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

## Kenapa belum bisa full port

Port yang benar-benar bisa konek WhatsApp masih terhalang. Runtime b-indo
(cabang utama repo InDo) kini sudah punya **WebSocket** dan **primitif kripto**
(x25519, ed25519, aes-gcm/cbc, hmac, hkdf, sha256, base64/hex, zlib), tetapi:

- Versi npm `@rexxhayanasi/b-indo` masih 1.0.0 (belum memuat primitif itu).
- Untuk memakai **baileys apa adanya** butuh interop npm — b-indo berjalan di
  VM sendiri, tidak bisa `impor` modul JavaScript (`ws`, `libsignal`,
  `protobufjs`). Full port berarti menulis ulang Noise + Signal + protobuf +
  seluruh baileys dalam `.wni`, atau menambahkan backend **transpile-ke-JS**
  ke InDo (model TypeScript) supaya `.wni` bisa langsung `impor` npm.

POC ini fokus ke logika murni sebagai fondasi.

## Menjalankan

```bash
npm install -g @rexxhayanasi/b-indo
indo jalankan indo/jid.tes.wni
indo jalankan indo/pesan.tes.wni
```

## Berkas

| Berkas | Isi |
| --- | --- |
| `jid.wni` | Port utilitas JID (encode, decode, pengecekan jenis) |
| `jid.tes.wni` | Uji JID vs versi JS |
| `pesan.wni` | Port `getContentType`, kunci future-proof, `bukaFutureProof` |
| `pesan.tes.wni` | Uji tipe pesan vs versi JS |

## Catatan porting

`typeof` di b-indo mengembalikan nama Indonesia (`"teks"` untuk string),
`Object.keys` → `Objek.kunci`, `Array.find` → `.cari`, `String.includes` →
`.berisi`. `device` pada `jidDecode` tetap berupa teks; selebihnya field cocok.
