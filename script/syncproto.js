import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { closingBrace, diffBundle, loadBundle, readForkInterfaces, root } from './protobundle.js'

const LONG_KINDS = new Set(['INT64', 'UINT64', 'SINT64', 'FIXED64', 'SFIXED64'])
const UNSIGNED_KINDS = new Set(['UINT64', 'FIXED64'])

const WRITERS = {
    STRING: 'string', BYTES: 'bytes', BOOL: 'bool', INT32: 'int32', UINT32: 'uint32',
    SINT32: 'sint32', INT64: 'int64', UINT64: 'uint64', SINT64: 'sint64', FIXED32: 'fixed32',
    SFIXED32: 'sfixed32', FIXED64: 'fixed64', SFIXED64: 'sfixed64', FLOAT: 'float',
    DOUBLE: 'double', ENUM: 'int32'
}

const wireOf = kind => {
    if (kind === 'STRING' || kind === 'BYTES' || kind === 'MESSAGE') return 2
    if (kind === 'FIXED32' || kind === 'SFIXED32' || kind === 'FLOAT') return 5
    if (kind === 'FIXED64' || kind === 'SFIXED64' || kind === 'DOUBLE') return 1
    return 0
}

const tagOf = field => (field.id << 3) | wireOf(field.kind)
const leaf = name => name.split('.').pop()
const qualify = name => '$root.proto.' + name
const interfaceOf = name => 'proto.' + name.split('.').slice(0, -1).concat('I' + leaf(name)).join('.')

const encodeField = (field, indent) => {
    const p = ' '.repeat(indent)
    const tag = tagOf(field)
    if (field.repeated) {
        const write = field.kind === 'MESSAGE'
            ? `${qualify(field.ref)}.encode(m.${field.name}[i], w.uint32(${tag}).fork()).ldelim();`
            : `w.uint32(${tag}).${WRITERS[field.kind]}(m.${field.name}[i]);`
        return `${p}if (m.${field.name} != null && m.${field.name}.length) {\n${p}    for (var i = 0; i < m.${field.name}.length; ++i)\n${p}        ${write}\n${p}}\n`
    }
    const write = field.kind === 'MESSAGE'
        ? `${qualify(field.ref)}.encode(m.${field.name}, w.uint32(${tag}).fork()).ldelim();`
        : `w.uint32(${tag}).${WRITERS[field.kind]}(m.${field.name});`
    return `${p}if (m.${field.name} != null && Object.hasOwnProperty.call(m, "${field.name}"))\n${p}    ${write}\n`
}

const decodeField = (field, indent) => {
    const p = ' '.repeat(indent)
    const read = field.kind === 'MESSAGE'
        ? `${qualify(field.ref)}.decode(r, r.uint32(), undefined, n + 1)`
        : `r.${WRITERS[field.kind]}()`
    if (field.repeated) {
        return `${p}case ${field.id}: {\n${p}        if (!(m.${field.name} && m.${field.name}.length))\n${p}            m.${field.name} = [];\n${p}        m.${field.name}.push(${read});\n${p}        break;\n${p}    }\n`
    }
    return `${p}case ${field.id}: {\n${p}        m.${field.name} = ${read};\n${p}        break;\n${p}    }\n`
}

const coerce = (kind, expression) => {
    if (kind === 'STRING') return `String(${expression})`
    if (kind === 'BOOL') return `Boolean(${expression})`
    if (kind === 'INT32' || kind === 'SINT32' || kind === 'SFIXED32') return `${expression} | 0`
    if (kind === 'UINT32' || kind === 'FIXED32' || kind === 'ENUM') return `${expression} >>> 0`
    if (kind === 'FLOAT' || kind === 'DOUBLE') return `Number(${expression})`
    return expression
}

