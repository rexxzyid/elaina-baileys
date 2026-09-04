import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadBundle, root } from './protobundle.js'

/**
 * AI Rich content is addressed by GraphQL __typename, not by a protobuf field
 * number, so none of it appears in WAProto and the only way to enumerate it is
 * to read the clients.
 *
 *   node script/typenames.js                      live bundle vs the repo
 *   node script/typenames.js --bundle <dir>       a bundle already on disk
 *   node script/typenames.js --apk <dir>          also read an extracted apk
 *   node script/typenames.js --json out.json      write the full report
 *
 * The two sources prove different things and are deliberately not pooled:
 *
 *   web     names the Web bundle actually compares, in a case or an
 *           === against __typename. This is proof Web renders the node.
 *   android names of the Kotlin classes that implement a node, recovered
 *           from the *Impl.kt file names the compiler leaves in debug info.
 *           This is proof Android has an implementation, and nothing more --
 *           Android dispatches through Pando in native code, so the names are
 *           never compared in dex bytecode and their absence there means
 *           nothing. Counting every GenAI-ish string in the dex instead is
 *           what tempts you into reporting source file names as wire types.
 *
 * A name in both is the strongest candidate to be reachable from a message.
 */

/** Only a comparison counts, so a stray identifier cannot pass for a type. */
const WEB_DISPATCH = /case\s*"((?:GenAI|GenAT|FOA)[A-Za-z0-9_]+)"|__typename\s*===?\s*"((?:GenAI|GenAT|FOA)[A-Za-z0-9_]+)"/g

/** The compiler writes the source file name; the class name is it minus Impl.kt. */
const ANDROID_IMPL = /(?:GenAI|GenAT|FOA)[A-Za-z0-9_]{3,60}Impl\.kt/g

const REPO_LITERAL = /['"`]((?:GenAI|GenAT|FOA)[A-Za-z0-9_]{3,60})['"`]/g

const FAMILY = [
    [/LayoutViewModel$/, 'layout'],
    [/Primitive$/, 'primitive'],
    [/Section$/, 'section'],
    [/(?:Item|Card|List|CTA|Toast|Header|ViewModel)$/, 'item']
]

const flag = name => {
    const at = process.argv.indexOf(name)
    return at === -1 ? null : process.argv[at + 1]
}

const familyOf = name => FAMILY.find(([pattern]) => pattern.test(name))?.[1] ?? 'other'

const collect = (text, pattern, into, pick = match => match[1] ?? match[2]) => {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(text)) !== null) {
        const name = pick(match)
        if (name) into.add(name)
    }
}

const walkFiles = (directory, accept, onFile) => {
    const walk = current => {
        for (const entry of readdirSync(current, { withFileTypes: true })) {
            const path = join(current, entry.name)
            if (entry.isDirectory()) walk(path)
            else if (accept(entry.name)) onFile(path)
        }
    }
    walk(directory)
}

const scanWebDirectory = directory => {
    const found = new Set()
    walkFiles(directory, name => name.endsWith('.js'), path =>
        collect(readFileSync(path, 'utf-8'), WEB_DISPATCH, found))
    return found
}

const scanAndroid = directory => {
    const found = new Set()
    walkFiles(directory, name => name.endsWith('.dex'), path =>
        collect(readFileSync(path, 'latin1'), ANDROID_IMPL, found, match => match[0].slice(0, -7)))
    return found
}

const scanRepo = () => {
    const found = new Set()
    walkFiles(join(root, 'lib'), name => name.endsWith('.js'), path =>
        collect(readFileSync(path, 'utf-8'), REPO_LITERAL, found))
    return found
}

const sorted = set => [...set].sort()

const bundleDirectory = flag('--bundle')
const apkDirectory = flag('--apk') ?? flag('--dex')

let web
let revision = 'on disk'
if (bundleDirectory) {
    web = scanWebDirectory(bundleDirectory)
}
else {
    const bundle = await loadBundle()
    revision = bundle.revision
    web = new Set()
    for (const chunk of bundle.chunks) {
        collect(chunk.source ?? chunk.text ?? String(chunk), WEB_DISPATCH, web)
    }
}

const android = apkDirectory ? scanAndroid(apkDirectory) : new Set()
const repo = scanRepo()

const inBoth = sorted(web).filter(name => android.has(name) && !repo.has(name))
const webOnly = sorted(web).filter(name => !android.has(name) && !repo.has(name))
const androidOnly = sorted(android).filter(name => !web.has(name) && !repo.has(name))

console.log(`revision ${revision}`)
console.log(`  web dispatch    ${web.size}`)
console.log(`  android classes ${android.size}`)
console.log(`  repo            ${repo.size}`)

const report = (title, names) => {
    if (!names.length) return
    console.log(`\n${title} (${names.length})`)
    for (const name of names) console.log(`  ${name.padEnd(46)} ${familyOf(name)}`)
}

report('rendered by web and implemented on android, missing here', inBoth)
report('rendered by web, no android class', webOnly)
report('android class only, message reachability unproven', androidOnly)

const jsonOut = flag('--json')
if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify({
        revision,
        web: sorted(web),
        android: sorted(android),
        repo: sorted(repo),
        inBoth,
        webOnly,
        androidOnly
    }, null, 2))
    console.log(`\nwrote ${jsonOut}`)
}
