<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">

<div align="center">
  <h1>💫 @rexxhayanasi/elaina-baileys</h1>
  <p><em>Custom WhatsApp library built upon Baileys — enhanced, modernized, and extended with an integrated message builder.</em></p>

  <img src="https://files.catbox.moe/dulwdz.jpeg" width="400" alt="Elaina Baileys Banner" />
  <br><br>

  <p>
    <a href="https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys">
      <img src="https://img.shields.io/npm/v/@rexxhayanasi/elaina-baileys?color=blueviolet&label=version&logo=npm" alt="npm version" />
    </a>
    <a href="https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys">
      <img src="https://img.shields.io/npm/dt/@rexxhayanasi/elaina-baileys?color=blueviolet&label=downloads&logo=npm" alt="npm downloads" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-success" alt="license" />
    </a>
    <img src="https://img.shields.io/badge/Node.js-%3E%3D22-339933?logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Module-ESM-F7DF1E?logo=javascript&logoColor=black" alt="ESM" />
    <img src="https://img.shields.io/badge/MessageBuilder-v4.6-7F5AF0" alt="Message Builder" />
  </p>

  <p>
    <a href="https://whatsapp.com/channel/0029Vb8RvQKEFeXmGnJr621s">
      <img src="https://img.shields.io/badge/Join-WhatsApp%20Channel-25D366?logo=whatsapp&logoColor=white" alt="WhatsApp Channel" />
    </a>
  </p>
</div>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212257468-1e9a91f1-b636-4676-a213-39d67b2d5d67.gif" width="100%">
</div>

> [!IMPORTANT]
> `@rexxhayanasi/elaina-baileys` is an unofficial WhatsApp Web API library and is not affiliated with, authorized, maintained, sponsored, or endorsed by WhatsApp or Meta.
>
> Use this project responsibly and comply with WhatsApp's Terms of Service and applicable laws.

> [!NOTE]
> Features reconstructed from the WhatsApp Web bundle, and how far each one has been verified, are documented in [EXPERIMENTAL.md](EXPERIMENTAL.md).

> [!NOTE]
> This project is built on top of the Baileys ecosystem and extends it with additional fixes, compatibility changes, interactive messaging support, and an integrated MessageBuilder.

> [!CAUTION]
> The previous project update channel is no longer used. Release information, changelogs, and project announcements are published through the current WhatsApp Channel linked in this README.

---

## 📌 Overview

`@rexxhayanasi/elaina-baileys` is a modern ESM-focused Baileys fork for WhatsApp Multi-Device development.

The package combines the socket layer, protocol utilities, LID-aware addressing support, and an integrated MessageBuilder in a single dependency. Buttons, native-flow messages, carousels, and AIRich layouts can be used directly from the package without installing a separate builder dependency.

### ✨ Highlights

| Feature | Description |
|---|---|
| 🔌 Multi-Device | Connect to WhatsApp using the Baileys Multi-Device protocol. |
| 🔐 Pairing Code | Supports normal and custom 8-character pairing codes. |
| 🖱️ Interactive Buttons | Quick reply, URL, copy, call, list/select, location, and other native-flow buttons. |
| 🧱 Integrated MessageBuilder | `Button`, `ButtonV2`, `Carousel`, `AIRich`, and `Toolkit` are included in the same package. |
| 🖼️ Albums | Send multiple images/videos as an album message. |
| 📢 Newsletter | Create, follow, update, react to, and fetch WhatsApp Channel/Newsletter data. |
| 👥 Groups | Group creation, participant management, metadata, description updates, and more. |
| 🪪 LID / PN Addressing | Supports modern LID addressing while exposing the PN/JID alternatives supplied by WhatsApp when available. |
| 📷 Profile Picture | Fetch, update, and remove profile pictures. |
| 🤖 AI Rich | Experimental rich-response builder for text, code, tables, media, suggestions, and other layouts. |
| 📦 ESM | ESM-first package designed for Node.js 22+; Node.js 24 is recommended. |

---

## 📚 Table of Contents