const fromField = (field, indent) => {
    const p = ' '.repeat(indent)
    const name = field.name
    if (field.repeated) {
        const item = field.kind === 'MESSAGE'
            ? `${p}        if (typeof d.${name}[i] !== "object")\n${p}            throw TypeError(".proto.${name}: object expected");\n${p}        m.${name}[i] = ${qualify(field.ref)}.fromObject(d.${name}[i], n + 1);\n`
            : `${p}        m.${name}[i] = ${coerce(field.kind, `d.${name}[i]`)};\n`
        return `${p}if (d.${name}) {\n${p}    if (!Array.isArray(d.${name}))\n${p}        throw TypeError(".proto.${name}: array expected");\n${p}    m.${name} = [];\n${p}    for (var i = 0; i < d.${name}.length; ++i) {\n${item}${p}    }\n${p}}\n`
    }
    if (field.kind === 'MESSAGE') {
        return `${p}if (d.${name} != null) {\n${p}    if (typeof d.${name} !== "object")\n${p}        throw TypeError(".proto.${name}: object expected");\n${p}    m.${name} = ${qualify(field.ref)}.fromObject(d.${name}, n + 1);\n${p}}\n`
    }
    if (field.kind === 'BYTES') {
        return `${p}if (d.${name} != null) {\n${p}    if (typeof d.${name} === "string")\n${p}        $util.base64.decode(d.${name}, m.${name} = $util.newBuffer($util.base64.length(d.${name})), 0);\n${p}    else if (d.${name}.length >= 0)\n${p}        m.${name} = d.${name};\n${p}}\n`
    }
    if (LONG_KINDS.has(field.kind)) {
        const unsigned = UNSIGNED_KINDS.has(field.kind)
        return `${p}if (d.${name} != null) {\n${p}    if ($util.Long)\n${p}        (m.${name} = $util.Long.fromValue(d.${name})).unsigned = ${unsigned};\n${p}    else if (typeof d.${name} === "string")\n${p}        m.${name} = parseInt(d.${name}, 10);\n${p}    else if (typeof d.${name} === "number")\n${p}        m.${name} = d.${name};\n${p}    else if (typeof d.${name} === "object")\n${p}        m.${name} = new $util.LongBits(d.${name}.low >>> 0, d.${name}.high >>> 0).toNumber(${unsigned});\n${p}}\n`
    }
    return `${p}if (d.${name} != null) {\n${p}    m.${name} = ${coerce(field.kind, 'd.' + name)};\n${p}}\n`
}

const toField = (field, indent) => {
    const p = ' '.repeat(indent)
    const name = field.name
    if (field.repeated) {
        const item = field.kind === 'MESSAGE'
            ? `${qualify(field.ref)}.toObject(m.${name}[j], o)`
            : field.kind === 'BYTES'
                ? `o.bytes === String ? $util.base64.encode(m.${name}[j], 0, m.${name}[j].length) : o.bytes === Array ? Array.prototype.slice.call(m.${name}[j]) : m.${name}[j]`
                : `m.${name}[j]`
        return `${p}if (m.${name} && m.${name}.length) {\n${p}    d.${name} = [];\n${p}    for (var j = 0; j < m.${name}.length; ++j) {\n${p}        d.${name}[j] = ${item};\n${p}    }\n${p}}\n`
    }
    const head = `${p}if (m.${name} != null && m.hasOwnProperty("${name}")) {\n`
    const tail = `${p}    if (o.oneofs)\n${p}        d._${name} = "${name}";\n${p}}\n`
    if (field.kind === 'MESSAGE') return head + `${p}    d.${name} = ${qualify(field.ref)}.toObject(m.${name}, o);\n` + tail
    if (field.kind === 'BYTES') return head + `${p}    d.${name} = o.bytes === String ? $util.base64.encode(m.${name}, 0, m.${name}.length) : o.bytes === Array ? Array.prototype.slice.call(m.${name}) : m.${name};\n` + tail
    if (LONG_KINDS.has(field.kind)) {
        const unsigned = UNSIGNED_KINDS.has(field.kind)
        return head + `${p}    if (typeof m.${name} === "number")\n${p}        d.${name} = o.longs === String ? String(m.${name}) : m.${name};\n${p}    else\n${p}        d.${name} = o.longs === String ? longToString(m.${name}, ${unsigned}) : o.longs === Number ? longToNumber(m.${name}, ${unsigned}) : m.${name};\n` + tail
    }
    return head + `${p}    d.${name} = m.${name};\n` + tail
}

