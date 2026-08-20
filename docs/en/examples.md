# Examples

Complete programs, not fragments. Each one runs as written once you have `@rexxhayanasi/elaina-baileys` installed and `"type": "module"` set.

## A command bot

Reconnects on drop, ignores history sync, and routes text commands.

```js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from '@rexxhayanasi/elaina-baileys'
import pino from 'pino'

const PREFIX = '.'

function textOf(message) {
  const m = message.message
  if (!m) return ''
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    ''
  )
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' })
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') console.log('connected')

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code !== DisconnectReason.loggedOut) start()
      else console.log('logged out, delete ./session and pair again')
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    const message = messages[0]
    if (!message?.message || message.key.fromMe) return

    const jid = message.key.remoteJid
    const body = textOf(message).trim()
    if (!body.startsWith(PREFIX)) return

    const [command, ...args] = body.slice(PREFIX.length).split(/\s+/)

    switch (command.toLowerCase()) {
      case 'ping':
        await sock.sendMessage(jid, { text: 'pong' }, { quoted: message })
        break

      case 'echo':
        if (!args.length) {
          await sock.sendMessage(jid, { text: `Usage: ${PREFIX}echo <text>` }, { quoted: message })
          break
        }
        await sock.sendMessage(jid, { text: args.join(' ') }, { quoted: message })
        break

      case 'id':
        await sock.sendMessage(jid, { text: jid }, { quoted: message })
        break

      default:
        break
    }
  })
}

start()
```

Three details worth copying:

**`message.key.fromMe`** — without this the bot answers its own messages and can loop.

**`type !== 'notify'`** — history sync delivers old messages through the same event. Skipping this makes the bot reply to your entire backlog on startup.

**`{ quoted: message }`** — replies thread properly in groups, where several people talk at once.

## Pairing by code

For a headless server where scanning a QR is awkward.

```js
import makeWASocket, { useMultiFileAuthState } from '@rexxhayanasi/elaina-baileys'
import pino from 'pino'

const PHONE = '6281234567890'

const { state, saveCreds } = await useMultiFileAuthState('./session')

const sock = makeWASocket({
  auth: state,
  logger: pino({ level: 'silent' })
})

sock.ev.on('creds.update', saveCreds)

if (!state.creds.registered) {
  const code = await sock.requestPairingCode(PHONE)
  console.log('Pairing code:', code)
}

sock.ev.on('connection.update', ({ connection }) => {
  if (connection === 'open') console.log('paired and connected')
})
```

Enter the code on the phone under **Linked devices → Link with phone number**.

## An interactive menu

```js
import { Button } from '@rexxhayanasi/elaina-baileys'

async function sendMenu(sock, jid) {
  const menu = new Button(sock)
    .setTitle('Elaina')
    .setBody('What would you like to do?')
    .setFooter('Elaina Baileys')
    .addReply('Ping', 'menu_ping')
    .addReply('About', 'menu_about')
    .addUrl('Docs', 'https://github.com/rexxzyid/elaina-baileys')

  await menu.send(jid)
}
```

Button taps come back as ordinary messages carrying the id you set, so handle them in the same place you handle text:

```js
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return

  const message = messages[0]
  if (!message?.message || message.key.fromMe) return

  const jid = message.key.remoteJid
  const selected =
    message.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    message.message.buttonsResponseMessage?.selectedButtonId ||
    message.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''

  if (selected.includes('menu_ping')) {
    await sock.sendMessage(jid, { text: 'pong' })
  }

  if (selected.includes('menu_about')) {
    await sock.sendMessage(jid, { text: 'Elaina Baileys 💜' })
  }
})
```

Native-flow replies arrive as `paramsJson`, a JSON string rather than a bare id — which is why the check above uses `includes` instead of an equality test. Parse it when you need the structured payload.

## Posting to a channel

```js
import makeWASocket, { useMultiFileAuthState } from '@rexxhayanasi/elaina-baileys'

const CHANNEL = '123456789@newsletter'

const { state, saveCreds } = await useMultiFileAuthState('./session')
const sock = makeWASocket({ auth: state })
sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', async ({ connection }) => {
  if (connection !== 'open') return

  const capabilities = await sock
    .newsletterAdminCapabilities(CHANNEL)
    .catch(() => null)

  if (!capabilities) {
    console.log('not an admin of this channel')
    return
  }

  console.log('capabilities:', capabilities)

  await sock.sendMessage(CHANNEL, { text: 'Update from Elaina 💜' })
})
```

Checking capabilities first is worth the extra call. Several channel features are gated per account, and when one is missing the server accepts the request and discards it without an error — so a silent no-op looks exactly like success.

## Downloading incoming media

`downloadContentFromMessage` takes the media node itself — not the whole message — plus its type, and returns a stream:

```js
import { downloadContentFromMessage } from '@rexxhayanasi/elaina-baileys'
import { writeFile } from 'node:fs/promises'

async function toBuffer(stream) {
  const chunks = []
  for await (const chunk of stream) chunks.push(chunk)
  return Buffer.concat(chunks)
}

sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return

  const image = messages[0]?.message?.imageMessage
  if (!image) return

  const stream = await downloadContentFromMessage(image, 'image')
  const buffer = await toBuffer(stream)

  await writeFile('./received.jpg', buffer)
  console.log('saved', buffer.length, 'bytes')
})
```

The second argument is the media type — `'image'`, `'video'`, `'audio'`, `'document'`, `'sticker'` — and it must match the node you passed, because it selects the decryption keys.

## Keeping the session safe

Everything above writes credentials to `./session`. Add it to `.gitignore` before your first commit:

```text
session/
node_modules/
```

Anyone holding that folder is logged in as you. Copying it to another machine gives that machine your session; deleting it forces a fresh pairing.
