const { readFileSync, writeFileSync } = require('fs')

const BASE_FILE = './WAProto.proto'
const UPSTREAM_FILE = './WAProto.upstream.proto'

let base = readFileSync(BASE_FILE, 'utf8')
const upstream = readFileSync(UPSTREAM_FILE, 'utf8')

const startTypes = process.argv.slice(2)

if (!startTypes.length) {
  console.error('Usage: node add-missing-proto-deps.js TypeName [TypeName...]')
  process.exit(1)
}

const BUILTIN = new Set([
  'double', 'float', 'int32', 'int64', 'uint32', 'uint64',
  'sint32', 'sint64', 'fixed32', 'fixed64',
  'sfixed32', 'sfixed64', 'bool', 'string', 'bytes',
])

function esc(v) {
  return v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findBlock(source, name) {
  const re = new RegExp(`(^|\\n)(message|enum)\\s+${esc(name)}\\s*\\{`, 'm')
  const m = re.exec(source)
  if (!m) return null

  const start = m.index + (m[1] ? m[1].length : 0)
  const open = source.indexOf('{', start)

  let depth = 0
  let lineComment = false
  let blockComment = false

  for (let i = open; i < source.length; i++) {
    const ch = source[i]
    const next = source[i + 1]

    if (lineComment) {
      if (ch === '\n') lineComment = false
      continue
    }

    if (blockComment) {
      if (ch === '*' && next === '/') {
        blockComment = false
        i++
      }
      continue
    }

    if (ch === '/' && next === '/') {
      lineComment = true
      i++
      continue
    }

    if (ch === '/' && next === '*') {
      blockComment = true
      i++
      continue
    }

    if (ch === '{') depth++
    if (ch === '}') {
      depth--
      if (depth === 0) {
        return {
          text: source.slice(start, i + 1),
        }
      }
    }
  }

  throw new Error(`Block not closed: ${name}`)
}

function hasBlock(source, name) {
  return !!findBlock(source, name)
}

function extractDeps(blockText) {
  const deps = new Set()

  const patterns = [
    /\b(?:optional|required|repeated)\s+([A-Z][A-Za-z0-9_]*(?:\.[A-Z][A-Za-z0-9_]*)*)\s+[A-Za-z_][A-Za-z0-9_]*\s*=/g,
    /^\s*([A-Z][A-Za-z0-9_]*(?:\.[A-Z][A-Za-z0-9_]*)*)\s+[A-Za-z_][A-Za-z0-9_]*\s*=/gm,
  ]

  for (const re of patterns) {
    let m
    while ((m = re.exec(blockText))) {
      const dep = m[1].split('.')[0]
      if (!BUILTIN.has(dep)) deps.add(dep)
    }
  }

  return [...deps]
}

function addType(name, seen = new Set()) {
  if (seen.has(name)) return
  seen.add(name)

  if (hasBlock(base, name)) {
    console.log(`✅ ${name} sudah ada`)
    return
  }

  const block = findBlock(upstream, name)

  if (!block) {
    console.log(`⚠️ upstream tidak punya ${name}`)
    return
  }

  base = `${base.trim()}\n\n${block.text}\n`
  console.log(`➕ add ${name}`)

  const deps = extractDeps(block.text)
  for (const dep of deps) {
    if (dep !== name) addType(dep, seen)
  }
}

for (const name of startTypes) addType(name)

base = base.replace(/\brequired\b/g, 'optional')

writeFileSync(BASE_FILE, base.trim() + '\n')
console.log('✅ missing deps added')
