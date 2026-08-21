import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

export const root = join(dirname(fileURLToPath(import.meta.url)), '..')

export const BROWSER_HEADERS = {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
}

const execFileAsync = promisify(execFile)

/**
 * Statuses that mean the request was refused rather than genuinely absent.
 * Some networks let curl through where undici is blocked, so these are worth
 * a second attempt through a different client before giving up.
 */
const FALLBACK_STATUS = new Set([401, 403, 405, 407, 429, 503])

const curlText = async (url, headers) => {
    const args = ['-sS', '--http2', '--compressed', '--fail', '--max-time', '90', url]
    for (const [key, value] of Object.entries(headers)) args.push('-H', `${key}: ${value}`)
    const { stdout } = await execFileAsync('curl', args, { maxBuffer: 1024 * 1024 * 1024 })
    return stdout
}

export const fetchText = async (url, headers = BROWSER_HEADERS) => {
    let reason
    try {
        const response = await fetch(url, { headers })
        if (response.ok) return await response.text()
        reason = `${response.status} ${response.statusText}`
        if (!FALLBACK_STATUS.has(response.status)) throw new Error(`Failed to fetch ${url}: ${reason}`)
    }
    catch (error) {
        if (reason) throw error
        reason = error.message
    }
    try {
        return await curlText(url, headers)
    }
    catch (error) {
        const detail = String(error.stderr || error.message).trim().split('\n').pop()
        throw new Error(`Failed to fetch ${url}: ${reason} (curl fallback: ${detail})`)
    }
}

export const closingBrace = (source, open) => {
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

const camelCase = name => name.replace(/_([a-z0-9])/g, (_, character) => character.toUpperCase())

const MESSAGE_ANCHOR = 'internalSpec={conversation:[1,'
const MESSAGE_FIELD_PATTERN = /([a-zA-Z0-9]+):\[(\d+),(?:\(e=o\("WAProtoConst"\)\)|e)\.TYPES\./g
const SPEC_PATTERN = /([A-Za-z$_][A-Za-z0-9$_]{0,3})\.name="([^"]+)",\1\.internalSpec=\{/g
const NAME_PATTERN = /([A-Za-z$_][A-Za-z0-9$_]{0,3})\.name="([^"]+)"/g
const FIELD_PATTERN = /([a-zA-Z0-9_]+):\[(\d+),([^\]]*?)(?:,([^\]]+))?\]/g

