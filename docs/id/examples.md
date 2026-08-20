# Contoh

Program lengkap, bukan potongan. Semuanya bisa langsung dijalankan setelah `@rexxhayanasi/elaina-baileys` terpasang dan `"type": "module"` diset.

## Bot perintah

Menyambung ulang saat putus, mengabaikan sinkronisasi riwayat, dan merutekan perintah teks.

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
    if (connection === 'open') console.log('tersambung')

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode
      if (code !== DisconnectReason.loggedOut) start()
      else console.log('sudah logout, hapus ./session lalu pairing lagi')
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
          await sock.sendMessage(jid, { text: `Cara pakai: ${PREFIX}echo <teks>` }, { quoted: message })
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

Tiga detail yang layak ditiru:

**`message.key.fromMe`** — tanpa ini bot membalas pesannya sendiri dan bisa berputar tanpa henti.

**`type !== 'notify'`** — sinkronisasi riwayat mengirim pesan lama lewat event yang sama. Melewatkan ini membuat bot membalas seluruh tumpukan pesan lamamu saat dinyalakan.

**`{ quoted: message }`** — balasan jadi rapi di grup, tempat banyak orang bicara bersamaan.

## Pairing dengan kode

Untuk server headless yang merepotkan kalau harus scan QR.

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
  if (connection === 'open') console.log('terpasang dan tersambung')
})
```

Masukkan kodenya di HP lewat **Perangkat tertaut → Tautkan dengan nomor telepon**.

## Menu interaktif

```js
import { Button } from '@rexxhayanasi/elaina-baileys'

async function sendMenu(sock, jid) {
  const menu = new Button(sock)
    .setTitle('Elaina')
    .setBody('Mau melakukan apa?')
    .setFooter('Elaina Baileys')
    .addReply('Ping', 'menu_ping')
    .addReply('Tentang', 'menu_about')
    .addUrl('Dokumentasi', 'https://github.com/rexxzyid/elaina-baileys')

  await menu.send(jid)
}
```

Tombol yang ditekan kembali sebagai pesan biasa yang membawa id yang kamu set, jadi tangani di tempat yang sama dengan pesan teks:

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

Balasan native-flow datang sebagai `paramsJson`, yaitu string JSON, bukan id polos — itulah sebabnya pengecekan di atas memakai `includes`, bukan perbandingan sama dengan. Parse isinya kalau kamu butuh payload terstruktur.

## Memposting ke channel

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
    console.log('bukan admin channel ini')
    return
  }

  console.log('capabilities:', capabilities)

  await sock.sendMessage(CHANNEL, { text: 'Update dari Elaina 💜' })
})
```

Mengecek capabilities dulu setimpal dengan satu panggilan tambahan. Beberapa fitur channel dibatasi per akun, dan ketika salah satunya tidak ada, server menerima request lalu membuangnya tanpa error — jadi kegagalan diam-diam terlihat persis seperti keberhasilan.

## Mengunduh media masuk

`downloadContentFromMessage` menerima node medianya langsung — bukan seluruh pesan — beserta tipenya, dan mengembalikan stream:

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
  console.log('tersimpan', buffer.length, 'byte')
})
```

Argumen kedua adalah tipe media — `'image'`, `'video'`, `'audio'`, `'document'`, `'sticker'` — dan harus cocok dengan node yang kamu berikan, karena tipe itulah yang menentukan kunci dekripsinya.

## Menjaga sesi tetap aman

Semua contoh di atas menulis kredensial ke `./session`. Tambahkan ke `.gitignore` sebelum commit pertama:

```text
session/
node_modules/
```

Siapa pun yang memegang folder itu sedang login sebagai kamu. Menyalinnya ke mesin lain memberi mesin itu sesimu; menghapusnya memaksa pairing ulang.
