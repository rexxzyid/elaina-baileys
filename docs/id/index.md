# Elaina Baileys

Library WhatsApp Multi-Device untuk Node.js. Bicara langsung ke protokol WhatsApp Web lewat WebSocket — tanpa browser, tanpa Selenium, tanpa headless Chrome.

Fork ini mengikuti bundle WhatsApp Web dari dekat: skema protobuf, revisi klien, dan tipe pesan baru dijaga tetap sejalan dengan yang benar-benar dikirim klien resmi.

## Isinya apa saja

- **MessageBuilder sudah termasuk.** Tombol, list, carousel, dan respons AIRich tanpa memasang paket kedua.
- **Dukungan channel.** Buat dan kelola newsletter, termasuk polling, pertanyaan, insight, dan undangan admin.
- **Skema protobuf yang selalu terkini.** Workflow harian membandingkan `WAProto` dengan bundle live dan menerapkan yang kurang.
- **Sadar LID.** Menangani identitas `@lid` yang baru berdampingan dengan JID nomor telepon.

## Mulai dari mana

- [Mulai cepat](./getting-started.html) — pasang, sambungkan, pasangkan perangkat
- [Pesan](./messages.html) — terima, baca, dan kirim
- [MessageBuilder](./builder.html) — pesan interaktif
- [Newsletter](./newsletter.html) — channel
- [Grup](./groups.html) — grup dan komunitas
- [Contoh](./examples.html) — bot lengkap
- [Referensi API](./api.html) — semua method, dibangkitkan dari kode

## Pemasangan

```bash
npm install @rexxhayanasi/elaina-baileys
```

Butuh Node.js 22 atau lebih baru. Paket ini ESM-first, jadi pakai `import`, bukan `require()`.

## Versi terpendek yang sudah jalan

```js
import makeWASocket, { useMultiFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./session')
const sock = makeWASocket({ auth: state })

sock.ev.on('creds.update', saveCreds)

sock.ev.on('messages.upsert', async ({ messages }) => {
  const message = messages[0]
  if (!message?.message) return
  await sock.sendMessage(message.key.remoteJid, { text: 'Halo 💜' })
})
```

Itu menyambung, menampilkan QR di terminal, dan membalas semua pesan. [Mulai cepat](./getting-started.html) mengubahnya jadi sesuatu yang benar-benar layak dijalankan.

## Catatan soal tingkat verifikasi

Sebagian library ini direkonstruksi dengan membaca bundle WhatsApp Web, bukan dari implementasi yang sudah ada. Bagian itu didokumentasikan apa adanya di [EXPERIMENTAL.md](https://github.com/rexxzyid/elaina-baileys/blob/main/EXPERIMENTAL.md), yang menandai tiap fitur sebagai **Live** (sudah dijalankan ke server WhatsApp), **Offline** (diverifikasi lokal, belum pernah dikirim), atau **Derived** (bentuknya diambil dari bundle, belum pernah dijalankan).

Baca file itu dulu sebelum merilis apa pun yang bergantung pada API channel yang baru.

## Lisensi dan kredit

Ini fork yang dipelihara aktif. Pemberitahuan upstream disimpan di `LICENSE` dan `NOTICE.md`, dan daftar kreditnya ada di README repositori.