const tsTypeOf = field => {
    let type
    if (field.kind === 'MESSAGE') type = interfaceOf(field.ref)
    else if (field.kind === 'STRING') type = 'string'
    else if (field.kind === 'BYTES') type = 'Uint8Array'
    else if (field.kind === 'BOOL') type = 'boolean'
    else if (LONG_KINDS.has(field.kind)) type = 'number|Long'
    else type = 'number'
    return field.repeated ? `${type}[]` : type
}

const patchRuntime = (source, gaps, needed, specs) => {
    let src = source

    const methodIndent = name => {
        for (const width of [8, 4, 12, 16, 20, 24]) {
            if (src.includes(`\n${' '.repeat(width)}${name}.encode = function encode(`)) return width
        }
        throw new Error(`runtime block not found: ${name}`)
    }

    const insertBefore = (needle, from, text) => {
        const at = src.indexOf(needle, from)
        if (at === -1) throw new Error(`anchor not found: ${needle.trim()}`)
        src = src.slice(0, at) + text + src.slice(at)
    }

    const buildType = (name, fields, indent) => {
        const local = leaf(name)
        const owner = name.includes('.') ? leaf(name.split('.').slice(0, -1).join('.')) : 'proto'
        const p = ' '.repeat(indent)
        const out = []
        out.push(`${p}${owner}.${local} = (function() {\n\n`)
        out.push(`${p}    function ${local}(p) {\n${p}        if (p)\n${p}            for (var ks = Object.keys(p), i = 0; i < ks.length; ++i)\n${p}                if (p[ks[i]] != null && ks[i] !== "__proto__")\n${p}                    this[ks[i]] = p[ks[i]];\n${p}    }\n\n`)
        for (const field of fields) out.push(`${p}    ${local}.prototype.${field.name} = ${field.repeated ? '$util.emptyArray' : 'null'};\n`)
        out.push(`\n${p}    let $oneOfFields;\n`)
        for (const field of fields.filter(entry => !entry.repeated)) {
            out.push(`\n${p}    Object.defineProperty(${local}.prototype, "_${field.name}", {\n${p}        get: $util.oneOfGetter($oneOfFields = ["${field.name}"]),\n${p}        set: $util.oneOfSetter($oneOfFields)\n${p}    });\n`)
        }
        out.push(`\n${p}    ${local}.create = function create(properties) {\n${p}        return new ${local}(properties);\n${p}    };\n\n`)
        out.push(`${p}    ${local}.encode = function encode(m, w) {\n${p}        if (!w)\n${p}            w = $Writer.create();\n`)
        for (const field of fields) out.push(encodeField(field, indent + 8))
        out.push(`${p}        return w;\n${p}    };\n\n`)
        out.push(`${p}    ${local}.decode = function decode(r, l, e, n) {\n${p}        if (!(r instanceof $Reader))\n${p}            r = $Reader.create(r);\n${p}        if (n === undefined)\n${p}            n = 0;\n${p}        if (n > $Reader.recursionLimit)\n${p}            throw Error("maximum nesting depth exceeded");\n${p}        var c = l === undefined ? r.len : r.pos + l, m = new ${qualify(name)}();\n${p}        while (r.pos < c) {\n${p}            var t = r.uint32();\n${p}            if (t === e)\n${p}                break;\n${p}            switch (t >>> 3) {\n`)
        for (const field of fields) out.push(decodeField(field, indent + 12))
        out.push(`${p}            default:\n${p}                r.skipType(t & 7, n);\n${p}                break;\n${p}            }\n${p}        }\n${p}        return m;\n${p}    };\n\n`)
        out.push(`${p}    ${local}.fromObject = function fromObject(d, n) {\n${p}        if (d instanceof ${qualify(name)})\n${p}            return d;\n${p}        if (n === undefined)\n${p}            n = 0;\n${p}        if (n > $util.recursionLimit)\n${p}            throw Error("maximum nesting depth exceeded");\n${p}        var m = new ${qualify(name)}();\n`)
        for (const field of fields) out.push(fromField(field, indent + 8))
        out.push(`${p}        return m;\n${p}    };\n\n`)
        out.push(`${p}    ${local}.toObject = function toObject(m, o) {\n${p}        if (!o)\n${p}            o = {};\n${p}        var d = {};\n`)
        if (fields.some(field => field.repeated)) {
            out.push(`${p}        if (o.arrays || o.defaults) {\n` + fields.filter(field => field.repeated).map(field => `${p}            d.${field.name} = [];\n`).join('') + `${p}        }\n`)
        }
        for (const field of fields) out.push(toField(field, indent + 8))
        out.push(`${p}        return d;\n${p}    };\n\n`)
        out.push(`${p}    ${local}.prototype.toJSON = function toJSON() {\n${p}        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);\n${p}    };\n\n`)
        out.push(`${p}    ${local}.getTypeUrl = function getTypeUrl(typeUrlPrefix) {\n${p}        if (typeUrlPrefix === undefined) {\n${p}            typeUrlPrefix = "type.googleapis.com";\n${p}        }\n${p}        return typeUrlPrefix + "/proto.${name}";\n${p}    };\n\n`)
        out.push(`${p}    return ${local};\n${p}})();\n\n`)
        return out.join('')
    }

    const addType = name => {
        const fields = specs.get(name)
        const parts = name.split('.')
        if (parts.length === 1) {
            const anchor = '\n    proto.ReportingTokenInfo = (function() {'
            const at = src.indexOf(anchor)
            if (at === -1) throw new Error('top level anchor missing')
            src = src.slice(0, at + 1) + buildType(name, fields, 4) + src.slice(at + 1)
            return
        }
        const parent = parts[parts.length - 2]
        const indent = methodIndent(parent)
        const p = ' '.repeat(indent)
        const from = src.indexOf(`\n${p}function ${parent}(p) {`)
        const at = src.indexOf(`\n${p}return ${parent};\n`, from === -1 ? 0 : from)
        if (at === -1) throw new Error(`parent return anchor missing: ${name}`)
        src = src.slice(0, at + 1) + buildType(name, fields, indent) + src.slice(at + 1)
    }

    const addFields = (name, fields) => {
        const local = leaf(name)
        const indent = methodIndent(local)
        const p = ' '.repeat(indent)

        const start = src.indexOf(`\n${p}function ${local}(p) {`)
        const oneOfAt = src.indexOf(`\n${p}let $oneOfFields;`, start)
        if (oneOfAt === -1) throw new Error(`oneOfFields anchor not found: ${local}`)
        src = src.slice(0, oneOfAt + 1) + fields.map(field => `${p}${local}.prototype.${field.name} = ${field.repeated ? '$util.emptyArray' : 'null'};\n`).join('') + src.slice(oneOfAt + 1)

        const singles = fields.filter(field => !field.repeated)
        if (singles.length) {
            const createAt = src.indexOf(`\n${p}${local}.create = function create(`)
            if (createAt === -1) throw new Error(`create anchor not found: ${local}`)
            const block = singles.map(field => `\n${p}Object.defineProperty(${local}.prototype, "_${field.name}", {\n${p}    get: $util.oneOfGetter($oneOfFields = ["${field.name}"]),\n${p}    set: $util.oneOfSetter($oneOfFields)\n${p}});\n`).join('')
            src = src.slice(0, createAt) + block + src.slice(createAt)
        }

        const join = parts => '\n' + parts.join('').replace(/\n$/, '')
        insertBefore(`\n${p}    return w;\n`, src.indexOf(`\n${p}${local}.encode = function encode(`), join(fields.map(field => encodeField(field, indent + 4))))
        insertBefore(`\n${' '.repeat(indent + 8)}default:\n`, src.indexOf(`\n${p}${local}.decode = function decode(`), join(fields.map(field => decodeField(field, indent + 8))))
        insertBefore(`\n${p}    return m;\n`, src.indexOf(`\n${p}${local}.fromObject = function fromObject(`), join(fields.map(field => fromField(field, indent + 4))))
        insertBefore(`\n${p}    return d;\n`, src.indexOf(`\n${p}${local}.toObject = function toObject(`), join(fields.map(field => toField(field, indent + 4))))
    }

    for (const name of [...needed].sort((a, b) => a.split('.').length - b.split('.').length)) addType(name)
    for (const gap of gaps) addFields(gap.type, gap.fields)
    return src
}

