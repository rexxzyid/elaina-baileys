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
    return fields.size > 50 ? fields : undefined
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

const readForkFields = () => {
    const target = join(root, 'WAProto/index.d.ts')
    if (!existsSync(target)) throw new Error('WAProto/index.d.ts not found')
    const source = readFileSync(target, 'utf8')
    const block = source.match(/interface IMessage \{([\s\S]*?)\n {4}\}/)
    if (!block) throw new Error('IMessage interface not found')
    return new Set([...block[1].matchAll(/^\s+([a-zA-Z0-9]+)\?:/gm)].map(match => match[1]))
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

const bundleFields = await findMessageSpec(collectChunkUrls(html))
if (!bundleFields) throw new Error('Could not locate the Message spec in the bundle')
const forkFields = readForkFields()
const missing = [...bundleFields].filter(([name]) => !forkFields.has(name)).sort((a, b) => a[1] - b[1])

const report = [
    `WhatsApp Web client revision: live ${liveRevision}, pinned ${pinned}${liveRevision === pinned ? '' : ' (outdated)'}`,
    `Message fields: bundle ${bundleFields.size}, WAProto ${forkFields.size}`,
    missing.length
        ? `Missing from WAProto (${missing.length}):\n` + missing.map(([name, id]) => `  - ${name} (field ${id})`).join('\n')
        : 'Missing from WAProto: none'
].join('\n')

console.log(report)

if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT,
        `missing_count=${missing.length}\n` +
        `revision_outdated=${liveRevision === pinned ? 'false' : 'true'}\n` +
        `live_revision=${liveRevision}\n`, { flag: 'a' })
}
if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + report + '\n```\n', { flag: 'a' })
}

process.exitCode = missing.length ? 1 : 0
