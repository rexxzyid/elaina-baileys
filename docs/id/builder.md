# MessageBuilder

MessageBuilder sudah termasuk di dalam paket. Fungsinya membangun tipe pesan interaktif WhatsApp tanpa kamu merakit protobuf-nya sendiri.

```js
import {
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  Toolkit,
  MessageBuilder,
  MB,
  MESSAGE_BUILDER_VERSION
} from '@rexxhayanasi/elaina-baileys'
```

Kelas-kelasnya juga bisa diakses lewat namespace `MessageBuilder` atau alias pendeknya `MB`:

```js
const button = new MessageBuilder.Button(sock)
const carousel = new MB.Carousel(sock)
```

Semua builder menerima socket di constructor dan diakhiri `.send(jid)`. Pakai `.build(jid)` kalau kamu mau objek pesannya saja tanpa mengirim.

## Button

`Button` membangun pesan interaktif native-flow — tipe tombol yang modern.

```js
import { Button } from '@rexxhayanasi/elaina-baileys'

const message = new Button(sock)
  .setTitle('Elaina Menu')
  .setBody('Pilih salah satu di bawah.')
  .setFooter('@rexxhayanasi/elaina-baileys')
  .addReply('Ping', 'ping')
  .addUrl('Buka Website', 'https://example.com')
  .addCopy('Salin Kode', 'ELAINA2026')

await message.send(jid)
```

`addReply(teks, id)` mengirim balik `id` ke bot kamu saat ditekan — `id` itulah yang kamu cocokkan di `messages.upsert`.

### Dengan header media

```js
const message = new Button(sock)
  .setImage('https://example.com/elaina.jpg')
  .setTitle('Elaina')
  .setBody('Pesan interaktif dengan header gambar.')
  .setFooter('Powered by Elaina Baileys')
  .addReply('Menu', 'menu')
  .addUrl('Website', 'https://example.com')

await message.send(jid)
```

### Jenis tombol

```js
.addReply(displayText, id)
.addUrl(displayText, url)
.addCopy(displayText, copyCode)
.addCall(displayText, id)
.addReminder(displayText, id)
.addCancelReminder(displayText, id)
.addAddress(displayText, id)
.addLocation(options)
.addSelection(title, options)
.addButton(name, params)
```

### Method konten

```js
.setTitle(text)
.setSubtitle(text)
.setBody(text)
.setFooter(text)
.setImage(urlOrBuffer)
.setVideo(urlOrBuffer)
.setDocument(urlOrBuffer)
.setMedia(object)
.setContextInfo(object)
.addPayload(object)
.clearButtons()
.setParams(object)
.build(jid)
.send(jid)
```

## List

List pilihan tunggal adalah `Button` dengan `addSelection`, lalu section dan row:

```js
const list = new Button(sock)
  .setTitle('Elaina Menu')
  .setBody('Pilih satu menu.')
  .setFooter('Elaina Baileys')
  .addSelection('Buka Menu')
  .makeSection('Menu Utama')
  .makeRow('', 'Profil', 'Buka menu profil', 'profile')
  .makeRow('', 'Pengaturan', 'Buka menu pengaturan', 'settings')
  .makeSection('Lainnya')
  .makeRow('', 'Tentang', 'Tentang bot ini', 'about')

await list.send(jid)
```

`makeRow(header, judul, deskripsi, id)` — argumen terakhir adalah id yang dikirim balik ke kamu, sama seperti `addReply`.

Row menempel ke section yang dideklarasikan di atasnya, jadi panggil `makeSection` sebelum row yang menjadi isinya.

## ButtonV2

`ButtonV2` adalah builder tombol klasik yang lebih sederhana. Jenis tombolnya lebih sedikit, pengaturannya lebih ringkas.

```js
import { ButtonV2 } from '@rexxhayanasi/elaina-baileys'

const message = new ButtonV2(sock)
  .setTitle('Elaina')
  .setSubtitle('WhatsApp Bot')
  .setBody('Pilih tindakan.')
  .setFooter('Elaina Baileys')
  .setThumbnail('https://example.com/elaina.jpg')
  .addButton('Menu', 'menu')
  .addButton('Ping', 'ping')

await message.send(jid)
```

## Carousel

Carousel adalah beberapa kartu yang bisa digeser. Bangun tiap kartu dengan `Button.toCard()`, lalu serahkan ke `Carousel`.

```js
import { Button, Carousel } from '@rexxhayanasi/elaina-baileys'

const card1 = await new Button(sock)
  .setImage('https://example.com/card1.jpg')
  .setBody('Kartu pertama')
  .addReply('Pilih', 'card_1')
  .toCard()

const card2 = await new Button(sock)
  .setImage('https://example.com/card2.jpg')
  .setBody('Kartu kedua')
  .addUrl('Buka', 'https://example.com')
  .toCard()

const carousel = new Carousel(sock)
  .setBody('Pilih salah satu kartu di bawah.')
  .setFooter('Elaina Carousel')
  .addCard([card1, card2])

await carousel.send(jid)
```

`toCard()` bersifat async karena mengunggah medianya — jangan lupa `await`.

> [!IMPORTANT]
> Setiap kartu carousel butuh gambar atau video di header-nya. Kartu tanpa media tidak akan tampil.

## AIRich

`AIRich` membangun respons kaya dengan blok konten campuran — teks, kode, tabel — dalam satu pesan.

```js
import { AIRich } from '@rexxhayanasi/elaina-baileys'

const rich = new AIRich(sock)
  .setTitle('Elaina AI')
  .setFooter('Dibuat dengan AIRich')
  .addText('Halo! Ini respons kaya.')
  .addCode('javascript', `console.log('Hello Elaina')`)

await rich.send(jid)
```

Blok tampil sesuai urutan kamu menambahkannya, jadi urutan pemanggilan itulah tata letaknya.

## Memilih yang mana

| Pakai | Kapan |
|---|---|
| `Button` | tombol interaktif modern, URL, copy, call, list |
| `ButtonV2` | tombol balasan biasa, tidak lebih |
| `Carousel` | beberapa kartu media dalam satu pesan yang bisa digeser |
| `AIRich` | campuran blok teks, kode, dan tabel |

## Perbedaan tampilan

Pesan interaktif bergantung pada versi dan platform WhatsApp penerima. Tombol yang tampil di Android bisa jatuh jadi teks polos di klien desktop lama. Uji di platform yang benar-benar kamu dukung, dan pastikan pesannya tetap terbaca kalau bagian interaktifnya gagal tampil.