const patchTypings = (source, gaps, needed, specs) => {
    let src = source

    const anchorAt = match => ({
        open: match.index + match[0].length - 1,
        indent: match.index - src.lastIndexOf('\n', match.index) - 1
    })

    const findInterface = wanted => {
        const scope = []
        let depth = 0
        for (const match of src.matchAll(/namespace\s+([A-Za-z0-9_]+)\s*\{|interface\s+I([A-Za-z0-9_]+)\s*\{|\{|\}/g)) {
            if (match[0] === '}') {
                depth--
                while (scope.length && scope[scope.length - 1].depth >= depth) scope.pop()
                continue
            }
            if (match[2]) {
                const path = [...scope.map(entry => entry.name), match[2]].join('.').replace(/^proto\./, '')
                if (path === wanted) return anchorAt(match)
            }
            else if (match[1]) scope.push({ name: match[1], depth })
            depth++
        }
        return null
    }

    const findNamespace = wanted => {
        const scope = []
        let depth = 0
        for (const match of src.matchAll(/namespace\s+([A-Za-z0-9_]+)\s*\{|\{|\}/g)) {
            if (match[0] === '}') {
                depth--
                while (scope.length && scope[scope.length - 1].depth >= depth) scope.pop()
                continue
            }
            if (match[1]) {
                const path = [...scope.map(entry => entry.name), match[1]].join('.').replace(/^proto\./, '')
                if (path === wanted) return anchorAt(match)
                scope.push({ name: match[1], depth })
            }
            depth++
        }
        return null
    }

    const findClass = name => {
        const local = leaf(name)
        const hits = [...src.matchAll(new RegExp(`class ${local} implements I${local} \\{`, 'g'))]
        if (hits.length !== 1) return null
        return { open: hits[0].index + hits[0][0].length - 1, indent: hits[0].index - src.lastIndexOf('\n', hits[0].index) - 1 }
    }

    const buildTypings = (name, indent) => {
        const local = leaf(name)
        const fields = specs.get(name)
        const p = ' '.repeat(indent)
        const iface = interfaceOf(name)
        const declaration = `${p}interface I${local} {\n` + fields.map(field => `${p}    ${field.name}?: (${tsTypeOf(field)}|null);\n`).join('') + `${p}}\n\n`
        const klass = `${p}class ${local} implements I${local} {\n`
            + `${p}    constructor(p?: ${iface});\n`
            + fields.map(field => `${p}    public ${field.name}?: (${tsTypeOf(field)}|null);\n`).join('')
            + fields.filter(field => !field.repeated).map(field => `${p}    public _${field.name}?: "${field.name}";\n`).join('')
            + `${p}    public static create(properties?: ${iface}): proto.${name};\n`
            + `${p}    public static encode(m: ${iface}, w?: $protobuf.Writer): $protobuf.Writer;\n`
            + `${p}    public static decode(r: ($protobuf.Reader|Uint8Array), l?: number): proto.${name};\n`
            + `${p}    public static fromObject(d: { [k: string]: any }): proto.${name};\n`
            + `${p}    public static toObject(m: proto.${name}, o?: $protobuf.IConversionOptions): { [k: string]: any };\n`
            + `${p}    public toJSON(): { [k: string]: any };\n`
            + `${p}    public static getTypeUrl(typeUrlPrefix?: string): string;\n`
            + `${p}}\n\n`
        return declaration + klass
    }

    for (const gap of gaps) {
        const iface = findInterface(gap.type)
        if (iface) {
            const p = ' '.repeat(iface.indent + 4)
            const lines = gap.fields.map(field => `${p}${field.name}?: (${tsTypeOf(field)}|null);\n`).join('')
            src = src.slice(0, iface.open + 1) + '\n' + lines.replace(/\n$/, '') + src.slice(iface.open + 1)
        }
        const klass = findClass(gap.type)
        if (klass) {
            const p = ' '.repeat(klass.indent + 4)
            const lines = gap.fields.map(field => `${p}public ${field.name}?: (${tsTypeOf(field)}|null);\n`).join('')
            src = src.slice(0, klass.open + 1) + '\n' + lines.replace(/\n$/, '') + src.slice(klass.open + 1)
        }
    }

    const ordered = [...needed].sort((a, b) => a.split('.').length - b.split('.').length)
    const deferred = []
    for (const name of ordered) {
        if (!name.includes('.')) {
            const at = src.indexOf('    interface IReportingTokenInfo {')
            src = src.slice(0, at) + buildTypings(name, 4) + src.slice(at)
            continue
        }
        const parent = name.split('.').slice(0, -1).join('.')
        const namespace = findNamespace(parent)
        if (!namespace) {
            deferred.push(name)
            continue
        }
        src = src.slice(0, namespace.open + 1) + '\n' + buildTypings(name, namespace.indent + 4) + src.slice(namespace.open + 1)
    }

    for (const name of deferred) {
        const parent = name.split('.').slice(0, -1).join('.')
        let namespace = findNamespace(parent)
        if (!namespace) {
            const local = leaf(parent)
            const hit = src.match(new RegExp(`class ${local} implements I${local} \\{`))
            if (!hit) throw new Error(`cannot place nested typing: ${name}`)
            const open = hit.index + hit[0].length - 1
            const end = closingBrace(src, open)
            const indent = hit.index - src.lastIndexOf('\n', hit.index) - 1
            const p = ' '.repeat(indent)
            src = src.slice(0, end + 1) + `\n\n${p}namespace ${local} {\n${p}}\n` + src.slice(end + 1)
            namespace = findNamespace(parent)
        }
        if (!namespace) throw new Error(`cannot place nested typing: ${name}`)
        src = src.slice(0, namespace.open + 1) + '\n' + buildTypings(name, namespace.indent + 4) + src.slice(namespace.open + 1)
    }

    return src
}

const bundle = await loadBundle({ directory: process.env.PROTO_BUNDLE_DIR })
const fork = readForkInterfaces()
const { missingMessage, gaps, needed } = diffBundle(bundle, fork)

if (missingMessage.length) {
    console.error('Message oneof is behind the bundle; regenerate WAProto rather than patching:')
    for (const [name, id] of missingMessage) console.error(`  - ${name} (field ${id})`)
    process.exit(2)
}

if (!gaps.length) {
    console.log('WAProto already declares every field the bundle does.')
    process.exit(0)
}

const runtimePath = join(root, 'WAProto/index.js')
const typingsPath = join(root, 'WAProto/index.d.ts')

writeFileSync(runtimePath, patchRuntime(readFileSync(runtimePath, 'utf8'), gaps, needed, bundle.specs))
writeFileSync(typingsPath, patchTypings(readFileSync(typingsPath, 'utf8'), gaps, needed, bundle.specs))

const added = gaps.reduce((total, gap) => total + gap.fields.length, 0)
console.log(`Added ${added} fields across ${gaps.length} types and ${needed.length} new types.`)
for (const gap of gaps) console.log(`  - ${gap.type}: ${gap.fields.map(field => field.name).join(', ')}`)
