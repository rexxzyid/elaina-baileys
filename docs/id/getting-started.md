# Mulai cepat

## Kebutuhan

- Node.js **22 atau lebih baru** (disarankan 24)
- npm
- Akun WhatsApp untuk dipasangkan

```bash
node -v
```

## Pemasangan

```bash
npm install @rexxhayanasi/elaina-baileys
```

Paket ini ESM-first, jadi `package.json` kamu butuh `"type": "module"`:

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

Sisanya datang dari entry point yang sama:

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
> MessageBuilder sudah terintegrasi. Kamu tidak perlu memasang `baileys-mbuilder` terpisah.

## Koneksi yang tahan restart

Bagian pentingnya bukan socket-nya — tapi menyambung ulang saat WhatsApp memutus, dan tahu kapan *tidak* boleh menyambung ulang.

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
      console.log('WhatsApp tersambung')
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect) {
        startSock()
      } else {
        console.log('Sesi sudah logout')
      }
    }
  })

  return sock
}

startSock()
```

Dua hal di sini yang benar-benar penting:

**`saveCreds` pada `creds.update`.** Tanpa itu sesi tidak tersimpan dan kamu harus pairing ulang tiap kali restart.

**Pengecekan `loggedOut`.** Semua alasan diskoneksi lain layak dicoba ulang. `loggedOut` tidak — sesinya sudah hilang, dan menyambung ulang terus-menerus cuma menghabiskan request. Hapus `./session` lalu pairing lagi.

## Pairing dengan kode

Pairing lewat kode menghindari scan QR. Minta setelah socket dibuat, dan hanya kalau akun belum terdaftar.

```js
const phoneNumber = '6281234567890'

if (!state.creds.registered) {
  const code = await sock.requestPairingCode(phoneNumber)
  console.log('Pairing code:', code)
}
```

Pakai format internasional tanpa `+`, spasi, atau simbol.

### Kode kustom

```js
const code = await sock.requestPairingCode(
  '6281234567890',
  'ELAINA01'
)

console.log(code)
```

> [!IMPORTANT]
> Pairing code kustom harus tepat 8 karakter. Lebih pendek atau lebih panjang akan ditolak.

## Sesi disimpan di mana

`useMultiFileAuthState('./session')` menulis kredensial dan signal key sebagai file JSON di folder itu. Perlakukan seperti password:

- Jangan di-commit. Tambahkan `session/` ke `.gitignore`.
- Menyalinnya ke mesin lain berarti mesin itu login sebagai kamu.
- Menghapusnya berarti logout dan harus pairing dari awal.

Backend lain juga tersedia dan semuanya mengembalikan bentuk `{ state, saveCreds }` yang sama:

| Fungsi | Menerima |
|---|---|
| `useMultiFileAuthState(folder)` | path direktori |
| `useSingleFileAuthState(fileName)` | satu file JSON |
| `useSqliteAuthState(opts)` | objek opsi |
| `useNekoDBAuth(db, collectionName?)` | handle database; mengembalikan `clearAuth()` juga |

## Selanjutnya

Setelah koneksi stabil, lanjut ke [Pesan](./messages.html) untuk membaca yang masuk dan membalasnya.
