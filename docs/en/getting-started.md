# Getting started

## Requirements

- Node.js **22 or newer** (24 recommended)
- npm
- A WhatsApp account to pair with

```bash
node -v
```

## Install

```bash
npm install @rexxhayanasi/elaina-baileys
```

The package is ESM-first, so your `package.json` needs `"type": "module"`:

```json
{
  "type": "module",
  "dependencies": {
    "@rexxhayanasi/elaina-baileys": "latest"
  }
}
```

## Import

```js
import makeWASocket from '@rexxhayanasi/elaina-baileys'
```

Everything else comes from the same entry point:

```js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  MessageBuilder,
  MB
} from '@rexxhayanasi/elaina-baileys'
```

> [!NOTE]
> MessageBuilder is already integrated. You do not need to install `baileys-mbuilder` separately.

## A connection that survives restarts

The important part is not the socket — it is reconnecting when WhatsApp drops you, and knowing when *not* to reconnect.

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

Two things earn their place here:

**`saveCreds` on `creds.update`.** Without it the session is not persisted and you re-pair on every restart.

**The `loggedOut` check.** Every other disconnect reason is worth retrying. `loggedOut` is not — the session is gone, and reconnecting in a loop just burns through requests. Delete `./session` and pair again.

## Pairing with a code

Pairing by code avoids scanning a QR. Request it after the socket exists, and only when the account is not registered yet.

```js
const phoneNumber = '6281234567890'

if (!state.creds.registered) {
  const code = await sock.requestPairingCode(phoneNumber)
  console.log('Pairing code:', code)
}
```

Use the international format without `+`, spaces, or symbols.

### A custom code

```js
const code = await sock.requestPairingCode(
  '6281234567890',
  'ELAINA01'
)

console.log(code)
```

> [!IMPORTANT]
> A custom pairing code must be exactly 8 characters. Anything shorter or longer is rejected.

## Where the session lives

`useMultiFileAuthState('./session')` writes credentials and signal keys as JSON files in that folder. Treat it like a password:

- Do not commit it. Add `session/` to `.gitignore`.
- Copying it to another machine logs that machine in as you.
- Deleting it logs you out and forces a fresh pairing.

Other backends ship with the library and all return the same `{ state, saveCreds }` shape:

| Function | Takes |
|---|---|
| `useMultiFileAuthState(folder)` | a directory path |
| `useSingleFileAuthState(fileName)` | one JSON file |
| `useSqliteAuthState(opts)` | an options object |
| `useNekoDBAuth(db, collectionName?)` | a database handle; also returns `clearAuth()` |

## Next

Once the connection stays open, go to [Messages](./messages.html) to read what arrives and reply to it.
