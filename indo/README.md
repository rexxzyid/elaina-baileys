# POC: Baileys dalam InDo (b-indo)

Percobaan mem-port sebagian logika Elaina Baileys ke bahasa
[`@rexxhayanasi/b-indo`](https://github.com/rexxzyid/InDo) (berkas `.wni`, kata
kunci berbahasa Indonesia).

## Status: proof-of-concept logika murni

Yang di-port di sini **logika murni** yang tidak butuh jaringan atau kripto,
dan hasilnya dibuktikan **identik** dengan implementasi JavaScript-nya:

- **JID** (`jid.wni`) — `jidEncode`, `jidDecode`, dan pengecekan jenis JID,
  identik dengan `src/WABinary/jid-utils.js`.
- **Tipe pesan** (`pesan.wni`) — `tipeKonten` (getContentType), daftar dan
  pengecekan kunci future-proof, serta `bukaFutureProof` (membuka bungkus
  `ephemeralMessage`/`viewOnce` dst), identik dengan `getContentType` +
  `normalizeMessageContent` di `src/Utils`.
- **Kunci media** (`media.wni`) — `kunciMedia` (getMediaKeys) + `infoHkdf`,
  derivasi iv/cipherKey/macKey dari mediaKey lewat HKDF-SHA256 (salt 32 nol,
  info `WhatsApp <Tipe> Keys`). Hasilnya **byte-per-byte identik** dengan
  `getMediaKeys` di `src/Utils/messages-media.js`. Ini memakai primitif kripto
  baru di `indo-langvm` (`Kripto.hkdf`, `Bita`).
- **Generik** (`generik.wni`) — pembantu murni dari `src/Utils/generics.js`:
  `encodeBigEndian`, `unpadRandomMax16`, `generateParticipantHashV2`
  (SHA256+base64), `bytesToCrockford`, `isStringNullOrEmpty`,
  `isWABusinessPlatform`, dan `trimUndefined`. Nilai keluaran dicocokkan persis
  dengan versi JS (hash `2:GpK7wo`, crockford `14ZJ1931S14H`, dst).
- **Sandi media** (`sandimedia.wni`) — `enkripsiMedia`/`dekripsiMedia`, alur
  enkripsi media WhatsApp utuh: AES-256-CBC dengan `cipherKey`/`iv` dari
  `kunciMedia`, MAC = 10 byte pertama HMAC-SHA256(`macKey`, `iv || enc`),
  `fileEnc = enc || mac`, plus `fileSha256` dan `fileEncSha256`. `dekripsiMedia`
  memverifikasi MAC sebelum dekripsi. Nilai `enc`, `mac`, dan kedua sha256
  dicocokkan persis dengan `encryptedStream` di `src/Utils/messages-media.js`.
- **Retry media** (`retrymedia.wni`) — `getMediaRetryKey`
  (HKDF-SHA256, info `WhatsApp Media Retry Notification`),
  `enkripsiRetryMedia`/`dekripsiRetryMedia` (AES-256-GCM dengan AAD = id pesan).
  Bagian kripto dari alur media-retry di `src/Utils/messages-media.js`
  (encode/decode protobuf ditinggal ke pemanggil). retryKey dan ciphertext
  dicocokkan persis dengan versi JS.
- **Kripto** (`kripto.wni`) — `aesEncryptGCM`/`aesDecryptGCM`,
  `aesEncrypt`/`aesDecrypt` (CBC dengan iv 16 byte di depan), `hmacSign`
  (HMAC-SHA256), `sha256`, `generateSignalPubKey` (prefix `05` bila kunci 32
  byte), dan `Curve` (`buatKunci` x25519, `kunciBersama` ECDH x25519). Padanan
  `src/Utils/crypto.js`. `hmacSign` dan `sha256` dicocokkan persis dengan
  keluaran JS, dan `Curve.kunciBersama` menghasilkan rahasia yang identik dari
  kedua sisi. Ini memakai primitif kripto `indo-langvm` (`Kripto.aesGcm*`,
  `Kripto.aesCbc*`, `Kripto.x25519*`, `Kripto.hmacSha256`, `Kripto.sha256`).

## Kenapa belum bisa full port

Port yang benar-benar bisa konek WhatsApp masih terhalang. Runtime b-indo
(cabang utama repo InDo) kini sudah punya **WebSocket** dan **primitif kripto**
(x25519, ed25519, aes-gcm/cbc, hmac, hkdf, sha256, base64/hex, zlib), tetapi:

- Runtime itu dipublikasikan ke npm sebagai `indo-langvm` (sudah memuat
  WebSocket + primitif kripto), tetapi ia tetap VM sendiri, bukan transpiler JS.
- Untuk memakai **baileys apa adanya** butuh interop npm — b-indo berjalan di
  VM sendiri, tidak bisa `impor` modul JavaScript (`ws`, `libsignal`,
  `protobufjs`). Full port berarti menulis ulang Noise + Signal + protobuf +
  seluruh baileys dalam `.wni`, atau menambahkan backend **transpile-ke-JS**
  ke InDo (model TypeScript) supaya `.wni` bisa langsung `impor` npm.

POC ini fokus ke logika murni sebagai fondasi.

## Menjalankan

```bash
npm install -g indo-langvm
indo jalankan indo/jid.tes.wni
indo jalankan indo/pesan.tes.wni
indo jalankan indo/media.tes.wni
indo jalankan indo/kripto.tes.wni
indo jalankan indo/generik.tes.wni
indo jalankan indo/sandimedia.tes.wni
indo jalankan indo/retrymedia.tes.wni
```

## Berkas

| Berkas | Isi |
| --- | --- |
| `jid.wni` | Port utilitas JID (encode, decode, pengecekan jenis) |
| `jid.tes.wni` | Uji JID vs versi JS |
| `pesan.wni` | Port `getContentType`, kunci future-proof, `bukaFutureProof` |
| `pesan.tes.wni` | Uji tipe pesan vs versi JS |
| `media.wni` | Port `getMediaKeys` (derivasi kunci media via HKDF) |
| `media.tes.wni` | Uji kunci media vs versi JS |
| `kripto.wni` | Port `src/Utils/crypto.js` (AES-GCM/CBC, HMAC, SHA256, x25519 Curve) |
| `kripto.tes.wni` | Uji round-trip AES, HMAC/SHA256, dan kesepakatan x25519 |
| `generik.wni` | Port pembantu murni `src/Utils/generics.js` |
| `generik.tes.wni` | Uji nilai pembantu generik vs versi JS |
| `sandimedia.wni` | Alur enkripsi/dekripsi media (AES-CBC + HMAC MAC) |
| `sandimedia.tes.wni` | Uji enc/mac/sha256 dan round-trip vs versi JS |
| `retrymedia.wni` | Kripto media-retry (HKDF + AES-GCM) |
| `retrymedia.tes.wni` | Uji retryKey dan ciphertext vs versi JS |

## Catatan porting

`typeof` di b-indo mengembalikan nama Indonesia (`"teks"` untuk string),
`Object.keys` → `Objek.kunci`, `Array.find` → `.cari`, `String.includes` →
`.berisi`. `device` pada `jidDecode` tetap berupa teks; selebihnya field cocok.

Operator `hapus` (delete) belum didukung tahap bytecode di runtime ini, jadi
`trimUndefined` di sini membangun objek baru tanpa kunci `taktentu` (bukan
mengubah objek asal di tempat seperti versi JS); hasil untuk konsumen sama.
