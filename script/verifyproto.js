import { loadBundle } from './protobundle.js'
import waproto from '../WAProto/index.js'

const { proto } = waproto

const resolve = name => name.split('.').reduce((holder, part) => holder && holder[part], proto)

const sampleFor = field => {
    if (field.repeated) {
        if (field.kind === 'MESSAGE') return [{}]
        if (field.kind === 'STRING') return ['a']
        if (field.kind === 'BYTES') return [Buffer.from([1])]
        if (field.kind === 'BOOL') return [true]
        return [1]
    }
    switch (field.kind) {
        case 'STRING': return 'x'
        case 'BYTES': return Buffer.from([1, 2, 3])
        case 'BOOL': return true
        case 'MESSAGE': return {}
        default: return 7
    }
}

const readTags = buffer => {
    const tags = []
    let at = 0
    while (at < buffer.length) {
        let shift = 0
        let key = 0
        while (at < buffer.length) {
            const byte = buffer[at++]
            key |= (byte & 0x7f) << shift
            shift += 7
            if (!(byte & 0x80)) break
        }
        tags.push(key >>> 3)
        const wire = key & 7
        if (wire === 2) {
            let lengthShift = 0
            let length = 0
            while (at < buffer.length) {
                const byte = buffer[at++]
                length |= (byte & 0x7f) << lengthShift
                lengthShift += 7
                if (!(byte & 0x80)) break
            }
            at += length
        }
        else if (wire === 0) while (at < buffer.length && buffer[at++] & 0x80);
        else if (wire === 5) at += 4
        else if (wire === 1) at += 8
        else break
    }
    return tags
}

const bundle = await loadBundle({ directory: process.env.PROTO_BUNDLE_DIR })

const failures = []
let checked = 0

for (const [name, fields] of bundle.specs) {
    const type = resolve(name)
    if (typeof type !== 'function' || typeof type.encode !== 'function') continue

    const declared = new Map(Object.keys(type.prototype).map(key => [key.toLowerCase(), key]))

    for (const field of fields) {
        const key = declared.get(field.name.toLowerCase())
        if (!key) continue
        if (field.kind === 'MAP' || field.kind === 'UNKNOWN') continue
        if (field.kind === 'MESSAGE' && !resolve(field.ref || '')) continue

        const note = reason => failures.push(`${name}.${key}: ${reason}`)
        const attempt = value => Buffer.from(type.encode(type.fromObject({ [key]: value })).finish())
        const sample = sampleFor(field)
        const alternative = Array.isArray(sample) ? sample[0] : [sample]

        let encoded
        try {
            encoded = attempt(sample)
        }
        catch {
            try {
                encoded = attempt(alternative)
            }
            catch (error) {
                note(`encode threw ${error.message}`)
                continue
            }
        }
        if (!readTags(encoded).includes(field.id)) {
            note(`wrote field ${readTags(encoded).join(',')} instead of ${field.id}`)
            continue
        }
        let decoded
        try {
            decoded = type.decode(encoded)
        }
        catch (error) {
            note(`decode threw ${error.message}`)
            continue
        }
        if (decoded[key] == null) {
            note('lost on round trip')
            continue
        }
        try {
            JSON.stringify(type.toObject(decoded, { longs: String, bytes: String }))
        }
        catch (error) {
            note(`toObject threw ${error.message}`)
            continue
        }
        checked++
    }
}

console.log(`Round-tripped ${checked} fields across the bundle.`)

if (failures.length) {
    console.error(`${failures.length} fields failed:`)
    for (const failure of failures.slice(0, 40)) console.error(`  - ${failure}`)
    process.exitCode = 1
}
