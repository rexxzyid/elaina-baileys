# Pesan

## Menerima

Semua masuk lewat `messages.upsert`. `type` memberi tahu apakah ini pesan langsung atau bagian dari sinkronisasi riwayat — untuk bot biasanya kamu cuma mau `notify`.

```js
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return

  const message = messages[0]
  if (!message?.message) return

  console.log('Dari:', message.key.remoteJid)
  console.log('Pesan:', message.message)
})
```

Melewatkan pengecekan `type` adalah penyebab paling umum bot membalas ratusan pesan lama begitu dinyalakan.

## Membaca teksnya

Isi pesan ada di field berbeda tergantung tipenya, jadi mengambil teks polos berarti mengecek beberapa tempat:

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

`conversation` adalah pesan teks polos. `extendedTextMessage` adalah teks yang membawa sesuatu — preview link, kutipan, atau format.

## Pengalamatan: JID, PN, dan LID

Versi WhatsApp terbaru bisa mengidentifikasi pengguna lewat **LID**, bukan JID nomor telepon. Jangan berasumsi semua identitas berakhiran `@s.whatsapp.net`.

```text
6281234567890@s.whatsapp.net
123456789012345@lid
120363xxxxxxxxxx@g.us
123456789@newsletter
```

Key pesan masuk membawa kedua bentuk kalau WhatsApp menyediakannya:

```js
const key = message.key

console.log('remoteJid:', key.remoteJid)
console.log('remoteJidAlt:', key.remoteJidAlt)
console.log('participant:', key.participant)
console.log('participantAlt:', key.participantAlt)
```

`remoteJidAlt` dan `participantAlt` menyimpan alamat alternatifnya, jadi aplikasi yang lebih suka JID nomor telepon bisa memakainya. Simpan juga yang asli — sebagian operasi protokol tetap butuh alamat yang WhatsApp kirim semula.

Normalkan dengan helper bawaan, bukan dengan potong-potong string:

```js
import { jidDecode, jidEncode, jidNormalizedUser } from '@rexxhayanasi/elaina-baileys'

const normalized = jidNormalizedUser(jid)
const decoded = jidDecode(jid)
```

> [!IMPORTANT]
> LID dan PN adalah dua alamat untuk akun yang sama **hanya kalau** WhatsApp memberi kamu pemetaannya, atau aplikasimu sudah tahu. Jangan pernah mengarang nomor telepon dengan mengganti `@lid` jadi `@s.whatsapp.net` — angkanya tidak berhubungan.

## Mengirim

### Teks

```js
await sock.sendMessage(jid, {
  text: 'Halo dari Elaina 💜'
})
```

### Gambar

```js
await sock.sendMessage(jid, {
  image: { url: 'https://example.com/image.jpg' },
  caption: 'Elaina Image'
})
```

Media menerima `{ url }` untuk file remote atau path lokal, dan juga `Buffer` serta stream.

### Video

```js
await sock.sendMessage(jid, {
  video: { url: 'https://example.com/video.mp4' },
  caption: 'Elaina Video'
})
```

### Dokumen

```js
await sock.sendMessage(jid, {
  document: { url: 'https://example.com/file.pdf' },
  fileName: 'document.pdf',
  mimetype: 'application/pdf'
})
```

`fileName` adalah yang dilihat penerima dan yang mereka dapat saat menyimpan. Tanpa `mimetype`, WhatsApp bisa gagal menampilkan preview.

### Lokasi

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

### Polling

```js
await sock.sendMessage(jid, {
  poll: {
    name: 'Pilih satu',
    values: ['Opsi A', 'Opsi B', 'Opsi C'],
    selectableCount: 1
  }
})
```

`selectableCount: 1` membuatnya pilihan tunggal. Naikkan angkanya untuk mengizinkan lebih dari satu jawaban.

### Polling foto

Beri sebuah opsi `image` dan polling berubah jadi polling foto:

```js
await sock.sendMessage(jid, {
  poll: {
    name: 'Cover yang mana?',
    values: [
      { name: 'Jakarta', image: { url: './jakarta.jpg' } },
      { name: 'Bandung', image: { url: './bandung.jpg' } }
    ],
    selectableCount: 1
  }
})
```

Opsi string dan opsi gambar boleh dicampur. String biasa tetap mengirim polling teks normal.

> [!NOTE]
> Polling foto berstatus **Offline** — proto-nya sudah diverifikasi lokal tapi belum pernah dijalankan ke server WhatsApp. Lihat [EXPERIMENTAL.md](https://github.com/rexxzyid/elaina-baileys/blob/main/EXPERIMENTAL.md).

## Membalas dan mengutip

Berikan pesan aslinya sebagai `quoted` untuk membalasnya:

```js
await sock.sendMessage(jid, { text: 'pong' }, { quoted: message })
```

## Kartu preview link

`externalAdReply` menampilkan kartu besar dengan thumbnail dan link sumber:

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

Pakai `renderLargerThumbnail: false` untuk kartu ringkas. `showAdAttribution: true` menambahkan label "Sponsored".

## Selanjutnya

Untuk tombol, list, dan carousel, lanjut ke [MessageBuilder](./builder.html).
