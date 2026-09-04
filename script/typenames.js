import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadBundle, root } from './protobundle.js'

/**
 * AI Rich content is addressed by GraphQL __typename, not by a protobuf field
 * number, so the names never appear in WAProto. They do appear as plain string
 * literals in the Web bundle and in the Android string table, which is what
 * this sweeps.
 *
 *   node script/typenames.js                      live bundle vs the repo
 *   node script/typenames.js --bundle <dir>       a bundle already on disk
 *   node script/typenames.js --dex <dir>          also read classesN.dex
 *   node script/typenames.js --json out.json      write the full report
 *
 * The Web list is the subset Web itself renders; the dex carries everything
 * Android knows, which is considerably more. A name in both is the strongest
 * candidate to be reachable from a message.
 */

/**
 * Anchored on the suffix rather than filtered afterwards: a dex string table
 * packs its entries end to end, so a match that is merely "starts with GenAI"
 * runs straight into the next string and is then thrown away. Greedy on
 * purpose -- lazy stops at the first suffix and turns
 * GenAIRichListItemLayoutViewModel into GenAIRichList.
 */
const NAME = /(?:GenAI|GenAT|FOA)[A-Za-z0-9_]{3,60}(?:LayoutViewModel|ViewModel|Primitive|Section|Item|Card|List|CTA|Toast|Header)/g

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

/** Only names that look like a rendered node, so stray identifiers stay out. */
const isTypename = name => familyOf(name) !== 'other'

/**
 * Split on everything unprintable first. A dex packs its strings end to end
 * behind a length byte, and matching greedily across that boundary welds two
 * neighbours into one name that belongs to neither.
 */
const scanText = (text, into) => {
    for (const token of text.split(/[^\x21-\x7e]+/)) {
        for (const match of token.match(NAME) ?? []) {
            if (isTypename(match)) into.add(match)
        }
    }
}

const scanDirectory = (directory, filter) => {
    const found = new Set()
    const walk = current => {
        for (const entry of readdirSync(current, { withFileTypes: true })) {
            const path = join(current, entry.name)
            if (entry.isDirectory()) {
                walk(path)
            }
            else if (filter(entry.name)) {
                scanText(readFileSync(path, 'latin1'), found)
            }
        }
    }
    walk(directory)
    return found
}

const scanRepo = () => {
    const found = new Set()
    const walk = current => {
        for (const entry of readdirSync(current, { withFileTypes: true })) {
            const path = join(current, entry.name)
            if (entry.isDirectory()) {
                walk(path)
            }
            else if (entry.name.endsWith('.js')) {
                for (const match of readFileSync(path, 'utf-8').match(/['"`]((?:GenAI|GenAT|FOA)[A-Za-z0-9_]{2,60})['"`]/g) ?? []) {
                    const name = match.slice(1, -1)
                    if (isTypename(name)) found.add(name)
                }
            }
        }
    }
    walk(join(root, 'lib'))
    return found
}

const sorted = set => [...set].sort()

const bundleDirectory = flag('--bundle')
const dexDirectory = flag('--dex')

let web
let revision = 'on disk'
if (bundleDirectory) {
    web = scanDirectory(bundleDirectory, name => name.endsWith('.js'))
}
else {
    const bundle = await loadBundle()
    revision = bundle.revision
    web = new Set()
    for (const chunk of bundle.chunks) {
        scanText(chunk.source ?? chunk.text ?? String(chunk), web)
    }
}

const dex = dexDirectory
    ? scanDirectory(dexDirectory, () => true)
    : new Set()

const repo = scanRepo()
const union = new Set([...web, ...dex])
const missing = sorted(union).filter(name => !repo.has(name))
const both = sorted(union).filter(name => web.has(name) && dex.has(name) && !repo.has(name))

console.log(`revision ${revision}`)
console.log(`  web  ${web.size}`)
console.log(`  dex  ${dex.size}`)
console.log(`  repo ${repo.size}`)
console.log(`  missing from repo ${missing.length}`)

if (both.length) {
    console.log('\nin both web and dex, not in the repo:')
    for (const name of both) console.log(`  ${name.padEnd(46)} ${familyOf(name)}`)
}

const dexOnly = missing.filter(name => !web.has(name))
if (dexOnly.length) {
    console.log('\nandroid only, not in the repo:')
    for (const name of dexOnly) console.log(`  ${name.padEnd(46)} ${familyOf(name)}`)
}

const jsonOut = flag('--json')
if (jsonOut) {
    writeFileSync(jsonOut, JSON.stringify({
        revision,
        web: sorted(web),
        dex: sorted(dex),
        repo: sorted(repo),
        missing,
        inBoth: both
    }, null, 2))
    console.log(`\nwrote ${jsonOut}`)
}
