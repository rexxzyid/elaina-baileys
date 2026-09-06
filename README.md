

<div align="center">
  <h1>💫 @rexxhayanasi/elaina-baileys</h1>
  <p><em>Custom WhatsApp library built upon Baileys — enhanced, modernized, and extended with an integrated message builder.</em></p>

  <img src="https://files.catbox.moe/z913tc.jpg" width="400" alt="Elaina Baileys Banner" />
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
    <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Module-ESM-F7DF1E?logo=javascript&logoColor=black" alt="ESM" />
    <img src="https://img.shields.io/badge/MessageBuilder-v4.7-7F5AF0" alt="Message Builder" />
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
| 📞 Voice & Video Calls | Place audio, video and screen-share calls on the session the bot already has, with a playlist that drives the call. |
| 🗄️ Database Sessions | Keep the session in SQLite, PostgreSQL, MySQL, MongoDB, Redis or NekoDB instead of files. |
| 📦 ESM | ESM-first package requiring Node.js 20+; Node.js 22 or newer is recommended. |

### 🗺️ What Can It Do?

New here? This is the whole library at a glance. Each row links to the section that shows the code.

| I want to… | Use | Read |
|---|---|---|
| Log in and stay logged in | `useMultiFileAuthState`, `usePostgresAuthState`, … | [Session Storage](#-session-storage) |
| Log in without scanning a QR | pairing code | [Pairing Code](#-pairing-code) |
| React to incoming messages | `messages.upsert` | [Receive Messages](#-receive-messages), [Events](#-events) |
| Send text, images, video, files, location, polls | `sock.sendMessage` | [Send Messages](#-send-messages) |
| Send buttons, lists, carousels | `Button`, `ButtonV2`, `Carousel` | [Integrated MessageBuilder](#-integrated-messagebuilder) |
| Send a rich AI-style card | `AIRich`, A2UI | [AIRich](#airich), [A2UI Cards](#a2ui-cards) |
| Read a rich message a bot sent me | `readRichMessage` | [Reading Rich Messages Back](#reading-rich-messages-back) |
| Send several photos as one post | album message | [Album Message](#-album-message) |
| Run a channel | newsletter helpers | [Newsletter / Channel](#-newsletter--channel) |
| Manage a group | `groupCreate`, `groupParticipantsUpdate`, … | [Group Management](#-group-management) |
| Manage a community | community helpers | [Communities](#-communities) |
| Block, unblock, report spam | `updateBlockStatus`, `reportSpam` | [Privacy Settings](#-privacy-settings) |
| Show typing, read receipts, presence | `sendPresenceUpdate`, `readMessages` | [Presence and Read Receipts](#-presence-and-read-receipts) |
| Pin, archive, mute, star a chat | `chatModify` | [Chat State](#-chat-state) |
| Use business labels and a catalog | label and catalog helpers | [Labels](#-labels), [Business and Catalog](#-business-and-catalog) |
| Make a call link, reject a call | `createCallLink`, `rejectCall` | [Calls](#-calls) |
| Ring someone and play audio | `makeVoipClient`, `voip.call` | [Placing a Voice Call](#placing-a-voice-call) |
| Play a queue of songs on a call | `playlist`, `enqueue`, `idle` | [Playing a Queue](#playing-a-queue) |
| Send video or share a screen on a call | `video: true`, `screenShare: true` | [Video Calls](#video-calls), [Screen Share](#screen-share) |
| Call a whole group | `voip.callGroup` | [Group Calls](#group-calls) |
| Change or read a profile picture | profile picture helpers | [Profile Picture](#-profile-picture) |
| Schedule a message for later | scheduled messages | [Scheduled Messages](#-scheduled-messages) |
| Keep up with WhatsApp Web changes | `npm run wa:update` | [Update WhatsApp Web Version](#-update-whatsapp-web-version) |
| Know if my number is in trouble | account health signals | [Account Health Signals](#-account-health-signals) |
| Understand LID vs PN jids | addressing helpers | [LID / PN / JID Addressing](#-lid--pn--jid-addressing) |
| Know why `conversation` is empty | `normalizeMessageContent` | [Every Message Type](#-every-message-type) |
| Fix something that broke | — | [Troubleshooting](#-troubleshooting) |

---

## 📚 Table of Contents

- [Requirements](#-requirements)
- [Installation](#-installation)
- [Import](#-import)
- [Basic Connection](#-basic-connection)
- [Session Storage](#-session-storage)
  - [Multi-file (default)](#multi-file-default)
  - [Single file](#single-file)
  - [SQLite](#sqlite)
  - [PostgreSQL, MySQL, MongoDB, Redis](#postgresql-mysql-mongodb-redis)
  - [NekoDB](#nekodb)
  - [Caching Signal Keys](#caching-signal-keys)
- [Pairing Code](#-pairing-code)
- [Receive Messages](#-receive-messages)
- [Events](#-events)
- [LID / PN / JID Addressing](#-lid--pn--jid-addressing)
- [Send Messages](#-send-messages)
- [External Ad Reply](#-external-ad-reply)
- [Integrated MessageBuilder](#-integrated-messagebuilder)
  - [Button](#button)
  - [Selection / List](#selection--list)
  - [ButtonV2](#buttonv2)
  - [Carousel](#carousel)
  - [AIRich](#airich)
  - [Reading Rich Messages Back](#reading-rich-messages-back)
  - [A2UI Cards](#a2ui-cards)
  - [HTML Mini App](#html-mini-app)
  - [Embedded Screens](#embedded-screens)
- [Album Message](#-album-message)
- [Newsletter / Channel](#-newsletter--channel)
  - [Creating and Editing a Channel](#creating-and-editing-a-channel)
  - [Following a Channel](#following-a-channel)
  - [Reading a Channel](#reading-a-channel)
  - [Posting and Reacting](#posting-and-reacting)
  - [Channel Status](#channel-status)
  - [Questions](#questions)
  - [Admins](#admins)
  - [Finding Channels](#finding-channels)
  - [Enforcements](#enforcements)
- [Username & About](#-username--about)
- [Group Management](#-group-management)
- [Communities](#-communities)
- [Privacy Settings](#-privacy-settings)
  - [Blocking](#blocking)
  - [Reporting Spam](#reporting-spam)
- [Every Message Type](#-every-message-type)
  - [Why conversation is sometimes empty](#why-conversation-is-sometimes-empty)
  - [The other 88](#the-other-88)
- [Presence and Read Receipts](#-presence-and-read-receipts)
- [Chat State](#-chat-state)
- [Labels](#-labels)
- [Business and Catalog](#-business-and-catalog)
- [Calls](#-calls)
  - [Placing a Voice Call](#placing-a-voice-call)
  - [Playing a Queue](#playing-a-queue)
  - [Video Calls](#video-calls)
  - [Screen Share](#screen-share)
  - [Group Calls](#group-calls)
- [Profile Picture](#-profile-picture)
- [Useful Exports](#-useful-exports)
- [Update WhatsApp Web Version](#-update-whatsapp-web-version)
- [Scheduled Messages](#-scheduled-messages)
- [Modern WhatsApp Message APIs](#-modern-whatsapp-message-apis)
- [Account Health Signals](#-account-health-signals)
- [Troubleshooting](#-troubleshooting)
- [Found a Bug?](#-found-a-bug)
- [Credits](#-credits)
- [TQTO](#-tqto)
- [License](#-license)

---

## ⚙️ Requirements

- Node.js **20 or newer** — this is what `package.json` declares and what the `preinstall` check enforces, so anything older is refused at install time
- **Node.js 22 or newer recommended**, and **24** for development and release workflows
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

### Optional Media Packages

The base install carries no image or video processing library, which keeps it around 45 MB smaller and leaves the choice of `sharp` build to you — no clash with a version your project already pins.

```bash
npm i sharp            # thumbnails, resizing, MessageBuilder Toolkit.resize
npm i fluent-ffmpeg    # video preview frames, MessageBuilder Toolkit.getMp4Preview
```

Media handling picks whichever image library it finds, in this order:

| Package | Used for |
|---|---|
| `sharp` | preferred, fastest |
| `@napi-rs/image` | fallback |
| `jimp` | pure-JS fallback, no native build |

Sending plain text, buttons, polls, newsletters and AI Rich messages needs none of them. Sending media without any of the three throws `No image processing library available`; calling `Toolkit.resize` or `Toolkit.getMp4Preview` without the relevant package throws a message naming what to install.

Check at runtime before relying on either:

```js
import { hasOptionalMedia } from '@rexxhayanasi/elaina-baileys'

await hasOptionalMedia('sharp')          // false when it is not installed
await hasOptionalMedia('fluent-ffmpeg')
```

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

### Socket options

Everything `makeWASocket` accepts, with its default:

| Option | Default | What it does |
|---|---|---|
| `auth` | — | required; the auth state from one of the session stores below |
| `logger` | pino instance | any pino-compatible logger |
| `version` | pinned WA Web version | protocol version the socket claims |
| `browser` | `['Mac OS', 'Chrome', '14.4.1']` | name shown under Linked Devices |
| `markOnlineOnConnect` | `true` | set `false` to keep phone notifications working |
| `syncFullHistory` | `true` | request the full history instead of the recent slice |
| `shouldSyncHistoryMessage` | `() => true` | decide per history batch whether to keep it |
| `shouldIgnoreJid` | `() => false` | drop events from matching jids before they are emitted |
| `getMessage` | `async () => undefined` | supply an old message so the socket can answer a retry |
| `cachedGroupMetadata` | `async () => undefined` | reuse your own group metadata cache |
| `emitOwnEvents` | `true` | emit events for actions this device performed |
| `fireInitQueries` | `true` | run the startup queries (props, blocklist, privacy) |
| `generateHighQualityLinkPreview` | `true` | fetch a larger link preview thumbnail |
| `linkPreviewImageThumbnailWidth` | `192` | link preview thumbnail width |
| `connectTimeoutMs` | `20000` | give up on the socket handshake |
| `keepAliveIntervalMs` | `15000` | ping interval |
| `defaultQueryTimeoutMs` | `60000` | give up on an iq query |
| `countryCode` | `'US'` | country hint sent at registration |
| `patchMessageBeforeSending` | identity | last chance to rewrite a message before relay |
| `enableAutoSessionRecreation` | `true` | rebuild a Signal session after repeated failures |
| `enableRecentMessageCache` | `true` | keep recent outbound messages for retry answers |
| `appStateMacVerification` | `{ patch: false, snapshot: false }` | verify app-state MACs |
| `waWebSocketUrl` | WA Web endpoint | override the socket URL |
| `customUploadHosts` | `[]` | extra media upload hosts |
| `inlineSenderKeyDistribution` | `true` | carry the sender key distribution message inside each group message, the way the official clients do; set `false` to send it only as a separate message |
| `transactionOpts` | `{ maxCommitRetries: 10, delayBetweenTriesMs: 3000 }` | retry policy for app-state transactions |
| `options` | `{}` | axios options for every HTTP request (proxy, timeout, headers) |
| `makeSignalRepository` | built-in | swap the Signal protocol store implementation |

`getMessage` matters more than its default suggests: without it, a recipient asking to re-receive a message gets nothing, and the message shows as "waiting for this message". Point it at whatever store you keep.

---

## 💾 Session Storage

The auth state holds your credentials and Signal keys. Losing it means scanning the QR again; leaking it means someone else can use your account. Four stores ship with the package, all returning the same `{ state, saveCreds }` shape.

Whichever you pick, wire `saveCreds` to the `creds.update` event — nothing is persisted otherwise:

```js
sock.ev.on('creds.update', saveCreds)
```

### Multi-file (default)

One folder, one file per key. Simple, dependency-free, and the right choice for a single bot on one machine.

```js
import { useMultiFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./session')
```

It writes many small files — a busy account produces thousands of pre-key files. That is normal; deleting them mid-session breaks the session.

### Single file

Everything in one JSON file. Easier to back up or move between hosts, slower once the key set grows because the whole file is rewritten on every change.

```js
import { useSingleFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useSingleFileAuthState('./session.json')
```

### SQLite

Keys in a real database, so concurrent reads and large key sets stay fast. Requires `better-sqlite3` v11, v12 or v13.

```bash
npm i better-sqlite3
```

```js
import { useSqliteAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useSqliteAuthState({ dbPath: './session.db' })
```

Pass an existing connection instead when the rest of your bot already uses one:

```js
import Database from 'better-sqlite3'

const database = new Database('./bot.db')
const { state, saveCreds } = await useSqliteAuthState({ database })
```

Two tables are created on first use: `creds` and `signal_keys`.

### PostgreSQL, MySQL, MongoDB, Redis

For a bot that already runs a database, or several bots that share one. Each takes either a connection you already have or the details to open its own, and each keeps its rows under a `session` name so one database can hold many accounts.

```bash
npm i pg        # PostgreSQL
npm i mysql2    # MySQL or MariaDB
npm i mongodb   # MongoDB
npm i ioredis   # Redis (node-redis works too)
```

```js
import {
    usePostgresAuthState,
    useMySQLAuthState,
    useMongoAuthState,
    useRedisAuthState
} from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await usePostgresAuthState({
    connectionString: 'postgres://user:pass@localhost:5432/bot'
})

const { state, saveCreds } = await useMySQLAuthState({
    uri: 'mysql://user:pass@localhost:3306/bot'
})

const { state, saveCreds } = await useMongoAuthState({
    uri: 'mongodb://localhost:27017',
    dbName: 'bot'
})

const { state, saveCreds } = await useRedisAuthState({
    uri: 'redis://localhost:6379'
})
```

Hand over your own connection when the rest of the bot already has one, and name the session when several accounts share the database:

```js
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const { state, saveCreds } = await usePostgresAuthState({ pool, session: 'sales-bot' })
```

`useMySQLAuthState` takes `pool`, `useMongoAuthState` takes `db` or `collection`, and `useRedisAuthState` takes `client` — node-redis and ioredis are both accepted, the command names are detected at startup.

All four return `clearAuth()` to wipe the session and `close()` to release a connection they opened themselves; a connection you passed in is left alone. `useSqliteAuthState` returns them too.

| Backend | Where keys live | Table or key |
|---|---|---|
| PostgreSQL | one table | `baileys_auth (session, type, id, value)` |
| MySQL | one table | `baileys_auth (session, type, id, value)` |
| MongoDB | one collection | `baileys_auth`, indexed on session + type + id |
| Redis | one hash per key type | `baileys_auth:<session>:<type>` |

Rename them with `table`, `collectionName` or `prefix`. The SQL backends write a batch of keys inside a transaction, MongoDB uses one `bulkWrite`, and Redis pipelines through `MULTI`, so a decrypt that stores thirty pre-keys costs one round trip, not thirty.

### NekoDB

For a bot whose state already lives in NekoDB, so the session travels with the rest of your data.

```js
import { useNekoDBAuth } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useNekoDBAuth(db)
```

The first argument must be a connected NekoDB instance; the collection defaults to `baileys_elaina_auth`. Pass a second argument to keep several sessions in one database:

```js
const { state, saveCreds } = await useNekoDBAuth(db, 'my_sessions')
```

### Caching Signal Keys

Every store reads keys from disk or database on each decrypt. Wrapping the key store in a cache removes that round trip:

```js
import makeWASocket, { makeCacheableSignalKeyStore, useMultiFileAuthState } from '@rexxhayanasi/elaina-baileys'
import pino from 'pino'

const logger = pino({ level: 'silent' })
const { state, saveCreds } = await useMultiFileAuthState('./session')

const sock = makeWASocket({
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, logger)
  },
  logger
})
```

Worth doing on every store, and close to required on the file-based ones for a busy group bot.

### Keeping Chats and Messages

The auth state stores keys, not conversations. For chats, contacts and message history, bind the in-memory store:

```js
import { makeInMemoryStore } from '@rexxhayanasi/elaina-baileys'

const store = makeInMemoryStore({ logger })
store.readFromFile('./store.json')
setInterval(() => store.writeToFile('./store.json'), 10_000)

const sock = makeWASocket({
  auth: state,
  logger,
  getMessage: async (key) => (await store.loadMessage(key.remoteJid, key.id))?.message
})

store.bind(sock.ev)
```

`store.chats`, `store.contacts`, `store.messages` and `store.groupMetadata` stay in sync from there, and `loadMessage` is exactly what `getMessage` needs. It lives in memory, so size it against your traffic — a bot in large groups will grow it steadily.

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

## 📡 Events

Everything the socket emits, through `sock.ev`. Subscribe individually, or batch with `sock.ev.process`.

```js
sock.ev.process(async (events) => {
  if (events['messages.upsert']) { /* ... */ }
  if (events['connection.update']) { /* ... */ }
})
```

`process` hands you one object per flush instead of one callback per event, which keeps a burst of history sync from thrashing your handler.

### Connection and credentials

| Event | Fires when |
|---|---|
| `connection.update` | connection state, QR, pairing code, reachout timelock |
| `creds.update` | credentials changed — always wire this to `saveCreds` |

### Messages

| Event | Fires when |
|---|---|
| `messages.upsert` | new or appended messages, with `type: 'notify' \| 'append'` |
| `messages.update` | status, edits, poll updates |
| `messages.delete` | messages revoked |
| `messages.reaction` | a reaction added or removed |
| `messages.media-update` | media re-upload finished |
| `message-receipt.update` | delivered / read receipts |
| `message-capping.update` | the new-chat quota changed |
| `messaging-history.set` | a history sync batch arrived |
| `messaging-history.status` | history sync progress |

### Chats and contacts

| Event | Fires when |
|---|---|
| `chats.upsert` / `chats.update` / `chats.delete` | chat list changes |
| `chats.lock` | a chat was locked or unlocked |
| `contacts.upsert` / `contacts.update` | contact changes |
| `presence.update` | typing, recording, online |
| `blocklist.update` | blocklist changed |
| `settings.update` | privacy or account settings changed |
| `labels.edit` / `labels.association` | business labels |
| `lid-mapping.update` | a phone number was mapped to a LID |

### Groups and communities

| Event | Fires when |
|---|---|
| `groups.upsert` / `groups.update` | group metadata |
| `group-participants.update` | joins, leaves, promotes, demotes |
| `group.join-request` | someone asked to join |
| `group.member-tag.update` | a member label changed |

### Newsletters

| Event | Fires when |
|---|---|
| `newsletter.reaction` | a follower reacted |
| `newsletter.view` | view counter moved |
| `newsletter-settings.update` | channel settings changed |
| `newsletter-participants.update` | admin promoted or demoted |
| `newsletter-admin-profile.update` | an admin changed their channel profile |

### Calls and voice

| Event | Fires when |
|---|---|
| `call` | incoming or updated call |
| `voice.transcription` | a voice note was transcribed |
| `voice.command` | a transcription matched the wake phrase |

### Other

| Event | Fires when |
|---|---|
| `event` | event message created or updated |
| `mex.notification` | a MEX notification this library does not model yet |

`mex.notification` is the escape hatch: anything WhatsApp adds that the library has not modelled arrives there with its raw operation name and payload, so a new feature never goes silently missing.

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

**View once for text — built, but it renders as unsupported.** `ExtendedTextMessage` carries a `viewOnce` field, and the Android client ships a whole module around it: `FMessageViewOnceText`, `ConversationRowViewOnceText`, `ViewOnceTextRowFactory`, a dedicated `ViewOnceTextFragment`, and its own `VIEW_ONCE_TEXT_MESSAGES_SENT` / `_RECEIVED` / `_OPENED` counters. The client's own encoder sets `extendedTextMessage.viewOnce` and wraps the result in `viewOnceMessageV2Extension`.

`sendMessage(jid, { text, viewOnceV2Extension: true })` produces exactly that shape:

```js
{ viewOnceMessageV2Extension: { message: { extendedTextMessage: { text, viewOnce: true } } } }
```

**Measured on a 2.26.34 device, it still displays "you received a message your version of WhatsApp doesn't support."** The payload matches what the client writes for itself, so the shape is not the problem — the feature is present in the binary but not live for ordinary senders on that build. Treat it as unavailable until a device shows otherwise.

`viewOnce: true` and `viewOnceV2: true` wrap in `viewOnceMessage` / `viewOnceMessageV2` instead; those are the wrappers media uses. The plain `conversation` field cannot carry any of this — it is a bare string with nowhere to put the flag — so the text has to travel as `extendedTextMessage`, which this fork always does.

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
 await conn.sendMessage(jid, {
  poll: {
    name: 'Yang mana yang enak?',
    values: [
  { name: 'Nasi Padang', image: { url: global.elaina } },
  { name: 'Nasi Goreng', image: { url: global.elaina } }
],
    selectableCount: 1,
    hideVoter: true,
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
})
```

`canAddOption` is left out of the example on purpose — add it only once you have confirmed the recipient supports it, since it is the one most likely to turn the whole poll into an unsupported placeholder.

Text options and image options can be mixed in the same poll, exactly as the composer allows. An option carrying an `image` turns the poll into a [photo poll](#photo-poll); once `canAddOption` is set, recipients extend it with [Poll Add Option](#poll-add-option).

`endDate` takes a `Date`, not a timestamp — it is converted to epoch milliseconds on the way out.

Photo polls do render in groups and one-to-one chats — the phone clients accept them there.

Two caveats worth knowing. WhatsApp **Web**'s own receiver is stricter than the phones. Its gate, read out of the Web bundle, is roughly this — it is WhatsApp's code, not an export of this library, so there is nothing here to import or call:

```text
isPhotoPollReceiverEnabled(msg) =
  isNewsletterMsg({ from: msg.from, to: msg.to }) && isNewsletterPhotoPollsReceiverEnabled()
```

In other words Web only accepts a photo poll inside a channel, so a photo poll that looks right on a phone can show as unsupported in a browser session. And combining image options with `hideVoter` or `endDate` moves the message to `pollCreationMessageV6`; if the images stop appearing once you add those switches, send the photo poll without them.

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

MessageBuilder v4.7 is included directly inside `@rexxhayanasi/elaina-baileys`.

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
  MESSAGE_BUILDER_VERSION,
  AIRichError,
  ItemNotFoundError,
  DuplicateIdError,
  InvalidTargetError,
  ContentValidationError
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

> [!IMPORTANT]
> `single_select` renders on **Android only**. WhatsApp Web and iOS have no code for it — the name does not exist in their native-flow list, so the message falls back to a plain text card and the list disappears. This is not something a library patch can fix. See [Native Flow Support](#native-flow-support) for what does render everywhere.

### Native Flow Support

WhatsApp Web keeps a fixed list of native-flow button names. Anything outside it is dropped and the message is downgraded to `phone_only_feature` — the text still arrives, the buttons do not.

```js
import { checkNativeFlowButtons, isWebSupportedButtonName, NATIVE_FLOW_BUTTON_LIMIT } from '@rexxhayanasi/elaina-baileys'

checkNativeFlowButtons([{ name: 'single_select' }])
// { ok: false, unsupported: ['single_select'], problems: ['"single_select" is not a native flow WhatsApp Web or iOS can render, only Android shows it'] }

isWebSupportedButtonName('quick_reply')  // true
```

Rendered everywhere: `quick_reply`, `cta_url`, `cta_call`, `cta_copy`, `cta_catalog`, `catalog_message`, `galaxy_message`, `order_status`, `payment_reminder`, `booking_confirmation`, `payment_request`, `api_signup`, `inapp_signup`, `cta_app`, `form_message`.

Android only: `single_select`, `send_location`, `address_message`, `cta_reminder`, `cta_cancel_reminder`.

Two limits, read from the client rather than guessed:

| First button | Maximum buttons |
|---|---|
| `quick_reply` | 10 |
| anything else | 3 |

Quick replies cannot be mixed with other button types in the same message — the client rejects the whole set, not just the odd button.

If you need one menu that works on every platform, use up to 10 `addReply` buttons, or send the options as text and let the user answer. There is no protocol trick that makes a single-select list appear on Web.

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
.addFOAText(text)
.addMetadata(text)
.addWidget(data, options)
.addFooterAction(data, options)
.addSection(section)
.addSubmessage(submessage)
```

### Editing a Live Message

Every `add*` call accepts `id`, `insertAt`, and `replace`, so a sent message can keep changing instead of being resent.

```js
const rich = new AIRich(sock)
  .setTitle('Elaina AI')
  .addText('Working on it…', { id: 'intro' })

await rich.send(jid)

rich.addImage('', { status: 'GENERATING', update_text: 'Generating image…', insertAt: 'intro', id: 'pic' })
await rich.sendEdit()

rich.addImage('https://example.com/result.jpg', { replace: 'pic' })
await rich.sendEdit()
```

`sendEdit()` reuses the key of the last `send()`, so no jid or message id is needed for the common case; pass them explicitly to edit some other message. `buildEdit(jid, id)` returns the edit payload without sending it.

Item bookkeeping:

```js
rich.getIds()          // [ 'intro', 'pic' ]
rich.hasId('pic')      // true
rich.peek('pic')       // the node behind that id
rich.assignId(0, 'first')  // names an item that has no id yet
rich.delete('pic')
```

`assignId` refuses to rename an item that already carries an id, and refuses an id another item is using.

Bad targets throw typed errors instead of failing silently — `ItemNotFoundError`, `DuplicateIdError`, `InvalidTargetError`, and `ContentValidationError`, all extending `AIRichError` with a `code` field.

### Mixing Instances

`sections` and `items` expose what a builder holds, so content built in one instance can be dropped into another.

```js
const cards = new AIRich(sock)
  .addProduct({ title: 'Elaina', brand: 'Baileys', product_url: 'https://example.com' })
  .addPost({ username: 'elaina', caption: 'Hello', url: 'https://example.com' })
  .items

rich.addSection(AIRich.newLayout('HScroll', cards), { id: 'mixed' })
await rich.sendEdit()
```

### Reading an Existing Message

`loadFrom` rebuilds a builder from a message you received, so an incoming interactive message can be edited and resent.

```js
const rich = new AIRich(sock).loadFrom(m.message)
const button = new Button(sock).loadFrom(m.message)
const carousel = new Carousel(sock).loadFrom(m.message)
const buttonV2 = new ButtonV2(sock).loadFrom(m.message)
```

### Primitives MessageBuilder Has No Helper For

MessageBuilder 4.7 covers 11 of the 20 AI Rich primitives the WhatsApp client knows. The rest are exposed here as plain section builders you drop into `addSection`.

```js
import {
  dividerSection,
  spacerSection,
  imageSection,
  taskSection,
  latexSection,
  thinkingSection,
  progressSection,
  TaskStatus,
  ThinkingIcon
} from '@rexxhayanasi/elaina-baileys'

rich.addSection(dividerSection(), { id: 'rule' })
rich.addSection(spacerSection({ spacing: 3 }))
rich.addSection(imageSection('https://example.com/photo.jpg'))
rich.addSection(taskSection({ taskId: 'job-1', title: 'Rendering', subtitle: 'frame 12/60', status: TaskStatus.RUNNING }))
rich.addSection(latexSection('E = mc^2'))
rich.addSection(thinkingSection('Searching the web…', { icon: ThinkingIcon.WEB_SEARCH }))
rich.addSection(progressSection('Almost done', { inProgress: false }))
```

| Builder | Primitive | Fields |
|---|---|---|
| `dividerSection` | `GenAIDividerPrimitive` | `divider_type` — `HORIZONTAL_LINE` or `DOT` |
| `spacerSection` | `GenAISpacerPrimitive` | `spacing`; 1 or less draws a rule, more draws that many blank lines |
| `imageSection` | `GenAIImagePrimitive` | `full_image` / `preview_image`, each with `url` and `url_fallback` |
| `taskSection` | `GenAITaskPrimitive` | `task_id`, `title`, `subtitle`, `status`; an empty `task_id` makes the client drop the item |
| `latexSection` | `GenAILatexUXPrimitive` | `latex_expression`, optional rendered `latex_image` |
| `thinkingSection` | `GenAIBotThinkingStatusPrimitive` | `title`, `icon`, `is_in_progress`, `meta_search_apps`, `thought_duration_sec` |
| `progressSection` | `GenAIBotProgressStatusPrimitive` | same fields as thinking |

Two primitives are deliberately left out: `GenAIMetaSubsQuotaUpsellPrimitive` is a Meta subscription upsell card, and `FOABloksPrimitive` names a Bloks screen the client fetches from Meta's servers rather than reading out of the message — neither of which a bot can populate.

### Reading Rich Messages Back

An AI Rich, A2UI or Bloks message arrives with nothing where a bot usually looks — `conversation` is empty, `extendedTextMessage` is absent, and `getContentType` reports only the wrapper (`botForwardedMessage` or `interactiveMessage`). `readRichMessage` normalises all of them into one shape.

```js
import { readRichMessage } from '@rexxhayanasi/elaina-baileys'

sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
        const rich = readRichMessage(msg)
        if (!rich) continue
        console.log(rich.kind, rich.text)
    }
})
```

It returns `null` for anything that is not one of these, so it is safe to call on every message.

| Field | Contents |
|---|---|
| `kind` | `a2ui`, `airich`, `bloks` or `interactive` |
| `text` | every readable string joined by newlines — AI Rich text primitives, A2UI `Text` components, and the interactive body and footer |
| `title` | `botMetadata.messageDisclaimerText`, falling back to the interactive header title |
| `buttons` | native flow buttons with `buttonParamsJson` already parsed; `params` is `null` when it will not parse |
| `html` | payloads of any HTML primitives, including ones inside an embedded screen |
| `a2ui` | `surfaceId`, `catalogId`, `version` and the component list |
| `bloks` | `type`, `uuid`, `fallback` and the parsed `params` |
| `typenames`, `sections`, `footerSections`, `embeddedScreens`, `embeddedTabs`, `submessages`, `responseId` | the AI Rich parts, empty when absent |

It unwraps view-once and the other envelopes first, so a card inside `viewOnceMessageV2` reads the same as a bare one.

### A2UI Cards

`interactiveMessage.bloksWidget` with `type: "im_a2ui"` renders a card the client draws **from a declarative spec carried in the message**. No HTML, no hosting, and unlike the rest of Bloks nothing is fetched from Meta — the components travel in `data` and the client lays them out.

> [!WARNING]
> The payload shape below is confirmed: a hand-written `bloksWidget` of this form renders on Android, and the client answers a malformed one with a named `A2UIValidationException`. The `sendA2UI` helper is **not** confirmed — cards sent through it have not been seen to render, and the cause is still open. Until that is settled, build the `bloksWidget` by hand if you need this to work.

```js
import { a2uiColumn, a2uiImage, a2uiText, sendA2UI } from '@rexxhayanasi/elaina-baileys'

await sendA2UI(sock, jid, [
    a2uiColumn('root', ['card_image', 'card_title', 'card_body']),
    a2uiImage('card_image', 'https://example.com/header.jpg'),
    a2uiText('card_title', 'Welcome!', { variant: 'h1' }),
    a2uiText('card_body', 'Nice to have you here.')
], {
    buttons: [{
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({ display_text: 'Join Group', url: 'https://chat.whatsapp.com/…' })
    }]
})
```

The layout is a flat list addressed by id: exactly one component must be `root`, and containers name their children by id rather than nesting them. `sendA2UI` throws if `root` is missing.

| Builder | Emits |
|---|---|
| `a2uiColumn(id, children)` | `Column` — children stacked vertically |
| `a2uiRow(id, children)` | `Row` |
| `a2uiText(id, text, { variant })` | `Text` — `variant` is `h1`, `body`, and so on |
| `a2uiImage(id, url, { variant, fit })` | `Image` — defaults `header` and `cover` |

The wrapper `a2uiSurface` builds the payload itself if you want to hand-write components the helpers do not cover:

```js
{
  version: 'v0.9',
  createSurface: {
    surfaceId: 'card-<uuid>',
    catalogId: 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
    sendDataModel: false,
    components: [ … ]
  }
}
```

`catalogId` names the component vocabulary, so components outside the basic catalog will not render. Only `Column`, `Row`, `Text` and `Image` have been confirmed on a device; the catalog lists more, and `a2uiSurface` will carry any object you give it, but treat the rest as untested.

The A2UI card and the native-flow buttons live in the same `interactiveMessage`, which is how the card gets a button row beneath it. `decodeBloksWidget(msg)` reads one back, with `params` already parsed.

### HTML Mini App

`htmlSection` carries a whole HTML document — styles and `<script>` included — that the WhatsApp Android client renders in a WebView inside the chat bubble. It is how an interactive page, a small canvas game, or a live chart reaches a user without hosting anything.

**Platform support.** This primitive appears nowhere in the WhatsApp Web bundle, and the Web renderer maps unknown primitives to an empty string. So it is deliberately excluded from `AI_RICH_PRIMITIVES` and listed in `AI_RICH_PRIMITIVES_ANDROID_ONLY` instead.

**The typename is not validated.** `GenAIaeacdsnwHtmlPrimitive` occurs nowhere in the Android APK either — not in any dex, resource or native library. Android decodes the unified response through Meta's Pando runtime (`com.facebook.pando.TreeJNI`), which reinterprets a tree node as a model class **without comparing `__typename`**. The renderer dispatches on the field shape instead, and logs `JarvisRichContent/render skipped malformed HtmlSectionContent` when the shape does not fit. What actually has to be there is `payload` and `trusted_sources` — those two field names, and the class `HtmlSectionContent(payload=, trustedSources=)`, are in the APK. The Kotlin model for the section is `FOAHtmlPrimitive`, exported as `AI_RICH_HTML_PRIMITIVE_ANDROID_CLASS`.

Pass `typename` to send the section under a different name:

```js
import { AI_RICH_HTML_PRIMITIVE_ANDROID_CLASS, htmlSection } from '@rexxhayanasi/elaina-baileys'

rich.addSection(htmlSection(html, { typename: AI_RICH_HTML_PRIMITIVE_ANDROID_CLASS }))
```

The default stays `GenAIaeacdsnwHtmlPrimitive` because that is the name observed working in production.

| Client | Result |
|---|---|
| Android | renders in a WebView, scripts run, taps and keys work |
| Web / Desktop | section comes through empty; `label` still shows |
| iOS | untested |

The WebView it renders in is offline and has no storage — see [what it actually gives you](#what-the-webview-actually-gives-you) before designing around it.

#### sendHtmlApp

One call, no envelope assembly.

```js
import { sendHtmlApp } from '@rexxhayanasi/elaina-baileys'
import { readFileSync } from 'node:fs'

await sendHtmlApp(sock, m.chat, readFileSync('./dino.html', 'utf8'), {
  title: 'NIXEL DINO',
  label: 'Dino Runner',
  trustedSources: ['nixel.dev']
})
```

```
sendHtmlApp(sock, jid, html, options?) => Promise<WAMessage>
```

| Argument | Required | Meaning |
|---|---|---|
| `sock` | yes | the socket returned by `makeWASocket` |
| `jid` | yes | target chat |
| `html` | yes | the HTML document; must be a non-empty string |

| Option | Default | Meaning |
|---|---|---|
| `title` | `''` | bot disclaimer line above the card |
| `label` | none | plain-text submessage; the only part Web and Desktop can show |
| `trustedSources` | `[]` | origins rendered as the attribution under the card |
| `height` | none | pin the page to this many pixels so the host stops re-measuring it |
| `id` | none | section id, so you can `replace` it later on the same builder |

Anything else is forwarded to `AIRich.send`, so `bypassDownload`, `forwarded`, `notification`, `includesUnifiedResponse`, `includesSubmessages`, `messageId` and `additionalNodes` all work.

**`bypassDownload` defaults to `false` here**, unlike `AIRich.send` where it is `true`. With it on, every send relays twice — the real message, then an immediate edit (`protocolMessage` type 14) carrying identical content — and the client renders the card, then re-renders it. For a static card that is a flicker; for a page running an animation loop it restarts the whole WebView. So a mini app sends once by default. Turn it back on if a card fails to appear without it.

| Passed | Relays | Effect |
|---|---|---|
| *(default)* | 1 | one message, no follow-up edit |
| `bypassDownload: true` | 2 | message, then the edit — re-renders the page |
| `includesUnifiedResponse: false` | 1 | empties `unifiedResponse` — **your HTML is gone** |
| `messageId: 'ABC123'` | 1 | uses your id instead of a generated one |
| `forwarded: false` | 1 | sends an empty `contextInfo`, dropping the Meta AI forward metadata |

The edit only ever fires under `includesUnifiedResponse && bypassDownload`, so both have to be on for a second relay to happen.

These are filled in for you, matching what the client expects:

```js
contextInfo: {
  forwardingScore: 1,
  isForwarded: true,
  forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
  forwardOrigin: 4
}
```

plus `messageType: 1`, a fresh `botResponseId`, and the `verificationMetadata` block.

#### htmlSection

Use the section builder when the HTML sits alongside other sections on a builder you control.

```js
import { AIRich, htmlSection, dividerSection } from '@rexxhayanasi/elaina-baileys'

const rich = new AIRich(sock)
rich.setTitle('Dashboard')
rich.addText('Penjualan hari ini')
rich.addSection(dividerSection())
rich.addSection(htmlSection(chartHtml, { trustedSources: ['nixel.dev'] }), { id: 'chart' })
await rich.send(m.chat)
```

```
htmlSection(html, { trustedSources?, height? }) => section
```

| Builder | Primitive | Fields |
|---|---|---|
| `htmlSection` | `GenAIaeacdsnwHtmlPrimitive` | `payload` — the HTML document; `trusted_sources` — attribution origins |

It throws a `TypeError` on an empty or non-string `html`, and on a `trustedSources` that is not an array, so a malformed card fails at build time instead of arriving blank.

#### What the WebView Actually Gives You

Measured on an Android device, not inferred. The page is injected into a blank frame, so it runs in an opaque origin:

| Signal | Value |
|---|---|
| `location.origin` | `null` |
| `location.protocol` | `about:` |
| `document.baseURI` | `about:blank` |
| `window.isSecureContext` | `false` |
| `navigator.onLine` | `true` — it lies, ignore it |

Every remote subresource fails: images from four unrelated hosts, `fetch`, `XMLHttpRequest`, a remote `<script>`, and an `<iframe>`. No `securitypolicyviolation` event fires for any of them.

`trustedSources` does not widen that. Tested on a device with one host listed in `trustedSources` and one absent: **both images failed**. Whatever the option does, it does not buy you a remote image, so images stay `data:` URIs.

Loading is dead, but talking is not. Two transports were measured on the same device in the same bubble:

| Transport | Result |
|---|---|
| `new WebSocket('wss://…')` | **connects** — `onopen` fires |
| `RTCPeerConnection` + STUN | **gathers an `srflx` candidate**, so outbound UDP and NAT reflection work |
| `fetch` / `XMLHttpRequest` / `<img>` / `<script>` / `<iframe>` | dead |

So a mini app is offline for anything it wants to *load*, and online for anything it wants to *talk to*. That is the whole difference, and it is what makes a networked mini app possible at all. Why the two split that way has not been established, so do not reason from a mechanism here — go by the table.

The opaque origin then takes the storage with it. Every one of these throws `SecurityError`, `indexedDB.open()` included:

```
localStorage   THROW SecurityError
sessionStorage THROW SecurityError
cookie         THROW SecurityError
indexedDB.open THROW SecurityError
caches         undefined
```

So a mini app here **ships everything it needs and remembers nothing on its own**. Plan for that:

- Embed media as `data:` URIs. A `data:` image loads fine; an `https:` one never will.
- Do not ship storage fallbacks. Wrapping `localStorage` in `try/catch` is correct, but the catch always runs — a high score cannot survive the bubble being re-rendered on its own.
- Persistence and any channel back to your bot go over a WebSocket to a server you run. The page talks to your server and your bot reads from the same place.
- Nothing measured so far tells the page who is viewing it, and one message in a group is one page for everybody — so identity has to be baked in per message, or asked for on screen.
- No `crypto.subtle`, since it requires a secure context. `wss://` is still encrypted by TLS; it is only the page that is not a secure context.
- The whole app travels inside the message, so its size is your budget.

What does work: `canvas` 2D, WebGL and WebGL2, `OffscreenCanvas`, WebAssembly, Web Audio, `requestAnimationFrame`, and video or audio decoded from a `data:` URI.

#### Writing HTML That Behaves in a WebView

The page runs inside a bubble in a scrolling chat list, not in a tab of its own. Five things that are harmless in a browser are not harmless here.

**Give the page a fixed height.** This is the one that makes a card visibly shudder. If the content height depends on the width — a `<canvas>` at `width:100%; height:auto`, an image with no dimensions, anything with `aspect-ratio` — then the host measures the bubble from the content while the content measures itself from the width the host just handed it, and the two chase each other. A page measured across widths 300px to 460px should report the same height every time.

Pass `height` and the library handles it, whatever the page does:

```js
await sendHtmlApp(sock, m.chat, html, { height: 300 })
```

It prepends `lockHeight(300)`, which pins `html`/`body` to that many pixels and moves the page's own content into a `#__wrap` scroll container on `DOMContentLoaded`. The container is what makes it work: pinning `body` alone is not enough, because `overflow:hidden` clips the view without shrinking `scrollHeight`, and the host still measures the overflow.

**Or let the page say its own height.** The bridge the host injects carries exactly one method, and it works:

```js
window.AndroidBridge.updateSize(520)
```

The bubble resizes to that many pixels. Confirmed on a device by tapping a button that made the call — so a mini app does not have to be pinned from the outside at all. Note the page must not also pin `html`/`body` in CSS, or the frame grows while the content stays where the stylesheet put it.

`checkHtmlApp` treats an `AndroidBridge.updateSize` call as settling the height, so a page that reports for itself no longer draws the "no height settled" warning.

To do it by hand instead, pin the outer height in pixels, give the canvas a fixed CSS size, and let anything longer scroll inside its own `overflow-y: auto` container rather than growing the page:

```css
#wrap { width: 100%; height: 300px; overflow: hidden }
#game { width: 312px; height: 106px }
```

**Stop the animation loop.** A bare `requestAnimationFrame` chain keeps drawing while the bubble is mounted — after the game ends, after the user scrolls away, after the screen turns off. Gate it:

```js
let rafId = null, running = true
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
  } else if (!running) {
    running = true
    last = 0
    rafId = requestAnimationFrame(loop)
  }
})
```

then end `loop()` with `if (running) rafId = requestAnimationFrame(loop)`.

**Close IndexedDB.** `indexedDB.open` without a matching `close()` leaves a connection behind every single time. Save on a hot path and they pile up:

```js
rq.onsuccess = () => {
  const db = rq.result
  const tx = db.transaction('kv', 'readwrite')
  tx.objectStore('kv').put(value, 'best')
  tx.oncomplete = () => db.close()
  tx.onerror = () => db.close()
}
```

**Scale the canvas to the device.** A `<canvas width="560">` shown at 352 CSS px on a `devicePixelRatio: 3` phone needs 1056 real pixels and gets 560 — visibly soft. Size the backing store and keep your game coordinates in constants:

```js
const W = 560, H = 190
const dpr = Math.min(devicePixelRatio || 1, 3)
canvas.width = W * dpr
canvas.height = H * dpr
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
```

**Scope your input handler.** `document.addEventListener('pointerdown', e => e.preventDefault())` cancels the gesture for the whole document, including the padding around your app, so the host can lose the scroll it was about to start. Bind to the element that actually needs it:

```js
canvas.addEventListener('pointerdown', e => { e.preventDefault(); jump() })
document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); jump() } })
```

**One escaping trap.** If you build the HTML as a JavaScript string literal, `"\d"` becomes `d` and `"\s"` becomes `s` before the page ever sees them — a regex like `/dino_best=(\d+)/` silently turns into one that matches literal `d` characters and never fires. Write `\\d` and `\\s`, or read the document from a file as in the first example and sidestep it.

#### Reading One Back

`decodeAIRich` handles the primitive like any other — there is no whitelist to update:

```js
const rich = decodeAIRich(msg)
const section = rich?.sections.find(s => s.view_model?.primitive?.__typename === AI_RICH_HTML_PRIMITIVE)
if (section) {
  const html = section.view_model.primitive.payload
}
```

Do not reach for `sections[0]` — the HTML lands wherever you added it, so a card with text and a divider in front of it puts the page at index 2.

Enum values, read from the client rather than guessed:

```js
import { DividerType, ImagineType, ImagineStatus, TaskStatus, ThinkingIcon, FooterActionType, AddonActionType, AI_RICH_LAYOUTS, AI_RICH_PRIMITIVES, AI_RICH_PRIMITIVES_ANDROID_ONLY, AI_RICH_HTML_PRIMITIVE } from '@rexxhayanasi/elaina-baileys'
```

`AI_RICH_LAYOUTS` lists all eight layout names accepted by `AIRich.newLayout` — `Single`, `HScroll`, and `ActionRow` are the ones MessageBuilder uses; `VStack`, `Grid`, `FlexibleCountGrid`, `RichListItem`, and `AddonAction` also exist.

### Embedded Screens

An embedded screen is a second surface attached to the same rich response. The bubble in the chat stays small; tapping it opens a full sheet that can hold its own sections, or several tabs of them. WhatsApp Web does not render it at all — its parser writes `CometComposedTextV2UnsupportedURType typename="embedded_screens"` and stops — so this is an Android and iOS surface.

```js
import { AIRich, embeddedScreen, embeddedTab, htmlSection } from '@rexxhayanasi/elaina-baileys'

const rich = new AIRich(sock)
  .addSection(htmlSection('<b>Preview</b>'))

rich.addEmbeddedScreen(embeddedScreen({
  title: 'Preview',
  tabs: [
    embeddedTab({ id: 'tab_0', tabHeader: 'Dino Runner', sections: [htmlSection(gameHtml)] }),
    embeddedTab({ id: 'tab_1', tabHeader: 'Scores', sections: [htmlSection(scoreHtml)] })
  ]
}))

await rich.send(m.chat)
```

#### The typenames on the wire

Every piece the client walks past carries a `__typename`, and the builder fills them in:

```jsonc
{
  "embedded_screens": [
    {
      "title": "Preview",
      "content": [
        {
          "__typename": "FOAEmbeddedScreenContentTabbed",
          "tabs": [
            {
              "id": "tab_0",
              "tab_header": "Dino Runner",
              "sections": [
                {
                  "__typename": "GenAIUnifiedResponseSection",
                  "view_model": {
                    "__typename": "GenAISingleLayoutViewModel",
                    "primitive": { "__typename": "GenAIaeacdsnwHtmlPrimitive", "payload": "<html…>" }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

Note the nesting: **tabs live inside a `content` entry, not beside it**. The screen holds `content[]`; an entry is either a section (it has `view_model`) or a tab container (it has `tabs`). Passing `tabs` to `embeddedScreen` wraps them in that container for you, and appends it after any plain `content` you also passed.

| Constant | Value | Where it goes |
| --- | --- | --- |
| `AI_RICH_SECTION_TYPENAME` | `GenAIUnifiedResponseSection` | every section, top level or nested |
| `AI_RICH_UNIFIED_RESPONSE_TYPENAME` | `XMSGGenAIUnifiedResponse` | the unified response root |
| `EMBEDDED_SCREEN_TABBED_TYPENAME` | `FOAEmbeddedScreenContentTabbed` | the `content` entry that holds tabs |
| `EMBEDDED_SCREEN_TAB_TYPENAME` | `FOAUnifiedResponseTab` | a tab, when you want it named |
| `EMBEDDED_SCREEN_TYPENAME` | `FOAUnifiedResponseEmbeddedScreen` | the screen itself, when you want it named |

`GenAIUnifiedResponseSection` and `XMSGGenAIUnifiedResponse` come straight out of the WhatsApp Web bundle, which builds exactly that shape in its own `injectRichResponseTestMessage` debug command. The three `FOA…` names come from the Android client's Kotlin models — `FOAEmbeddedScreenContentTabbedImpl.kt`, `FOAUnifiedResponseTabImpl.kt`, `FOAUnifiedResponseEmbeddedScreenImpl.kt`.

Sections always get their typename. The screen and the tabs do not, unless you ask:

```js
embeddedScreen({ typename: EMBEDDED_SCREEN_TYPENAME, tabs: [...] })
embeddedTab({ typename: EMBEDDED_SCREEN_TAB_TYPENAME, sections: [...] })
embeddedScreen({ tabs: [...], tabsTypename: 'FOAIDButtonSheets' })
```

That last one matters because, as with `htmlSection`, **Android does not compare `__typename`** — Pando reinterprets the tree node by field shape. Payloads in the wild carry all sorts of container names and still render. `tabsTypename` is there so you can match whatever a build expects instead of being locked to one string.

Everything else `embeddedScreen` accepts maps to a snake_case wire field: `content`, `header`, `body`, `artifacts`, `steps`, `stepEntries` → `step_entries`, `sources`, `pollId` → `poll_id`. An `id` is generated when you leave it out, and empty values are dropped rather than sent as `null`.

#### Reading one back

```js
import { decodeAIRich, readEmbeddedSections, readEmbeddedTabs } from '@rexxhayanasi/elaina-baileys'

const info = decodeAIRich(m.message)
info.embeddedScreens   // the raw screens
info.embeddedTabs      // every tab, from both nesting shapes
info.embeddedSections  // every section inside those screens

readEmbeddedTabs(info.embeddedScreens[0])
readEmbeddedSections(info.embeddedScreens[0])
```

`readRichMessage(m).html` now also collects HTML that sits inside an embedded screen, so a page delivered through a tab is no longer invisible to it.

### Inspecting a Received AI Rich Message

`decodeAIRich` unpacks the base64 `unifiedResponse` so you can see exactly which primitives a message uses — useful for reproducing something another bot sent.

```js
import { decodeAIRich } from '@rexxhayanasi/elaina-baileys'

const info = decodeAIRich(m.message)
console.log(info.layouts)     // [ 'Single', 'HScroll' ]
console.log(info.typenames)   // [ 'GenAIMarkdownTextUXPrimitive', 'GenAIProductItemCardPrimitive' ]
console.log(info.sections)
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
  ],
  caption: 'Caption for the album itself'
})
```

The per-item `caption` rides on each image or video. The `caption` beside `album` is the album's own — `AlbumMessage.caption`, field 1.

**It is an Android-only field, so it is opt-in on purpose.** The WhatsApp Web protobuf has no `caption` on `AlbumMessage` at all; the field was found by auditing the Android APK. This library links as a Web device, so sending a field the real Web client cannot even express is a fingerprint. Leave the key out — as every existing caller already does — and nothing is written. Set it only when you have decided that trade is worth it.

An album requires at least two image/video media items.

---

## 📢 Newsletter / Channel

### Creating and Editing a Channel

#### Create Newsletter

```js
const newsletter = await sock.newsletterCreate(
  'Elaina Updates',
  'Official update channel'
)

console.log(newsletter)
```

#### Update Name

```js
await sock.newsletterUpdateName(
  '123456789@newsletter',
  'Elaina News'
)
```

#### Update Description

```js
await sock.newsletterUpdateDescription(
  '123456789@newsletter',
  'Fresh updates from Elaina'
)
```

#### Update Picture

```js
await sock.newsletterUpdatePicture(
  '123456789@newsletter',
  { url: 'https://example.com/channel.jpg' }
)
```

#### Reaction Settings

```js
await sock.newsletterUpdateReactions('123456789@newsletter', 'BASIC')
```

`ALL` allows any emoji, `BASIC` the default set only, `NONE` disables reactions, `BLOCKLIST` uses the server-side blocklist. Anything else is rejected before the request leaves.

### Following a Channel

#### Follow / Unfollow

```js
await sock.newsletterFollow('123456789@newsletter')
await sock.newsletterUnfollow('123456789@newsletter')
```

#### Mute / Unmute

```js
await sock.newsletterMute('123456789@newsletter')
await sock.newsletterUnmute('123456789@newsletter')
```

#### Mute Admin or Follower Activity

WhatsApp Web replaced the old mute/unmute pair with one setting that separates admin notifications from follower notifications.

```js
await sock.newsletterUpdateUserSetting('123456789@newsletter', 'ADMIN_NOTIFICATIONS', true)
await sock.newsletterUpdateUserSetting('123456789@newsletter', 'FOLLOWER_NOTIFICATIONS', false)
```

`newsletterMute` and `newsletterUnmute` are shorthands for the same mutation with `ADMIN_NOTIFICATIONS`, which is exactly what the mute toggle in WhatsApp Web sends. They used to call a separate pair of operations that no longer exists in either client, so they now return the same `{ id, state }` the setting call returns.

#### Fetch Subscribed Newsletters

```js
const newsletters = await sock.newsletterSubscribed()
console.log(newsletters)
```

### Reading a Channel

#### Fetch Newsletter Metadata

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

#### Incremental Message Updates

Poll only what changed on a channel since a timestamp, instead of refetching history.

```js
const { messages } = await sock.newsletterFetchMessageUpdates('123456789@newsletter', {
  count: 50,
  since: 1770000000
})
```

#### Followers

```js
const followers = await sock.newsletterFollowers('123456789@newsletter', { count: 100 })
```

#### Insights

Admin analytics for a channel you own.

```js
const insights = await sock.newsletterInsights('123456789@newsletter', {
  metrics: ['NET_FOLLOWS', 'UNFOLLOWS']
})
// { result: [{ id, values }], last_update_time, metrics_status }
```

`metrics_status` is `OK` or `MISSING`; `MISSING` means the server has no data for the requested window yet.

#### Your Own Reactions and Votes

What you reacted or voted on across channels, without walking every message.

```js
const groups = await sock.newsletterMyAddOns({ limit: 100 })
const oneChannel = await sock.newsletterMyAddOns({ limit: 50, jid: '123456789@newsletter' })
const onStatuses = await sock.newsletterStatusMyAddOns({ limit: 50 })

for (const group of groups) {
  for (const m of group.messages) {
    console.log(group.jid, m.serverId, m.reaction?.code, m.pollVote?.hashes)
  }
}
```

`pollVote.hashes` are the SHA-256 option hashes, hex encoded — match them against the poll's options to know which one you picked.

### Posting and Reacting

#### React to Newsletter Message

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

#### Pin / Unpin Messages

Takes the message `server_id`, not the message key.

```js
await sock.newsletterPinMessages('123456789@newsletter', [175])
await sock.newsletterUnpinMessages('123456789@newsletter', 175)
```

#### Content Labels

```js
await sock.newsletterLabelAiContent('123456789@newsletter', 175)
await sock.newsletterLabelPaidPartnership('123456789@newsletter', 175)
```

`messageType` is the third argument and defaults to `MESSAGE`; pass `STATUS` to label a channel status.

#### Vote on a Channel Poll

Channel votes are sent unencrypted as option hashes, unlike the encrypted votes used in chats.

```js
await sock.newsletterSendPollVote('123456789@newsletter', pollServerId, ['Jakarta'])
```

#### Poll Voters

```js
const voters = await sock.newsletterPollVoters('123456789@newsletter', 175, {
  limit: 100,
  voteHash: undefined
})
```

The response groups voters per `vote_hash`, each with a `voter_list.edges` array.

#### Reaction Senders

```js
const senders = await sock.newsletterReactionSenders('123456789@newsletter', 175)
```

### Channel Status

#### Post a Channel Status

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

##### Channel Status vs `status@broadcast`

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

##### Where the Server Id Comes From

The `<ack>` that answers a published status carries `from`, `class`, `id` and `t` — and no server id at all. That is not a failure; the id arrives a moment later, on the `<status>` stanza the server echoes back to the publisher, marked `is_sender="true"`.

`sendNewsletterStatus` waits for that echo and fills it in, so the id you need to react to or revoke your own status is on the result:

```js
const posted = await sock.sendNewsletterStatus('123456789@newsletter', {
  image: { url: 'https://example.com/drop.jpg' },
  caption: 'New drop today'
})

posted.newsletterStatusServerId   // 175 — from the echo, not the ack
posted.newsletterStatusAck        // the ack itself, which never has one
posted.newsletterStatusDelivered  // the raw <status> node the id came from

await sock.sendNewsletterStatusReaction('123456789@newsletter', posted.newsletterStatusServerId, '🔥')
```

The wait is capped and never blocks the send: if no echo arrives, `newsletterStatusServerId` is `undefined` and everything else is unchanged. Tune it with `serverIdTimeoutMs`, or skip it with `resolveServerId: false` when you only care that the status went out.

##### Check Whether the Channel May Post

WhatsApp gates channel status creation on a per-channel capability the server grants, not on a setting you can flip. Check it before building a posting flow:

```js
const { canPost, canPostMusic, capabilities } = await sock.newsletterCanPostStatus('123456789@newsletter')
```

`canPost` is `CHANNEL_STATUS_PRODUCER` in the capability list. The full gate WhatsApp Web applies is: the `channel_status_creation` flag is on, you are admin or owner, the channel is not suspended or terminated, and the channel holds `CHANNEL_STATUS_PRODUCER`. Only the last one is visible to a client, and it is the one that actually varies per channel — the rollout flag is off by default on Web, which is why the button is missing there while the phone shows it.

##### Question Statuses

A channel status can carry a question box, and followers answer it.

```js
await sock.sendNewsletterStatus('123456789@newsletter', {
  image: { url: './bg.jpg' },
  question: { text: 'Ask me anything' }
})
```

Answers come back as `questionResponseMessage`. Reshare one on top of a new status with `interactionType: 'question_reshare'` plus `parentServerId` and `responseServerId`; publish your own answer with `interactionType: 'question_response'` and `parentServerId`. A question status has to sit on media — WhatsApp Web never publishes a text-only one.

#### Read Channel Statuses

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

#### Newsletter Status Attribution

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

#### Who Sent a Channel Message

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

### Questions

#### Question Responses

Answers to a channel question, with the follower behind each one.

```js
const { responses } = await sock.newsletterQuestionResponses('123456789@newsletter', 175, {
  count: 50,
  filter: 'starred',
  searchText: 'harga'
})

for (const r of responses) {
  console.log(r.sender.notifyName, r.sender.lid)
  console.log(r.message?.conversation)
  console.log(r.starred, r.replied)
}
```

`filter` accepts `contacts`, `replied`, or `starred`; `searchText` searches the answers; `before` pages backwards.

#### Hide a Question Response

Moderates a follower's answer to a channel question.

```js
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'HIDDEN')
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'VISIBLE')
```

---

### Admins

#### Admin Capabilities

Which channel features the server has enabled for you. This is the gate WhatsApp Web itself checks before offering a feature.

```js
const capabilities = await sock.newsletterAdminCapabilities('123456789@newsletter')
console.log(capabilities)
// [ 'INSIGHTS', 'ADMIN_NOTIFICATIONS', 'PHOTO_POLLS', 'QUESTIONS', 'QUIZ', 'THREAD_MENU' ]
```

Requires admin or owner rights on the channel; other channels answer `Not Authorized`.

#### Admin Profiles

A channel admin can set a name and photo of their own that ride along with every update they post, so followers see who wrote it instead of only the channel. WhatsApp calls the channel-level switch **Show admin profile**.

Three parts of this are readable from the library:

```js
const info = await sock.newsletterAdminInfo('123456789@newsletter')
// {
//   id: '123456789@newsletter',
//   adminCount: 3,
//   adminProfile: { id, name, picture: { id, directPath } },
//   adminProfilesEnabled: true
// }

const caps = await sock.newsletterAdminCapabilities('123456789@newsletter')
caps.includes('ADMIN_PROFILE')   // has WhatsApp granted the feature to this channel
```

Incoming updates carry the posting admin in `newsletterMeta`, and the library now also surfaces the live change notification:

```js
sock.ev.on('newsletter-admin-profile.update', ({ id, adminProfile }) => {
  console.log(id, adminProfile)
  // { id, name, pictureId, pictureDirectPath } — or null when an admin clears theirs
})
```

Setting your own admin name or photo is **not possible from any client API**. WhatsApp Web only ever receives admin profiles: there is no mutation for it, `newsletterUpdate` accepts only name, description, picture and reaction settings, and the "Show admin profile" switch in the Web UI is rendered without a handler. It is set from the phone, and only on channels that hold the `ADMIN_PROFILE` capability.

#### Admin Invites

```js
await sock.newsletterCreateAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterRevokeAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterAcceptAdminInvite('123456789@newsletter')
```

#### Pending Admin Invites

```js
const pending = await sock.newsletterPendingAdminInvites('123456789@newsletter')
// [ { id: '628xxxxxxxxx@s.whatsapp.net', phoneNumber: '628xxxxxxxxx' } ]
```

### Finding Channels

#### Discovery

```js
const recommended = await sock.newsletterRecommended({ limit: 20, countryCodes: ['ID'] })
const similar = await sock.newsletterSimilar('123456789@newsletter', { limit: 20 })
```

#### Directory

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

### Enforcements

#### Enforcements and Appeals

When a channel feature quietly disappears — the admin profile setting, the status ring, the ability to post — the cause is often an enforcement on the channel, not a missing rollout. This reads what WhatsApp is holding against it.

```js
const enf = await sock.newsletterEnforcements('123456789@newsletter')

console.log(enf.suspensions)
console.log(enf.adminProfiles)            // enforcement aimed at the admin profile feature
console.log(enf.profilePictureDeletions)
console.log(enf.violatingMessages)
console.log(enf.geoSuspensions)
```

Every entry carries the same shape:

```js
{
  enforcementId: '...',
  createdAt: 1770000000,
  violationCategory: 'GENERIC_VIOLATION',
  source: '...',
  appealState: '...',
  appealCreatedAt: undefined,
  appealReasonOptions: [ { reason: 'RM_COPS', label: 'I own the rights' } ],
  appealFormUrl: 'https://...',
  policy: { headline, subtitle, overview, explanation, adminDisclaimer }
}
```

`appealReasonOptions` and `appealFormUrl` are the appeal path WhatsApp itself offers — there is no other way to ask for a decision to be reviewed. An empty result in every bucket means the channel is clean and whatever is missing is a rollout, not a penalty.

Reports you filed, and appealing their outcome:

```js
const reports = await sock.newsletterReports()
await sock.newsletterAppealReport(reports[0].report_id, 'RESPONSE_VIOLATES_GUIDELINES')
```

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

### Update Group Description

```js
await sock.groupUpdateDescription(
  groupJid,
  'Welcome to Elaina Community 💜'
)
```

### Subject and Settings

```js
await sock.groupUpdateSubject(groupJid, 'New name')
await sock.groupSettingUpdate(groupJid, 'announcement')
```

`groupSettingUpdate` takes one of `announcement` (only admins may send), `not_announcement`, `locked` (only admins may edit group info) or `unlocked`.

### Who May Join and Who May Add

```js
await sock.groupMemberAddMode(groupJid, 'admin_add')
await sock.groupJoinApprovalMode(groupJid, 'on')
```

`groupMemberAddMode` is `admin_add` or `all_member_add`. `groupJoinApprovalMode` is `on` or `off`; with it on, people who use the invite link land in a request queue instead of the group.

### The Join Request Queue

```js
const pending = await sock.groupRequestParticipantsList(groupJid)
await sock.groupRequestParticipantsUpdate(groupJid, [userJid], 'approve')
await sock.groupRequestParticipantsUpdate(groupJid, [userJid], 'reject')
```

### Invite Links

```js
const code = await sock.groupInviteCode(groupJid)
console.log('https://chat.whatsapp.com/' + code)

const fresh = await sock.groupRevokeInvite(groupJid)

const preview = await sock.groupGetInviteInfo(code)
await sock.groupAcceptInvite(code)
```

`groupGetInviteInfo` reads the group behind a code without joining. There is also a direct invite pair — `groupRevokeInviteV4(groupJid, invitedJid)` and `groupAcceptInviteV4` — for the invite sent to one person rather than a link.

### Disappearing Messages

```js
await sock.groupToggleEphemeral(groupJid, 7 * 24 * 60 * 60)
await sock.groupToggleEphemeral(groupJid, 0)
```

The duration is in seconds; `0` turns it off. WhatsApp's own options are 24 hours, 7 days and 90 days.

### Reading Groups

```js
const metadata = await sock.groupMetadata(groupJid)
const all = await sock.groupFetchAllParticipating()

await sock.groupLeave(groupJid)
```

`groupFetchAllParticipating` returns every group you are in, keyed by jid. It is one request for all of them, so prefer it over calling `groupMetadata` in a loop.

---

## 🏘️ Communities

A community is a parent that owns groups. Every method mirrors its group counterpart, plus the linking calls that have no group equivalent.

### Create and Link

```js
const community = await sock.communityCreate('Elaina Community', 'What this community is for')

const group = await sock.communityCreateGroup('Announcements', [userJid], community.id)

await sock.communityLinkGroup(existingGroupJid, community.id)
await sock.communityUnlinkGroup(existingGroupJid, community.id)

const linked = await sock.communityFetchLinkedGroups(community.id)
```

`communityCreateGroup` makes a group already attached to the community. `communityLinkGroup` attaches one that exists — you must be admin of both.

### Members and Settings

```js
await sock.communityParticipantsUpdate(communityJid, [userJid], 'promote')
await sock.communityUpdateSubject(communityJid, 'New name')
await sock.communityUpdateDescription(communityJid, 'New description')
await sock.communitySettingUpdate(communityJid, 'announcement')
await sock.communityMemberAddMode(communityJid, 'admin_add')
await sock.communityJoinApprovalMode(communityJid, 'on')
await sock.communityToggleEphemeral(communityJid, 7 * 24 * 60 * 60)
```

The actions and values match the group ones above.

### Invites and Reading

```js
const code = await sock.communityInviteCode(communityJid)
await sock.communityRevokeInvite(communityJid)
await sock.communityAcceptInvite(code)
const preview = await sock.communityGetInviteInfo(code)

const metadata = await sock.communityMetadata(communityJid)
const all = await sock.communityFetchAllParticipating()
await sock.communityLeave(communityJid)
```

---

## 🔒 Privacy Settings

```js
const settings = await sock.fetchPrivacySettings(true)
```

Pass `true` to bypass the cache. Each setting has its own updater, and the value goes to the server unchanged — an unknown one is rejected there, not here:

| Call | Accepts |
|---|---|
| `updateLastSeenPrivacy(value)` | `all`, `contacts`, `contact_blacklist`, `none` |
| `updateOnlinePrivacy(value)` | `all`, `match_last_seen` |
| `updateProfilePicturePrivacy(value)` | `all`, `contacts`, `contact_blacklist`, `none` |
| `updateStatusPrivacy(value)` | `all`, `contacts`, `contact_blacklist`, `none` |
| `updateReadReceiptsPrivacy(value)` | `all`, `none` |
| `updateGroupsAddPrivacy(value)` | `all`, `contacts`, `contact_blacklist` |
| `updateCallPrivacy(value)` | `all`, `known` |
| `updateMessagesPrivacy(value)` | `all`, `contacts` |
| `updateDisableLinkPreviewsPrivacy(disabled)` | a boolean |

```js
await sock.updateLastSeenPrivacy('contacts')
await sock.updateOnlinePrivacy('match_last_seen')
await sock.updateDisableLinkPreviewsPrivacy(true)
```

### Default Disappearing Messages

```js
await sock.updateDefaultDisappearingMode(7 * 24 * 60 * 60)
const durations = await sock.fetchDisappearingDuration(jidA, jidB)
```

The default applies to new chats. `fetchDisappearingDuration` takes any number of jids and reports what each is set to.

### Blocking

```js
await sock.updateBlockStatus(jid, 'block')
await sock.updateBlockStatus(jid, 'unblock')
const blocked = await sock.fetchBlocklist()
```

### Reporting Spam

```js
import { SPAM_FLOWS } from '@rexxhayanasi/elaina-baileys'

await sock.reportSpam(jid)

await sock.reportSpam(groupJid, {
    flow: SPAM_FLOWS.GroupInfoReport,
    source: senderJid
})
```

`reportSpam` sends the chat-level report, the same one WhatsApp Web sends when you report a contact or a group without picking a message. `flow` tells the server where the report came from and defaults to `SPAM_FLOWS.OverflowMenuReport`; `SPAM_FLOWS` carries the values WhatsApp Web itself uses. `source` names the participant being reported inside a group, `subject` carries the entity name, and `isKnownChat` says whether the chat was already known to you. Reporting one specific message is not covered — that needs the franking tags the client derives when it receives the message.

---

## 📨 Every Message Type

`message.message` is a box with exactly one key set, and the key names the
kind. There are **117** of them. Two things trip up almost everyone starting
out, so read this part before hunting for a bug that is not there.

### Why `conversation` is sometimes empty

**29 of the 117 are wrappers.** They carry no content of their own — they hold
another message inside. A view-once photo is not `imageMessage`, it is
`viewOnceMessageV2` containing an `imageMessage`. A group status reply is
`groupStatusMessageV2` containing whatever was actually said. Read the outer
key and you find nothing:

```js
const m = messages[0]
console.log(m.message.conversation)          // undefined
console.log(Object.keys(m.message))          // [ 'groupStatusMessageV2' ]
```

`normalizeMessageContent` peels them off for you, up to five layers deep,
because wrappers nest — an edited view-once photo inside an ephemeral chat is
three of them stacked:

```js
import { normalizeMessageContent, getContentType } from '@rexxhayanasi/elaina-baileys'

const content = normalizeMessageContent(m.message)
const type = getContentType(content)        // 'imageMessage'
const text = content?.conversation || content?.extendedTextMessage?.text
```

Always normalise before you look. The full list of wrappers, so you can
recognise one when you see it:

| Group | Wrappers |
|---|---|
| Disappearing and view-once | `ephemeralMessage`, `viewOnceMessage`, `viewOnceMessageV2`, `viewOnceMessageV2Extension`, `limitSharingMessage` |
| Edits and replies | `editedMessage`, `associatedChildMessage`, `questionMessage`, `questionReplyMessage` |
| Status | `statusMentionMessage`, `statusAddYours`, `groupStatusMessage`, `groupStatusMessageV2`, `groupStatusMentionMessage` |
| Groups | `groupMentionedMessage` |
| Bots | `botInvokeMessage`, `botTaskMessage`, `botForwardedMessage`, `botPlatformRegistrationSuccessMessage` |
| Newsletter | `newsletterAdminProfileMessage`, `newsletterAdminProfileMessageV2`, `newsletterAdminProfileStatusMessage`, `newsletterScheduledMessage` |
| Polls and media | `pollCreationMessageV4`, `pollCreationOptionImageMessage`, `documentWithCaptionMessage`, `lottieStickerMessage`, `eventCoverImage`, `spoilerMessage` |

### The other 88

These carry the content. You will use a handful constantly and never touch
most of the rest, but knowing they exist saves you from assuming a message is
malformed when it is simply a kind you have not met.

| Group | Types |
|---|---|
| Text and location | `conversation`, `extendedTextMessage`, `locationMessage`, `liveLocationMessage`, `contactMessage`, `contactsArrayMessage`, `groupInviteMessage`, `albumMessage`, `musicMessage`, `conditionalRevealMessage` |
| Media | `imageMessage`, `videoMessage`, `audioMessage`, `documentMessage`, `stickerMessage`, `stickerPackMessage`, `stickerSyncRmrMessage`, `ptvMessage` |
| Buttons and lists | `buttonsMessage`, `buttonsResponseMessage`, `listMessage`, `listResponseMessage`, `templateMessage`, `templateButtonReplyMessage`, `interactiveMessage`, `interactiveResponseMessage`, `highlyStructuredMessage` |
| Polls and events | `pollCreationMessage` … `pollCreationMessageV6`, `pollUpdateMessage`, `pollAddOptionMessage`, `pollResultSnapshotMessage`, `pollResultSnapshotMessageV3`, `eventMessage`, `eventInviteMessage`, `questionResponseMessage`, `keepInChatMessage` |
| Status | `statusNotificationMessage`, `statusQuestionAnswerMessage`, `statusQuotedMessage`, `statusStickerInteractionMessage`, `statusLinkPreviewMetadata` |
| Newsletter | `newsletterFollowerInviteMessage`, `newsletterFollowerInviteMessageV2`, `newsletterAdminInviteMessage` |
| Calls | `call`, `bcallMessage`, `callLogMesssage`, `scheduledCallCreationMessage`, `scheduledCallEditMessage` |
| Payments and shop | `sendPaymentMessage`, `requestPaymentMessage`, `declinePaymentRequestMessage`, `cancelPaymentRequestMessage`, `paymentInviteMessage`, `paymentReminderMessage`, `splitPaymentMessage`, `splitPaymentUpdateMessage`, `productMessage`, `orderMessage`, `invoiceMessage` |
| Reactions and comments | `reactionMessage`, `encReactionMessage`, `commentMessage`, `encCommentMessage`, `pinInChatMessage`, `encEventResponseMessage` |
| Bots and AI | `richResponseMessage`, `placeholderMessage` |
| Protocol and sync | `protocolMessage`, `deviceSentMessage`, `senderKeyDistributionMessage`, `fastRatchetKeySenderKeyDistributionMessage`, `messageContextInfo`, `messageHistoryBundle`, `messageHistoryNotice`, `secretEncryptedMessage`, `requestPhoneNumberMessage`, `groupRootKeyShare`, `rootSecretDistributeMessage` |

`protocolMessage` is worth singling out: deletions, edits, ephemeral-timer
changes and app-state syncs all arrive as one, distinguished by its `type`.
A bot that ignores it will look like it never notices a deleted message.

### Reading a rich message

A message from another bot — AI Rich, A2UI, Bloks — leaves `conversation`
empty and `getContentType` reporting only the wrapper. `readRichMessage`
normalises all of them into one shape; see
[Reading Rich Messages Back](#reading-rich-messages-back).

---

## 👀 Presence and Read Receipts

```js
await sock.presenceSubscribe(jid)

await sock.sendPresenceUpdate('composing', jid)
await sock.sendPresenceUpdate('recording', jid)
await sock.sendPresenceUpdate('paused', jid)

await sock.sendPresenceUpdate('available')
await sock.sendPresenceUpdate('unavailable')
```

You only receive someone's presence after `presenceSubscribe` on their jid. `available` and `unavailable` are your own global state and take no jid; the rest are per-chat typing indicators. `recording` goes on the wire as `composing` with `media: audio`, which is what produces "recording audio…".

### Marking as Read

```js
await sock.readMessages([msg.key])

await sock.sendReceipt(jid, participant, [messageId], 'read')
await sock.sendReceipts([msg.key], 'read')
```

`readMessages` is the one to reach for. `sendReceipt` and `sendReceipts` are the lower layer underneath it, with the receipt type spelled out — `read`, `read-self`, `played` or `undefined` for a plain delivery receipt.

### Checking a Number

```js
const results = await sock.onWhatsApp('6281234567890', '6289876543210')
for (const entry of results) {
  console.log(entry.jid, entry.exists)
}
```

---

## 🗂️ Chat State

`chatModify` writes to app state, so a change syncs to the phone and to every other linked device.

```js
await sock.chatModify({ archive: true, lastMessages: [msg] }, jid)
await sock.chatModify({ pin: true }, jid)
await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid)
await sock.chatModify({ mute: null }, jid)
await sock.chatModify({ markRead: false, lastMessages: [msg] }, jid)
await sock.chatModify({ star: { messages: [{ id: msg.key.id, fromMe: msg.key.fromMe }], star: true } }, jid)
await sock.chatModify({ clear: true, lastMessages: [msg] }, jid)
await sock.chatModify({ delete: true, lastMessages: [msg] }, jid)
await sock.chatModify({ contact: { fullName: 'Elaina' } }, jid)
```

`mute` is a duration in milliseconds, and `null` unmutes. Several of these need `lastMessages` — the server uses it to place the change in the chat's timeline, and it throws without it.

### History and Resync

```js
await sock.fetchMessageHistory(50, oldestMsgKey, oldestMsgTimestamp)
await sock.requestPlaceholderResend(messageKey)
await sock.resyncAppState(['regular_high'], false)
```

`fetchMessageHistory` asks the phone for messages older than the key you pass; they arrive through `messaging-history.set`. `requestPlaceholderResend` asks for one message again when it arrived as a placeholder.

---

## 🏷️ Labels

Labels are a WhatsApp Business feature.

```js
await sock.addLabel(jid, { id: '1', name: 'Customer', color: 0, deleted: false })

await sock.addChatLabel(jid, labelId)
await sock.removeChatLabel(jid, labelId)

await sock.addMessageLabel(jid, messageId, labelId)
await sock.removeMessageLabel(jid, messageId, labelId)
```

---

## 🛍️ Business and Catalog

```js
const profile = await sock.getBusinessProfile(jid)
await sock.updateBusinessProfile({ description: 'Toko Elaina', address: 'Jakarta', email: 'halo@example.com' })

const catalog = await sock.getCatalog({ jid, limit: 10 })
const collections = await sock.getCollections(jid, 51)
const order = await sock.getOrderDetails(orderId, tokenBase64)
```

`updateBusinessProfile` is also exported under its original misspelling, `updateBussinesProfile`; both are the same function.

### Managing Products

```js
const created = await sock.productCreate({
  name: 'Elaina Sticker Pack',
  description: 'A pack of stickers',
  price: 15000,
  currency: 'IDR',
  isHidden: false,
  images: [{ url: 'https://example.com/product.jpg' }]
})

await sock.productUpdate(created.id, { price: 20000 })
await sock.productDelete([created.id])
```

### Profile and Quick Replies

```js
await sock.updateProfileName('Elaina')
await sock.updateCoverPhoto(buffer)
await sock.addOrEditQuickReply({ shortcut: 'hi', message: 'Hello!', keywords: ['halo'] })

await sock.addOrEditContact(jid, { fullName: 'Elaina' })
await sock.removeContact(jid)
```

`removeContact` is `chatModify({ contact: null })` under a friendlier name, so it syncs to the phone like any other contact edit.

### Refetching Expired Media

```js
const refreshed = await sock.updateMediaMessage(msg)
```

WhatsApp's media URLs expire. When a download fails on an old message, this asks the sender's device for a fresh `directPath` and returns the message with it filled in — then download again.

### Group Member Labels

```js
await sock.updateMemberLabel(groupJid, memberLabel)
```

Sends a `GROUP_MEMBER_LABEL_CHANGE` protocol message, which is how the per-group label beside a participant's name is set.

---

## 📞 Calls

```js
import { CALL_AUDIO_PREFIX, CALL_VIDEO_PREFIX } from '@rexxhayanasi/elaina-baileys'

const token = await sock.createCallLink('video')
console.log(CALL_VIDEO_PREFIX + token)

const scheduled = await sock.createCallLink('audio', { startTime: Math.floor(Date.now() / 1000) + 3600 })
console.log(CALL_AUDIO_PREFIX + scheduled)

await sock.rejectCall(callId, callFrom)
```

`createCallLink` takes `audio` or `video` and returns just the token. The two prefixes are exported because they do not match the media name — video links live under `/video/` but audio links under `/voice/`. Pass an `event` with a `startTime` in unix seconds to schedule the call instead of opening it now.

### Placing a Voice Call

The VoIP stack runs the WhatsApp Web calling engine in-process and rides **the socket you are already logged in with**. There is no second pairing and no second QR: pair once, and the same session places calls.

```js
import { makeVoipClient } from '@rexxhayanasi/elaina-baileys'

sock.ev.on('connection.update', async ({ connection }) => {
    if (connection !== 'open') {
        return
    }

    const voip = await makeVoipClient(sock)
    const call = await voip.call('628123456789', {
        durationMs: 60000,
        audioSource: './halo.mp3'
    })

    call.on('ringing', () => console.log('ringing'))
    call.on('connected', () => console.log('answered'))
    call.on('ended', reason => console.log('ended:', reason))

    await call.waitForEnd()
})
```

`audioSource` is anything ffmpeg can read — a file, a URL, or `lavfi:sine=frequency=440` for a tone. Leave it out and the call carries silence. `durationMs` hangs up on its own; pass `0` to stay on until someone ends it. `call.mute(true)` and `call.end()` do what they say, and `call.on('audio', pcm)` hands you the far end as 16 kHz mono `Float32Array` frames.

Audio is Opus at 16 kHz wideband. 48 kHz needs native audio device hooks the JS-only WASM build does not have.

When the socket reconnects, hand the new one over instead of building a second client:

```js
const voip = await makeVoipClient(sock)

sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
        await voip.attach(sock)
    }
})
```

### Playing a Queue

Every call takes a playlist, and the queue drives the call rather than the other way round: play a song, hang up when it ends; or play, wait while the next track is being found, play that one, then hang up.

```js
const call = await voip.call('628123456789', {
    playlist: ['satu.mp3'],
    durationMs: 0
})
```

One track, then the call ends by itself — `endWhenQueueEmpty` is on by default and `durationMs: 0` takes the hard timeout out of the way.

For a queue where the next track has to be looked up, give the gap a grace window and fill it while the call stays up:

```js
const call = await voip.call('628123456789', {
    playlist: [await findTrack('lagu pertama')],
    idleGraceMs: 30000,
    durationMs: 0
})

call.on('track', track => console.log('playing', track))
call.on('trackend', track => console.log('finished', track))

call.on('idle', async () => {
    const next = await findTrack(queue.shift())
    if (next) {
        call.enqueue(next)
    }
})

await call.waitForEnd()
```

`idle` fires the moment the queue empties. Anything enqueued before the grace window closes cancels the hang up and plays straight away; if nothing arrives, the call ends. Set `endWhenQueueEmpty: false` to stay on the call indefinitely and hang up yourself.

`enqueue` also takes an array, `skip()` drops the current track, `play()` replaces the queue with one track now, and `queued()` and `nowPlaying()` report what is left and what is running. Audio buffered from a finished track is played out before the next one starts, so a song is never cut off mid-tail by the queue advancing.

### Video Calls

Both one to one and group calls take video. The frames come from ffmpeg the same way the audio does, so a video source is a file, a URL, a still image, or an `lavfi:` generator.

```js
const call = await voip.call('628123456789', {
    video: true,
    videoPlaylist: ['klip.mp4'],
    playlist: ['lagu.mp3'],
    durationMs: 0
})

call.on('videotrack', track => console.log('now showing', track))
```

```js
const call = await voip.callGroup('12345-67890@g.us', {
    video: true,
    videoPlaylist: ['klip.mp4']
})
```

Video has its own queue, separate from the audio one: `playVideo`, `enqueueVideo`, `skipVideo`, `queuedVideo` and `nowPlayingVideo`, with `videotrack` and `videotrackend` events. The hang-up rules stay tied to the audio queue, so a call ends when the audio runs out rather than when the picture does.

A still image is looped rather than shown for a single frame, which is the easy way to send a fixed card:

```js
await voip.call('628123456789', { video: true, videoSource: './poster.jpg', playlist: ['lagu.mp3'] })
```

The engine picks the resolution and frame rate when the call connects and the feeder scales to fit, padding to keep the aspect ratio. Frames go out as I420 straight into the WASM encoder — there is no WebCodecs in Node, so the browser encode path is not used. When the queue runs dry the last frame is held rather than cutting to black, so a stall reads as a freeze instead of a flash.

Audio and video are two ffmpeg processes with two clocks. Playing the same file through both will drift; if you need them locked together, pass the same file only to `playlist` and leave the picture on a still image.

### Screen Share

The same video, sent as a screen share instead of a camera. It is a separate wasm entry point, so the recipient sees it labelled as a shared screen rather than as the bot turning its camera on.

```js
const call = await voip.call('628123456789', {
    screenShare: true,
    videoPlaylist: ['slide.png'],
    playlist: ['narasi.mp3']
})
```

`screenShare: true` implies `video: true`. Turn it on and off mid-call with `call.startScreenShare()` and `call.stopScreenShare()`; `call.isScreenShare()` reports which one is live.

Which to prefer depends on what you are sending, and it is worth testing both on a real call:

- **Screen share** suits still content — slides, lyrics, a card. The encoder favours sharpness over motion, and a 16:9 source is not padded into a portrait camera frame.
- **The camera path** suits moving pictures, and reaches everyone. Screen share is gated by `calling_screen_share_milestone_version`: a recipient on an older WhatsApp gets a "please update" dialog instead of your content. In a group there is also a participant cap for sharing, and typically only one participant may share at a time.

### Group Calls

```js
const call = await voip.callGroup('12345-67890@g.us', {
    playlist: ['satu.mp3', 'dua.mp3'],
    idleGraceMs: 30000,
    durationMs: 0
})
```

`callGroup` reads the participant list from the group metadata, resolves each member's LID and devices, and rings them all. Pass `participants` to ring only some of them, or `metadata` if you already have it and want to skip the fetch.

To join a call someone else started, hand `joinGroupCall` what the incoming offer told you:

```js
const call = await voip.joinGroupCall({
    callId,
    callCreatorJid,
    groupJid,
    playlist: ['satu.mp3']
})
```

The queue behaves the same on a group call as on a one-to-one call.

The stack ships `whatsapp.wasm`, `loader.js` and `worker-modules.js` under `lib/assets/wasm/`, so it works out of the box; `wasmPath`, `resourcesPath` and `wasmBinary` are there for when you want to point it at a fresher build, and `storageDir` moves the engine's scratch directory off the default under the system temp dir. It needs `ffmpeg` for the outgoing media; set `ffmpegPath` on the client or `FFMPEG_PATH` in the environment when the binary is not on `PATH`.

Those three files are WhatsApp Web's own, vendored byte for byte. A supply-chain scanner will call them obfuscated code and a large binary, so `lib/assets/wasm/README.md` records their checksums, what they can and cannot reach, and why they are not reformatted; `npm run verify:assets` re-checks all of it in one command.

Nothing is written to stdout unless you ask: pass `debug: true` for the built-in tracing, or `logger: (...args) => …` to route it into your own logger.

### Logging Out

```js
await sock.logout()
```

This unlinks the device on WhatsApp's side, so the stored credentials become useless. To stop the socket without unlinking, use `sock.end()`.

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
  useSingleFileAuthState,
  useSqliteAuthState,
  usePostgresAuthState,
  useMySQLAuthState,
  useMongoAuthState,
  useRedisAuthState,
  useNekoDBAuth,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
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
| `npm run verify:assets` | checksum and scan the vendored VoIP resources |
| `npm run fetch:bundle -- <dir>` | download the raw bundle |
| `npm run update:version` | bump the pinned revision without any of the checks |
| `npm run audit:apk -- <dir>` | diff `WAProto` against an extracted Android APK |
| `npm run sync:proto -- --gaps <file>` | patch `WAProto` from an audit's `--json` output |

**Auditing against Android.** Everything above reads the WhatsApp **Web** bundle, so a field the Android client knows and Web does not never reaches `WAProto` at all. `audit:apk` closes that blind spot: point it at a directory of extracted `classes*.dex` and it parses the protobuf model classes straight out of the dex — reading each `*_FIELD_NUMBER` constant and its value — then reports which fields and which whole types are missing, with their field numbers.

```
npm run audit:apk -- /path/to/extracted-apk
```

Add `--json <file>` and it writes the gaps in the shape `sync:proto` consumes, so the same code generator that patches from the Web bundle can patch from the APK:

```
npm run audit:apk -- /path/to/extracted-apk /dev/null --json gaps.json
npm run sync:proto -- --gaps gaps.json
npm run verify:proto
```

Nothing is written by hand, so `npm run proto:update` will not undo it — `sync:proto` is additive and reads the existing `WAProto` as its baseline.

**Android is not the client this library presents as.** Baileys links as a WhatsApp Web device, so a field the Web bundle does not declare is one the real Web client never sends — decoding it costs nothing, sending it makes this client look like neither Web nor Android. The auditor cross-checks every candidate against the Web bundle and marks the difference:

```
KHUSUS ANDROID Message.AlbumMessage.caption — aman didekode, kirim hanya kalau memang disengaja
```

Treat that mark as a reason to keep the field readable but off by default. All four fields patched in so far carry it.

**Two more guards matter, because a name can match while the numbering does not.** The auditor keeps only the single APK class that overlaps a type best — several classes carry similar field names and the loser is a false positive — and it refuses any field whose number is already taken in that type. Without the second guard, `CtwaContextData.canonicalUrl=3` would have been written straight over `sourceUrl`, silently corrupting the wire format. libsignal's own records are skipped outright.

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

## ⏰ Scheduled Messages

WhatsApp schedules a message by sending it **immediately, encrypted**, and letting the server hand out the key at the chosen time. The envelope is `conditionalRevealMessage`; the key travels in a `<meta type="scheduled_message">` node beside the message.

The pieces are exposed as building blocks, reconstructed from the WhatsApp Web client:

```js
import {
  encodeScheduledMessage,
  decodeScheduledMessage,
  buildScheduledMsgMetaNode,
  buildUnscheduleProtocolMessage,
  isScheduledTimeValid,
  SCHEDULED_MSG_WINDOW
} from '@rexxhayanasi/elaina-baileys'

const at = Math.floor(Date.now() / 1000) + 3600
if (!isScheduledTimeValid(at)) throw new Error('outside the allowed window')

const scheduled = encodeScheduledMessage({ conversation: 'sent later' })
// { revealKey, revealKeyId, encIv, encPayload, message: { conditionalRevealMessage } }

const meta = buildScheduledMsgMetaNode({
  scheduledTimestampS: at,
  revealKeyId: scheduled.revealKeyId,
  revealKey: scheduled.revealKey
})
// <meta type="scheduled_message" st="…"><key rkid="…">{32 bytes}</key></meta>

await sock.relayMessage(jid, scheduled.message, {
  messageId: sock.generateMessageTag(),
  additionalNodes: [meta]
})
```

Reading one back, once you hold the reveal key:

```js
const message = decodeScheduledMessage(msg.message, revealKey)
```

Cancelling a scheduled message is a protocol message:

```js
await sock.relayMessage(jid, buildUnscheduleProtocolMessage(scheduledKey), { messageId })
```

Limits taken from the client, not guessed:

| | Chat | Channel |
|---|---|---|
| Earliest | 10 minutes ahead | 10 minutes ahead |
| Latest | 14 days | 30 days |
| Per chat | 30 scheduled messages | 30 |
| Media per schedule | 1 | 1 |

The reveal key is AES-256-GCM, 32 bytes, with a 12-byte IV and the tag appended to `encPayload`. The server keeps reveal keys for 30 days, and answers `419` when a chat is over its limit.

> [!WARNING]
> Every gate for this feature is off by default in the client WhatsApp ships (`scheduled_messages_sender_enabled`, `scheduled_messages_receiver_enabled`, `channels_scheduling_updates_enabled`). These builders match the wire format the client uses, but until WhatsApp enables the feature for an account the server may reject or ignore the request. Treat it as experimental.

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

## 🛡️ Account Health Signals

WhatsApp tracks how an account reaches out to people it has not spoken to before, and it tells the client where it stands. Reading those two signals is far more reliable than guessing at a safe delay.

### New-Chat Message Quota

```js
const cap = await sock.fetchNewChatMessageCap()
// {
//   status: 'NONE' | 'FIRST_WARNING' | 'SECOND_WARNING' | 'CAPPED',
//   capped: false, warned: false,
//   totalQuota: 200, usedQuota: 41, remaining: 159,
//   cycleStart, cycleEnd, serverTime, oteStatus, mvStatus, subscriptionStatus
// }
```

`status` is WhatsApp's own escalation ladder for messaging **new** chats: `NONE` → `FIRST_WARNING` → `SECOND_WARNING` → `CAPPED`. `remaining` is what is left in the current cycle, and `cycleEnd` is when it resets.

Only first contact with a new chat consumes quota. Replying inside a conversation the other person started does not.

### Reachout Timelock

```js
const lock = await sock.fetchAccountReachoutTimelock()
// { isActive: true, timeEnforcementEnds: Date, enforcementType: 'BIZ_QUALITY' }
```

`isActive` means the account is already restricted from reaching out, and `timeEnforcementEnds` is when that lifts. `enforcementType` says why — `BIZ_QUALITY` is the quality-based one, the `BIZ_COMMERCE_VIOLATION_*` values are policy categories.

Both signals also arrive unprompted:

```js
sock.ev.on('connection.update', ({ reachoutTimeLock }) => {
  if (reachoutTimeLock?.isActive) stopSending()
})
```

### Using Them as a Guard

```js
const guard = async () => {
  const lock = await sock.fetchAccountReachoutTimelock()
  if (lock.isActive) return { send: false, reason: 'reachout timelock until ' + lock.timeEnforcementEnds }

  const cap = await sock.fetchNewChatMessageCap()
  if (cap.capped) return { send: false, reason: 'new-chat quota exhausted until ' + new Date(cap.cycleEnd * 1000) }
  if (cap.warned) return { send: false, reason: 'WhatsApp already warned this account: ' + cap.status }
  if (cap.remaining !== undefined && cap.remaining < 10) return { send: false, reason: 'only ' + cap.remaining + ' left this cycle' }

  return { send: true, remaining: cap.remaining }
}
```

Check it before a run and again every batch — `SECOND_WARNING` is the last state before the cap lands, so stopping there is the difference between a pause and a block.

> [!NOTE]
> Sending in bulk through an unofficial client is outside WhatsApp's Terms of Service whatever the recipients agreed to. The sanctioned route for opt-in bulk messaging is the WhatsApp Business Platform. These signals reduce the odds of tripping automated limits; they do not make an account safe.

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
