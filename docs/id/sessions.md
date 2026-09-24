# Penyimpanan Sesi

Auth state menyimpan kredensial dan kunci Signal kamu. Kehilangannya berarti pairing ulang; membocorkannya berarti orang lain bisa memakai akunmu. Paket ini membawa beberapa backend sekaligus, dan semuanya mengembalikan bentuk `{ state, saveCreds }` yang sama.

Mana pun yang kamu pilih, sambungkan `saveCreds` ke event `creds.update`. Kalau tidak, tidak ada yang tersimpan:

```js
sock.ev.on('creds.update', saveCreds)
```

## Multi-berkas (bawaan)

Satu folder, satu berkas per kunci. Sederhana, tanpa dependensi, dan pilihan yang tepat untuk satu bot di satu mesin.

```js
import { useMultiFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./session')
```

Ia menulis banyak berkas kecil — akun yang sibuk menghasilkan ribuan berkas pre-key. Itu normal; menghapusnya di tengah sesi merusak sesinya.

## Satu berkas

Semuanya dalam satu berkas JSON. Lebih mudah dibackup atau dipindah antar host, tapi melambat begitu kumpulan kuncinya membesar karena seluruh berkas ditulis ulang setiap ada perubahan.

```js
import { useSingleFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useSingleFileAuthState('./session.json')
```

## SQLite

Kunci disimpan di database sungguhan, jadi pembacaan bersamaan dan kumpulan kunci besar tetap cepat. Butuh `better-sqlite3` v11, v12, atau v13.

```bash
npm i better-sqlite3
```

```js
import { useSqliteAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useSqliteAuthState({ dbPath: './session.db' })
```

Kalau bagian lain botmu sudah punya koneksi, serahkan koneksi itu saja:

```js
import Database from 'better-sqlite3'

const database = new Database('./bot.db')
const { state, saveCreds } = await useSqliteAuthState({ database })
```

Dua tabel dibuat saat pertama dipakai: `creds` dan `signal_keys`.

## PostgreSQL, MySQL, MongoDB, Redis

Untuk bot yang sudah menjalankan database, atau beberapa bot yang berbagi satu database. Masing-masing menerima koneksi yang sudah kamu punya atau detail untuk membuka koneksinya sendiri, dan masing-masing menyimpan barisnya di bawah satu nama `session`, jadi satu database bisa memuat banyak akun.

```bash
npm i pg        # PostgreSQL
npm i mysql2    # MySQL atau MariaDB
npm i mongodb   # MongoDB
npm i ioredis   # Redis (node-redis juga bisa)
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

Serahkan koneksimu sendiri kalau bagian lain bot sudah punya, dan beri nama sesinya kalau beberapa akun berbagi database yang sama:

```js
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const { state, saveCreds } = await usePostgresAuthState({ pool, session: 'sales-bot' })
```

`useMySQLAuthState` menerima `pool`, `useMongoAuthState` menerima `db` atau `collection`, dan `useRedisAuthState` menerima `client` — node-redis maupun ioredis dua-duanya diterima, nama perintahnya dideteksi saat start.

Keempatnya mengembalikan `clearAuth()` untuk menghapus sesi dan `close()` untuk melepas koneksi yang mereka buka sendiri; koneksi yang kamu serahkan tidak disentuh. `useSqliteAuthState` juga mengembalikan keduanya.

| Backend | Tempat kuncinya | Tabel atau key |
|---|---|---|
| PostgreSQL | satu tabel | `baileys_auth (session, type, id, value)` |
| MySQL | satu tabel | `baileys_auth (session, type, id, value)` |
| MongoDB | satu koleksi | `baileys_auth`, terindeks pada session + type + id |
| Redis | satu hash per jenis kunci | `baileys_auth:<session>:<type>` |

Ganti namanya dengan `table`, `collectionName`, atau `prefix`. Backend SQL menulis sekumpulan kunci di dalam satu transaksi, MongoDB memakai satu `bulkWrite`, dan Redis menyalurkannya lewat `MULTI`, jadi satu dekripsi yang menyimpan tiga puluh pre-key memakan satu perjalanan, bukan tiga puluh.

## NekoDB

Untuk bot yang state-nya sudah ada di NekoDB, supaya sesinya ikut bersama data yang lain.

```js
import { useNekoDBAuth } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useNekoDBAuth(db)
```

Argumen pertama harus instance NekoDB yang sudah tersambung; koleksinya default ke `baileys_elaina_auth`. Beri argumen kedua untuk menyimpan beberapa sesi dalam satu database:

```js
const { state, saveCreds } = await useNekoDBAuth(db, 'my_sessions')
```

## Menyimpan kunci Signal di cache

Setiap backend membaca kunci dari disk atau database pada tiap dekripsi. Membungkus penyimpanan kunci dengan cache menghilangkan perjalanan itu:

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

Layak dipakai di backend apa pun, dan hampir wajib di yang berbasis berkas untuk bot grup yang sibuk.

## Menyimpan chat dan pesan

Auth state menyimpan kunci, bukan percakapan. Untuk chat, kontak, dan riwayat pesan, pasang penyimpanan in-memory:

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

Dari situ `store.chats`, `store.contacts`, `store.messages`, dan `store.groupMetadata` akan terus sinkron, dan `loadMessage` persis yang dibutuhkan `getMessage`. Ia hidup di memori, jadi ukur terhadap trafikmu — bot di grup besar akan terus menggembungkannya.

## Selanjutnya

Setelah sesi aman, lanjut ke [Kode pairing](./pairing.html) untuk memasangkan perangkat, atau [Pesan](./messages.html) untuk mulai menerima dan membalas.
