import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const pickDirectory = () => {
    if (process.env.PROTO_BUNDLE_DIR) return process.env.PROTO_BUNDLE_DIR
    const root = '.wa-bundle'
    if (!existsSync(root)) return undefined
    const revisions = readdirSync(root).filter(entry => /^\d+$/.test(entry)).sort()
    return revisions.length ? join(root, revisions[revisions.length - 1]) : undefined
}

const directory = pickDirectory()

if (!directory) {
    console.error('no bundle snapshot found, run npm run fetch:bundle or set PROTO_BUNDLE_DIR')
    process.exit(1)
}

const sources = readdirSync(directory)
    .filter(entry => entry.endsWith('.js'))
    .map(entry => readFileSync(join(directory, entry), 'utf8'))

const queries = new Map()

for (const source of sources) {
    for (const match of source.matchAll(/params:\{id:"(\d+)",metadata:\{[^}]*\},name:"([A-Za-z0-9_]+)"/g)) {
        const start = source.lastIndexOf('__d("', match.index)
        const body = source.slice(start, match.index)
        const args = [...new Set([...body.matchAll(/kind:"LocalArgument",name:"([A-Za-z0-9_]+)"/g)].map(entry => entry[1]))]
        const fields = new Set([...body.matchAll(/(?:kind:"LinkedField",[^}]*?name:"([A-Za-z0-9_]+)"|alias:"([A-Za-z0-9_]+)")/g)]
            .flatMap(entry => [entry[1], entry[2]].filter(Boolean)))
        queries.set(match[1], { name: match[2], args: args.sort(), fields })
    }
}

const mex = readFileSync('lib/Types/Mex.js', 'utf8')
const idOf = Object.fromEntries([...mex.matchAll(/QueryIds\["([A-Z_0-9]+)"\] = "(\d+)"/g)].map(entry => [entry[1], entry[2]]))
const pathOf = Object.fromEntries([...mex.matchAll(/XWAPaths\["([A-Za-z0-9_]+)"\] = "([A-Za-z0-9_]+)"/g)].map(entry => [entry[1], entry[2]]))

const readObjectLiteral = (source, at) => {
    let depth = 0
    for (let index = at; index < source.length; index++) {
        const character = source[index]
        if (character === '{') depth++
        else if (character === '}') {
            depth--
            if (!depth) return source.slice(at, index + 1)
        }
    }
    return undefined
}

const topLevelKeys = (literal) => {
    const keys = []
    let depth = 0
    let index = 0
    let expectKey = false
    while (index < literal.length) {
        const character = literal[index]
        if (character === '{' || character === '[' || character === '(') {
            depth++
            expectKey = depth === 1
        }
        else if (character === '}' || character === ']' || character === ')') {
            depth--
            expectKey = false
        }
        else if (character === "'" || character === '"' || character === '`') {
            const quote = character
            index++
            while (index < literal.length && literal[index] !== quote) index += literal[index] === '\\' ? 2 : 1
            expectKey = false
        }
        else if (character === ',' && depth === 1) {
            expectKey = true
        }
        else if (expectKey && depth === 1 && !/\s/.test(character)) {
            const key = /^([A-Za-z_$][A-Za-z0-9_$]*)/.exec(literal.slice(index))
            if (key) {
                keys.push(key[1])
                index += key[1].length
            }
            expectKey = false
            continue
        }
        index++
    }
    return keys
}

const callSites = []

for (const file of ['lib/Socket/newsletter.js', 'lib/Socket/socket.js']) {
    const source = readFileSync(file, 'utf8')
    let at = -1
    while ((at = source.indexOf('executeWMexQuery(', at + 1)) >= 0) {
        const args = at + 'executeWMexQuery('.length
        const first = /^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*,/.exec(source.slice(args))
        let literal
        let after
        if (first) {
            const declaration = source.lastIndexOf(`const ${first[1]} = {`, at)
            literal = declaration >= 0 ? readObjectLiteral(source, source.indexOf('{', declaration)) : '{}'
            after = args + first[0].length - 1
        }
        else {
            const open = source.indexOf('{', args)
            literal = readObjectLiteral(source, open)
            after = open + (literal?.length ?? 0)
        }
        if (literal === undefined) continue
        const tail = source.slice(after, after + 200)
        const target = /QueryIds\.([A-Z_0-9]+),\s*(?:XWAPaths\.([A-Za-z0-9_]+)|'([a-z0-9_]+)')/.exec(tail)
        if (!target) continue
        const line = source.slice(0, at).split('\n').length
        callSites.push({
            file,
            line,
            query: target[1],
            path: target[2] ? pathOf[target[2]] : target[3],
            sent: topLevelKeys(literal).sort()
        })
    }
}

const failures = []

for (const [name, id] of Object.entries(idOf)) {
    if (!queries.has(id)) {
        failures.push(`QueryIds.${name} = ${id} is not a persisted query in this revision`)
    }
}

const usedIds = new Map()

for (const site of callSites) {
    const id = idOf[site.query]
    const query = queries.get(id)
    const where = `${site.file}:${site.line} (QueryIds.${site.query})`
    if (!query) {
        failures.push(`${where} points at an id this revision does not serve`)
        continue
    }
    usedIds.set(site.query, query.name)
    const missing = query.args.filter(arg => !site.sent.includes(arg))
    const extra = site.sent.filter(key => !query.args.includes(key))
    if (missing.length) {
        failures.push(`${where} sends no ${missing.join(', ')} but ${query.name} declares it`)
    }
    if (extra.length) {
        failures.push(`${where} sends ${extra.join(', ')} which ${query.name} does not declare`)
    }
    if (site.path && !query.fields.has(site.path)) {
        failures.push(`${where} reads data.${site.path} but ${query.name} returns ${[...query.fields].filter(field => field.startsWith('xwa2') || field.endsWith('_list')).join(', ') || 'none of those'}`)
    }
}

const duplicated = new Map()

for (const [name, id] of Object.entries(idOf)) {
    const list = duplicated.get(id) ?? []
    list.push(name)
    duplicated.set(id, list)
}

for (const [id, names] of duplicated) {
    if (names.length > 1 && new Set(names.map(name => queries.get(id)?.name)).size === 1) {
        const query = queries.get(id)?.name
        if (query) console.log(`Note: ${names.join(' and ')} share ${query}.`)
    }
}

console.log(`Checked ${callSites.length} w:mex call sites against ${queries.size} persisted queries in ${directory}.`)

if (failures.length) {
    console.error(`${failures.length} mismatches:`)
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exitCode = 1
}
