import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { closingBrace, loadBundle, readSnapshotMeta } from './protobundle.js'

/**
 * Every surface below is a place where a WhatsApp Web change can reach the
 * wire. Anything outside them is client-side rendering and cannot affect a
 * Baileys client, which is what makes "nothing changed" a usable answer.
 */
const MODULE_PATTERN = /__d\("([A-Za-z0-9_.$]+)"/g
const STANZA_PATTERN = /smax\("([a-z0-9_:-]+)"\s*,\s*\{/g
const STANZA_TAG_PATTERN = /smax\("([a-z0-9_:-]+)"/g
const XMLNS_PATTERN = /xmlns:\s*"([a-z0-9_:.-]+)"/g
const MEX_PATTERN = /params:\{id:"(\d+)",metadata:\{[^}]*\},name:"([A-Za-z0-9_]+)"/g
const MEDIA_PATTERN = /"(\/(?:mms|newsletter|product|pps)\/[a-z0-9-]+)"/g
const FLAG_PATTERN = /"([a-z][a-z0-9]*(?:_[a-z0-9]+){1,})"/g

const isQuote = character => character === '"' || character === "'" || character === '`'

/**
 * Attribute names of one stanza literal. The bundle is minified, so instead of
 * parsing JavaScript we walk the object body and collect the keys that sit at
 * depth zero, skipping over string contents.
 */
const topLevelKeys = body => {
    const keys = []
    let depth = 0
    let index = 0
    while (index < body.length) {
        const character = body[index]
        if (isQuote(character)) {
            const quote = character
            index++
            while (index < body.length && body[index] !== quote) index += body[index] === '\\' ? 2 : 1
            index++
            continue
        }
        if (character === '{' || character === '[' || character === '(') depth++
        else if (character === '}' || character === ']' || character === ')') depth--
        else if (character === ':' && depth === 0) {
            const before = body.slice(Math.max(0, index - 64), index)
            const key = before.match(/([A-Za-z_$][A-Za-z0-9_$]*)\s*$/) || before.match(/"([^"]+)"\s*$/)
            if (key) keys.push(key[1])
        }
        index++
    }
    return keys
}

const collectSurfaces = directory => {
    const surfaces = {
        modules: new Set(),
        stanzaTags: new Set(),
        stanzaAttrs: new Set(),
        xmlns: new Set(),
        mexOperations: new Set(),
        mediaPaths: new Set(),
        flags: new Set()
    }

    for (const entry of readdirSync(directory)) {
        if (!entry.endsWith('.js')) continue
        const source = readFileSync(join(directory, entry), 'utf8')

        for (const match of source.matchAll(MODULE_PATTERN)) surfaces.modules.add(match[1])
        for (const match of source.matchAll(STANZA_TAG_PATTERN)) surfaces.stanzaTags.add(match[1])
        for (const match of source.matchAll(XMLNS_PATTERN)) surfaces.xmlns.add(match[1])
        for (const match of source.matchAll(MEX_PATTERN)) surfaces.mexOperations.add(`${match[2]} ${match[1]}`)
        for (const match of source.matchAll(MEDIA_PATTERN)) surfaces.mediaPaths.add(match[1])
        for (const match of source.matchAll(FLAG_PATTERN)) surfaces.flags.add(match[1])

        for (const match of source.matchAll(STANZA_PATTERN)) {
            const open = match.index + match[0].length - 1
            const body = source.slice(open + 1, closingBrace(source, open))
            for (const key of topLevelKeys(body)) surfaces.stanzaAttrs.add(`${match[1]}@${key}`)
        }
    }

    return surfaces
}

const setDiff = (before, after) => ({
    added: [...after].filter(value => !before.has(value)).sort(),
    removed: [...before].filter(value => !after.has(value)).sort(),
    total: after.size
})

const diffSpecs = (before, after) => {
    const newTypes = []
    const changedTypes = []
    for (const [name, fields] of after.specs) {
        const known = before.specs.get(name)
        if (!known) {
            newTypes.push({ type: name, fields: fields.map(field => `${field.name} (${field.id})`) })
            continue
        }
        const seen = new Set(known.map(field => field.name.toLowerCase()))
        const added = fields.filter(field => !seen.has(field.name.toLowerCase()))
        if (added.length) changedTypes.push({ type: name, fields: added.map(field => `${field.name} (${field.id})`) })
    }
    const removedTypes = [...before.specs.keys()].filter(name => !after.specs.has(name)).sort()
    newTypes.sort((a, b) => a.type.localeCompare(b.type))
    changedTypes.sort((a, b) => a.type.localeCompare(b.type))

    const messageFields = setDiff(new Set(before.messageFields.keys()), new Set(after.messageFields.keys()))
    return { newTypes, changedTypes, removedTypes, messageFields }
}

export const diffSnapshots = async (beforeDir, afterDir) => {
    const beforeSurfaces = collectSurfaces(beforeDir)
    const afterSurfaces = collectSurfaces(afterDir)
    const beforeBundle = await loadBundle({ directory: beforeDir })
    const afterBundle = await loadBundle({ directory: afterDir })

    const surfaces = {}
    for (const key of Object.keys(beforeSurfaces)) surfaces[key] = setDiff(beforeSurfaces[key], afterSurfaces[key])

    const proto = diffSpecs(beforeBundle, afterBundle)
    const protocolTouched = Boolean(
        surfaces.stanzaTags.added.length || surfaces.stanzaTags.removed.length ||
        surfaces.stanzaAttrs.added.length || surfaces.stanzaAttrs.removed.length ||
        surfaces.xmlns.added.length || surfaces.xmlns.removed.length ||
        surfaces.mexOperations.added.length || surfaces.mexOperations.removed.length ||
        surfaces.mediaPaths.added.length || surfaces.mediaPaths.removed.length ||
        proto.newTypes.length || proto.changedTypes.length || proto.messageFields.added.length
    )

    return {
        before: { directory: beforeDir, ...readSnapshotMeta(beforeDir) },
        after: { directory: afterDir, ...readSnapshotMeta(afterDir) },
        surfaces,
        proto,
        protocolTouched
    }
}

const bullet = (values, limit = 40) => {
    if (!values.length) return '  _(tidak ada)_'
    const shown = values.slice(0, limit).map(value => `  - \`${value}\``)
    if (values.length > limit) shown.push(`  - _…dan ${values.length - limit} lainnya_`)
    return shown.join('\n')
}

const LABELS = {
    modules: 'Modul',
    stanzaTags: 'Tag stanza (smax)',
    stanzaAttrs: 'Atribut stanza',
    xmlns: 'Namespace (xmlns)',
    mexOperations: 'Operasi MEX',
    mediaPaths: 'Path media',
    flags: 'Flag / feature string'
}

export const renderReport = report => {
    const lines = []
    lines.push(`# Diff bundle WhatsApp Web`)
    lines.push('')
    lines.push(`- Sebelum: revisi \`${report.before.revision ?? 'tidak tercatat'}\` (${report.before.directory})`)
    lines.push(`- Sesudah: revisi \`${report.after.revision ?? 'tidak tercatat'}\` (${report.after.directory})`)
    lines.push(`- Menyentuh protokol: **${report.protocolTouched ? 'YA' : 'TIDAK'}**`)
    lines.push('')

    lines.push('## Protobuf')
    lines.push('')
    lines.push(`Field \`Message\` baru (${report.proto.messageFields.added.length}):`)
    lines.push(bullet(report.proto.messageFields.added))
    lines.push('')
    lines.push(`Tipe baru (${report.proto.newTypes.length}):`)
    lines.push(bullet(report.proto.newTypes.map(entry => `${entry.type}: ${entry.fields.join(', ')}`), 25))
    lines.push('')
    lines.push(`Tipe dengan field tambahan (${report.proto.changedTypes.length}):`)
    lines.push(bullet(report.proto.changedTypes.map(entry => `${entry.type}: ${entry.fields.join(', ')}`), 25))
    lines.push('')

    for (const [key, label] of Object.entries(LABELS)) {
        const surface = report.surfaces[key]
        lines.push(`## ${label}`)
        lines.push('')
        lines.push(`Total sekarang: ${surface.total}`)
        lines.push('')
        lines.push(`Ditambah (${surface.added.length}):`)
        lines.push(bullet(surface.added))
        lines.push('')
        lines.push(`Dihapus (${surface.removed.length}):`)
        lines.push(bullet(surface.removed))
        lines.push('')
    }

    return lines.join('\n')
}

const isMain = process.argv[1] && process.argv[1].endsWith('diffbundle.js')

if (isMain) {
    const [beforeDir, afterDir] = process.argv.slice(2).filter(argument => !argument.startsWith('--'))
    if (!beforeDir || !afterDir) {
        console.error('Usage: node script/diffbundle.js <snapshot-lama> <snapshot-baru> [--json file] [--markdown file]')
        process.exit(2)
    }
    const report = await diffSnapshots(beforeDir, afterDir)
    const jsonAt = process.argv.indexOf('--json')
    const markdownAt = process.argv.indexOf('--markdown')
    if (jsonAt !== -1 && process.argv[jsonAt + 1]) writeFileSync(process.argv[jsonAt + 1], JSON.stringify(report, null, 2) + '\n')
    const markdown = renderReport(report)
    if (markdownAt !== -1 && process.argv[markdownAt + 1]) writeFileSync(process.argv[markdownAt + 1], markdown + '\n')
    console.log(markdown)
}
