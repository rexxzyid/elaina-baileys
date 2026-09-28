# POC: Baileys dalam InDo (b-indo)

Percobaan mem-port sebagian logika Elaina Baileys ke bahasa
[`@rexxhayanasi/b-indo`](https://github.com/rexxzyid/InDo) (berkas `.wni`, kata
kunci berbahasa Indonesia).

## Status: proof-of-concept logika murni

Yang di-port di sini **hanya logika murni** yang tidak butuh jaringan atau
kripto: utilitas JID (`jidEncode`, `jidDecode`, dan pengecekan jenis JID).
Hasilnya sudah dibuktikan **identik** dengan implementasi JavaScript di
`src/WABinary/jid-utils.js`.

## Kenapa belum bisa full port

Baileys butuh tiga hal inti untuk terhubung ke WhatsApp yang **belum ada** di
b-indo saat ini:

- **WebSocket (WSS)** — b-indo `Jaringan` baru mendukung HTTP dan server dasar.
- **Kripto Signal** — b-indo `Kripto` baru `acakUUID`, `hash`, `byteAcak`;
  belum ada Curve25519, HKDF, AES-GCM, HMAC-SHA256 untuk handshake Noise.
- **Interop npm** — b-indo berjalan di VM sendiri, tidak bisa memuat dependency
  JavaScript baileys (`ws`, `libsignal`, `protobufjs`).

Selama tiga hal itu belum ada di bahasanya, port yang benar-benar bisa konek WA
tidak mungkin. POC ini fokus ke bagian yang murni logika, sebagai fondasi.

## Menjalankan

```bash
npm install -g @rexxhayanasi/b-indo
indo jalankan indo/jid.tes.wni
```

## Berkas

| Berkas | Isi |
| --- | --- |
| `jid.wni` | Port utilitas JID (encode, decode, pengecekan jenis) |
| `jid.tes.wni` | Uji yang mencetak hasil untuk dibandingkan dengan versi JS |

## Catatan

`typeof` di b-indo mengembalikan nama Indonesia (`"teks"` untuk string, bukan
`"string"`) — penting saat mem-port penjaga tipe. `device` di sini tetap berupa
teks, sedangkan versi JS mengubahnya ke angka; selebihnya field cocok.
