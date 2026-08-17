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

### Custom Pairing Code

A custom pairing code must contain exactly **8 characters**.

```js
const code = await sock.requestPairingCode(
  '6281234567890',
  'ELAINA01'
)

console.log(code)
```

Use the phone number in international format without `+`, spaces, or symbols.

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

console.log(metadata)
```

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
```

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

The package includes an ESM updater script that fetches the current WhatsApp Web `client_revision` and synchronizes the version used by the runtime.

Run:

```bash
npm run update:version
```

The updater does not require Yarn or Corepack. With Node.js 24, the script uses the built-in `fetch` implementation.

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

The original poll must allow adding options.

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

<br>

<table>
<tr>
<td align="center">
<a href="https://github.com/RexxHayanasi">
<img src="https://avatars.githubusercontent.com/u/150516773?v=4" width="80px" alt="RexxHayanasi" />
<br />
<sub><b>RexxHayanasi</b></sub>
<br />
<sub>Project Maintainer</sub>
</a>
</td>

<td align="center">
<a href="https://github.com/kiuur">
<img src="https://avatars.githubusercontent.com/u/182334162?v=4" width="80px" alt="Kyuu" />
<br />
<sub><b>Kyuu</b></sub>
<br />
<sub>Contributor</sub>
</a>
</td>

<td align="center">
<a href="https://github.com/ValdazGT">
<img src="https://avatars.githubusercontent.com/u/108647595?v=4" width="80px" alt="ValdazGT" />
<br />
<sub><b>ValdazGT</b></sub>
<br />
<sub>MBuilder - OWNER</sub>
</a>
</td>
</tr>
</table>

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
