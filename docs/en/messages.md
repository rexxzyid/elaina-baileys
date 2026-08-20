# Messages

## Receiving

Everything arrives through `messages.upsert`. The `type` tells you whether this is a live message or part of a history sync — for a bot you usually want only `notify`.

```js
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return

  const message = messages[0]
  if (!message?.message) return

  console.log('From:', message.key.remoteJid)
  console.log('Message:', message.message)
})
```

Skipping the `type` check is the most common reason a bot replies to hundreds of old messages the moment it starts.

## Reading the text

A message body lives in a different field depending on its type, so pulling out plain text means checking a handful of places:

```js
sock.ev.on('messages.upsert', async ({ messages }) => {
  const m = messages[0]
  if (!m?.message) return

  const text =
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.imageMessage?.caption ||
    m.message.videoMessage?.caption ||
    ''

  console.log(text)
})
```

`conversation` is a plain text message. `extendedTextMessage` is text with something attached — a link preview, a quote, formatting.

## Addressing: JID, PN and LID

Recent WhatsApp versions may identify a user by a **LID** rather than a phone-number JID. Do not assume every identifier ends in `@s.whatsapp.net`.

```text
6281234567890@s.whatsapp.net
123456789012345@lid
120363xxxxxxxxxx@g.us
123456789@newsletter
```

Incoming keys carry both forms when WhatsApp supplies them:

```js
const key = message.key

console.log('remoteJid:', key.remoteJid)
console.log('remoteJidAlt:', key.remoteJidAlt)
console.log('participant:', key.participant)
console.log('participantAlt:', key.participantAlt)
```

`remoteJidAlt` and `participantAlt` hold the alternate address, so an application that prefers phone-number JIDs can use them. Keep the original around too — some protocol operations still need the address WhatsApp originally sent.

Normalise with the built-in helpers rather than string surgery:

```js
import { jidDecode, jidEncode, jidNormalizedUser } from '@rexxhayanasi/elaina-baileys'

const normalized = jidNormalizedUser(jid)
const decoded = jidDecode(jid)
```

> [!IMPORTANT]
> A LID and a PN are two addresses for the same account only when WhatsApp gives you the mapping, or your application already knows it. Never invent a phone number by swapping `@lid` for `@s.whatsapp.net` — the digits are unrelated.

## Sending

### Text

```js
await sock.sendMessage(jid, {
  text: 'Hello from Elaina 💜'
})
```

### Image

```js
await sock.sendMessage(jid, {
  image: { url: 'https://example.com/image.jpg' },
  caption: 'Elaina Image'
})
```

Media accepts `{ url }` for a remote file or a local path, and also a `Buffer` and a stream.

### Video

```js
await sock.sendMessage(jid, {
  video: { url: 'https://example.com/video.mp4' },
  caption: 'Elaina Video'
})
```

### Document

```js
await sock.sendMessage(jid, {
  document: { url: 'https://example.com/file.pdf' },
  fileName: 'document.pdf',
  mimetype: 'application/pdf'
})
```

`fileName` is what the recipient sees and what they get when they save it. Without a `mimetype`, WhatsApp may not preview the file.

### Location

```js
await sock.sendMessage(jid, {
  location: {
    degreesLatitude: -6.200000,
    degreesLongitude: 106.816666,
    name: 'Jakarta',
    address: 'Jakarta, Indonesia'
  }
})
```

### Poll

```js
await sock.sendMessage(jid, {
  poll: {
    name: 'Choose one',
    values: ['Option A', 'Option B', 'Option C'],
    selectableCount: 1
  }
})
```

`selectableCount: 1` makes it single-choice. Raise it to allow multiple answers.

### Photo poll

Give an option an `image` and the poll becomes a photo poll:

```js
await sock.sendMessage(jid, {
  poll: {
    name: 'Which cover?',
    values: [
      { name: 'Jakarta', image: { url: './jakarta.jpg' } },
      { name: 'Bandung', image: { url: './bandung.jpg' } }
    ],
    selectableCount: 1
  }
})
```

String options and image options can be mixed. Plain strings still send a normal text poll.

> [!NOTE]
> Photo polls are verified **Offline** — the proto is confirmed locally but has not been run against WhatsApp's servers. See [EXPERIMENTAL.md](https://github.com/rexxzyid/elaina-baileys/blob/main/EXPERIMENTAL.md).

## Replying and quoting

Pass the original message as `quoted` to reply to it:

```js
await sock.sendMessage(jid, { text: 'pong' }, { quoted: message })
```

## Link preview cards

`externalAdReply` renders a large card with a thumbnail and a source link:

```js
await sock.sendMessage(jid, {
  text: 'Elaina Baileys',
  contextInfo: {
    externalAdReply: {
      title: 'Elaina Baileys',
      body: 'Modern WhatsApp Multi-Device library',
      mediaType: 1,
      thumbnailUrl: 'https://example.com/elaina.jpg',
      sourceUrl: 'https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys',
      renderLargerThumbnail: true,
      showAdAttribution: false
    }
  }
})
```

Set `renderLargerThumbnail: false` for a compact card. `showAdAttribution: true` adds the "Sponsored" label.

## Next

For buttons, lists and carousels, continue to [MessageBuilder](./builder.html).
