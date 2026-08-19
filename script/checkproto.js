import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const BROWSER_HEADERS = {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
}

const fetchText = async (url, headers = BROWSER_HEADERS) => {
    const response = await fetch(url, { headers })
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
    return response.text()
}

const collectChunkUrls = html => {
    const unescaped = html.replaceAll('\\/', '/')
    const matches = unescaped.matchAll(/https:\/\/static\.whatsapp\.net\/rsrc\.php\/[A-Za-z0-9_\-/.]+?\.js/g)
    return [...new Set([...matches].map(match => match[0]))]
}

const MESSAGE_ANCHOR = 'internalSpec={conversation:[1,'
const FIELD_PATTERN = /([a-zA-Z0-9]+):\[(\d+),(?:\(e=o\("WAProtoConst"\)\)|e)\.TYPES\./g
const SPEC_PATTERN = /([A-Za-z$_]{1,4})\.name="([^"]+)",\1\.internalSpec=\{/g

const closingBrace = (source, open) => {
    let depth = 0
    for (let i = open; i < source.length; i++) {
        if (source[i] === '{') depth++
        else if (source[i] === '}') {
            depth--
            if (!depth) return i
        }
    }
    return source.length
}

const parseAllSpecs = source => {
    const specs = new Map()
    for (const match of source.matchAll(SPEC_PATTERN)) {
        const open = match.index + match[0].length - 1
        const body = source.slice(open, closingBrace(source, open))
        const fields = new Set([...body.matchAll(/([a-zA-Z0-9]+):\[\d+,/g)].map(field => field[1]))
        if (!fields.size) continue
        const name = match[2].split('$').pop()
        const known = specs.get(name)
        if (!known || fields.size > known.size) specs.set(name, fields)
    }
    return specs
}

const parseMessageSpec = source => {
    const at = source.indexOf(MESSAGE_ANCHOR)
    if (at === -1) return undefined
    let depth = 0
    let end = source.length
    for (let i = at + 'internalSpec='.length; i < source.length; i++) {
        const character = source[i]
        if (character === '{') depth++
        else if (character === '}') {
            depth--
            if (!depth) {
                end = i
                break
            }
        }
    }
    const fields = new Map()
    for (const match of source.slice(at, end).matchAll(FIELD_PATTERN)) {
        fields.set(match[1], Number.parseInt(match[2], 10))
    }
    if (fields.size <= 50) return undefined
    return { fields, specs: parseAllSpecs(source) }
}

const findMessageSpec = async urls => {
    const queue = [...urls]
    let found
    const workers = Array.from({ length: 8 }, async () => {
        while (queue.length && !found) {
            const url = queue.shift()
            if (!url) return
            let source
            try {
                source = await fetchText(url, { ...BROWSER_HEADERS, referer: 'https://web.whatsapp.com/' })
            }
            catch {
                continue
            }
            const fields = parseMessageSpec(source)
            if (fields) found = fields
        }
    })
    await Promise.all(workers)
    return found
}

const readForkProto = () => {
    const target = join(root, 'WAProto/index.d.ts')
    if (!existsSync(target)) throw new Error('WAProto/index.d.ts not found')
    const source = readFileSync(target, 'utf8')
    const interfaces = new Map()
    for (const match of source.matchAll(/interface I([A-Za-z0-9]+) \{/g)) {
        const open = match.index + match[0].length - 1
        let depth = 0
        let end = source.length
        for (let i = open; i < source.length; i++) {
            if (source[i] === '{') depth++
            else if (source[i] === '}') {
                depth--
                if (!depth) {
                    end = i
                    break
                }
            }
        }
        const fields = new Set([...source.slice(open, end).matchAll(/^\s+([a-zA-Z0-9]+)\?:/gm)].map(field => field[1]))
        const known = interfaces.get(match[1])
        if (!known || fields.size > known.size) interfaces.set(match[1], fields)
    }
    if (!interfaces.has('Message')) throw new Error('IMessage interface not found')
    return interfaces
}

const readClientRevision = source => {
    const match = source.match(/client_revision\\?":\s*(\d+)/)
    if (!match?.[1]) throw new Error('client_revision not found')
    return Number.parseInt(match[1], 10)
}

const pinnedRevision = () => {
    const source = readFileSync(join(root, 'lib/Defaults/index.js'), 'utf8')
    const match = source.match(/const\s+version\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*(\d+)\s*\]/)
    return match ? Number.parseInt(match[1], 10) : 0
}

const html = await fetchText('https://web.whatsapp.com/')
const liveRevision = readClientRevision(await fetchText('https://web.whatsapp.com/sw.js'))
const pinned = pinnedRevision()

const bundle = await findMessageSpec(collectChunkUrls(html))
if (!bundle) throw new Error('Could not locate the Message spec in the bundle')
const fork = readForkProto()
const forkMessage = fork.get('Message')
const missing = [...bundle.fields].filter(([name]) => !forkMessage.has(name)).sort((a, b) => a[1] - b[1])

const missingElsewhere = []
for (const [name, fields] of bundle.specs) {
    if (name === 'Message') continue
    const declared = fork.get(name)
    if (!declared) continue
    const gap = [...fields].filter(field => !declared.has(field))
    if (gap.length) missingElsewhere.push(`  - ${name}: ${gap.sort().join(', ')}`)
}
missingElsewhere.sort()

const report = [
    `WhatsApp Web client revision: live ${liveRevision}, pinned ${pinned}${liveRevision === pinned ? '' : ' (outdated)'}`,
    `Message fields: bundle ${bundle.fields.size}, WAProto ${forkMessage.size}`,
    missing.length
        ? `Missing Message fields (${missing.length}):\n` + missing.map(([name, id]) => `  - ${name} (field ${id})`).join('\n')
        : 'Missing Message fields: none',
    missingElsewhere.length
        ? `Types with missing fields (${missingElsewhere.length}):\n` + missingElsewhere.join('\n')
        : 'Types with missing fields: none'
].join('\n')

console.log(report)

if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT,
        `missing_count=${missing.length + missingElsewhere.length}\n` +
        `revision_outdated=${liveRevision === pinned ? 'false' : 'true'}\n` +
        `live_revision=${liveRevision}\n`, { flag: 'a' })
}
if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + report + '\n```\n', { flag: 'a' })
}

process.exitCode = missing.length + missingElsewhere.length ? 1 : 0