- [Requirements](#-requirements)
- [Installation](#-installation)
- [Import](#-import)
- [Basic Connection](#-basic-connection)
- [Pairing Code](#-pairing-code)
- [Receive Messages](#-receive-messages)
- [LID / PN / JID Addressing](#-lid--pn--jid-addressing)
- [Send Messages](#-send-messages)
- [External Ad Reply](#-external-ad-reply)
- [Integrated MessageBuilder](#-integrated-messagebuilder)
  - [Button](#button)
  - [Selection / List](#selection--list)
  - [ButtonV2](#buttonv2)
  - [Carousel](#carousel)
  - [AIRich](#airich)
- [Album Message](#-album-message)
- [Newsletter / Channel](#-newsletter--channel)
- [Username & About](#-username--about)
- [Group Management](#-group-management)
- [Profile Picture](#-profile-picture)
- [Useful Exports](#-useful-exports)
- [Update WhatsApp Web Version](#-update-whatsapp-web-version)
- [Modern WhatsApp Message APIs](#-modern-whatsapp-message-apis)
- [Troubleshooting](#-troubleshooting)
- [Credits](#-credits)
- [License](#-license)

---

## ⚙️ Requirements

- Node.js **22 or newer**
- **Node.js 24 recommended** for development and release workflows
- npm
- A WhatsApp account for pairing

Check your Node.js version:

```bash
node -v
```

---

## 📦 Installation

Install directly from npm:

```bash
npm install @rexxhayanasi/elaina-baileys
```

### Recommended package setup

Use the package directly under its own name:

```json
{
  "type": "module",
  "dependencies": {
    "@rexxhayanasi/elaina-baileys": "latest"
  }
}
```

This package is ESM-first. Use `import` syntax instead of `require()`.

---

## 📥 Import

```js
import makeWASocket from '@rexxhayanasi/elaina-baileys'
```

Import additional utilities:

```js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  Toolkit,
  MessageBuilder,
  MB
} from '@rexxhayanasi/elaina-baileys'
```

> [!NOTE]
> MessageBuilder is already integrated. You do not need to install `baileys-mbuilder` separately.

---

## 🚀 Basic Connection

```js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from '@rexxhayanasi/elaina-baileys'
import pino from 'pino'

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('./session')

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' })
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('WhatsApp connected')
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        startSock()
      } else {
        console.log('Session logged out')
      }
    }
  })

  return sock
}

startSock()
```

### Retry and pairing options

Beyond the usual Baileys options, these control how the socket handles undecryptable messages, rejected sends, and pairing:

| Option | Default | What it does |
|---|---|---|
| `maxMsgRetryCount` | `3` | decryption retries requested per incoming message |
| `retryRequestDelayMs` | `250` | wait before asking the sender to re-encrypt |
| `maxRetryQueueSize` | `64` | messages allowed to queue for retry at once |
| `ackRetryDelayMs` | `750` | wait before resending after a retryable nack |
| `maxAckRetryCount` | `3` | resend attempts after a retryable nack |
| `pairingCodeTimeoutMs` | `180000` | how long a pairing code stays valid |

`maxRetryQueueSize` is a safety valve, not a throughput knob. A burst of undecryptable messages would otherwise queue without limit and grow the heap; past the cap the extras are acked without a retry. Raising it does not rescue more messages — `retryRequestDelayMs` is the setting that does, at the cost of pressing the sender harder.

---

## 🔐 Pairing Code

Pairing code can be requested after creating the socket.

```js
const phoneNumber = '6281234567890'

if (!state.creds.registered) {
  const code = await sock.requestPairingCode(phoneNumber)
  console.log('Pairing code:', code)
}
```

The number is normalized before it is used, so `+62 812-3456-7890` and `6281234567890` are the same request. What is rejected is a number that cannot be valid: fewer than 6 or more than 15 digits, or a leading `0` — country codes never start with one, so `081234567890` is the local form, not the international one WhatsApp expects.

```js
await sock.requestPairingCode('081234567890')
// Boom 400: phoneNumber must be in international format:
// country code followed by the national number, digits only
```

### The request is confirmed by the server

`requestPairingCode` waits for WhatsApp's answer and only returns once the server has registered the code. A rejection is thrown rather than swallowed, so a code you receive is a code the server actually knows about:

```js
try {
  const code = await sock.requestPairingCode(phoneNumber)
  console.log('Pairing code:', code)
} catch (error) {
  console.log(error.message)   // e.g. rate-overlimit, not-allowed
  console.log(error.data)      // e.g. 429
}
```

The two rejections you are most likely to meet are `rate-overlimit` — too many attempts, wait before retrying — and a not-allowed variant, meaning link-by-phone-number is not enabled for that account.

### One code at a time

A pairing response can only be decrypted by the keys that produced it, so a second request while one is still pending would destroy the first. That is refused with a `409`:

```js
try {
  await sock.requestPairingCode(phoneNumber)
} catch (error) {
  if (error.output?.statusCode === 409) {
    console.log('still pending, seconds left:', error.data.secondsLeft)
  }
}
```

Call `cancelPairingCode()` to abandon a pending attempt and request a new one immediately. It returns whether there was anything to cancel:

```js
sock.cancelPairingCode()
const code = await sock.requestPairingCode(phoneNumber)
```

The guard clears itself once the code expires. WhatsApp rotates a pairing code every 3 minutes; adjust with `pairingCodeTimeoutMs` if you need a different window.

### Custom Pairing Code

A custom pairing code must contain exactly **8 characters**.

```js
const code = await sock.requestPairingCode(
  '6281234567890',
  'ELAINA01'
)

console.log(code)
```

### Checking pairing without touching a running bot

`script/testpairing.js` runs one pairing request against a throwaway session directory, so credentials of a bot that is already connected are never replaced:

```bash
node script/testpairing.js 6281234567890 --check-only
```

`--check-only` reports whether the server accepted the registration and never prints the code — use it anywhere the output can be read by someone else. Drop the flag to print the code and wait for the link to complete.

---

## 📩 Receive Messages

```js
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return

  const message = messages[0]
  if (!message?.message) return

  console.log('From:', message.key.remoteJid)
  console.log('Message:', message.message)
})
```

Simple text extraction:

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

---

## 🪪 LID / PN / JID Addressing

Recent WhatsApp protocol versions may identify users with LID addresses instead of only phone-number JIDs. Do not assume every incoming user identifier ends with `@s.whatsapp.net`.

Common forms include:

```text
6281234567890@s.whatsapp.net
123456789012345@lid
120363xxxxxxxxxx@g.us
123456789@newsletter
```

For incoming messages, inspect the key fields provided by WhatsApp:

```js
const key = message.key

console.log('remoteJid:', key.remoteJid)
console.log('remoteJidAlt:', key.remoteJidAlt)
console.log('participant:', key.participant)
console.log('participantAlt:', key.participantAlt)
```

When WhatsApp supplies an alternate PN/JID, `remoteJidAlt` or `participantAlt` can be used by applications that prefer phone-number JIDs. Keep the original LID available as well because some protocol operations may still require the address WhatsApp originally supplied.

Use the built-in JID helpers when normalizing identifiers:

```js
import { jidDecode, jidEncode, jidNormalizedUser } from '@rexxhayanasi/elaina-baileys'

const normalized = jidNormalizedUser(jid)
const decoded = jidDecode(jid)

console.log(normalized)
console.log(decoded)
```

> [!IMPORTANT]
> LID and PN are two address forms for the same account only when WhatsApp provides or your application already knows the mapping. Do not create a fake PN by replacing the `@lid` suffix.

---

## 💬 Send Messages

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

#### Poll settings

Every switch WhatsApp shows on its own poll composer is available here. The option names do not match the protobuf field names, so they are listed side by side:

| Option | Protobuf field | Default | What it does |
|---|---|---|---|
| `selectableCount` | `selectableOptionsCount` | `1` | how many answers one person may pick |
| `hideVoter` | `hideParticipantName` | `false` | hides who voted for what |
| `canAddOption` | `allowAddOption` | `false` | lets recipients add their own options |
| `endDate` | `endTime` | none | a `Date` after which the poll closes |

> **These four are gated on the receiving account.** WhatsApp checks each one against a server-controlled flag, and when a flag is off the recipient does not merely ignore the setting — the **entire poll** renders as *"You received a message that your version of WhatsApp doesn't support"*. Option images are relayed separately, so a failed poll can look like only the pictures arrived.
>
> The check is on the field being *present*, not on its value, which is why this library omits `hideParticipantName` and `allowAddOption` entirely when you leave them off rather than sending `false`.
>
> `canAddOption` is the least available of the four: WhatsApp Web has no sending gate for it at all, meaning its own composer never offers it, and the receiving flag `poll_add_option_receiving_enabled` still defaults to off. Treat it as experimental. `selectableCount` is the one setting that is never gated.
>
> To find out what a given account supports, send one poll per setting and see which arrive as real polls.

`hideVoter` and `endDate` work on photo polls too. Every poll version carries the same `PollCreationMessage`, so `pollCreationMessageV3` holds those fields exactly as V6 does and the receiver reads them from whichever version arrived — but the option images only attach on V3. This library therefore keeps a photo poll on V3 and reserves V6 for text polls:

| Poll | Version sent |
|---|---|
| any option carrying an `image` | V3, settings included |
| text options + `hideVoter` / `endDate` | V6 |
| text options, one answer | V3 |
| text options, several answers | `pollCreationMessage` |

`canAddOption` remains the exception: it fails the whole poll wherever its receiving flag is off, images or not.

```js
await sock.sendMessage(jid, {
  poll: {
    name: 'Where should we eat?',
    values: [
      { name: 'Padang', image: { url: './padang.jpg' } },
      'Sunda'
    ],
    selectableCount: 2,
    hideVoter: true,
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
})
```

`canAddOption` is left out of the example on purpose — add it only once you have confirmed the recipient supports it, since it is the one most likely to turn the whole poll into an unsupported placeholder.

Text options and image options can be mixed in the same poll, exactly as the composer allows. An option carrying an `image` turns the poll into a [photo poll](#photo-poll); once `canAddOption` is set, recipients extend it with [Poll Add Option](#poll-add-option).

`endDate` takes a `Date`, not a timestamp — it is converted to epoch milliseconds on the way out.

Photo polls do render in groups and one-to-one chats — the phone clients accept them there.

Two caveats worth knowing. WhatsApp **Web**'s own receiver is stricter than the phones:

```js
isPhotoPollReceiverEnabled = msg =>
  isNewsletterMsg({ from: msg.from, to: msg.to }) && isNewsletterPhotoPollsReceiverEnabled()
```

so a photo poll that looks right on a phone can show as unsupported in a browser session. And combining image options with `hideVoter` or `endDate` moves the message to `pollCreationMessageV6`; if the images stop appearing once you add those switches, send the photo poll without them.

---

## 📰 External Ad Reply

`externalAdReply` can be attached through `contextInfo` when you want a standard WhatsApp link-preview style card.

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

The payload can also be passed to a builder using `.setContextInfo(...)` when the builder supports context information.

---

# 🧱 Integrated MessageBuilder

MessageBuilder v4.6 is included directly inside `@rexxhayanasi/elaina-baileys`.

Available exports:

```js
import {
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  Toolkit,
  MessageBuilder,
  MB,
  MESSAGE_BUILDER_VERSION
} from '@rexxhayanasi/elaina-baileys'
```

You can also access the classes through `MessageBuilder` or its short alias `MB`:

```js
const button = new MessageBuilder.Button(sock)
const carousel = new MB.Carousel(sock)
```

---

## Button

The `Button` builder is intended for native-flow interactive messages.

### Quick Reply + URL + Copy

```js
import { Button } from '@rexxhayanasi/elaina-baileys'

const message = new Button(sock)
  .setTitle('Elaina Menu')
  .setBody('Choose an option below.')
  .setFooter('@rexxhayanasi/elaina-baileys')
  .addReply('Ping', 'ping')
  .addUrl('Open Website', 'https://example.com')
  .addCopy('Copy Code', 'ELAINA2026')

await message.send(jid)
```

### Button with Image

```js
const message = new Button(sock)
  .setImage('https://example.com/elaina.jpg')
  .setTitle('Elaina')
  .setBody('Interactive message with image header.')
  .setFooter('Powered by Elaina Baileys')
  .addReply('Menu', 'menu')
  .addUrl('Website', 'https://example.com')

await message.send(jid)
```

### Available Button Helpers

```js
.addReply(displayText, id)
.addUrl(displayText, url)
.addCopy(displayText, copyCode)
.addCall(displayText, id)
.addReminder(displayText, id)
.addCancelReminder(displayText, id)
.addAddress(displayText, id)
.addLocation(options)
.addSelection(title, options)
.addButton(name, params)
```

The builder also provides:

```js
.setTitle(text)
.setSubtitle(text)
.setBody(text)
.setFooter(text)
.setImage(urlOrBuffer)
.setVideo(urlOrBuffer)
.setDocument(urlOrBuffer)
.setMedia(object)
.setContextInfo(object)
.addPayload(object)
.clearButtons()
.setParams(object)
.build(jid)
.send(jid)
```

---

## Selection / List

Create a native single-select list using `addSelection`, `makeSection`, and `makeRow`.

```js
const list = new Button(sock)
  .setTitle('Elaina Menu')
  .setBody('Select one menu.')
  .setFooter('Elaina Baileys')
  .addSelection('Open Menu')
  .makeSection('Main Menu')
  .makeRow('', 'Profile', 'Open profile menu', 'profile')
  .makeRow('', 'Settings', 'Open settings menu', 'settings')
  .makeSection('Other')
  .makeRow('', 'About', 'About this bot', 'about')

await list.send(jid)
```

---

## ButtonV2

`ButtonV2` provides a simpler classic button builder.

```js
import { ButtonV2 } from '@rexxhayanasi/elaina-baileys'

const message = new ButtonV2(sock)
  .setTitle('Elaina')
  .setSubtitle('WhatsApp Bot')
  .setBody('Choose an action.')
  .setFooter('Elaina Baileys')
  .setThumbnail('https://example.com/elaina.jpg')
  .addButton('Menu', 'menu')
  .addButton('Ping', 'ping')

await message.send(jid)
```

---

## Carousel

Carousel cards can be created from `Button.toCard()` and then passed to `Carousel`.

```js
import { Button, Carousel } from '@rexxhayanasi/elaina-baileys'

const card1 = await new Button(sock)
  .setImage('https://example.com/card1.jpg')
  .setBody('First card')
  .addReply('Select', 'card_1')
  .toCard()

const card2 = await new Button(sock)
  .setImage('https://example.com/card2.jpg')
  .setBody('Second card')
  .addUrl('Open', 'https://example.com')
  .toCard()

const carousel = new Carousel(sock)
  .setBody('Choose one of the cards below.')
  .setFooter('Elaina Carousel')
  .addCard([card1, card2])

await carousel.send(jid)
```

> [!IMPORTANT]
> Each carousel card must contain an image or video media attachment in its header.

---

## AIRich

`AIRich` is the integrated rich-response builder for multiple layouts and content types

### Text + Code + Table

```js
import { AIRich } from '@rexxhayanasi/elaina-baileys'

const rich = new AIRich(sock)
  .setTitle('Elaina AI')
  .setFooter('Generated with AIRich')
  .addText('Hello! This is a rich response.')
  .addCode('javascript', `console.log('Hello Elaina')`)
  .addTable([
    ['Feature', 'Status'],
    ['Button', 'Available'],
    ['Carousel', 'Available'],
    ['AIRich', 'Experimental']
  ])
  .addSuggest(['Show menu', 'Help me', 'About Elaina'])

await rich.send(jid)
```

Other available AIRich helpers include:

```js
.addText(text)
.addCode(language, code)
.addTable(rows)
.addSource(sources)
.addReels(items)
.addImage(imageUrl, options)
.addVideo(videoUrl, options)
.addProduct(data)
.addPost(data)
.addTip(text)
.addSuggest(suggestion, options)
.addSection(section)
.addSubmessage(submessage)
```

> [!WARNING]
> AIRich and some experimental interactive payloads depend on WhatsApp client/server compatibility. Rendering may change between WhatsApp versions.

---

## 🖼️ Album Message

Send multiple images or videos as one album.

```js
await sock.sendMessage(jid, {
  album: [
    {
      image: { url: 'https://example.com/1.jpg' },
      caption: 'Image 1'
    },
    {
      image: { url: 'https://example.com/2.jpg' },
      caption: 'Image 2'
    },
    {
      video: { url: 'https://example.com/3.mp4' },
      caption: 'Video 3'
    }
  ]
})
```

An album requires at least two image/video media items.

---

## 📢 Newsletter / Channel

### Create Newsletter

```js
const newsletter = await sock.newsletterCreate(
  'Elaina Updates',
  'Official update channel'
)

console.log(newsletter)
```

### Update Name

```js
await sock.newsletterUpdateName(
  '123456789@newsletter',
  'Elaina News'
)
```

### Update Description

```js
await sock.newsletterUpdateDescription(
  '123456789@newsletter',
  'Fresh updates from Elaina'
)
```

### Update Picture

```js
await sock.newsletterUpdatePicture(
  '123456789@newsletter',
  { url: 'https://example.com/channel.jpg' }
)
```

### Follow / Unfollow

```js
await sock.newsletterFollow('123456789@newsletter')
await sock.newsletterUnfollow('123456789@newsletter')
```

### Mute / Unmute

```js
await sock.newsletterMute('123456789@newsletter')
await sock.newsletterUnmute('123456789@newsletter')
```

### React to Newsletter Message

```js
await sock.newsletterReactMessage(
  '123456789@newsletter',
  '175',
  '🔥'
)
```

Remove a reaction by using an empty value:

```js
await sock.newsletterReactMessage(
  '123456789@newsletter',
  '175',
  ''
)
```

### Fetch Newsletter Metadata

```js
const metadata = await sock.newsletterMetadata(
  'jid',
  '123456789@newsletter'
)

console.log(metadata.thread_metadata.handle)          // the channel's @username
console.log(metadata.thread_metadata.subscribers_count)
console.log(metadata.thread_metadata.settings.reaction_codes.value)
```

`handle` is the channel's public username — the part after `wa.me/channel/`. It comes back on every call, whether or not you own the channel.

Three extra sections are off by default because they cost the server extra work:

```js
const metadata = await sock.newsletterMetadata('jid', '123456789@newsletter', {
  fetchPinnedMessages: true,
  fetchStatusMetadata: true,
  fetchWamoSub: true
})

metadata.thread_metadata.pinned_messages   // [ { message_id, expiry_ts } ]
metadata.thread_metadata.wamo_sub          // { plan_id }
metadata.status_metadata                   // { last_status_server_id, last_status_sent_time }
```

### Mute Admin or Follower Activity

WhatsApp Web replaced the old mute/unmute pair with one setting that separates admin notifications from follower notifications.

```js
await sock.newsletterUpdateUserSetting('123456789@newsletter', 'ADMIN_NOTIFICATIONS', true)
await sock.newsletterUpdateUserSetting('123456789@newsletter', 'FOLLOWER_NOTIFICATIONS', false)
```

`newsletterMute` and `newsletterUnmute` still work and still mute everything at once.

### Fetch Subscribed Newsletters

```js
const newsletters = await sock.newsletterSubscribed()
console.log(newsletters)
```

### Admin Capabilities

Which channel features the server has enabled for you. This is the gate WhatsApp Web itself checks before offering a feature.

```js
const capabilities = await sock.newsletterAdminCapabilities('123456789@newsletter')
console.log(capabilities)
// [ 'INSIGHTS', 'ADMIN_NOTIFICATIONS', 'PHOTO_POLLS', 'QUESTIONS', 'QUIZ', 'THREAD_MENU' ]
```

Requires admin or owner rights on the channel; other channels answer `Not Authorized`.

### Admin Profile Info

```js
const info = await sock.newsletterAdminInfo('123456789@newsletter')
// {
//   id: '123456789@newsletter',
//   adminCount: 3,
//   adminProfile: { id, name, picture: { id, directPath } },
//   adminProfilesEnabled: true
// }
```

`adminProfile` is only filled in when the channel has admin profiles turned on, so check `adminProfilesEnabled` before reading it.

### Pin / Unpin Messages

Takes the message `server_id`, not the message key.

```js
await sock.newsletterPinMessages('123456789@newsletter', [175])
await sock.newsletterUnpinMessages('123456789@newsletter', 175)
```

### Poll Voters

```js
const voters = await sock.newsletterPollVoters('123456789@newsletter', 175, {
  limit: 100,
  voteHash: undefined
})
```

The response groups voters per `vote_hash`, each with a `voter_list.edges` array.

### Reaction Senders

```js
const senders = await sock.newsletterReactionSenders('123456789@newsletter', 175)
```

### Content Labels

```js
await sock.newsletterLabelAiContent('123456789@newsletter', 175)
await sock.newsletterLabelPaidPartnership('123456789@newsletter', 175)
```

`messageType` is the third argument and defaults to `MESSAGE`; pass `STATUS` to label a channel status.

### Admin Invites

```js
await sock.newsletterCreateAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterRevokeAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterAcceptAdminInvite('123456789@newsletter')
```

### Discovery

```js
const recommended = await sock.newsletterRecommended({ limit: 20, countryCodes: ['ID'] })
const similar = await sock.newsletterSimilar('123456789@newsletter', { limit: 20 })
```

### Directory

Channel discovery, the same queries the Updates tab uses. Categories are `BUSINESS`, `ENTERTAINMENT`, `LIFESTYLE`, `NEWS`, `ORGANIZATIONS`, `PEOPLE`, `SPORTS` and `SPECIAL_EVENTS` through `SPECIAL_EVENTS_5`.

```js
const list = await sock.newsletterDirectoryList({
  view: 'RECOMMENDED',        // RECOMMENDED | NEW | POPULAR | FEATURED | TRENDING
  categories: ['NEWS'],
  countryCodes: ['ID'],
  limit: 20
})

const found = await sock.newsletterDirectorySearch('elaina', { limit: 20 })
const preview = await sock.newsletterDirectoryCategories({ categories: ['NEWS'], countryCode: 'ID' })
```

### Vote on a Channel Poll

Channel votes are sent unencrypted as option hashes, unlike the encrypted votes used in chats.

```js
await sock.newsletterSendPollVote('123456789@newsletter', pollServerId, ['Jakarta'])
```

### Insights

Admin analytics for a channel you own.

```js
const insights = await sock.newsletterInsights('123456789@newsletter', {
  metrics: ['NET_FOLLOWS', 'UNFOLLOWS']
})
// { result: [{ id, values }], last_update_time, metrics_status }
```

`metrics_status` is `OK` or `MISSING`; `MISSING` means the server has no data for the requested window yet.

### Followers

```js
const followers = await sock.newsletterFollowers('123456789@newsletter', { count: 100 })
```

### Pending Admin Invites

```js
const pending = await sock.newsletterPendingAdminInvites('123456789@newsletter')
// [ { id: '628xxxxxxxxx@s.whatsapp.net', phoneNumber: '628xxxxxxxxx' } ]
```

### Hide a Question Response

Moderates a follower's answer to a channel question.

```js
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'HIDDEN')
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'VISIBLE')
```

---

## 🪪 Username & About

WhatsApp Web moved usernames and the About text to MEX queries. These call the same persisted queries the Web client uses.

### Username

```js
const current = await sock.getUsername()
console.log(current) // { username: 'elaina', state: 'ACTIVE', pin: '1234' }

await sock.setUsername('elaina')
await sock.setUsernamePin('1234')
await sock.removeUsername()
```

Check a name before claiming it:

```js
const { available, suggestions } = await sock.checkUsernameAvailability('elaina')
```

`setUsername` resolves `true` only when the server answers `SUCCESS`. `state` is `ACTIVE` or `RESERVED`; pass `{ reserved: true }` when claiming a reserved name.

#### Username Rules

`setUsername` and `checkUsernameAvailability` reject a bad name locally before it reaches the server, so you get the reason instead of a generic failure. The rules are read straight out of the Web client:

| Rule | Error |
|---|---|
| Only `a-z`, `A-Z`, `0-9`, `_`, `.` | `INVALID_CHARACTER` |
| 3 to 35 characters | `INVALID_LENGTH` |
| At least one letter | `INVALID_NO_LETTERS` |
| No leading or trailing `.`, no `..` | `INVALID_PERIODS` |
| Cannot start with `www.` | `INVALID_WWW_PREFIX` |
| Cannot end with `.com .org .net .int .edu .gov .mil .arpa .html .htm .txt .xml` | `INVALID_DOMAIN_SUFFIX` |
| Cannot contain `whatsapp`, `instagram`, `facebook`, `oculus` | `INVALID_WORD` |

The PIN is exactly four digits.

Validate without calling the server:

```js
import { validateUsername, isUsernamePin, displayUsername } from '@rexxhayanasi/elaina-baileys'

validateUsername('rexx.hayanasi')  // { isValid: true }
validateUsername('rexx.com')       // { isValid: false, errorType: 'INVALID_DOMAIN_SUFFIX' }
isUsernamePin('1234')              // true
displayUsername('rexx')            // '@rexx'
```

A leading `@` is stripped for you, so `setUsername('@elaina')` and `setUsername('elaina')` are the same call.

### About / Text Status

```js
await sock.updateTextStatus('Building bots', { emoji: '🤖', ephemeralDurationSec: 0 })

const mine = await sock.fetchTextStatus(['6281234567890@s.whatsapp.net'])
const about = await sock.fetchAbout('6281234567890@s.whatsapp.net')
console.log(about.status)
```

`updateTextStatus()` with no text clears it. `fetchTextStatus` takes one or many JIDs and answers per JID with the text, emoji, last update time and ephemeral duration. `fetchAbout` reads a single user's About through `xwa2_users_updates_since`.

The classic `updateProfileStatus` IQ still works and is untouched.

### Terms of Service Notices

WhatsApp gates some features behind a notice the user has to move through. These read the notice list and report progress back, the same IQs the Web client uses.

```js
const notices = await sock.fetchUserNotices()
// [ { id: '20601216', stage: '2', t: '...', version: '...', type: '...' } ]

await sock.updateUserNoticeStage('20601216', 5)
```

`stage` is the server's own counter for that notice — read the current value from `fetchUserNotices` before advancing it.

### Marketing Opt-Out List

```js
const list = await sock.fetchOptOutList({ category: 'marketing' })

await sock.updateOptOut({
  jid: '6281234567890@s.whatsapp.net',
  category: 'marketing',
  action: 'add',
  reason: 'user_request'
})
```

### Push Settings

```js
const settings = await sock.fetchPushSettings()
```

### Server-side Link Preview

Lets WhatsApp generate the preview instead of scraping the page yourself.

```js
const preview = await sock.fetchServerLinkPreview('https://example.com')
// { direct_path, hash, title, description, preview_type, thumb_data, width, height }
```

---

## 👥 Group Management

### Create Group

```js
const group = await sock.groupCreate(
  'Elaina Community',
  [
    '6281234567890@s.whatsapp.net',
    '6289876543210@s.whatsapp.net'
  ]
)

console.log(group.id)
```

### Add Participant

```js
await sock.groupParticipantsUpdate(
  groupJid,
  ['6281234567890@s.whatsapp.net'],
  'add'
)
```

### Remove Participant

```js
await sock.groupParticipantsUpdate(
  groupJid,
  ['6281234567890@s.whatsapp.net'],
  'remove'
)
```

### Promote / Demote

```js
await sock.groupParticipantsUpdate(groupJid, [userJid], 'promote')
await sock.groupParticipantsUpdate(groupJid, [userJid], 'demote')
```

### Update Description

```js
await sock.groupUpdateDescription(
  groupJid,
  'Welcome to Elaina Community 💜'
)
```

---

## 📷 Profile Picture

### Fetch Profile Picture URL

```js
const url = await sock.profilePictureUrl(jid, 'image')
console.log(url)
```

### Update Profile Picture

```js
await sock.updateProfilePicture(jid, {
  url: 'https://example.com/profile.jpg'
})
```

### Remove Profile Picture

```js
await sock.removeProfilePicture(jid)
```

---

## 🧰 Useful Exports

Some commonly used exports include:

```js
import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  jidDecode,
  jidEncode,
  jidNormalizedUser,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  Toolkit,
  MessageBuilder,
  MB,
  MESSAGE_BUILDER_VERSION
} from '@rexxhayanasi/elaina-baileys'
```

Check the builder version:

```js
console.log(MESSAGE_BUILDER_VERSION)
console.log(MessageBuilder.VERSION)
```

---

## 🔄 Update WhatsApp Web Version

One command performs the whole check:

```bash
npm run wa:update
```

It reads the pinned revision, fetches the live one, downloads the bundle into `.wa-bundle/<revision>/`, parses WhatsApp Web's protobuf specs and compares them against `WAProto`, diffs the new snapshot against the previous one, round-trips every field through the encoder, and writes `.wa-bundle/report.md` and `report.json`.

The report ends in one verdict:

| Verdict | Meaning |
|---|---|
| `no-change` | live revision matches the pinned one |
| `bump-only` | revision moved, no wire surface changed |
| `bump-and-review` | revision moved **and** a wire surface changed — read the diff |
| `needs-work` | WhatsApp declares protobuf fields `WAProto` does not |
| `blocked` | the round-trip encoder failed; do not bump |

Add `--apply` to bump the pinned revision, which is refused unless the verdict is a bump and the encoder passed.

```bash
npm run wa:update -- --apply
```

Supporting commands:

| Command | Purpose |
|---|---|
| `npm run wa:diff -- <old> <new>` | diff two bundle snapshots on their own |
| `npm run check:proto` | protobuf gap check only |
| `npm run sync:proto` | add missing protobuf fields to `WAProto` |
| `npm run verify:proto` | round-trip encoder only |
| `npm run fetch:bundle -- <dir>` | download the raw bundle |
| `npm run update:version` | bump the pinned revision without any of the checks |

The diff covers every surface a WhatsApp change can reach the wire through — protobuf specs, stanza tags and attributes, `xmlns`, MEX operations, media paths — so a release that only moves UI code is reported as exactly that. `AGENTS.md` documents which surfaces matter and which are client-side noise.

Set `PROTO_BUNDLE_DIR` to read from a local directory and `PROTO_OFFLINE=1` to skip the live revision lookup. Where the built-in `fetch` is refused, the scripts fall back to `curl` automatically.

For automated releases, only commit the files actually changed by the updater and `package.json`. Do not commit `node_modules`.

Recommended `.gitignore` entries:

```gitignore
node_modules/
npm-debug.log*
```

If your repository intentionally does not track a lockfile for this library package, add `package-lock.json` as well. Otherwise, keep the lockfile tracked normally.


---

## 🧪 Modern WhatsApp Message APIs

Elaina Baileys exposes helpers for newer protobuf message types already present in the bundled WAProto. These APIs are experimental because WhatsApp can gate rendering or server acceptance by account, platform, or rollout.

```js
import {
  makeNewsletterStatusAttribution,
  LOCATION_BROADCAST_JID,
  isJidLocationBroadcast
} from '@rexxhayanasi/elaina-baileys'
```

### Photo Poll

Give an option an `image` and the poll is sent as a photo poll: the option images go out as associated messages and each option carries the hash the server expects.

These work in groups and one-to-one chats as well as channels, and `hideVoter` and `endDate` can be combined with them — the poll stays on `pollCreationMessageV3`, which is the version the option images attach to. See [Poll settings](#poll-settings).

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

Each option image is uploaded and then sent as its own `pollCreationOptionImageMessage`, linked back to the poll by `MEDIA_POLL` association. A poll with two image options is three messages on the wire.

Plain string options still send a normal text poll, and the two can be mixed. The rest of the poll switches — multiple answers, hidden voters, add-option, end time — are listed under [Poll settings](#poll-settings).

### Question Message

```js
await sock.sendMessage(jid, {
  question: {
    text: 'What feature should be added next?'
  }
})
```

The same payload can be sent to a newsletter JID. Newsletter questions are keyed by a `<meta questiontype>` node, which the socket adds automatically:

```js
await sock.sendMessage('123456789@newsletter', {
  question: {
    text: 'Which update do you want next?'
  }
})
```

```xml
<message to="123456789@newsletter" id="MESSAGE_ID" type="text">
  <meta questiontype="question"/>
  <plaintext>PROTO_MESSAGE</plaintext>
</message>
```

`questiontype` is `question` when posting a question, `response` when a follower answers it, and `reply` when the channel replies to an answer.

### Question Response

A follower answering a question. Sent with `questiontype="response"`.

```js
await sock.sendMessage(jid, {
  questionResponse: {
    key: questionMessage.key,
    text: 'MessageBuilder'
  }
})
```

### Question Reply

The channel replying to an answer, quoting it by the question's server id. Sent with `questiontype="reply"`.

```js
await sock.sendMessage('123456789@newsletter', {
  questionReply: {
    text: 'Good pick, shipping it next',
    serverQuestionId: 175,
    quotedQuestion: questionMessage.message,   // optional
    quotedResponse: responseMessage.message    // optional
  }
})
```

### Status Question Answer

```js
await sock.sendMessage(jid, {
  statusQuestionAnswer: {
    key: statusQuestion.key,
    text: 'Elaina Baileys'
  }
})
```

### Status Quoted Message

```js
await sock.sendMessage(jid, {
  statusQuoted: {
    originalStatusId: statusMessage.key,
    type: 'QUESTION_ANSWER',
    text: 'Quoted status answer'
  }
})
```

### Status Sticker Interaction

```js
await sock.sendMessage(jid, {
  statusStickerInteraction: {
    key: statusMessage.key,
    stickerKey: 'heart',
    type: 'REACTION'
  }
})
```

### Status Notification

Supported notification types are `UNKNOWN`, `STATUS_ADD_YOURS`, `STATUS_RESHARE`, and `STATUS_QUESTION_ANSWER_RESHARE`.

```js
await sock.sendMessage(jid, {
  statusNotification: {
    responseMessageKey: responseMessage.key,
    originalMessageKey: statusMessage.key,
    type: 'STATUS_RESHARE'
  }
})
```

### Newsletter Admin Invite

```js
await sock.sendMessage(userJid, {
  newsletterAdminInvite: {
    newsletterJid: '123456789@newsletter',
    newsletterName: 'Elaina Updates',
    caption: 'Join as an admin',
    inviteExpiration: Math.floor(Date.now() / 1000) + 86400
  }
})
```

`jpegThumbnail` and `contextInfo` can also be supplied.

### Newsletter Follower Invite V2

```js
await sock.sendMessage(userJid, {
  newsletterFollowerInvite: {
    newsletterJid: '123456789@newsletter',
    newsletterName: 'Elaina Updates',
    caption: 'Follow this channel'
  }
})
```

### Who Sent a Channel Message

A channel message carries the posting admin's display name and picture in a `<meta>` block that used to be dropped on the floor. It is now decoded into `newsletterMeta`.

```js
sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    if (!msg.newsletterMeta) continue
    console.log(msg.newsletterMeta.adminProfile.name)               // 'Rexx Hayanasi'
    console.log(msg.newsletterMeta.adminProfile.pictureDirectPath)
    console.log(msg.newsletterMeta.paidPartnership)                 // sponsored post
    console.log(msg.newsletterMeta.aiContent)                       // self-declared AI content
    console.log(msg.newsletterMeta.editTimestamp)
  }
})
```

There is **no username here** — WhatsApp only ships `id`, `name` and `picture` for a channel admin. `name` is the admin profile name the channel owner set, which is not the same as the account's `@username`, and it is only present when the channel turned admin profiles on. `pushName` falls back to it so existing code that reads `msg.pushName` starts showing the admin instead of nothing.

Messages the bot itself posted to a channel now arrive with `key.fromMe: true` (WhatsApp marks them `is_sender`), plus `key.isNewsletterSender`. Before this they looked like someone else's messages, so a bot could answer its own channel post.

### Post a Channel Status

A channel can publish its own status — the ring around the channel avatar, playable like a story. It is a real WhatsApp feature with its own stanza, not a `status@broadcast` post addressed to a channel.

```js
await sock.sendNewsletterStatus('123456789@newsletter', {
  image: { url: './poster.jpg' },
  caption: 'New drop today'
})

await sock.sendNewsletterStatus('123456789@newsletter', {
  text: 'Thanks for 10k followers'
})
```

React to one, or take a reaction back:

```js
await sock.sendNewsletterStatusReaction('123456789@newsletter', 175, '🔥')
await sock.sendNewsletterStatusReaction('123456789@newsletter', 175, undefined)
```

Delete one:

```js
await sock.revokeNewsletterStatus('123456789@newsletter', statusId)
```

#### Channel Status vs `status@broadcast`

They look the same to a viewer and are completely different on the wire.

| | `status@broadcast` | Channel status |
|---|---|---|
| Stanza | `<status to="status@broadcast" id t>` | `<status to="…@newsletter" id>` |
| Payload | `<enc>` nodes, one per recipient device | `<plaintext>` — the raw protobuf |
| Encryption | end-to-end, sender-key fanout | none, channels are not E2EE |
| Audience | your contact list, `statusJidList` | everyone following the channel |
| Who may post | anyone | channel admins with the producer capability |
| Media | normal media upload | newsletter upload, referenced by `media_id` |

The library handles the media difference for you: `sendNewsletterStatus` uploads through the newsletter path and puts the returned handle into `media_id` automatically. Supported types are text, image, video, gif, and audio — documents and stickers are rejected. WhatsApp Web itself only publishes image and video, so the other two get a warning and may be refused by the server.

#### Check Whether the Channel May Post

WhatsApp gates channel status creation on a per-channel capability the server grants, not on a setting you can flip. Check it before building a posting flow:

```js
const { canPost, canPostMusic, capabilities } = await sock.newsletterCanPostStatus('123456789@newsletter')
```

`canPost` is `CHANNEL_STATUS_PRODUCER` in the capability list. The full gate WhatsApp Web applies is: the `channel_status_creation` flag is on, you are admin or owner, the channel is not suspended or terminated, and the channel holds `CHANNEL_STATUS_PRODUCER`. Only the last one is visible to a client, and it is the one that actually varies per channel — the rollout flag is off by default on Web, which is why the button is missing there while the phone shows it.

#### Question Statuses

A channel status can carry a question box, and followers answer it.

```js
await sock.sendNewsletterStatus('123456789@newsletter', {
  image: { url: './bg.jpg' },
  question: { text: 'Ask me anything' }
})
```

Answers come back as `questionResponseMessage`. Reshare one on top of a new status with `interactionType: 'question_reshare'` plus `parentServerId` and `responseServerId`; publish your own answer with `interactionType: 'question_response'` and `parentServerId`. A question status has to sit on media — WhatsApp Web never publishes a text-only one.

### Read Channel Statuses

```js
const list = await sock.getNewsletterStatuses('123456789@newsletter', { count: 20 })

for (const status of list.statuses) {
  console.log(status.serverId, status.type, status.viewsCount, status.responsesCount)
  console.log(status.adminProfile?.name)
  console.log(status.reactionCounts) // [ { code: '👍', count: 12 } ]
}
```

Page backwards with `{ before: serverId }` or forwards with `{ after: serverId }`.

To poll only what changed since a timestamp, use the updates feed — it goes to the channel jid, not to the server:

```js
const updates = await sock.getNewsletterStatusUpdates('123456789@newsletter', {
  count: 20,
  since: 1770000000
})
```

### Newsletter Status Attribution

Elaina Baileys exposes `StatusAttribution.Type.NEWSLETTER_STATUS` with the channel reshare metadata already present in WAProto.

```js
await sock.sendMessage('status@broadcast', {
  image: { url: 'https://example.com/status.jpg' },
  caption: 'Shared from Elaina Updates',
  newsletterStatus: {
    newsletterJid: '123456789@newsletter',
    messageId: 42,
    duration: 24,
    hasMultipleReshares: false
  }
}, {
  statusJidList: audienceJids
})
```

The attribution can also be created manually.

```js
const attribution = makeNewsletterStatusAttribution({
  newsletterJid: '123456789@newsletter',
  messageId: 42
})

await sock.sendMessage('status@broadcast', {
  text: 'Newsletter status',
  contextInfo: {
    statusAttributions: [attribution]
  }
}, {
  statusJidList: audienceJids
})
```

### Group Status Reaction

```js
await sock.sendMessage(groupJid, {
  groupStatusReaction: {
    key: groupStatusMessage.key,
    text: '❤️'
  }
})
```

The reaction is wrapped in `groupStatusMessageV2`, allowing the existing relay layer to include group-status metadata.

### Poll Add Option

The original poll must have been created with `canAddOption: true` (see [Poll settings](#poll-settings)). One message carries one option — `addOption` is a single value in the protobuf, not a list, so send several messages to add several options.

```js
await sock.sendMessage(jid, {
  pollAddOption: {
    pollCreationMessageKey: pollMessage.key,
    option: 'New option'
  }
})
```

`addOption` can be supplied directly when you already have the protobuf option object.

### Comment Message

`content` accepts text or protobuf message fields. Raw protobuf content can be supplied as `message`.

```js
await sock.sendMessage(jid, {
  comment: {
    targetMessageKey: targetMessage.key,
    content: {
      text: 'Comment on this message'
    }
  }
})
```

### Event Invite Message

```js
await sock.sendMessage(jid, {
  eventInvite: {
    eventId: 'elaina-event-001',
    eventTitle: 'Elaina Community Event',
    startTime: new Date(Date.now() + 3600000),
    endTime: new Date(Date.now() + 7200000),
    caption: 'See you there'
  }
})
```

### Scheduled Call

```js
const created = await sock.sendMessage(jid, {
  scheduledCall: {
    scheduledTimestampMs: new Date(Date.now() + 3600000),
    callType: 'VIDEO',
    title: 'Elaina Call'
  }
})
```

Cancel a scheduled call with its message key.

```js
await sock.sendMessage(jid, {
  scheduledCallEdit: {
    key: created.key,
    editType: 'CANCEL'
  }
})
```

### Location Broadcast Identifier

WhatsApp Desktop recognizes `location@broadcast` separately from `status@broadcast`. Elaina Baileys exposes the identifier and detector without treating it as normal status fanout.

```js
console.log(LOCATION_BROADCAST_JID)
console.log(isJidLocationBroadcast('location@broadcast'))
```

### Low-Level Builders

```js
import {
  makeQuestionMessage,
  makeQuestionResponseMessage,
  makeStatusQuestionAnswerMessage,
  makeStatusQuotedMessage,
  makeStatusStickerInteractionMessage,
  makeStatusNotificationMessage,
  makeNewsletterAdminInviteMessage,
  makeNewsletterFollowerInviteMessage,
  makePollAddOptionMessage,
  makeCommentMessage,
  makeEventInviteMessage,
  makeScheduledCallCreationMessage,
  makeScheduledCallEditMessage,
  makeGroupStatusReactionMessage,
  makeNewsletterStatusAttribution,
  makeGroupStatusAttribution
} from '@rexxhayanasi/elaina-baileys'
```

These helpers return protobuf-compatible message content that can be passed to `generateWAMessageFromContent` or custom relay logic.

> [!IMPORTANT]
> The inspected WhatsApp Desktop build also exposes schema names related to bot history sharing and identity verification. They are intentionally not added until their protobuf field numbers, parent messages, and wire layout are confirmed. Elaina Baileys does not guess protobuf tags.

---

## 🐞 Troubleshooting

### Pairing code must be exactly 8 characters

When using a custom pairing code:

```js
await sock.requestPairingCode(phone, 'ELAINA01')
```

The custom value must contain exactly eight characters.

### A pairing code appears but the phone never shows a prompt

Check what the request threw before assuming the notification is at fault. `requestPairingCode` now waits for the server and reports a rejection instead of returning a code that was never registered:

| Message | Meaning |
|---|---|
| `rate-overlimit` (`429`) | too many attempts — wait, retrying makes it worse |
| `not-allowed` / feature errors | link-by-phone-number is not enabled for that account |
| `must be in international format` (`400`) | the number is not `<country code><national number>` |
| `accepted without registering` | the server replied without a pairing ref |
| `never answered` | no reply arrived at all |

If none of these fire and the code is registered, type it manually through **WhatsApp → Linked Devices → Link with phone number**. If it is accepted there, the registration was fine and only the push notification did not arrive, which is decided server-side.

Verify from outside your bot with `node script/testpairing.js <number> --check-only`.

### A pairing request is refused with 409

Another code is still pending. Wait it out or call `sock.cancelPairingCode()` first — see [Pairing Code](#-pairing-code).

### `Socket is required`

Builder classes require an active Baileys socket:

```js
const button = new Button(sock)
```

Do not create them without passing `sock`.

### Buttons or AIRich render differently

Interactive WhatsApp payloads may depend on:

- WhatsApp application version
- Web protocol changes
- Account/server rollout
- Message type compatibility

Always test experimental message formats before production use.

### LID appears instead of a phone-number JID

This is expected on newer WhatsApp addressing flows. Check `participantAlt` or `remoteJidAlt` when available instead of blindly converting `@lid` into `@s.whatsapp.net`.

### Session logged out

If WhatsApp returns `DisconnectReason.loggedOut`, remove the invalid local session and pair the account again.

---

## 🐞 Found a Bug?

If you encounter a bug or compatibility issue, you can contact the maintainer or follow the WhatsApp Channel for project updates.

<p align="center">
  <a href="https://wa.me/6285924647929">
    <img src="https://img.shields.io/badge/Chat%20on%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Chat on WhatsApp" />
  </a>
  <a href="https://whatsapp.com/channel/0029Vb8RvQKEFeXmGnJr621s">
    <img src="https://img.shields.io/badge/WhatsApp%20Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp Channel" />
  </a>
</p>

---

## 🙏 Credits

This project exists thanks to the work of many developers and open-source projects.

### Project Maintainer

- **RexxHayanasi** — maintainer, fork development, integration, fixes, features, and project branding.

### Baileys / Upstream

- **WhiskeySockets/Baileys** — upstream Baileys project and core WhatsApp Web implementation.
- **adiwajshing** — original Baileys author and early ecosystem work.

### Fork / Source Contributions

- **Lia Wynn / ItsLia** — fork lineage and prior Baileys modifications retained where applicable.
- **Kyuu / kiuur** — project contributor and support.

### Integrated MessageBuilder

The integrated MessageBuilder is based on **NIXCODE / Advanced WhatsApp Interactive Message Builder**.

- **Nixel** — original creator of the MessageBuilder implementation. [WhatsApp](https://wa.me/6285188349341) · [Channel](https://whatsapp.com/channel/0029VbCV1ck8fewpdNb2TY2k)
- **Ahmad tumbuh kembang** — MessageBuilder contributor.

The original builder attribution and licensing notices must be respected when modifying or redistributing its source. The builder is integrated into this package so users do not need to install `baileys-mbuilder` separately.

### Open Source Contributors

Thanks to every upstream Baileys contributor, library author, tester, issue reporter, and developer whose work helped make this project possible.

> Forking and modifying open-source projects is welcome. Please preserve applicable copyright, license, attribution, and contributor notices.

---

## 💜 TQTO

<details>
<summary><strong>Thanks To</strong></summary>

Terima kasih kepada semua pihak yang telah memberikan dukungan, inspirasi, dan kontribusi dalam pengembangan proyek ini.

- **Allah SWT** — atas rahmat, kemudahan, dan perlindungan-Nya.
- **Orang Tua** — atas doa dan dukungan yang tiada henti.
- **RexxHayanasi** — pengembang dan maintainer proyek.
- Seluruh contributor dan komunitas open source yang membantu perkembangan Baileys.

</details>
<h2 align="center">✨ Contributors & Credits</h2>

<p align="center">
  Thanks to everyone who contributed to this project.
</p>

<table align="center">
  <tr>
    <td align="center" width="180">
      <a href="https://github.com/RexxHayanasi">
        <img
          src="https://avatars.githubusercontent.com/u/150516773?v=4"
          width="90"
          height="90"
          alt="RexxHayanasi"
        />
        <br />
        <b>RexxHayanasi</b>
      </a>
      <br />
      <sub>Project Maintainer</sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/kiuur">
        <img
          src="https://avatars.githubusercontent.com/u/182334162?v=4"
          width="90"
          height="90"
          alt="Kyuu"
        />
        <br />
        <b>Kyuu</b>
      </a>
      <br />
      <sub>Contributor</sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/ValdazGT">
        <img
          src="https://avatars.githubusercontent.com/u/108647595?v=4"
          width="90"
          height="90"
          alt="ValdazGT"
        />
        <br />
        <b>ValdazGT</b>
      </a>
      <br />
      <sub>MBuilder · Owner</sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/itsliaaa">
        <img
          src="https://avatars.githubusercontent.com/u/88979678?v=4"
          width="90"
          height="90"
          alt="ITSLIAAA"
        />
        <br />
        <b>ITSLIAAA</b>
      </a>
      <br />
      <sub>messages-send.js Reference</sub>
      <br />
      <sub>Early Migration Reference</sub>
    </td>
  </tr>
</table>

<p align="center">
  <sub>Built and maintained with contributions from the community ❤️</sub>
</p>

---

## 📄 License

This project is distributed under the license included with the repository/package.

Elaina-specific modifications are maintained by **RexxHayanasi**. Portions of the codebase are derived from Baileys and other open-source work and therefore retain applicable upstream copyright, license, and attribution notices.

Do not remove third-party copyright or attribution notices required by their respective licenses.

---

<div align="center">
  <b>💫 @rexxhayanasi/elaina-baileys</b>
  <br>
  <sub>Built with respect for the Baileys open-source ecosystem.</sub>
</div>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">
