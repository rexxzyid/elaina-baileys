# Elaina Baileys

A WhatsApp Multi-Device library for Node.js. It speaks the WhatsApp Web protocol directly over a WebSocket — no browser, no Selenium, no headless Chrome.

This fork tracks the WhatsApp Web bundle closely: the protobuf schema, the client revision, and the newer message types are kept in step with what the official client actually sends.

## What comes with it

- **MessageBuilder built in.** Buttons, lists, carousels and AIRich responses without installing a second package.
- **Channel support.** Create and run newsletters, including polls, questions, insights and admin invites.
- **A protobuf schema that stays current.** A daily workflow compares `WAProto` against the live bundle and applies what is missing.
- **LID-aware addressing.** Handles the newer `@lid` identifiers alongside phone-number JIDs.

## Where to start

- [Getting started](./getting-started.html) — install, connect, pair a device
- [Messages](./messages.html) — receive, read and send
- [MessageBuilder](./builder.html) — interactive messages
- [Newsletter](./newsletter.html) — channels
- [Groups](./groups.html) — groups and communities
- [Examples](./examples.html) — complete bots
- [API reference](./api.html) — every method, generated from the code

## Install

```bash
npm install @rexxhayanasi/elaina-baileys
```

Needs Node.js 22 or newer. The package is ESM-first, so use `import` rather than `require()`.

## The shortest thing that works

```js
import makeWASocket, { useMultiFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./session')
const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)

sock.ev.on('messages.upsert', async ({ messages }) => {
  const message = messages[0]
  if (!message?.message) return
  await sock.sendMessage(message.key.remoteJid, { text: 'Hello 💜' })
})
```

That connects, prints a QR code in the terminal, and replies to everything. [Getting started](./getting-started.html) turns it into something you would actually run.

## A note on what is verified

Parts of this library were reconstructed by reading the WhatsApp Web bundle rather than from an existing implementation. Those parts are documented honestly in [EXPERIMENTAL.md](https://github.com/rexxzyid/elaina-baileys/blob/main/EXPERIMENTAL.md), which labels each feature as **Live** (executed against WhatsApp's servers), **Offline** (verified locally, never sent), or **Derived** (shape taken from the bundle, never run).

Read that file before shipping anything that depends on the newer channel APIs.

## Licence and credit

This is a maintained fork. Upstream notices are preserved in `LICENSE` and `NOTICE.md`, and the credits are listed in the repository README.