const parseSpecs = source => {
    const declarations = new Map()
    for (const match of source.matchAll(NAME_PATTERN)) {
        if (!declarations.has(match[1])) declarations.set(match[1], [])
        declarations.get(match[1]).push({ at: match.index, name: match[2].replaceAll('$', '.') })
    }
    const nearest = (variable, at) => {
        const candidates = declarations.get(variable)
        if (!candidates) return null
        let best = null
        let distance = Infinity
        for (const candidate of candidates) {
            const gap = Math.abs(candidate.at - at)
            if (gap < distance) {
                distance = gap
                best = candidate.name
            }
        }
        return best
    }

    const specs = new Map()
    for (const match of source.matchAll(SPEC_PATTERN)) {
        const open = match.index + match[0].length - 1
        const body = source.slice(open + 1, closingBrace(source, open))
        const fields = []
        for (const field of body.matchAll(FIELD_PATTERN)) {
            const flags = field[3]
            const reference = field[4]
            const type = flags.match(/TYPES\.([A-Z0-9]+)/)
            let target = null
            if (reference) {
                const value = reference.trim()
                const external = value.match(/^o\("[^"]+"\)\.([A-Za-z0-9$_]+)$/)
                const member = value.match(/^[A-Za-z$_][A-Za-z0-9$_]{0,3}\.([A-Za-z0-9$_]+)$/)
                if (external) target = external[1].replace(/Spec$/, '').replaceAll('$', '.')
                else if (/^[A-Za-z$_][A-Za-z0-9$_]{0,3}$/.test(value)) target = nearest(value, match.index)
                else if (member) target = member[1].replace(/Spec$/, '').replaceAll('$', '.')
            }
            fields.push({
                name: camelCase(field[1]),
                id: Number.parseInt(field[2], 10),
                kind: type ? type[1] : 'UNKNOWN',
                repeated: /FLAGS\.REPEATED/.test(flags),
                ref: target
            })
        }
        if (!fields.length) continue
        const name = match[2].replaceAll('$', '.')
        const known = specs.get(name)
        if (!known || fields.length > known.length) specs.set(name, fields)
    }
    return specs
}

const parseMessageFields = source => {
    const at = source.indexOf(MESSAGE_ANCHOR)
    if (at === -1) return undefined
    const end = closingBrace(source, at + 'internalSpec='.length)
    const fields = new Map()
    for (const match of source.slice(at, end).matchAll(MESSAGE_FIELD_PATTERN)) {
        fields.set(match[1], Number.parseInt(match[2], 10))
    }
    return fields.size > 50 ? fields : undefined
}

export const collectChunkUrls = html => {
    const unescaped = html.replaceAll('\\/', '/')
    const matches = unescaped.matchAll(/https:\/\/static\.whatsapp\.net\/rsrc\.php\/[A-Za-z0-9_\-/.]+?\.js/g)
    return [...new Set([...matches].map(match => match[0]))]
}

const absorb = (specs, message, source) => {
    const found = parseMessageFields(source)
    if (found) message.fields = found
    for (const [name, fields] of parseSpecs(source)) {
        const known = specs.get(name)
        if (!known || fields.length > known.length) specs.set(name, fields)
    }
}

export const loadBundle = async ({ directory, concurrency = 12, onProgress } = {}) => {
    const specs = new Map()
    const message = { fields: undefined }

    if (directory) {
        for (const entry of readdirSync(directory)) {
            if (!entry.endsWith('.js')) continue
            absorb(specs, message, readFileSync(join(directory, entry), 'utf8'))
        }
    }
    else {
        const urls = collectChunkUrls(await fetchText('https://web.whatsapp.com/'))
        const queue = [...urls]
        let done = 0
        const workers = Array.from({ length: concurrency }, async () => {
            while (queue.length) {
                const url = queue.shift()
                if (!url) return
                try {
                    absorb(specs, message, await fetchText(url, { ...BROWSER_HEADERS, referer: 'https://web.whatsapp.com/' }))
                }
                catch {
                    continue
                }
                finally {
                    done++
                    if (onProgress && done % 50 === 0) onProgress(done, urls.length)
                }
            }
        })
        await Promise.all(workers)
    }

    if (!message.fields) throw new Error('Could not locate the Message spec in the bundle')
    return { messageFields: message.fields, specs }
}

const SCOPE_PATTERN = /namespace\s+([A-Za-z0-9_]+)\s*\{|interface\s+I([A-Za-z0-9_]+)\s*\{|\{|\}/g

export const readForkInterfaces = (source = readFileSync(join(root, 'WAProto/index.d.ts'), 'utf8')) => {
    const interfaces = new Map()
    const scope = []
    let depth = 0
    for (const match of source.matchAll(SCOPE_PATTERN)) {
        if (match[0] === '}') {
            depth--
            while (scope.length && scope[scope.length - 1].depth >= depth) scope.pop()
            continue
        }
        if (match[2]) {
            const open = match.index + match[0].length - 1
            const body = source.slice(open, closingBrace(source, open))
            const path = [...scope.map(entry => entry.name), match[2]].join('.').replace(/^proto\./, '')
            const fields = new Set([...body.matchAll(/^\s+"?([a-zA-Z0-9_]+)"?\?:/gm)].map(field => field[1]))
            const known = interfaces.get(path)
            if (known) for (const field of fields) known.add(field)
            else interfaces.set(path, fields)
        }
        else if (match[1]) scope.push({ name: match[1], depth })
        depth++
    }
    if (!interfaces.has('Message')) throw new Error('IMessage interface not found')
    return interfaces
}

export const diffBundle = (bundle, fork) => {
    const forkMessage = fork.get('Message')
    const missingMessage = [...bundle.messageFields]
        .filter(([name]) => !forkMessage.has(name))
        .sort((a, b) => a[1] - b[1])

    const gaps = []
    const undeclared = []
    for (const [name, fields] of bundle.specs) {
        if (name === 'Message') continue
        const declared = fork.get(name)
        if (!declared) {
            undeclared.push(name)
            continue
        }
        const lowered = new Set([...declared].map(field => field.toLowerCase()))
        const missing = fields.filter(field => !lowered.has(field.name.toLowerCase()))
        if (missing.length) gaps.push({ type: name, fields: missing })
    }
    gaps.sort((a, b) => a.type.localeCompare(b.type))
    undeclared.sort()

    const needed = new Set()
    const visit = name => {
        if (!name || fork.has(name) || needed.has(name) || !bundle.specs.has(name)) return
        needed.add(name)
        for (const field of bundle.specs.get(name)) if (field.kind === 'MESSAGE') visit(field.ref)
    }
    for (const gap of gaps) for (const field of gap.fields) if (field.kind === 'MESSAGE') visit(field.ref)

    return { missingMessage, gaps, undeclared, needed: [...needed] }
}

export const readClientRevision = source => {
    const match = source.match(/client_revision\\?":\s*(\d+)/)
    if (!match?.[1]) throw new Error('client_revision not found')
    return Number.parseInt(match[1], 10)
}

const PINNED_FILES = ['lib/Defaults/index.js', 'lib/Utils/generics.js']
const PINNED_PATTERN = /(\[\s*\d+\s*,\s*\d+\s*,\s*)(\d+)(\s*\])/

export const pinnedRevision = () => {
    const target = join(root, PINNED_FILES[0])
    if (!existsSync(target)) return 0
    const match = readFileSync(target, 'utf8').match(/const\s+version\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*(\d+)\s*\]/)
    return match ? Number.parseInt(match[1], 10) : 0
}

/**
 * Rewrites the pinned client revision everywhere it is declared. Returns the
 * files that actually changed so a caller can refuse to commit a no-op.
 */
export const writePinnedRevision = revision => {
    const touched = []
    for (const relative of PINNED_FILES) {
        const target = join(root, relative)
        if (!existsSync(target)) continue
        const before = readFileSync(target, 'utf8')
        const after = before.replace(PINNED_PATTERN, (_, head, current, tail) => head + revision + tail)
        if (after === before) continue
        writeFileSync(target, after)
        touched.push(relative)
    }
    return touched
}

export const liveRevision = async () => readClientRevision(await fetchText('https://web.whatsapp.com/sw.js'))

/**
 * Downloads every chunk of the live bundle into `directory` and records the
 * revision alongside it, so a later run can diff two snapshots offline.
 */
export const snapshotBundle = async ({ directory, concurrency = 12, onProgress } = {}) => {
    mkdirSync(directory, { recursive: true })
    const revision = readClientRevision(await fetchText('https://web.whatsapp.com/sw.js'))
    const urls = collectChunkUrls(await fetchText('https://web.whatsapp.com/'))
    if (!urls.length) throw new Error('No bundle chunks found on the page')

    const queue = [...urls]
    let saved = 0
    let failed = 0
    const workers = Array.from({ length: concurrency }, async () => {
        while (queue.length) {
            const url = queue.shift()
            if (!url) return
            try {
                const source = await fetchText(url, { ...BROWSER_HEADERS, referer: 'https://web.whatsapp.com/' })
                writeFileSync(join(directory, createHash('sha1').update(url).digest('hex').slice(0, 12) + '.js'), source)
                saved++
            }
            catch {
                failed++
            }
            finally {
                if (onProgress) onProgress(saved + failed, urls.length)
            }
        }
    })
    await Promise.all(workers)

    if (!saved) throw new Error('Every chunk download failed')
    const meta = { revision, total: urls.length, saved, failed, capturedAt: new Date().toISOString() }
    writeFileSync(join(directory, 'snapshot.json'), JSON.stringify(meta, null, 2) + '\n')
    return meta
}

export const readSnapshotMeta = directory => {
    const target = join(directory, 'snapshot.json')
    if (!existsSync(target)) return undefined
    try {
        return JSON.parse(readFileSync(target, 'utf8'))
    }
    catch {
        return undefined
    }
}
