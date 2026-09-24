# Session storage

Auth state holds your credentials and Signal keys. Lose it and you pair again; leak it and someone else can use your account. The package ships several backends, and every one returns the same `{ state, saveCreds }` shape.

Whichever you pick, wire `saveCreds` to the `creds.update` event. Without it, nothing is persisted:

```js
sock.ev.on('creds.update', saveCreds)
```

## Multi-file (default)

One folder, one file per key. Simple, dependency-free, and the right call for a single bot on a single machine.

```js
import { useMultiFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./session')
```

It writes many small files — a busy account produces thousands of pre-key files. That is normal; deleting them mid-session breaks the session.

## Single file

Everything in one JSON file. Easier to back up or move between hosts, but it slows down as the key set grows because the whole file is rewritten on every change.

```js
import { useSingleFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useSingleFileAuthState('./session.json')
```

## SQLite

Keys live in a real database, so concurrent reads and large key sets stay fast. Needs `better-sqlite3` v11, v12, or v13.

```bash
npm i better-sqlite3
```

```js
import { useSqliteAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useSqliteAuthState({ dbPath: './session.db' })
```

If the rest of your bot already has a connection, hand that connection over:

```js
import Database from 'better-sqlite3'

const database = new Database('./bot.db')
const { state, saveCreds } = await useSqliteAuthState({ database })
```

Two tables are created on first use: `creds` and `signal_keys`.

## PostgreSQL, MySQL, MongoDB, Redis

For bots already running a database, or several bots sharing one. Each takes a connection you already have or the details to open its own, and each stores its rows under a `session` name, so one database can hold many accounts.

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

const pg = await usePostgresAuthState({
  connectionString: 'postgres://user:pass@localhost:5432/bot'
})

const mysql = await useMySQLAuthState({
  uri: 'mysql://user:pass@localhost:3306/bot'
})

const mongo = await useMongoAuthState({
  uri: 'mongodb://localhost:27017',
  dbName: 'bot'
})

const redis = await useRedisAuthState({
  uri: 'redis://localhost:6379'
})
```

Hand over your own connection when the rest of the bot already has one, and name the session when several accounts share the same database:

```js
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const { state, saveCreds } = await usePostgresAuthState({ pool, session: 'sales-bot' })
```

`useMySQLAuthState` takes `pool`, `useMongoAuthState` takes `db` or `collection`, and `useRedisAuthState` takes `client` — both node-redis and ioredis are accepted, the command names are detected at start.

All four return `clearAuth()` to wipe the session and `close()` to release connections they opened themselves; a connection you handed over is left alone. `useSqliteAuthState` returns both too.

| Backend | Where keys live | Table or key |
|---|---|---|
| PostgreSQL | one table | `baileys_auth (session, type, id, value)` |
| MySQL | one table | `baileys_auth (session, type, id, value)` |
| MongoDB | one collection | `baileys_auth`, indexed on session + type + id |
| Redis | one hash per key type | `baileys_auth:<session>:<type>` |

Rename them with `table`, `collectionName`, or `prefix`. The SQL backends write a batch of keys inside one transaction, MongoDB uses a single `bulkWrite`, and Redis pipes them through `MULTI`, so one decryption that stores thirty pre-keys costs one round trip, not thirty.

## NekoDB

For bots whose state already lives in NekoDB, so the session rides along with the rest of the data.

```js
import { useNekoDBAuth } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useNekoDBAuth(db)
```

The first argument must be a connected NekoDB instance; the collection defaults to `baileys_elaina_auth`. Pass a second argument to keep several sessions in one database:

```js
const { state, saveCreds } = await useNekoDBAuth(db, 'my_sessions')
```

## Caching Signal keys

Every backend reads keys from disk or the database on each decryption. Wrapping the key store in a cache removes that trip:

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

Worth it on any backend, and all but required on the file-based ones for a busy group bot.

## Storing chats and messages

Auth state holds keys, not conversations. For chats, contacts, and message history, attach an in-memory store:

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

From there `store.chats`, `store.contacts`, `store.messages`, and `store.groupMetadata` stay in sync, and `loadMessage` is exactly what `getMessage` needs. It lives in memory, so size it against your traffic — a bot in large groups will keep inflating it.

## Next

With the session safe, move on to [Pairing code](./pairing.html) to link a device, or [Messages](./messages.html) to start receiving and replying.
