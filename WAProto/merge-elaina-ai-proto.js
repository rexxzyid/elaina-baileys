const { readFileSync, writeFileSync } = require('fs')

const BASE_FILE = './WAProto.proto'
const UPSTREAM_FILE = './WAProto.upstream.proto'

let base = readFileSync(BASE_FILE, 'utf8')
const upstream = readFileSync(UPSTREAM_FILE, 'utf8')

const BLOCKS = [
  'AIRichResponseMessage',
  'AIRichResponseSubMessage',
  'AIRichResponseCodeMetadata',
  'AIRichResponseContentItemsMetadata',
  'AIRichResponseDynamicMetadata',
  'AIRichResponseGridImageMetadata',
  'AIRichResponseImageURL',
  'AIRichResponseInlineImageMetadata',
  'AIRichResponseLatexMetadata',
  'AIRichResponseMapMetadata',
  'AIRichResponseTableMetadata',
  'AIRichResponseUnifiedResponse',
  'AIRichResponseMessageType',
  'AIRichResponseSubMessageType',

  'BotMetadata',
  'BotCapabilityMetadata',
  'BotFeedbackMessage',
  'BotSourcesMetadata',
  'BotSuggestedPromptMetadata',
  'BotSessionMetadata',
  'BotRenderingMetadata',
  'BotProgressIndicatorMetadata',
  'BotMemoryMetadata',
  'BotModelMetadata',
  'BotReminderMetadata',
  'BotImagineMetadata',
  'BotQuotaMetadata',
  'BotPromotionMessageMetadata',
  'BotLinkedAccountsMetadata',
  'BotUnifiedResponseMutation',
  'BotSignatureVerificationMetadata',
  'BotPluginMetadata',
  'BotMediaMetadata',
  'BotMetricsMetadata',
  'BotModeSelectionMetadata',
  'BotAgeCollectionMetadata',
  'BotMessageOriginMetadata',
  'BotMessageSharingInfo',

  'AIHomeState',
  'AIQueryFanout',
  'AIRegenerateMetadata',
  'AIThreadInfo'
]

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
          start,
          end: i + 1,
          text: source.slice(start, i + 1)
        }
      }
    }
  }

  throw new Error(`Block not closed: ${name}`)
}

function hasBlock(source, name) {
  return !!findBlock(source, name)
}

function replaceOrAdd(name) {
  const up = findBlock(upstream, name)

  if (!up) {
    console.log(`⚠️ upstream tidak punya ${name}`)
    return
  }

  const old = findBlock(base, name)

  if (old) {
    base = base.slice(0, old.start) + up.text + base.slice(old.end)
    console.log(`🔁 replace ${name}`)
  } else {
    base = `${base.trim()}\n\n${up.text}\n`
    console.log(`➕ add ${name}`)
  }
}

function getMessageField(fieldName) {
  const msg = findBlock(upstream, 'Message')
  if (!msg) throw new Error('message Message tidak ada di upstream')

  return msg.text
    .split('\n')
    .find(v => new RegExp(`\\b${esc(fieldName)}\\s*=\\s*\\d+\\b`).test(v) && v.trim().endsWith(';'))
    ?.trim() || null
}

function addMessageField(fieldName) {
  if (new RegExp(`\\b${esc(fieldName)}\\s*=`).test(base)) {
    console.log(`✅ Message.${fieldName} sudah ada`)
    return
  }

  const line = getMessageField(fieldName)
  if (!line) {
    console.log(`⚠️ upstream tidak punya field Message.${fieldName}`)
    return
  }

  const msg = findBlock(base, 'Message')
  if (!msg) throw new Error('message Message tidak ada di base')

  const text = msg.text
  const close = text.lastIndexOf('}')
  const next = `${text.slice(0, close)}    ${line}\n${text.slice(close)}`

  base = base.slice(0, msg.start) + next + base.slice(msg.end)
  console.log(`➕ add Message.${fieldName}`)
}

console.log('== Merge AI/Bot/AIRich only ==')

for (const name of BLOCKS) {
  replaceOrAdd(name)
}

console.log('\n== Add Message.richResponseMessage only ==')
addMessageField('richResponseMessage')

console.log('\n== Sanitize required -> optional ==')
base = base.replace(/\brequired\b/g, 'optional')

writeFileSync(BASE_FILE, base.trim() + '\n')
console.log('\n✅ merge selesai: AI/Bot/AIRich ditambahkan, JID/LID Elaina tetap jadi base')
