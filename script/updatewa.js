import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { liveRevision } from './protobundle.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * web.whatsapp.com answers a plain fetch with 403 often enough that this script
 * used to fail on its own, mid-way through `proto:update`, while the snapshot
 * step right before it had already read the same file. `liveRevision` is that
 * step's reader, curl fallback and all.
 */
const fetchVersion = async () => [2, 3000, await liveRevision()]

const update = (file, pattern, replacement) => {
    const target = join(root, file)
    if (!existsSync(target)) throw new Error(`File not found: ${file}`)
    const source = readFileSync(target, 'utf8')
    if (!pattern.test(source)) throw new Error(`Version declaration not found: ${file}`)
    pattern.lastIndex = 0
    const next = source.replace(pattern, replacement)
    if (next !== source) writeFileSync(target, next)
    return next !== source
}

const version = await fetchVersion()
const value = `[${version.join(', ')}]`
const defaultsChanged = update('lib/Defaults/index.js', /const\s+version\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]\s*;/, `const version = ${value};`)
const genericsChanged = update('lib/Utils/generics.js', /const\s+baileysVersion\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]\s*;/, `const baileysVersion = ${value};`)
console.log(`WhatsApp Web version: ${value}`)
console.log(`Defaults: ${defaultsChanged ? 'updated' : 'unchanged'}`)
console.log(`Generics: ${genericsChanged ? 'updated' : 'unchanged'}`)
