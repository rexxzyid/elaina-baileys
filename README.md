

<div align="center">
  <h1>💫 @rexxhayanasi/elaina-baileys</h1>
  <p><em>Library WhatsApp custom di atas Baileys — diperbaiki, dimodernkan, dan dilengkapi message builder bawaan.</em></p>

  <img src="https://files.catbox.moe/z913tc.jpg" width="400" alt="Elaina Baileys Banner" />
  <br><br>

  <p>
    <a href="https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys">
      <img src="https://img.shields.io/npm/v/@rexxhayanasi/elaina-baileys?color=blueviolet&label=version&logo=npm" alt="npm version" />
    </a>
    <a href="https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys">
      <img src="https://img.shields.io/npm/dt/@rexxhayanasi/elaina-baileys?color=blueviolet&label=downloads&logo=npm" alt="npm downloads" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-success" alt="license" />
    </a>
    <img src="https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Module-ESM-F7DF1E?logo=javascript&logoColor=black" alt="ESM" />
    <img src="https://img.shields.io/badge/MessageBuilder-v4.7-7F5AF0" alt="Message Builder" />
  </p>

  <p>
    <a href="https://whatsapp.com/channel/0029Vb8RvQKEFeXmGnJr621s">
      <img src="https://img.shields.io/badge/Join-WhatsApp%20Channel-25D366?logo=whatsapp&logoColor=white" alt="WhatsApp Channel" />
    </a>
  </p>
</div>

<div align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212257468-1e9a91f1-b636-4676-a213-39d67b2d5d67.gif" width="100%">
</div>

> [!IMPORTANT]
> `@rexxhayanasi/elaina-baileys` adalah library API WhatsApp Web tidak resmi. Tidak berafiliasi, tidak diizinkan, tidak dipelihara, tidak disponsori, dan tidak didukung oleh WhatsApp maupun Meta.
>
> Pakai proyek ini dengan bertanggung jawab, dan patuhi Ketentuan Layanan WhatsApp serta hukum yang berlaku.

> [!NOTE]
> Fitur yang direkonstruksi dari bundle WhatsApp Web, beserta sejauh mana masing-masing sudah diverifikasi, didokumentasikan di [EXPERIMENTAL.md](EXPERIMENTAL.md).

> [!NOTE]
> Proyek ini dibangun di atas ekosistem Baileys, lalu ditambah perbaikan, penyesuaian kompatibilitas, dukungan pesan interaktif, dan MessageBuilder bawaan.

> [!CAUTION]
> Channel update proyek yang lama sudah tidak dipakai. Informasi rilis, catatan perubahan, dan pengumuman proyek diterbitkan lewat WhatsApp Channel yang ditautkan di README ini.

---

## 📌 Ringkasan

`@rexxhayanasi/elaina-baileys` adalah fork Baileys modern yang berorientasi ESM, untuk pengembangan WhatsApp Multi-Device.

Paket ini menggabungkan lapisan socket, utilitas protokol, dukungan pengalamatan yang sadar LID, dan MessageBuilder bawaan dalam satu dependensi. Button, pesan native-flow, carousel, dan layout AIRich bisa dipakai langsung dari paket ini tanpa memasang dependensi builder terpisah.

### ✨ Yang Menonjol

| Fitur | Keterangan |
|---|---|
| 🔌 Multi-Device | Terhubung ke WhatsApp lewat protokol Baileys Multi-Device. |
| 🔐 Kode Pairing | Mendukung kode pairing biasa maupun kustom 8 karakter. |
| 🖱️ Button Interaktif | Quick reply, URL, copy, call, list/select, lokasi, dan button native-flow lainnya. |
| 🧱 MessageBuilder Terintegrasi | `Button`, `ButtonV2`, `Carousel`, `AIRich`, dan `Toolkit` ada di paket yang sama. |
| 🖼️ Album | Mengirim beberapa gambar/video sebagai satu pesan album. |
| 📢 Channel | Membuat, mengikuti, mengubah, bereaksi, dan mengambil data WhatsApp Channel. |
| 👥 Grup | Pembuatan grup, pengelolaan anggota, metadata, pengubahan deskripsi, dan lainnya. |
| 🪪 Pengalamatan LID / PN | Mendukung pengalamatan LID yang baru, sekaligus membuka alternatif PN/JID yang diberikan WhatsApp kalau ada. |
| 📷 Foto Profil | Mengambil, mengubah, dan menghapus foto profil. |
| 🤖 AI Rich | Builder respons rich eksperimental untuk teks, kode, tabel, media, saran, dan layout lainnya. |
| 📞 Panggilan Suara & Video | Melakukan panggilan audio, video, dan berbagi layar di sesi yang sudah dipunyai bot, dengan playlist yang menggerakkan panggilannya. |
| 🗄️ Sesi di Database | Menyimpan sesi di SQLite, PostgreSQL, MySQL, MongoDB, Redis, atau NekoDB, bukan di berkas. |
| 📦 ESM | Paket ESM-first, butuh Node.js 20+; disarankan Node.js 22 atau lebih baru. |

### 🗺️ Apa Saja Yang Bisa Dilakukan?

Baru di sini? Ini seluruh library dalam satu pandangan. Tiap baris menaut ke bagian yang memperlihatkan kodenya.

| Aku mau… | Pakai | Baca |
|---|---|---|
| Login dan tetap login | `useMultiFileAuthState`, `usePostgresAuthState`, … | [Penyimpanan Sesi](#-penyimpanan-sesi) |
| Login tanpa scan QR | kode pairing | [Kode Pairing](#-kode-pairing) |
| Menanggapi pesan masuk | `messages.upsert` | [Menerima Pesan](#-menerima-pesan), [Event](#-event) |
| Kirim teks, gambar, video, berkas, lokasi, polling | `sock.sendMessage` | [Mengirim Pesan](#-mengirim-pesan) |
| Kirim button, list, carousel | `Button`, `ButtonV2`, `Carousel` | [MessageBuilder Terintegrasi](#-messagebuilder-terintegrasi) |
| Kirim kartu bergaya AI | `AIRich`, A2UI | [AIRich](#airich), [Kartu A2UI](#kartu-a2ui) |
| Baca pesan rich yang dikirim bot lain | `readRichMessage` | [Membaca Balik Pesan Rich](#membaca-balik-pesan-rich) |
| Kirim beberapa foto jadi satu postingan | pesan album | [Pesan Album](#-pesan-album) |
| Mengelola channel | helper channel | [Newsletter / Channel](#-newsletter--channel) |
| Mengelola grup | `groupCreate`, `groupParticipantsUpdate`, … | [Pengelolaan Grup](#-pengelolaan-grup) |
| Mengelola komunitas | helper komunitas | [Komunitas](#-komunitas) |
| Blokir, buka blokir, lapor spam | `updateBlockStatus`, `reportSpam` | [Pengaturan Privasi](#-pengaturan-privasi) |
| Tampilkan sedang menulis, tanda dibaca, presence | `sendPresenceUpdate`, `readMessages` | [Presence dan Tanda Dibaca](#-presence-dan-tanda-dibaca) |
| Pin, arsip, bisukan, bintangi chat | `chatModify` | [Keadaan Chat](#-keadaan-chat) |
| Pakai label bisnis dan katalog | helper label dan katalog | [Label](#-label), [Bisnis dan Katalog](#-bisnis-dan-katalog) |
| Buat link panggilan, tolak panggilan | `createCallLink`, `rejectCall` | [Panggilan](#-panggilan) |
| Menelepon orang dan memutar audio | `makeVoipClient`, `voip.call` | [Melakukan Panggilan Suara](#melakukan-panggilan-suara) |
| Memutar antrean lagu di panggilan | `playlist`, `enqueue`, `idle` | [Memainkan Antrean Audio](#memainkan-antrean-audio) |
| Kirim video atau bagikan layar saat panggilan | `video: true`, `screenShare: true` | [Panggilan Video](#panggilan-video), [Berbagi Layar](#berbagi-layar) |
| Menelepon satu grup sekaligus | `voip.callGroup` | [Panggilan Grup](#panggilan-grup) |
| Mengubah atau membaca foto profil | helper foto profil | [Foto Profil](#-foto-profil) |
| Menjadwalkan pesan untuk nanti | pesan terjadwal | [Pesan Terjadwal](#-pesan-terjadwal) |
| Mengikuti perubahan WhatsApp Web | `npm run wa:update` | [Memperbarui Versi WhatsApp Web](#-memperbarui-versi-whatsapp-web) |
| Tahu kalau nomorku sedang bermasalah | sinyal kesehatan akun | [Sinyal Kesehatan Akun](#-sinyal-kesehatan-akun) |
| Paham bedanya jid LID dan PN | helper pengalamatan | [Pengalamatan LID / PN / JID](#-pengalamatan-lid--pn--jid) |
| Tahu kenapa `conversation` kosong | `normalizeMessageContent` | [Semua Jenis Pesan](#-semua-jenis-pesan) |
| Memperbaiki yang rusak | — | [Penanganan Masalah](#-penanganan-masalah) |

---

## 📚 Daftar Isi

- [Ringkasan](#-ringkasan)
  - [Yang Menonjol](#-yang-menonjol)
  - [Apa Saja Yang Bisa Dilakukan?](#-apa-saja-yang-bisa-dilakukan)
- [Kebutuhan](#-kebutuhan)
- [Pemasangan](#-pemasangan)
  - [Paket yang disarankan](#paket-yang-disarankan)
  - [Paket Media Opsional](#paket-media-opsional)
- [Impor](#-impor)
- [Koneksi Dasar](#-koneksi-dasar)
  - [Opsi percobaan ulang dan pairing](#opsi-percobaan-ulang-dan-pairing)
  - [Opsi socket](#opsi-socket)
- [Penyimpanan Sesi](#-penyimpanan-sesi)
  - [Multi-berkas (bawaan)](#multi-berkas-bawaan)
  - [Satu berkas](#satu-berkas)
  - [SQLite](#sqlite)
  - [PostgreSQL, MySQL, MongoDB, Redis](#postgresql-mysql-mongodb-redis)
  - [NekoDB](#nekodb)
  - [Menyimpan Kunci Signal di Cache](#menyimpan-kunci-signal-di-cache)
  - [Menyimpan Chat dan Pesan](#menyimpan-chat-dan-pesan)
- [Kode Pairing](#-kode-pairing)
  - [Permintaannya dikonfirmasi server](#permintaannya-dikonfirmasi-server)
  - [Satu kode dalam satu waktu](#satu-kode-dalam-satu-waktu)
  - [Kode Pairing Kustom](#kode-pairing-kustom)
  - [Memeriksa pairing tanpa menyentuh bot yang jalan](#memeriksa-pairing-tanpa-menyentuh-bot-yang-jalan)
- [Menerima Pesan](#-menerima-pesan)
- [Event](#-event)
  - [Koneksi dan kredensial](#koneksi-dan-kredensial)
  - [Pesan](#pesan)
  - [Chat dan kontak](#chat-dan-kontak)
  - [Grup dan komunitas](#grup-dan-komunitas)
  - [Channel](#channel)
  - [Panggilan dan suara](#panggilan-dan-suara)
  - [Lain-lain](#lain-lain)
- [Pengalamatan LID / PN / JID](#-pengalamatan-lid--pn--jid)
- [Mengirim Pesan](#-mengirim-pesan)
  - [Teks](#teks)
  - [Gambar](#gambar)
  - [Video](#video)
  - [Dokumen](#dokumen)
  - [Lokasi](#lokasi)
  - [Polling](#polling)
- [External Ad Reply](#-external-ad-reply)
  - [Kenapa kartunya bisa tidak muncul sama sekali](#kenapa-kartunya-bisa-tidak-muncul-sama-sekali)
  - [Click-to-WhatsApp, bentuk yang benar-benar dikirim saat iklan diklik](#click-to-whatsapp-bentuk-yang-benar-benar-dikirim-saat-iklan-diklik)
  - [Kartu dan label "via ad" itu dua hal berbeda](#kartu-dan-label-via-ad-itu-dua-hal-berbeda)
  - [Jangan pernah menyetel `alwaysShowAdAttribution` dari bot](#jangan-pernah-menyetel-alwaysshowadattribution-dari-bot)
- [Kartu Rich Link](#-kartu-rich-link)
  - [Satu impor, seluruh builder](#satu-impor-seluruh-builder)
- [Split Payment dan Pengingat](#-split-payment-dan-pengingat)
- [Gaya Link Preview di Status](#-gaya-link-preview-di-status)
- [Membaca Social Link Preview](#-membaca-social-link-preview)
- [Button](#button)
  - [Quick Reply + URL + Copy](#quick-reply--url--copy)
  - [Button dengan Gambar](#button-dengan-gambar)
  - [Daftar Helper Button](#daftar-helper-button)
- [Selection / List](#selection--list)
  - [Dukungan Native Flow](#dukungan-native-flow)
- [ButtonV2](#buttonv2)
- [Carousel](#carousel)
- [AIRich](#airich)
  - [Teks + Kode + Tabel](#teks--kode--tabel)
  - [Kenapa bisa tidak muncul sama sekali](#kenapa-bisa-tidak-muncul-sama-sekali)
  - [Apa Yang Bisa Dicampur Dengan Apa](#apa-yang-bisa-dicampur-dengan-apa)
  - [Inline Entity di Dalam Teks](#inline-entity-di-dalam-teks)
  - [Menyunting Pesan Yang Sudah Tampil](#menyunting-pesan-yang-sudah-tampil)
  - [Mencampur Instance](#mencampur-instance)
  - [Membaca Pesan Yang Sudah Ada](#membaca-pesan-yang-sudah-ada)
  - [Primitif Yang Belum Punya Helper](#primitif-yang-belum-punya-helper)
  - [Sisa Katalog Meta AI](#sisa-katalog-meta-ai)
  - [Meneruskan Jawaban Meta AI Yang Asli](#meneruskan-jawaban-meta-ai-yang-asli)
  - [Membaca Balik Pesan Rich](#membaca-balik-pesan-rich)
  - [Kartu A2UI](#kartu-a2ui)
  - [Mini App HTML](#mini-app-html)
  - [Layar Tertanam](#layar-tertanam)
  - [Memeriksa Pesan AI Rich Yang Diterima](#memeriksa-pesan-ai-rich-yang-diterima)
- [Pesan Album](#-pesan-album)
- [Status](#-status)
  - [Latar, Warna Teks dan Font](#latar-warna-teks-dan-font)
  - [Status Gambar, Video dan Suara](#status-gambar-video-dan-suara)
  - [Stiker Status](#stiker-status)
  - [Status Grup](#status-grup)
  - [Apa Saja Yang Benar-Benar Bisa Digayakan](#apa-saja-yang-benar-benar-bisa-digayakan)
- [Newsletter / Channel](#-newsletter--channel)
  - [Membuat dan Menyunting Channel](#membuat-dan-menyunting-channel)
  - [Mengikuti Channel](#mengikuti-channel)
  - [Membaca Channel](#membaca-channel)
  - [Memposting dan Bereaksi](#memposting-dan-bereaksi)
  - [Status Channel](#status-channel)
  - [Pertanyaan](#pertanyaan)
  - [Admin](#admin)
  - [Mencari Channel](#mencari-channel)
  - [Penindakan](#penindakan)
- [Username & Info](#-username--info)
  - [Username](#username)
  - [Info / Status Teks](#info--status-teks)
  - [Pemberitahuan Ketentuan Layanan](#pemberitahuan-ketentuan-layanan)
  - [Daftar Opt-Out Pemasaran](#daftar-opt-out-pemasaran)
  - [Pengaturan Push](#pengaturan-push)
  - [Link Preview Dari Sisi Server](#link-preview-dari-sisi-server)
- [Pengelolaan Grup](#-pengelolaan-grup)
  - [Membuat Grup](#membuat-grup)
  - [Menambah Anggota](#menambah-anggota)
  - [Mengeluarkan Anggota](#mengeluarkan-anggota)
  - [Promote / Demote](#promote--demote)
  - [Mengubah Deskripsi Grup](#mengubah-deskripsi-grup)
  - [Subjek dan Pengaturan](#subjek-dan-pengaturan)
  - [Siapa Yang Boleh Masuk dan Siapa Yang Boleh Menambah](#siapa-yang-boleh-masuk-dan-siapa-yang-boleh-menambah)
  - [Antrean Permintaan Masuk](#antrean-permintaan-masuk)
  - [Link Undangan](#link-undangan)
  - [Pesan Sementara](#pesan-sementara)
  - [Membaca Grup](#membaca-grup)
- [Komunitas](#-komunitas)
  - [Membuat dan Menautkan](#membuat-dan-menautkan)
  - [Anggota dan Pengaturan](#anggota-dan-pengaturan)
  - [Undangan dan Pembacaan](#undangan-dan-pembacaan)
- [Pengaturan Privasi](#-pengaturan-privasi)
  - [Pesan Sementara Bawaan](#pesan-sementara-bawaan)
  - [Pemblokiran](#pemblokiran)
  - [Melaporkan Spam](#melaporkan-spam)
- [Semua Jenis Pesan](#-semua-jenis-pesan)
  - [Kenapa `conversation` kadang kosong](#kenapa-conversation-kadang-kosong)
  - [84 sisanya](#84-sisanya)
  - [Membaca pesan rich](#membaca-pesan-rich)
- [Presence dan Tanda Dibaca](#-presence-dan-tanda-dibaca)
  - [Menandai Sudah Dibaca](#menandai-sudah-dibaca)
  - [Memeriksa Nomor](#memeriksa-nomor)
- [Keadaan Chat](#-keadaan-chat)
  - [Riwayat dan Sinkronisasi Ulang](#riwayat-dan-sinkronisasi-ulang)
- [Label](#-label)
- [Bisnis dan Katalog](#-bisnis-dan-katalog)
  - [Mengelola Produk](#mengelola-produk)
  - [Profil dan Balasan Cepat](#profil-dan-balasan-cepat)
  - [Mengambil Ulang Media Kedaluwarsa](#mengambil-ulang-media-kedaluwarsa)
  - [Label Anggota Grup](#label-anggota-grup)
- [Panggilan](#-panggilan)
  - [Melakukan Panggilan Suara](#melakukan-panggilan-suara)
  - [Memainkan Antrean Audio](#memainkan-antrean-audio)
  - [Panggilan Video](#panggilan-video)
  - [Berbagi Layar](#berbagi-layar)
  - [Panggilan Grup](#panggilan-grup)
  - [Keluar](#keluar)
- [Foto Profil](#-foto-profil)
  - [Mengambil URL Foto Profil](#mengambil-url-foto-profil)
  - [Mengubah Foto Profil](#mengubah-foto-profil)
  - [Menghapus Foto Profil](#menghapus-foto-profil)
- [Ekspor Yang Berguna](#-ekspor-yang-berguna)
- [Memperbarui Versi WhatsApp Web](#-memperbarui-versi-whatsapp-web)
- [Pesan Terjadwal](#-pesan-terjadwal)
- [API Pesan WhatsApp Modern](#-api-pesan-whatsapp-modern)
  - [Message Key](#message-key)
  - [Polling Foto](#polling-foto)
  - [Pesan Pertanyaan](#pesan-pertanyaan)
  - [Jawaban Pertanyaan Masuk](#jawaban-pertanyaan-masuk)
  - [Balasan Pertanyaan](#balasan-pertanyaan)
  - [Jawaban Pertanyaan di Status](#jawaban-pertanyaan-di-status)
  - [Pesan Kutipan Status](#pesan-kutipan-status)
  - [Interaksi Stiker Status](#interaksi-stiker-status)
  - [Notifikasi Status](#notifikasi-status)
  - [Undangan Admin Channel](#undangan-admin-channel)
  - [Undangan Follower Channel V2](#undangan-follower-channel-v2)
  - [Audiens Status Kustom (Teman Dekat)](#audiens-status-kustom-teman-dekat)
  - [Add Yours](#add-yours)
  - [Mention di Status](#mention-di-status)
  - [Reaksi Status Grup](#reaksi-status-grup)
  - [Menambah Opsi Polling](#menambah-opsi-polling)
  - [Pesan Komentar](#pesan-komentar)
  - [Pesan Undangan Acara](#pesan-undangan-acara)
  - [Panggilan Terjadwal](#panggilan-terjadwal)
  - [Penanda Broadcast Lokasi](#penanda-broadcast-lokasi)
  - [Builder Tingkat Rendah](#builder-tingkat-rendah)
- [Sinyal Kesehatan Akun](#-sinyal-kesehatan-akun)
  - [Kuota Pesan ke Chat Baru](#kuota-pesan-ke-chat-baru)
  - [Timelock Reachout](#timelock-reachout)
  - [Memakainya Sebagai Pengaman](#memakainya-sebagai-pengaman)
- [Penanganan Masalah](#-penanganan-masalah)
  - [`Cannot read properties of undefined (reading 'undefined')` saat membalas](#cannot-read-properties-of-undefined-reading-undefined-saat-membalas)
  - [Bot menjawab di semua grup kecuali satu](#bot-menjawab-di-semua-grup-kecuali-satu)
  - [Kode pairing harus tepat 8 karakter](#kode-pairing-harus-tepat-8-karakter)
  - [Kode pairing muncul tapi ponselnya tidak pernah menampilkan prompt](#kode-pairing-muncul-tapi-ponselnya-tidak-pernah-menampilkan-prompt)
  - [Permintaan pairing ditolak dengan 409](#permintaan-pairing-ditolak-dengan-409)
  - [`Socket is required`](#socket-is-required)
  - [Button atau AIRich tergambar berbeda](#button-atau-airich-tergambar-berbeda)
  - [Yang muncul LID, bukan JID nomor telepon](#yang-muncul-lid-bukan-jid-nomor-telepon)
  - [Sesi ter-logout](#sesi-ter-logout)
- [Menemukan Bug?](#-menemukan-bug)
- [Kredit](#-kredit)
  - [Pemelihara Proyek](#pemelihara-proyek)
  - [Baileys / Upstream](#baileys--upstream)
  - [Kontribusi Fork / Sumber](#kontribusi-fork--sumber)
  - [MessageBuilder Terintegrasi](#messagebuilder-terintegrasi)
  - [Kontributor Open Source](#kontributor-open-source)
- [TQTO](#-tqto)
- [Lisensi](#-lisensi)

---

## ⚙️ Kebutuhan

- Node.js **20 atau lebih baru** — itu yang dideklarasikan `package.json` dan yang dipaksa oleh pemeriksaan `preinstall`, jadi versi di bawahnya ditolak saat instalasi
- **Disarankan Node.js 22 atau lebih baru**, dan **24** untuk pengembangan serta alur rilis
- npm
- Satu akun WhatsApp untuk pairing

Cek versi Node.js kamu:

```bash
node -v
```

---

## 📦 Pemasangan

Pasang langsung dari npm:

```bash
npm install @rexxhayanasi/elaina-baileys
```

### Paket yang disarankan

Pakai paketnya langsung dengan namanya sendiri:

```json
{
  "type": "module",
  "dependencies": {
    "@rexxhayanasi/elaina-baileys": "latest"
  }
}
```

Paket ini ESM-first. Pakai sintaks `import`, bukan `require()`.

### Paket Media Opsional

Pemasangan dasarnya tidak membawa library pengolah gambar atau video. Ukurannya jadi sekitar 45 MB lebih kecil, dan pilihan build `sharp` diserahkan ke kamu — tidak bentrok dengan versi yang sudah dipaku proyekmu.

```bash
npm i sharp            # thumbnail, resize, MessageBuilder Toolkit.resize
npm i fluent-ffmpeg    # frame preview video, MessageBuilder Toolkit.getMp4Preview
```

Penanganan media memakai library gambar mana pun yang ditemukan, dengan urutan ini:

| Paket | Dipakai untuk |
|---|---|
| `sharp` | pilihan utama, paling cepat |
| `@napi-rs/image` | cadangan |
| `jimp` | cadangan murni JS, tanpa build native |

Mengirim teks biasa, button, polling, channel, dan pesan AI Rich tidak butuh satu pun dari itu. Mengirim media tanpa ketiganya melempar `No image processing library available`; memanggil `Toolkit.resize` atau `Toolkit.getMp4Preview` tanpa paketnya melempar pesan yang menyebutkan apa yang harus dipasang.

Periksa saat runtime sebelum mengandalkan salah satunya:

```js
import { hasOptionalMedia } from '@rexxhayanasi/elaina-baileys'

await hasOptionalMedia('sharp')          // false kalau belum terpasang
await hasOptionalMedia('fluent-ffmpeg')
```

---

## 📥 Impor

```js
import makeWASocket from '@rexxhayanasi/elaina-baileys'
```

Mengimpor utilitas tambahan:

```js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  Toolkit,
  MessageBuilder,
  MB
} from '@rexxhayanasi/elaina-baileys'
```

> [!NOTE]
> MessageBuilder sudah terintegrasi. Kamu tidak perlu memasang `baileys-mbuilder` secara terpisah.

---

## 🚀 Koneksi Dasar

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
        console.log('Sesi ter-logout')
      }
    }
  })

  return sock
}

startSock()
```

### Opsi percobaan ulang dan pairing

Selain opsi Baileys yang biasa, yang ini mengatur bagaimana socket menangani pesan yang tidak bisa didekripsi, pengiriman yang ditolak, dan pairing:

| Opsi | Bawaan | Fungsinya |
|---|---|---|
| `maxMsgRetryCount` | `3` | jumlah percobaan dekripsi yang diminta per pesan masuk |
| `retryRequestDelayMs` | `250` | jeda sebelum meminta pengirim mengenkripsi ulang |
| `maxRetryQueueSize` | `64` | jumlah pesan yang boleh mengantre untuk diulang sekaligus |
| `ackRetryDelayMs` | `750` | jeda sebelum mengirim ulang setelah nack yang bisa diulang |
| `maxAckRetryCount` | `3` | jumlah percobaan kirim ulang setelah nack yang bisa diulang |
| `pairingCodeTimeoutMs` | `180000` | berapa lama satu kode pairing tetap berlaku |

`maxRetryQueueSize` itu klep pengaman, bukan tombol throughput. Tanpa batas itu, ledakan pesan yang tidak bisa didekripsi akan mengantre tanpa henti dan menggelembungkan heap; di atas batasnya, kelebihannya di-ack tanpa diulang. Menaikkannya tidak menyelamatkan lebih banyak pesan — yang berperan di situ `retryRequestDelayMs`, dengan harga menekan pengirim lebih keras.

### Opsi socket

Semua yang diterima `makeWASocket`, beserta bawaannya:

| Opsi | Bawaan | Fungsinya |
|---|---|---|
| `auth` | — | wajib; auth state dari salah satu penyimpanan sesi di bawah |
| `logger` | instance pino | logger apa pun yang kompatibel dengan pino |
| `version` | versi WA Web yang dipaku | versi protokol yang diklaim socket |
| `browser` | `['Mac OS', 'Chrome', '14.4.1']` | nama yang tampil di Perangkat Tertaut |
| `markOnlineOnConnect` | `true` | setel `false` supaya notifikasi di ponsel tetap jalan |
| `syncFullHistory` | `true` | minta seluruh riwayat, bukan cuma potongan terbaru |
| `shouldSyncHistoryMessage` | `() => true` | putuskan per batch riwayat, disimpan atau tidak |
| `shouldIgnoreJid` | `() => false` | buang event dari jid yang cocok sebelum dipancarkan |
| `getMessage` | `async () => undefined` | sediakan pesan lama supaya socket bisa menjawab permintaan ulang |
| `cachedGroupMetadata` | `async () => undefined` | pakai ulang cache metadata grup milikmu sendiri |
| `emitOwnEvents` | `true` | pancarkan event untuk tindakan yang dilakukan perangkat ini |
| `fireInitQueries` | `true` | jalankan kueri awal (props, blocklist, privasi) |
| `generateHighQualityLinkPreview` | `true` | ambil thumbnail link preview yang lebih besar |
| `linkPreviewImageThumbnailWidth` | `192` | lebar thumbnail link preview |
| `connectTimeoutMs` | `20000` | batas waktu menyerah pada handshake socket |
| `keepAliveIntervalMs` | `15000` | selang ping |
| `defaultQueryTimeoutMs` | `60000` | batas waktu menyerah pada kueri iq |
| `countryCode` | `'US'` | petunjuk negara yang dikirim saat registrasi |
| `patchMessageBeforeSending` | identitas | kesempatan terakhir menulis ulang pesan sebelum direlay |
| `enableAutoSessionRecreation` | `true` | bangun ulang sesi Signal setelah gagal berulang kali |
| `enableRecentMessageCache` | `true` | simpan pesan keluar terbaru untuk menjawab permintaan ulang |
| `appStateMacVerification` | `{ patch: false, snapshot: false }` | verifikasi MAC app-state |
| `waWebSocketUrl` | endpoint WA Web | ganti URL socket |
| `customUploadHosts` | `[]` | host unggah media tambahan |
| `inlineSenderKeyDistribution` | `true` | bawa sender key distribution message di dalam tiap pesan grup, seperti yang dilakukan klien resmi; setel `false` supaya dikirim hanya sebagai pesan terpisah |
| `transactionOpts` | `{ maxCommitRetries: 10, delayBetweenTriesMs: 3000 }` | kebijakan ulang untuk transaksi app-state |
| `options` | `{}` | opsi axios untuk tiap permintaan HTTP (proxy, timeout, header) |
| `makeSignalRepository` | bawaan | ganti implementasi penyimpanan protokol Signal |

`getMessage` lebih penting daripada yang tersirat dari bawaannya: tanpa itu, penerima yang meminta pesan dikirim ulang tidak mendapat apa pun, dan pesannya tampil sebagai "menunggu pesan ini". Arahkan ke penyimpanan apa pun yang kamu punya.

---

## 💾 Penyimpanan Sesi

Auth state menyimpan kredensial dan kunci Signal kamu. Kehilangannya berarti scan QR lagi; membocorkannya berarti orang lain bisa memakai akunmu. Paket ini membawa beberapa penyimpanan sekaligus, semuanya mengembalikan bentuk `{ state, saveCreds }` yang sama.

Mana pun yang kamu pilih, sambungkan `saveCreds` ke event `creds.update` — kalau tidak, tidak ada yang tersimpan:

```js
sock.ev.on('creds.update', saveCreds)
```

### Multi-berkas (bawaan)

Satu folder, satu berkas per kunci. Sederhana, tanpa dependensi, dan pilihan yang tepat untuk satu bot di satu mesin.

```js
import { useMultiFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useMultiFileAuthState('./session')
```

Ia menulis banyak berkas kecil — akun yang sibuk menghasilkan ribuan berkas pre-key. Itu normal; menghapusnya di tengah sesi merusak sesinya.

### Satu berkas

Semuanya dalam satu berkas JSON. Lebih mudah dibackup atau dipindah antar host, tapi melambat begitu kumpulan kuncinya membesar karena seluruh berkas ditulis ulang setiap ada perubahan.

```js
import { useSingleFileAuthState } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useSingleFileAuthState('./session.json')
```

### SQLite

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

### PostgreSQL, MySQL, MongoDB, Redis

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

const { state, saveCreds } = await usePostgresAuthState({
    connectionString: 'postgres://user:pass@localhost:5432/bot'
})

const { state, saveCreds } = await useMySQLAuthState({
    uri: 'mysql://user:pass@localhost:3306/bot'
})

const { state, saveCreds } = await useMongoAuthState({
    uri: 'mongodb://localhost:27017',
    dbName: 'bot'
})

const { state, saveCreds } = await useRedisAuthState({
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

### NekoDB

Untuk bot yang state-nya sudah ada di NekoDB, supaya sesinya ikut bersama data yang lain.

```js
import { useNekoDBAuth } from '@rexxhayanasi/elaina-baileys'

const { state, saveCreds } = await useNekoDBAuth(db)
```

Argumen pertama harus instance NekoDB yang sudah tersambung; koleksinya default ke `baileys_elaina_auth`. Beri argumen kedua untuk menyimpan beberapa sesi dalam satu database:

```js
const { state, saveCreds } = await useNekoDBAuth(db, 'my_sessions')
```

### Menyimpan Kunci Signal di Cache

Setiap penyimpanan membaca kunci dari disk atau database pada tiap dekripsi. Membungkus penyimpanan kunci dengan cache menghilangkan perjalanan itu:

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

Layak dipakai di penyimpanan apa pun, dan hampir wajib di yang berbasis berkas untuk bot grup yang sibuk.

### Menyimpan Chat dan Pesan

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

---

## 🔐 Kode Pairing

Kode pairing bisa diminta setelah socket dibuat.

```js
const phoneNumber = '6281234567890'

if (!state.creds.registered) {
  const code = await sock.requestPairingCode(phoneNumber)
  console.log('Kode pairing:', code)
}
```

Nomornya dinormalkan sebelum dipakai, jadi `+62 812-3456-7890` dan `6281234567890` itu permintaan yang sama. Yang ditolak adalah nomor yang mustahil valid: kurang dari 6 atau lebih dari 15 digit, atau diawali `0` — kode negara tidak pernah dimulai dengan nol, jadi `081234567890` itu bentuk lokal, bukan bentuk internasional yang diharapkan WhatsApp.

```js
await sock.requestPairingCode('081234567890')
// Boom 400: phoneNumber must be in international format:
// kode negara lalu nomor nasionalnya, hanya digit
```

### Permintaannya dikonfirmasi server

`requestPairingCode` menunggu jawaban WhatsApp dan baru kembali setelah server mendaftarkan kodenya. Penolakan dilempar, bukan ditelan, jadi kode yang kamu terima memang kode yang benar-benar diketahui server:

```js
try {
  const code = await sock.requestPairingCode(phoneNumber)
  console.log('Kode pairing:', code)
} catch (error) {
  console.log(error.message)   // misalnya rate-overlimit, not-allowed
  console.log(error.data)      // misalnya 429
}
```

Dua penolakan yang paling sering kamu temui: `rate-overlimit` — terlalu banyak percobaan, tunggu dulu sebelum mencoba lagi — dan varian not-allowed, artinya tautan-lewat-nomor-telepon tidak diaktifkan untuk akun itu.

### Satu kode dalam satu waktu

Respons pairing hanya bisa didekripsi oleh kunci yang menghasilkannya, jadi permintaan kedua saat yang pertama masih menggantung akan merusak yang pertama. Itu ditolak dengan `409`:

```js
try {
  await sock.requestPairingCode(phoneNumber)
} catch (error) {
  if (error.output?.statusCode === 409) {
    console.log('masih menggantung, sisa detik:', error.data.secondsLeft)
  }
}
```

Panggil `cancelPairingCode()` untuk meninggalkan percobaan yang menggantung lalu langsung meminta yang baru. Ia mengembalikan apakah memang ada yang dibatalkan:

```js
sock.cancelPairingCode()
const code = await sock.requestPairingCode(phoneNumber)
```

Pengamannya membersihkan diri sendiri begitu kodenya kedaluwarsa. WhatsApp merotasi kode pairing setiap 3 menit; sesuaikan dengan `pairingCodeTimeoutMs` kalau kamu butuh jendela lain.

### Kode Pairing Kustom

Kode pairing kustom harus berisi tepat **8 karakter**.

```js
const code = await sock.requestPairingCode(
  '6281234567890',
  'ELAINA01'
)

console.log(code)
```

### Memeriksa pairing tanpa menyentuh bot yang jalan

`script/testpairing.js` menjalankan satu permintaan pairing ke direktori sesi sekali pakai, jadi kredensial bot yang sudah tersambung tidak pernah tertimpa:

```bash
node script/testpairing.js 6281234567890 --check-only
```

`--check-only` melaporkan apakah server menerima registrasinya dan tidak pernah mencetak kodenya — pakai itu di tempat mana pun yang outputnya bisa dibaca orang lain. Lepas flag-nya untuk mencetak kode dan menunggu penautannya selesai.

---

## 📩 Menerima Pesan

```js
sock.ev.on('messages.upsert', async ({ messages, type }) => {
  if (type !== 'notify') return

  const message = messages[0]
  if (!message?.message) return

  console.log('Dari:', message.key.remoteJid)
  console.log('Pesan:', message.message)
})
```

Mengambil teksnya secara sederhana:

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

---

## 📡 Event

Semua yang dipancarkan socket, lewat `sock.ev`. Berlangganan satu-satu, atau sekaligus dengan `sock.ev.process`.

```js
sock.ev.process(async (events) => {
  if (events['messages.upsert']) { /* ... */ }
  if (events['connection.update']) { /* ... */ }
})
```

`process` memberimu satu objek per flush, bukan satu callback per event, sehingga ledakan sinkronisasi riwayat tidak menggempur handler-mu.

### Koneksi dan kredensial

| Event | Dipancarkan saat |
|---|---|
| `connection.update` | keadaan koneksi, QR, kode pairing, timelock reachout |
| `creds.update` | kredensial berubah — selalu sambungkan ini ke `saveCreds` |

### Pesan

| Event | Dipancarkan saat |
|---|---|
| `messages.upsert` | pesan baru atau tambahan, dengan `type: 'notify' \| 'append'` |
| `messages.update` | status, suntingan, pembaruan polling |
| `messages.delete` | pesan ditarik |
| `messages.reaction` | reaksi ditambah atau dihapus |
| `messages.media-update` | unggah ulang media selesai |
| `message-receipt.update` | tanda terkirim / dibaca |
| `message-capping.update` | kuota chat baru berubah |
| `messaging-history.set` | satu batch sinkronisasi riwayat datang |
| `messaging-history.status` | kemajuan sinkronisasi riwayat |

### Chat dan kontak

| Event | Dipancarkan saat |
|---|---|
| `chats.upsert` / `chats.update` / `chats.delete` | daftar chat berubah |
| `chats.lock` | satu chat dikunci atau dibuka |
| `contacts.upsert` / `contacts.update` | kontak berubah |
| `presence.update` | sedang menulis, merekam, online |
| `blocklist.update` | daftar blokir berubah |
| `settings.update` | pengaturan privasi atau akun berubah |
| `labels.edit` / `labels.association` | label bisnis |
| `lid-mapping.update` | satu nomor telepon dipetakan ke LID |

### Grup dan komunitas

| Event | Dipancarkan saat |
|---|---|
| `groups.upsert` / `groups.update` | metadata grup |
| `group-participants.update` | masuk, keluar, promote, demote |
| `group.join-request` | ada yang minta masuk |
| `group.member-tag.update` | label anggota berubah |

### Channel

| Event | Dipancarkan saat |
|---|---|
| `newsletter.reaction` | ada follower bereaksi |
| `newsletter.view` | penghitung tayangan bergerak |
| `newsletter-settings.update` | pengaturan channel berubah |
| `newsletter-participants.update` | admin dipromote atau didemote |
| `newsletter-admin-profile.update` | seorang admin mengubah profil channel-nya |

### Panggilan dan suara

| Event | Dipancarkan saat |
|---|---|
| `call` | panggilan masuk atau diperbarui |
| `voice.transcription` | satu pesan suara ditranskripsikan |
| `voice.command` | satu transkripsi cocok dengan frasa pemicu |

### Lain-lain

| Event | Dipancarkan saat |
|---|---|
| `event` | pesan acara dibuat atau diperbarui |
| `mex.notification` | notifikasi MEX yang belum dimodelkan library ini |

`mex.notification` itu pintu daruratnya: apa pun yang ditambahkan WhatsApp dan belum dimodelkan library ini tiba di situ beserta nama operasi dan payload mentahnya, jadi fitur baru tidak pernah hilang tanpa jejak.

---

## 🪪 Pengalamatan LID / PN / JID

Versi protokol WhatsApp yang baru bisa mengidentifikasi pengguna dengan alamat LID, bukan hanya JID nomor telepon. Jangan berasumsi setiap penanda pengguna yang masuk berakhiran `@s.whatsapp.net`.

Bentuk yang umum antara lain:

```text
6281234567890@s.whatsapp.net
123456789012345@lid
120363xxxxxxxxxx@g.us
123456789@newsletter
```

Untuk pesan masuk, periksa field key yang diberikan WhatsApp:

```js
const key = message.key

console.log('remoteJid:', key.remoteJid)
console.log('remoteJidAlt:', key.remoteJidAlt)
console.log('participant:', key.participant)
console.log('participantAlt:', key.participantAlt)
```

Kalau WhatsApp menyediakan PN/JID alternatif, `remoteJidAlt` atau `participantAlt` bisa dipakai aplikasi yang lebih suka JID nomor telepon. Tetap simpan LID aslinya juga, karena sebagian operasi protokol masih bisa menuntut alamat yang awalnya diberikan WhatsApp.

Pakai helper JID bawaan saat menormalkan penanda:

```js
import { jidDecode, jidEncode, jidNormalizedUser } from '@rexxhayanasi/elaina-baileys'

const normalized = jidNormalizedUser(jid)
const decoded = jidDecode(jid)

console.log(normalized)
console.log(decoded)
```

> [!IMPORTANT]
> LID dan PN adalah dua bentuk alamat untuk akun yang sama **hanya** kalau WhatsApp menyediakan pemetaannya atau aplikasimu sudah tahu pemetaannya. Jangan membuat PN palsu dengan mengganti akhiran `@lid`.

---

## 💬 Mengirim Pesan

### Teks

```js
await sock.sendMessage(jid, {
  text: 'Salam dari Elaina 💜'
})
```

**View once untuk teks — sudah dibangun, tapi tergambar sebagai tidak didukung.** `ExtendedTextMessage` punya field `viewOnce`, dan klien Android membawa satu modul penuh di sekitarnya: `FMessageViewOnceText`, `ConversationRowViewOnceText`, `ViewOnceTextRowFactory`, satu `ViewOnceTextFragment` khusus, plus penghitungnya sendiri `VIEW_ONCE_TEXT_MESSAGES_SENT` / `_RECEIVED` / `_OPENED`. Encoder klien itu sendiri menyetel `extendedTextMessage.viewOnce` lalu membungkus hasilnya di `viewOnceMessageV2Extension`.

`sendMessage(jid, { text, viewOnceV2Extension: true })` menghasilkan bentuk itu persis:

```js
{ viewOnceMessageV2Extension: { message: { extendedTextMessage: { text, viewOnce: true } } } }
```

**Diukur di perangkat 2.26.34, yang tampil tetap "kamu menerima pesan yang tidak didukung versi WhatsApp-mu."** Payload-nya sama dengan yang ditulis klien untuk dirinya sendiri, jadi bentuknya bukan masalahnya — fiturnya ada di binary tapi belum hidup untuk pengirim biasa di build itu. Anggap belum tersedia sampai ada perangkat yang membuktikan sebaliknya.

`viewOnce: true` dan `viewOnceV2: true` membungkusnya di `viewOnceMessage` / `viewOnceMessageV2`; itu pembungkus yang dipakai media. Field `conversation` yang polos tidak bisa membawa semua ini — ia cuma string tanpa tempat untuk menaruh flag-nya — jadi teksnya harus berjalan sebagai `extendedTextMessage`, dan fork ini selalu begitu.

### Gambar

```js
await sock.sendMessage(jid, {
  image: { url: 'https://example.com/image.jpg' },
  caption: 'Gambar Elaina'
})
```

### Video

```js
await sock.sendMessage(jid, {
  video: { url: 'https://example.com/video.mp4' },
  caption: 'Video Elaina'
})
```

### Dokumen

```js
await sock.sendMessage(jid, {
  document: { url: 'https://example.com/file.pdf' },
  fileName: 'dokumen.pdf',
  mimetype: 'application/pdf'
})
```

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

#### Pengaturan polling

Setiap sakelar yang ditampilkan WhatsApp di composer polling-nya sendiri tersedia di sini. Nama opsinya tidak sama dengan nama field protobuf-nya, jadi keduanya didaftar bersebelahan:

| Opsi | Field protobuf | Bawaan | Fungsinya |
|---|---|---|---|
| `selectableCount` | `selectableOptionsCount` | `1` | berapa jawaban yang boleh dipilih satu orang |
| `hideVoter` | `hideParticipantName` | `false` | menyembunyikan siapa memilih apa |
| `canAddOption` | `allowAddOption` | `false` | mengizinkan penerima menambah opsinya sendiri |
| `endDate` | `endTime` | tidak ada | `Date` yang setelahnya polling ditutup |

> **Empat opsi ini digerbangi di akun penerima.** WhatsApp memeriksa masing-masing terhadap flag yang dikendalikan server, dan kalau flag-nya mati, penerima bukan cuma mengabaikan pengaturannya — **seluruh polling** tergambar sebagai *"Kamu menerima pesan yang tidak didukung versi WhatsApp-mu"*. Gambar opsinya direlay terpisah, jadi polling yang gagal bisa kelihatan seperti hanya gambarnya yang sampai.
>
> Yang diperiksa itu *keberadaan* field-nya, bukan nilainya. Itu sebabnya library ini menghilangkan `hideParticipantName` dan `allowAddOption` sama sekali kalau kamu tidak menyalakannya, bukan mengirim `false`.
>
> `canAddOption` paling jarang tersedia di antara keempatnya: WhatsApp Web sama sekali tidak punya gerbang pengiriman untuknya, artinya composer-nya sendiri tidak pernah menawarkannya, dan flag penerimanya `poll_add_option_receiving_enabled` masih default mati. Anggap eksperimental. `selectableCount` satu-satunya pengaturan yang tidak pernah digerbangi.
>
> Untuk tahu apa yang didukung sebuah akun, kirim satu polling per pengaturan lalu lihat mana yang tiba sebagai polling sungguhan.

`hideVoter` dan `endDate` jalan di polling foto juga. Semua versi polling membawa `PollCreationMessage` yang sama, jadi `pollCreationMessageV3` memegang field-field itu persis seperti V6, dan penerima membacanya dari versi mana pun yang datang — tapi gambar opsinya hanya menempel di V3. Karena itu library ini menahan polling foto di V3 dan menyimpan V6 untuk polling teks:

| Polling | Versi yang dikirim |
|---|---|
| ada opsi yang membawa `image` | V3, lengkap dengan pengaturannya |
| opsi teks + `hideVoter` / `endDate` | V6 |
| opsi teks, satu jawaban | V3 |
| opsi teks, beberapa jawaban | `pollCreationMessage` |

`canAddOption` tetap jadi pengecualian: ia menggagalkan seluruh polling di mana pun flag penerimanya mati, ada gambar atau tidak.

```js
 await conn.sendMessage(jid, {
  poll: {
    name: 'Yang mana yang enak?',
    values: [
  { name: 'Nasi Padang', image: { url: global.elaina } },
  { name: 'Nasi Goreng', image: { url: global.elaina } }
],
    selectableCount: 1,
    hideVoter: true,
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
})
```

`canAddOption` sengaja tidak dimasukkan ke contohnya — tambahkan hanya setelah kamu memastikan penerimanya mendukung, karena itu yang paling mungkin mengubah seluruh polling jadi placeholder tidak didukung.

Opsi teks dan opsi gambar bisa dicampur dalam satu polling, persis seperti yang diizinkan composer. Satu opsi yang membawa `image` mengubah polling itu jadi [polling foto](#polling-foto); begitu `canAddOption` disetel, penerima bisa memperluasnya lewat [Menambah Opsi Polling](#menambah-opsi-polling).

`endDate` menerima `Date`, bukan timestamp — ia dikonversi ke milidetik epoch saat dikirim.

Polling foto memang tergambar di grup maupun chat satu lawan satu — klien ponsel menerimanya di sana.

Dua catatan yang perlu diketahui. Penerima WhatsApp **Web** lebih ketat daripada ponsel. Gerbangnya, yang dibaca dari bundle Web, kira-kira begini — ini kode WhatsApp, bukan ekspor library ini, jadi tidak ada yang bisa diimpor atau dipanggil dari sini:

```text
isPhotoPollReceiverEnabled(msg) =
  isNewsletterMsg({ from: msg.from, to: msg.to }) && isNewsletterPhotoPollsReceiverEnabled()
```

Dengan kata lain, Web hanya menerima polling foto di dalam channel, jadi polling foto yang kelihatan benar di ponsel bisa tampil tidak didukung di sesi browser. Dan mencampur opsi gambar dengan `hideVoter` atau `endDate` memindahkan pesannya ke `pollCreationMessageV6`; kalau gambarnya berhenti muncul setelah kamu menambahkan sakelar itu, kirim polling fotonya tanpa keduanya.

---

## 📰 External Ad Reply

`externalAdReply` bisa ditempelkan lewat `contextInfo` kalau kamu mau kartu bergaya link preview WhatsApp yang standar.

```js
await sock.sendMessage(jid, {
  text: 'Elaina Baileys',
  contextInfo: {
    externalAdReply: {
      title: 'Elaina Baileys',
      body: 'Library WhatsApp Multi-Device modern',
      mediaType: 1,
      thumbnailUrl: 'https://example.com/elaina.jpg',
      sourceUrl: 'https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys',
      renderLargerThumbnail: true,
      showAdAttribution: false
    }
  }
})
```

Payload-nya juga bisa diserahkan ke builder lewat `.setContextInfo(...)` kalau builder-nya mendukung context info.

Ada juga bentuk singkat yang duduk di sebelah konten, bukan di dalam `contextInfo`:

```js
await sock.sendMessage(jid, {
  text: 'Elaina Baileys',
  externalAdReply: {
    title: 'Elaina Baileys',
    body: 'Library WhatsApp Multi-Device modern',
    thumbnail: await fs.promises.readFile('./cover.jpg'),
    url: 'https://www.npmjs.com/package/@rexxhayanasi/elaina-baileys',
    largeThumbnail: true
  }
})
```

`url` di situ mengisi `sourceUrl`, yaitu tautan yang dibuka kartunya. Itu bukan gambar, jadi tidak lagi disalin ke `thumbnailUrl` atau `mediaUrl` — keduanya kunci terpisah yang kamu setel sendiri kalau gambarnya memang diambil lewat jaringan. Beri kartunya salah satu: buffer `thumbnail` inline atau `thumbnailUrl`; tanpa keduanya, kartunya tergambar tanpa gambar dan satu peringatan masuk ke logger.

### Kenapa kartunya bisa tidak muncul sama sekali

Field-nya masih hidup — build WhatsApp sekarang tetap mem-parse `externalAdReply` dan tetap menelusurinya saat validasi. Yang berubah ada di sisi penerima. Kedua klien membuang **seluruh pesannya**, bukan cuma kartunya, kalau tiba di akun konsumer. WA Web:

```js
if (!isSMB() && !getIsSentByMe(t) && r != null
    && getABPropConfigValue("ctwa_suppress_message_with_external_ad_reply_consumer_db_level_enabled"))
  throw new MessageValidationError("This is a spam message sent to consumer number with externalAdReply", INVALID_MESSAGE)
```

Android punya gerbang yang sama, dicatat sebagai `ctwa-message-suppressed-external-ad-reply` di sebelah "message suppressed due to ExternalAdReply, mitigation enabled" di `CoreMessageStore`, tepat sebelum pesannya dibuang dan diganti placeholder.

Baca ketiga syaratnya:

- `!isSMB()` — penerima WhatsApp Business tetap melihat kartunya. Hanya WhatsApp konsumer yang membuangnya.
- `!getIsSentByMe` — salinanmu sendiri di perangkatmu sendiri dikecualikan. Itu sebabnya satu kartu bisa kelihatan sempurna di ponsel pengirim sementara tidak ada orang lain yang menerima pesannya.
- AB prop-nya — dikendalikan server per akun, jadi payload yang sama bisa jalan untuk satu penerima dan hilang untuk yang lain, dan bisa mulai gagal tanpa satu baris kodemu berubah.

Tidak ada isi payload yang mengubah ini. Ini bukan soal `mediaType` yang benar, thumbnail yang valid, atau `showAdAttribution`; pesannya dibuang setelah didekripsi, sebelum digambar. Kalau kartunya yang membawa isi pesanmu, kirim isi itu di badan pesan juga supaya pesannya tetap berguna sendiri.

Bawaan prop ini di tabel klien `false`, jadi ini tidak aktif di mana-mana — dinyalakan per akun dari server. Pastikan dulu sebelum berasumsi: kirim kartu yang sama ke nomor WhatsApp Business. Kalau salinan Business menampilkan kartunya dan salinan konsumer tidak menampilkan pesan sama sekali, itu gerbang ini. Kalau dua-duanya tidak menampilkan kartu tapi dua-duanya menampilkan pesannya, berarti kartunya sendiri yang cacat dan [Kartu Rich Link](#-kartu-rich-link) bukan yang kamu butuhkan — periksa thumbnail-nya dulu.

### Click-to-WhatsApp, bentuk yang benar-benar dikirim saat iklan diklik

Contoh di atas memakai `externalAdReply` sebagai hiasan. Click-to-WhatsApp adalah tujuan asli field ini dibangun: seseorang mengetuk iklan di Facebook atau Instagram, WhatsApp terbuka di thread pengiklan, dan pesan pertama yang dikirim orang itu membawa iklan asalnya. Kunci-kunci tambahan itulah yang dibiarkan kosong oleh kartu hiasan.

```js
import { proto } from '@rexxhayanasi/elaina-baileys'

await sock.sendMessage(jid, {
  text: 'Halo, saya mau tanya soal promonya',
  contextInfo: {
    conversionSource: 'FB_Ads',
    conversionData: Buffer.from('120210000000000000'),
    conversionDelaySeconds: 3,
    externalAdReply: {
      sourceType: 'ad',
      sourceId: '120210000000000000',
      sourceUrl: 'https://fb.me/1a2b3c4d5e',
      sourceApp: 'facebook',
      ctwaClid: 'AbQ1kZ8xR2mNpL7vT0yUwE',
      title: 'Diskon 50% Semua Menu',
      body: 'Berlaku sampai akhir bulan',
      mediaType: proto.ContextInfo.ExternalAdReplyInfo.MediaType.IMAGE,
      thumbnailUrl: 'https://example.com/promo.jpg',
      renderLargerThumbnail: true,
      showAdAttribution: true,
      containsAutoReply: true,
      automatedGreetingMessageShown: true,
      greetingMessageBody: 'Halo, saya mau tanya soal promonya',
      ctaPayload: 'promo_bulan_ini',
      adType: proto.ContextInfo.ExternalAdReplyInfo.AdType.CTWA,
      containsCtwaFlowsAutoLabel: true
    }
  }
})
```

Kegunaan tiap kunci yang khusus CTWA:

| Kunci | Artinya |
|---|---|
| `contextInfo.conversionSource` | permukaan mana yang menghasilkan kliknya. `FB_Ads` adalah nilai yang ditulis klien itu sendiri |
| `contextInfo.conversionData` | byte opaque yang dikembalikan ke pengiklan untuk atribusi — dalam praktiknya id iklannya. `ctwaPayload` (55) mengalahkan yang ini kalau `ctwaSignals` juga disetel |
| `contextInfo.conversionDelaySeconds` | jumlah detik antara ketukan iklan dan pengirimannya. Ini field **20**, bukan `entryPointConversionDelaySeconds` (31) — parser CTWA hanya membaca 20 |
| `sourceType` | `"ad"` untuk iklan, `"post"` untuk postingan organik |
| `sourceId` | id iklan atau postingannya |
| `ctwaClid` | id klik yang mengikat percakapan ini ke satu klik iklan |
| `sourceApp` | `"facebook"`, `"instagram"`, … |
| `containsAutoReply` / `greetingMessageBody` | sapaan yang sudah terisi dari iklannya, dan apakah pengirim melihatnya |
| `ctaPayload` | payload call-to-action iklannya, kamu yang menentukan |
| `adType` | `CTWA` (0) atau `CAWC` (1) |
| `containsCtwaFlowsAutoLabel` | baru di revisi `1047203841`: thread-nya membawa auto-label CTWA Flows |

`AdType.CTWA` bernilai `0`, jadi protobuf tidak menuliskannya ke wire dan ia terbaca balik sebagai `0` — itu nilai bawaannya, bukan field yang hilang.

### Kartu dan label "via ad" itu dua hal berbeda

Saat diterima, klien melipat `contextInfo` menjadi `ctwaContext` pada pesannya, dan hanya sebagian kunci di atas yang selamat dalam perjalanan itu:

```js
n.alwaysShowAdAttribution = contextInfo.alwaysShowAdAttribution
n.conversionSource        = contextInfo.conversionSource
n.conversionDelaySeconds  = contextInfo.conversionDelaySeconds
n.conversionData          = ctwaSignals != null && ctwaPayload != null ? ctwaPayload : conversionData
const d = contextInfo.externalAdReply
if (d != null) {
  n.sourceUrl = d.sourceUrl, n.title = d.title, n.description = d.body
  n.thumbnail = decodeBytes(d.thumbnail), n.thumbnailUrl = d.thumbnailUrl
  n.mediaType = d.mediaType, n.mediaUrl = d.mediaUrl
  n.isSuspiciousLink = findLink(d.sourceUrl).suspiciousCharacters.size > 0
  // lalu sourceApp, dan greetingMessageBody / automatedGreetingMessageShown / ctaPayload
  // hanya kalau isWamoAGMIntegrationEnabled(d.sourceApp)
}
```

`sourceType`, `sourceId`, dan `ctwaClid` **tidak** disalin ke `ctwaContext` — mereka ikut untuk keperluan atribusi, tidak menggambar apa pun.

**Kartunya** — gambar, judul, subjudul — lalu digambar dengan syarat yang tidak menyebut Business maupun AB prop mana pun:

```js
if (ctwaContext == null
    || ctwaContext.sourceUrl == null
    || ctwaContext.mediaType === MediaType.NONE
    || (ctwaContext.adContextPreviewDismissed === true && isHideAdContextIfSoftDismissed()))
  return null
```

Jadi akun konsumer biasa memang menggambarnya, selama `sourceUrl` disetel dan `mediaType` bernilai `IMAGE` atau `VIDEO`. `mediaType: 0` tidak menggambar apa pun.

**Label "Message via ad"** itu elemen terpisah, dan ia bertumpu pada `contextInfo.alwaysShowAdAttribution` (field **48**) — bukan `externalAdReply.showAdAttribution`, yang merupakan field lain dan tidak pernah dibaca labelnya. Satu titik render memeriksa field-nya saja; satu lagi lewat `shouldShowAdAttribution`, yang menambahkan `isSMB() || getABPropConfigValue("wa_ctwa_web_thread_ad_attribution_enabled")` (`2898`, bawaan `false`) dan menolak langsung untuk pesan yang diteruskan.

### Jangan pernah menyetel `alwaysShowAdAttribution` dari bot

Menyetelnya mengorbankan seluruh pesanmu, tanpa prop apa pun terlibat:

```js
function D(msg) {
  const n = msg.ctwaContext?.alwaysShowAdAttribution
  if (!isSMB() && !isMeAccount(getSender(msg)) && n === true)
    throw new MessageValidationError("This is a spam message sent to consumer number with 'Message Via Ad' header", INVALID_MESSAGE)
}
```

Tanpa AB prop, tanpa rollout — penerima konsumer selalu membuang pesan apa pun yang membawa flag itu dari siapa pun kecuali dirinya sendiri. Ia berada di modul yang sama dengan penekanan `externalAdReply` yang didokumentasikan di atas, dan keduanya terbagi rapi:

| Yang kamu kirim | Penerima konsumer |
|---|---|
| `externalAdReply` dengan `sourceUrl` + `mediaType` 1/2 | kartunya tergambar |
| `externalAdReply`, prop `21819` aktif untuk akun itu | seluruh pesan dibuang (dikendalikan server, bawaan mati) |
| `contextInfo.alwaysShowAdAttribution: true` | seluruh pesan dibuang, **selalu** |

Jadi paruh kartu dari CTWA itu biasa dan aman; paruh atribusi iklannya memang untuk akun Business.

---

## 🖼️ Kartu Rich Link

Kartu yang digambar WhatsApp sendiri untuk sebuah tautan. Gambar besar, judul, dan subjudulnya sama dengan `externalAdReply`, tapi dibangun dari `extendedTextMessage`, yaitu link preview biasa yang dikirim semua pengguna sepanjang hari — tanpa field iklan, jadi penekanan di atas tidak bisa menyentuhnya.

```js
await sock.sendMessage(jid, {
  richLink: {
    text: 'dengerin ini',
    url: 'https://example.com/track',
    title: 'Judul Lagu',
    description: 'Penyanyi',
    image: { url: './sampul.jpg' }
  }
})
```

`url` wajib. `text` adalah pesanmu; tautannya ditambahkan ke situ kalau belum ada di dalamnya, karena klien hanya menggambar preview untuk tautan yang ada di badan pesan. Hilangkan `text` dan tautannya yang menjadi badan pesan.

`image` bagian yang melakukan pekerjaannya. Composer WhatsApp sendiri tidak menaruh gambarnya di dalam pesan — ia mengunggahnya ke server media sebagai blob `thumbnail-link` lalu mengirim kuncinya, sehingga penerima mengunduh dan mendekripsi sampul ukuran penuh. Itulah yang membuat preview-nya besar, bukan kotak kecil, dan itu yang dilakukan di sini:

| yang dikirim ke wire | dari |
| --- | --- |
| `jpegThumbnail` | salinan inline 192px, ditampilkan selama unduhan berjalan |
| `thumbnailDirectPath`, `mediaKey`, `mediaKeyTimestamp` | hasil unggahan |
| `thumbnailSha256`, `thumbnailEncSha256` | hasil unggahan |
| `thumbnailWidth`, `thumbnailHeight` | ukuran gambar yang benar-benar dienkode |

Dua yang terakhir bukan hiasan. Pengaman klien itu sendiri begini:

```js
var n = !!(e.thumbnailDirectPath || e.thumbnailHQ) && e.thumbnailHeight != null && e.thumbnailWidth != null;
if (!n) return false;
```

Kalau salah satu dimensinya hilang, ia menggambar kartu kecil dan tidak pernah mengunduh blob-nya, dan perbandingan keduanya menentukan bubble potret atau lanskap. Karena itu dimensinya di sini diukur dari byte yang sudah dienkode, bukan dari sumbernya: gambar yang lebih lebar dari targetnya diperkecil, gambar yang sudah lebih sempit dibiarkan apa adanya, bukan ditarik sampai 640 lalu jadi kabur. Kalau tidak ada library gambar yang terpasang, tidak ada yang bisa diukur, jadi tidak ada unggahan sama sekali dan kamu dapat kartu kecil — unggahan tanpa dimensi di sebelahnya adalah unggahan yang akan ditolak klien.

Beri `large: false` kalau memang mau kartu kecil; itu melewati unggahannya juga. `thumbnailWidth` mengubah angka 640; `previewType` menerima `proto.Message.ExtendedTextMessage.PreviewType` kalau kamu mau `VIDEO` untuk tautan yang diputar inline. Kunci lain apa pun diteruskan ke pesannya, jadi `contextInfo` jalan seperti biasa.

Satu kasus di mana kartu besar ditolak apa pun yang kamu kirim: di status, klien juga menuntut `thumbnailWidth / thumbnailHeight >= 1.4`, jadi sampul potret atau persegi jatuh ke kartu kecil di situ.

Kalau kamu sudah punya pipeline preview sendiri, `linkPreview` menerima `image` yang sama dan mengunggahnya dengan cara yang sama:

```js
await sock.sendMessage(jid, {
  text: 'lihat https://example.com/a',
  linkPreview: {
    'matched-text': 'https://example.com/a',
    title: 'Judul',
    description: 'Keterangan',
    image: { url: './gambar.jpg' }
  }
})
```

`linkPreview` juga menerima `large: false` untuk kartu kecil, dan ia sama sekali tidak butuh tautannya ada di teksmu:

```js
await sock.sendMessage(jid, {
  text: 'tidak ada tautan di sini',
  linkPreview: {
    'matched-text': 'https://example.com',
    title: 'Judul',
    description: 'Keterangan',
    image: { url: './gambar.jpg' }
  }
})
```

Klien memutuskan sebuah pesan membawa preview lewat `isUrlExtendedTextMessage`, yaitu `!!matchedText || !!description || !!title` — badan pesannya tidak pernah dilihat. Jadi kartunya tergambar, mengetuknya membuka `matchedText`, dan chat-nya hanya menampilkan kata-katamu. `richLink` menambahkan tautannya karena link preview normalnya milik sebuah tautan yang bisa dilihat pembaca; kalau kamu mau kartunya tanpa itu, pakai `linkPreview` langsung.

Fungsi `upload` harus tersedia untuk kartu besar, karena thumbnail-nya memang benar-benar diunggah — mengirim lewat socket sudah memberimu itu. Library gambar (`sharp`, `@napi-rs/image`, atau `jimp`) yang mengukur dan menskalakan sampulnya, dan tanpa itu kartunya selalu yang kecil.

---

# 🧱 MessageBuilder Terintegrasi

MessageBuilder v4.7 sudah disertakan langsung di dalam `@rexxhayanasi/elaina-baileys`.

### Satu impor, seluruh builder

Permukaan builder-nya terdiri dari 175 nama yang tersebar di empat modul, dan itulah kenapa satu bot bisa berakhir dengan satu paragraf impor cuma untuk menggambar satu kartu. `MB` (nama panjangnya: `MessageBuilder`) membawa semuanya — kelima kelas builder, semua pabrik section dan item, semua enum, pemeriksa native flow, helper tanda tangan. Tidak ada lagi yang perlu ikut di baris impor:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

await new MB.Button(sock)
  .setTitle('Elaina Menu')
  .addReply('Ping', 'ping')
  .send(jid)

const rich = new MB.AIRich(sock)
rich.addText('*Laporan*')
rich.addSection(MB.dividerSection())
rich.addSection(MB.taskSection({ taskId: 'job-1', title: 'Rendering', status: MB.TaskStatus.RUNNING }))
await rich.send(jid)

MB.checkNativeFlowButtons([{ name: 'single_select' }])
```

Tiap anggota `MB` adalah fungsi yang sama dengan named export-nya, bukan salinan, jadi tidak ada yang berubah kalau kamu sudah mengimpornya satu-satu — `MB.dividerSection === dividerSection`. Kelas builder-nya juga membawa anggota yang sama sebagai static (`AIRich.dividerSection`, `Button.checkNativeFlowButtons`), yang berguna kalau kelasnya sudah jadi satu-satunya yang kamu impor.

Semua contoh di bab ini ditulis seperti itu, `MB` dan tidak ada yang lain, sampai ke halaman A2UI dan mini app HTML. Daftar panjangnya masih jalan dan tidak ada yang dideprekasi, jadi bot yang sudah ada tidak perlu diubah:

```js
import {
  Button,
  ButtonV2,
  Carousel,
  AIRich,
  Toolkit,
  MessageBuilder,
  MB,
  MESSAGE_BUILDER_VERSION,
  AIRichError,
  ItemNotFoundError,
  DuplicateIdError,
  InvalidTargetError,
  ContentValidationError
} from '@rexxhayanasi/elaina-baileys'
```

---

## 💸 Split Payment dan Pengingat

Dua-duanya tergambar di Android sebagai bubble-nya sendiri. Nominalnya angka manusia — nilai di wire diskalakan dengan `offset` (bawaan 1000), dan menyerahkan angka yang sudah diskalakan dengan tangan membuat tagihannya seribu kali lipat.

```js
import { SplitPaymentStatus, ReminderFrequency } from '@rexxhayanasi/elaina-baileys'

await sock.sendMessage(jid, {
  splitPayment: {
    splitId: 'makan-01',
    total: 150000,
    currency: 'IDR',
    description: 'Makan bareng',
    requesterJid: '628xxxx@s.whatsapp.net',
    participants: [
      { jid: '6281xxxx@s.whatsapp.net', amount: 50000 },
      { jid: '6282xxxx@s.whatsapp.net', amount: 100000, status: SplitPaymentStatus.PAID }
    ]
  }
})

await sock.sendMessage(jid, {
  splitPaymentUpdate: { splitId: 'makan-01', participantJid: '6281xxxx@s.whatsapp.net' }
})

await sock.sendMessage(jid, {
  paymentReminder: {
    reminderId: 'sewa-01',
    description: 'Sewa bulanan',
    amount: 500000,
    currency: 'IDR',
    frequency: ReminderFrequency.MONTHLY
  }
})
```

`splitId` wajib, dan itulah yang disebut pesan pembaruannya nanti. Peserta default ke `PENDING` dan `createdAt` dicap untukmu. Pengingatnya default ke `ACTIVE` dan menerima `WEEKLY`, `BI_WEEKLY`, `MONTHLY`, atau `QUARTERLY`; `payeeVpa`, `payeeJid`, dan `payerJid` ada untuk alur UPI.

Baca kembali dengan `readSplitPayment(msg)` dan `readPaymentReminder(msg)`, yang mengembalikan `null` untuk apa pun selain itu dan menyerahkan nominalnya sebagai angka manusia. `money(amount, code)` dan `readMoney(value)` melakukan penskalaannya sendiri kalau kamu butuh di tempat lain.

Ini pesan biasa yang dikirim akunmu sendiri, tampil di bawah namamu sendiri — tidak memindahkan uang dan bukan permintaan pembayaran yang ditindaklanjuti jaringan. Anggap kartu split ini sebagai catatan, karena memang itu.

## 📊 Gaya Link Preview di Status

`statusLinkPreviewMetadata` duduk di bagian atas pesan, di sebelah teksnya, dan memberi tahu status kartu link preview mana yang harus digambar:

```js
await sock.sendMessage('status@broadcast', {
  text: 'baca ini https://example.com/artikel',
  statusLinkPreview: { style: 1 }
})
```

Klien tidak menerbitkan nama apa pun untuk nilai-nilai ini, jadi di sini angkanya diteruskan apa adanya ketimbang mengarang enum — `statusLinkPreview: 1` saja hasilnya sama. Style negatif atau bukan bilangan bulat ditolak.

## 🎬 Membaca Social Link Preview

Kalau klien Meta sendiri mengirim link preview untuk reel atau postingan, mereka menempelkan node tambahan di sebelah judul dan thumbnail yang biasa: `linkPreviewMetadata` berisi jenis postingan, video inline, dan durasinya, plus `endCardTiles` dan `videoContentUrl`. `readSocialPreview(msg)` menarik semua itu kembali keluar, dan mengembalikan `null` untuk pesan yang tidak membawa satu pun di antaranya.

```js
import { readSocialPreview } from '@rexxhayanasi/elaina-baileys'

sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    const social = readSocialPreview(msg)
    if (social) console.log(social.postType, social.videoUrl, social.endCards)
  }
})
```

**Di sini sengaja tidak ada resep sisi pengirim.** `socialPreview` dan `videoEndCard` masih ada dan masih terenkode dengan benar, tapi sampai revisi `1047301412` tidak ada yang menggambarnya dari pesan yang kamu kirim, jadi mendokumentasikannya sebagai cara membuat kartu berarti mendokumentasikan pesan yang tiba kosong.

Buktinya, supaya kamu tidak perlu menurunkannya ulang: di WA Web, pemeta proto-ke-model untuk `extendedTextMessage` menyalin `matchedText`, `description`, `title`, `jpegThumbnail`, `previewType`, `doNotPlayInline`, `mediaKey`, `mediaKeyTimestamp`, `thumbnailDirectPath`, `thumbnailSha256`, dan `thumbnailEncSha256` — tidak ada yang lain. `linkPreviewMetadata`, `endCardTiles`, dan `videoContentUrl` dibuang di perbatasan itu sebelum ada komponen yang bisa membacanya, dan hitungan pembacaan langsung di seluruh bundle sepakat: `matchedText` 66, `thumbnailDirectPath` 51, ketiga itu **0** masing-masing. Di aplikasi, `endCardTiles_` sama sekali tidak ada di dex mana pun, jadi tile-nya bahkan tidak bisa didekode di sana.

Untuk kartu yang memang tergambar, dengan thumbnail besar dan tanpa tautan yang ditempel di badan pesan, pakai [Kartu Rich Link](#-kartu-rich-link) atau opsi `linkPreview` pada pesan teks biasa.

## Button

Builder `Button` dipakai untuk pesan interaktif native-flow.

### Quick Reply + URL + Copy

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const message = new MB.Button(sock)
  .setTitle('Elaina Menu')
  .setBody('Pilih salah satu di bawah.')
  .setFooter('@rexxhayanasi/elaina-baileys')
  .addReply('Ping', 'ping')
  .addUrl('Buka Website', 'https://example.com')
  .addCopy('Salin Kode', 'ELAINA2026')

await message.send(jid)
```

### Button dengan Gambar

```js
const message = new MB.Button(sock)
  .setImage('https://example.com/elaina.jpg')
  .setTitle('Elaina')
  .setBody('Pesan interaktif dengan header gambar.')
  .setFooter('Powered by Elaina Baileys')
  .addReply('Menu', 'menu')
  .addUrl('Website', 'https://example.com')

await message.send(jid)
```

### Daftar Helper Button

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

Builder-nya juga menyediakan:

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

---

## Selection / List

Buat list single-select native dengan `addSelection`, `makeSection`, dan `makeRow`.

```js
const list = new MB.Button(sock)
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

> [!IMPORTANT]
> `single_select` hanya tergambar di **Android**. WhatsApp Web dan iOS tidak punya kodenya — namanya tidak ada di daftar native-flow mereka, jadi pesannya jatuh ke kartu teks biasa dan list-nya hilang. Ini bukan hal yang bisa ditambal dari library. Lihat [Dukungan Native Flow](#dukungan-native-flow) untuk yang memang tergambar di mana-mana.

### Dukungan Native Flow

WhatsApp Web memegang daftar nama button native-flow yang tetap. Apa pun di luar daftar itu dibuang dan pesannya diturunkan jadi `phone_only_feature` — teksnya tetap sampai, button-nya tidak.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

MB.checkNativeFlowButtons([{ name: 'single_select' }])
// { ok: false, unsupported: ['single_select'], problems: ['"single_select" is not a native flow WhatsApp Web or iOS can render, only Android shows it'] }

MB.isWebSupportedButtonName('quick_reply')  // true
```

Tergambar di mana-mana: `quick_reply`, `cta_url`, `cta_call`, `cta_copy`, `cta_catalog`, `catalog_message`, `galaxy_message`, `order_status`, `payment_reminder`, `booking_confirmation`, `payment_request`, `api_signup`, `inapp_signup`, `cta_app`, `form_message`.

Hanya Android: `single_select`, `send_location`, `address_message`, `cta_reminder`, `cta_cancel_reminder`.

Dua batas, dibaca dari klien, bukan dikira-kira:

| Button pertama | Maksimum button |
|---|---|
| `quick_reply` | 10 |
| selain itu | 3 |

Quick reply tidak bisa dicampur dengan jenis button lain dalam satu pesan — klien menolak seluruh kumpulannya, bukan cuma button yang menyimpang.

Kalau kamu butuh satu menu yang jalan di semua platform, pakai sampai 10 button `addReply`, atau kirim pilihannya sebagai teks dan biarkan pengguna menjawab. Tidak ada trik protokol yang membuat list single-select muncul di Web.

---

## ButtonV2

`ButtonV2` menyediakan builder button klasik yang lebih sederhana.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const message = new MB.ButtonV2(sock)
  .setTitle('Elaina')
  .setSubtitle('WhatsApp Bot')
  .setBody('Pilih satu tindakan.')
  .setFooter('Elaina Baileys')
  .setThumbnail('https://example.com/elaina.jpg')
  .addButton('Menu', 'menu')
  .addButton('Ping', 'ping')

await message.send(jid)
```

---

## Carousel

Kartu carousel bisa dibuat dari `Button.toCard()` lalu diserahkan ke `Carousel`.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const card1 = await new MB.Button(sock)
  .setImage('https://example.com/card1.jpg')
  .setBody('Kartu pertama')
  .addReply('Pilih', 'card_1')
  .toCard()

const card2 = await new MB.Button(sock)
  .setImage('https://example.com/card2.jpg')
  .setBody('Kartu kedua')
  .addUrl('Buka', 'https://example.com')
  .toCard()

const carousel = new MB.Carousel(sock)
  .setBody('Pilih salah satu kartu di bawah.')
  .setFooter('Elaina Carousel')
  .addCard([card1, card2])

await carousel.send(jid)
```

> [!IMPORTANT]
> Setiap kartu carousel wajib punya lampiran media gambar atau video di header-nya.

---

## AIRich

`AIRich` adalah builder respons rich bawaan untuk bermacam layout dan jenis konten.

Ia tidak lewat `sock.sendMessage`, dan memang tidak bisa. `send` merelay pesannya lalu langsung mengirim satu suntingan `protocolMessage` untuk pesan itu sendiri — unified response baru tergambar setelah stanza kedua itu mendarat. Itu dua stanza dari satu panggilan, dan bukan hal yang bisa dikembalikan `sendMessage`; ia memberimu satu `WebMessageInfo` untuk satu pesan. Jadi respons rich dibangun di atas sebuah instance lalu direlay oleh builder-nya sendiri, dan semua contoh di bawah mulai dari `new MB.AIRich(sock)` dan berakhir di `await rich.send(jid)`.

**`import { MB }` adalah satu-satunya impor di bagian ini**, termasuk halaman mini app HTML, A2UI, dan semua pembacanya — `MB.htmlSection(…)`, `MB.sendHtmlApp(…)`, `MB.a2uiText(…)`, `MB.decodeAIRich(…)`, `MB.TaskStatus.RUNNING`. Lihat [Satu impor, seluruh builder](#satu-impor-seluruh-builder). Named export-nya tetap jalan tanpa perubahan kalau kamu lebih suka itu; keduanya fungsi yang sama, bukan salinan.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock)
rich.addText('Halo')
await rich.send(jid)
```

`send` menerima opsi yang sama dengan `build` — `quoted`, `messageId`, `forwardWrapper`, `notification` — dan `sendEdit` menggantikan pesan yang sudah tampil di layar. Serahkan jid bot sendiri lewat `botJid` kalau kamu mau atribusi forward-nya menyebut sesuatu selain bawaannya.

### Teks + Kode + Tabel

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock)
  .setTitle('Elaina AI')
  .setFooter('Dibuat dengan AIRich')
  .addText('Halo! Ini respons rich.')
  .addCode('javascript', `console.log('Halo Elaina')`)
  .addTable([
    ['Fitur', 'Status'],
    ['Button', 'Tersedia'],
    ['Carousel', 'Tersedia'],
    ['AIRich', 'Eksperimental']
  ])
  .addSuggest(['Lihat menu', 'Bantu aku', 'Tentang Elaina'])

await rich.send(jid)
```

### Kenapa bisa tidak muncul sama sekali

Dulu pesan AI Rich dikirim terbungkus `botForwardedMessage`, seperti yang dilakukan forward Meta AI yang asli. Klien penerima hanya membuka pembungkus itu di belakang sebuah gerbang:

```js
: n && o("WAWebBotBaseGating").isRichResponseForwardReceivingEnabled() ? n : u || null
```

di mana `n` itu `botForwardedMessage`. Gerbang itu adalah AB prop `ai_rich_response_forward_receiving_enabled` (id 16682), dan bawaannya di tabel klien **false**. Kalau mati, pembungkusnya tidak pernah dibuka, jadi pesannya tidak di-parse sebagai respons rich dan tidak ada yang digambar — bukan placeholder tidak didukung, tapi tidak ada apa-apa.

Karena itu `build` dan `send` sekarang menaruh `richResponseMessage` di tingkat atas. Pemeta jenis pesannya menerima itu tanpa gerbang sama sekali (`e === "richResponseMessage" ? MSG_TYPE.RICH_RESPONSE`), dan jalur parse-nya berjalan normal; prop yang sama lalu hanya menentukan apakah atribusi forward di `contextInfo` dibawa atau tidak, dan itu kosmetik.

Beri `forwardWrapper: true` ke `build`, `send`, `buildEdit`, atau `forwardRichResponse` untuk mendapatkan bentuk terbungkus yang lama — layak dilakukan hanya kalau kamu tahu penerimanya sudah menyalakan prop itu.

Helper AIRich lain yang tersedia antara lain:

```js
.addText(text)
.addCode(language, code)
.addTable(rows)
.addSource(sources)
.addReels(items)
.addImage(imageUrl, options)
.addVideo(videoUrl, options)
.addProduct(data)
.addPost(data)
.addTip(text)
.addSuggest(suggestion, options)
.addFOAText(text)
.addMetadata(text)
.addWidget(data, options)
.addFooterAction(data, options)
.addSection(section)
.addSubmessage(submessage)
```

### Apa Yang Bisa Dicampur Dengan Apa

Respons rich dan pesan interaktif kelihatannya seharusnya bisa digabung, dan menu bot yang memasangkan `nativeFlowMessage` dengan `bloksWidget` memberi kesan apa pun bisa. Baca kliennya, dan semuanya terbagi rapi jadi satu hal yang tidak bisa dicampur dan dua yang bisa.

#### Kunci konten tingkat atas tidak pernah bisa dicampur

`richResponseMessage` itu field **97** dari `Message`. `interactiveMessage` **45**, `extendedTextMessage` **6**, `conversation` **1**. Protobuf dengan senang hati mengenkode dua di antaranya bersebelahan, dan keduanya selamat dalam perjalanan — tapi setiap resolver memilih tepat satu, mengikuti urutan field, dan sisanya cuma beban mati di wire:

```js
proto.Message.encode({ richResponseMessage, interactiveMessage }).finish()
// kunci di wire   : interactiveMessage, richResponseMessage
// getContentType() : interactiveMessage        ← respons rich-nya diabaikan
```

Jadi tidak ada yang namanya "respons rich dengan button". Kirim dua pesan, atau pilih satu bentuk.

#### Di dalam `interactiveMessage`, tiga slot ikut dan tiga saling berebut

Klien menentukan jenis interaktifnya dengan menelusuri enum-nya sendiri lalu mengambil field pertama yang ada:

```js
InteractiveMessageType = { NATIVE_FLOW: 'nativeFlowMessage', SHOPS_STOREFRONT: 'shopStorefrontMessage', CAROUSEL: 'carouselMessage' }
getInteractiveMessageTypeForProto = f => members().find(t => fieldNameFor(t) in f)
```

Jadi `nativeFlowMessage`, `shopStorefrontMessage`, dan `carouselMessage` **saling berebut** — yang pertama ada yang menang dan menentukan `interactiveType`, apa pun urutan penulisanmu. Dan ketiganya memang `oneof` protobuf sungguhan (field 4, 5, 6, 7), yang dipaksakan runtime protobuf aplikasi saat parse dengan menyimpan hanya yang terakhir di wire: setel dua, Web mengambil field 6 sementara aplikasi mengambil field 7. Jangan pernah menyetel dua.

`header` (1), `body` (2), `footer` (3), `bloksWidget` (8), dan `contextInfo` (15) duduk **di luar** oneof itu, jadi semuanya ikut bersama payload mana pun yang menang. Itu sebabnya memasangkan `nativeFlowMessage` dengan `bloksWidget` itu sehat secara struktur, bukan trik.

Dua detail yang hanya muncul saat parse:

- **Di Web, `carouselMessage` tetap di-parse walau `nativeFlowMessage` yang menang.** Carousel-nya dibaca ke `carouselCardsParsed` secara terpisah, jadi kartu dan button tiba bersamaan di sana — tapi kalau carousel-nya gagal di-parse, seluruh pesannya jatuh ke node tidak didukung, button ikut. Jangan membangun di atas ini: oneof di atas berarti aplikasi tidak pernah melihat kedua paruhnya.
- **Widget A2UI yang valid menunda pemeriksaan nama native-flow.** Pengamannya berbunyi `if (!S && (msgContext === 'relay' || msgContext === 'history'))`, di mana `S` adalah `bloksWidget.type === 'im_a2ui' && isBloksWidgetEnabled()`. Dengan widget itu terpasang dan prop-nya aktif, `isValidNativeFlowName` dan `isValidNativeFlowMessage` dilewati sama sekali.

Keduanya berdiri di belakang satu syarat keras:

```js
isSupportedInteractiveMessageVersion(type, payload) {
  const n = payload?.messageVersion
  if (n == null || type == null) return false
  switch (type) { case NATIVE_FLOW: return n <= 1; case SHOPS_STOREFRONT: return n <= 1; case CAROUSEL: return n <= 1 }
}
```

`messageVersion` **wajib** ada di slot yang menang, dan nilainya harus `1` atau kurang. Hilangkan itu dan pesannya tidak didukung sebelum semua yang di atas dijalankan — tidak ada versi 9. Kunci konten `nativeFlow` menyetelnya untukmu.

#### Constraint tombol, dan kenapa itu menentukan segalanya

`nativeFlowMessage.name` **bukan** yang dibaca klien. Nama flow-nya diturunkan dari button-nya, dan hanya kalau button-nya lolos pemeriksaan:

```js
getBizNativeFlowName = ({ interactiveMessage: m }) => {
  const p = m?.nativeFlowMessage?.buttons
  if (p?.length > 0 && !buttonsViolateButtonImprovementsConstraints(p.map(b => ({ nativeFlowButton: b }))))
      return MB.getNativeFlowNameByButtonName(p[0].name)          // ← satu satunya cabang yang dicapai bot
  if (e.buttonsMessage?.buttons?.length === 1) return …          // buttonsMessage lama
  const f = !(p?.length) && (body.text || header.title || footer.text || header.imageMessage) && !m?.shopStorefrontMessage
  if (f) return MIXED                                            // ← hanya kalau TIDAK ADA button
  // selain itu: undefined
}
```

Perhatikan arti `MIXED` yang sebenarnya di situ: itu nama untuk pesan interaktif **tanpa button sama sekali**. Bukan "campuran jenis button", dan `name: 'mixed'` di protobuf tidak pernah dilihat.

Ini pemeriksaannya, lengkap:

```js
const QUICK_REPLY_LIMIT = 10, OTHER_LIMIT = 3
const SUPPORTED = [QUICK_REPLY, CTA_CALL, CTA_URL, CTA_CATALOG, CATALOG_MESSAGE, CTA_COPY_CODE, CTA_FLOW,
                   ORDER_STATUS, PAYMENT_REMINDER, BOOKING_CONFIRMATION, PAYMENT_REQUEST,
                   API_SIGNUP, INAPP_SIGNUP, CTA_APP, FORM_MESSAGE]

const isQuickReply = b => b.nativeFlowButton?.name === String(QUICK_REPLY)

buttonsViolateButtonImprovementsConstraints = e => {
  if (e.length === 0) return false
  const firstIsQR = isQuickReply(e[0])
  if (e.length > (firstIsQR ? QUICK_REPLY_LIMIT : OTHER_LIMIT)) return true
  return !e.slice(1).every(b => {
    const mapped = MB.getNativeFlowNameByButtonName(b.nativeFlowButton?.name)
    return (mapped != null ? SUPPORTED.includes(mapped) : true) && firstIsQR === isQuickReply(b)
  })
}
```

Tiga aturan keluar dari situ:

1. **Setiap button harus sejenis dengan button pertama** — quick reply atau bukan. Satu `cta_url` di sebelah `quick_reply` merusak seluruh daftarnya.
2. **Maksimum 10 button kalau yang pertama `quick_reply`, maksimum 3 kalau bukan.**
3. Button berikutnya yang namanya terpetakan ke flow yang dikenal harus salah satu dari lima belas di atas. Nama yang tidak dikenali lolos aturan yang satu ini.

**Semua itu khusus WA Web.** `buttonsViolateButtonImprovementsConstraints` dan `isValidNativeFlowName` tidak muncul di mana pun di APK Android — tidak di dex mana pun. Aplikasi mengambil keputusan tidak-didukungnya sendiri di `FMessageInteractiveFactory/isUnknownInteractiveMessage`, dan predikat di sekitarnya (`interactiveMessageCase_`, plus satu tes `buttons.size() == 1` yang hanya dipakai untuk alur pembayaran) melihat kasus oneof-nya dan nama button pertamanya. Tidak ada batas jumlah dan tidak ada aturan sejenis. Jadi pesan yang membawa `cta_url`, `cta_call`, `send_location`, `quick_reply`, dan `single_select` sekaligus memang tergambar di ponsel — dan di situ pula satu-satunya tempat beberapa nama itu ada, sesuai [Dukungan Native Flow](#dukungan-native-flow).

Langgar satu aturannya dan nama flow-nya kembali `undefined`, dan di Web itu fatal satu langkah kemudian:

```js
isValidNativeFlowName = ({ bizInfo, msgContext, name }) => {
  if (msgContext !== 'relay' && name != null) return true
  const a = bizInfo?.nativeFlowName
  if (a == null || name == null) return false            // ← nama undefined, sebelum apa pun yang lain
  return cast(a) === MIXED || … ? true : cast(a) === name
}
```

Pesan masuk itu relay, jadi `name == null` mengembalikan false dan pesannya jadi node tidak didukung di Web — button, teks, footer, semuanya, sementara pesan yang sama tergambar normal di ponsel. Perhatikan urutannya: pintu darurat `MIXED` diperiksa **setelah** tes null, jadi node `<biz>` yang mengaku `mixed` juga tidak menyelamatkan daftar button yang melanggar.

Node `<biz>` itu paruh yang lain, dan library ini sudah mengirimnya. Kalau button pertamanya bukan salah satu dari sedikit flow yang butuh namanya sendiri, yang dikirim adalah:

```xml
<biz actual_actors="2" host_storage="2" privacy_mode_ts="…">
  <interactive type="native_flow" v="1">
    <native_flow v="9" name="mixed"/>
  </interactive>
  <quality_control decision_id="…" source_type="third_party">…</quality_control>
</biz>
```

`v="9" name="mixed"` itu atribut stanza, tidak berhubungan dengan `messageVersion` di protobuf — yang tetap harus `1`. Dengan node-nya menyebut `mixed`, nama flow apa pun yang dihasilkan button-mu diterima, jadi constraint button di atas satu-satunya yang masih bisa gagal.

`nativeFlowButtonsViolateConstraints` diekspor supaya kamu bisa memeriksa sendiri satu daftar terhadap aturan Web, dan menyerahkan daftar yang melanggar akan mencatat peringatan yang menyebutkan batasnya dan jenis yang ditemukannya. Itu peringatan dan bukan error justru karena aplikasi tetap menggambarnya: anggap sebagai "ini akan kosong bagi siapa pun yang membaca di desktop", bukan "ini rusak".

Ini campuran lengkapnya lewat `sendMessage`, tanpa impor — satu jenis button, masih di dalam batasnya, jadi tergambar di mana-mana:

```js
const teks = '✨ MENU ELAINA\n\nPilih kategori di bawah.'

await sock.sendMessage(jid, {
  text: teks,
  footer: 'Elaina - MultiDevice',
  nativeFlow: [
    { text: 'Semua Menu', id: '.allmenu' },
    { text: 'Downloader', id: '.menu downloader' },
    { text: 'Sticker', id: '.menu sticker' }
  ],
  optionText: 'Pilih Kategori',
  optionTitle: 'Kategori',
  bloksWidget: {
    type: 'im_a2ui',
    uuid: crypto.randomUUID(),
    fallback: teks,
    data: JSON.stringify({ type: 'info_card', title: '✨ MENU ELAINA', body: 'Pilih kategori di bawah.' })
  }
})
```

Mencampur jenis dalam satu pesan tidak masalah bagi pembaca di ponsel, dan bentuknya seperti ini — lima jenis, lima nama, empat di antaranya memang tidak punya nama flow di WA Web:

```js
await sock.sendMessage(jid, {
  text: 'Semua jenis tombol dalam satu pesan',
  footer: 'Elaina - MultiDevice',
  nativeFlow: [
    { text: 'Balas', id: '.menu' },
    { text: 'Situs', url: 'https://nixel.dev' },
    { text: 'Telepon', call: '+628000000000' },
    { name: 'send_location', buttonParamsJson: '' },
    { text: 'Pilih', sections: [{ title: 'Kategori', rows: [{ title: 'Downloader', id: '.menu downloader' }] }] }
  ]
})
```

Itu mencatat peringatan constraint-nya dan tergambar di ponsel. Kalau pesan yang sama juga harus jalan di tab browser, pecah supaya setiap pesan membawa satu jenis saja, maksimum tiga untuk jenis non-quick-reply:

```js
await sock.sendMessage(jid, {
  text: 'Tautan penting',
  nativeFlow: [
    { text: 'Situs', url: 'https://nixel.dev' },
    { text: 'Channel', url: 'https://whatsapp.com/channel/xxxx' }
  ]
})
```

Ada satu jalan keluar dari seluruh pemeriksaan ini, dan itu alasan kenapa menu dengan kartu A2UI bisa lebih longgar daripada yang tanpa: `if (!S && (msgContext === 'relay' || …))`. Dengan widget `im_a2ui` yang valid dan `im_bloks_widget_enable` aktif, validasi nama flow-nya tidak pernah dijalankan. Itu gerbang yang tidak kamu kendalikan, jadi bangun button-nya tetap sesuai aturan dan anggap widget-nya bonus.

Jaga `bloksWidget.fallback` identik byte-per-byte dengan `text`. Klien menyembunyikan teks bubble-nya hanya kalau widget-nya aktif **dan** keduanya sama (`if (S && k === msg.bloksWidget?.fallback) k = null`), jadi payload yang sama menggambar widget-nya di tempat prop-nya aktif dan teks biasa di tempat yang tidak, bukan menampilkan isinya dua kali.

#### Di dalam `richResponseMessage`, semuanya bisa dicampur

Di sinilah respons rich benar-benar bisa disusun. Empat daftar berjalan bersama dan tidak ada yang saling berebut:

| Slot | Membawa |
|---|---|
| `sections` | view model-nya — satu per `addText`, `addCode`, `addSection`, … |
| `submessages` | paruh protobuf yang dipasangkan `addTable`, `addCode`, dan `addMap` dengan section-nya |
| `footer_sections` | `addFooterSection`, digambar di bawah badan pesan |
| `embedded_screens` | `addEmbeddedScreen`; WhatsApp memanggil `stripEmbeddedScreens` sebelum menggambar, jadi ini sampai ke model tapi tidak menggambar apa-apa |

`messageContextInfo` ikut di sebelahnya di tingkat atas, bukan berebut, karena pemindaian kunci kontennya hanya mencocokkan `conversation` atau nama yang mengandung `Message` — dan `messageContextInfo` tidak mengandung keduanya. Begitulah `botMetadata` dan bukti verifikasinya bisa ikut bersama respons rich.

Widget Bloks juga bisa hidup **di dalam** respons rich, bukan di sebelahnya, sebagai section ketimbang field `interactiveMessage`:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock).setTitle('Elaina AI')

rich.addText('*Statistik hari ini*')
rich.addSection(MB.bloksSection('im_a2ui', { type: 'info_card', title: 'Penjualan', body: 'Rp 1.250.000' }))

await rich.send(jid)
```

Itu memancarkan `FOABloksPrimitive`, salah satu dari delapan belas nama yang juga digambar WA Web — jadi berbeda dari jalur `interactiveMessage.bloksWidget`, yang ini tidak berada di belakang `im_bloks_widget_enable`.

### Inline Entity di Dalam Teks

`addText` dan `addTable` memindai string-nya untuk empat bentuk mirip markdown lalu mengubahnya menjadi **inline entity** — bagian yang digambar klien sebagai tautan, kutipan, dan rumus di dalam satu paragraf, bukan sebagai section terpisah.

| Kamu menulis | Menjadi | `__typename` |
| --- | --- | --- |
| `[label](https://x.test)` | tautan yang bisa diketuk | `GenAIInlineLinkItem` |
| `[label](!https://x.test)` | sama, tapi ditandai tidak dipercaya | `GenAIInlineLinkItem` |
| `[label](>whatsapp://settings)` | deeplink ke sebuah aplikasi | `GenAIDeeplinkItem` |
| `[](https://x.test)` | kutipan sumber bernomor | `GenAISearchCitationItem` |
| `[x^2]<https://img.test>` | rumus yang digambar | `GenAILatexItem` |

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock).setTitle('Elaina AI')

rich.addText('buka [Setelan](>whatsapp://settings), atau lihat [situsnya](https://nixel.dev)')

await rich.send(jid)
```

Dua prefiks itu penanda pada **targetnya**, bukan pada labelnya, dan dilepas sebelum dikirim:

- `!` — tautannya tidak dipercaya, jadi `is_trusted: false` ikut dikirim.
- `>` — ini deeplink, jadi dikirim sebagai `deeplink_url` pada `GenAIDeeplinkItem`, bukan `url` pada `GenAIInlineLinkItem`.

Deeplink itu untuk skema yang diserahkan ponsel ke sebuah aplikasi (`whatsapp://`, `fb://`, `instagram://`), bukan ke halaman web. Klien mem-parse keduanya menjadi jenis node yang berbeda, jadi mengirim skema aplikasi sebagai tautan biasa bukan hal yang sama.

```js
rich.addText(text, { deeplink: false })
rich.addText(text, { hyperlink: false, citation: false, latex: false })
rich.addText(text, { extract: false })
```

Tiga baris itu opsi pada satu panggilan, bukan urutan untuk dijalankan apa adanya — pilih flag yang kamu mau lalu kirim seperti di atas.

`AI_RICH_INLINE_ENTITIES` mendaftar keempatnya. Daftarnya sengaja tertutup — parser Web memilih jalur berdasarkan `__typename` dan **melempar** `inline entity <name>` untuk apa pun di luarnya, jadi nama kelima yang dikarang merusak seluruh pesannya, bukan menurunkannya pelan-pelan.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const info = MB.decodeAIRich(m.message)
const inline = info.sections.flatMap(s => s.view_model?.primitive?.inline_entities ?? [])
console.log(inline.map(e => e.metadata.__typename))
```

### Menyunting Pesan Yang Sudah Tampil

Setiap panggilan `add*` menerima `id`, `insertAt`, dan `replace`, jadi pesan yang sudah terkirim bisa terus berubah ketimbang dikirim ulang.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock)
  .setTitle('Elaina AI')
  .addText('Sedang dikerjakan…', { id: 'intro' })

await rich.send(jid)

rich.addImage('', { status: 'GENERATING', update_text: 'Membuat gambar…', insertAt: 'intro', id: 'pic' })
await rich.sendEdit()

rich.addImage('https://example.com/result.jpg', { replace: 'pic' })
await rich.sendEdit()
```

`sendEdit()` memakai ulang key dari `send()` terakhir, jadi untuk kasus yang umum tidak perlu jid atau id pesan; serahkan keduanya secara eksplisit kalau mau menyunting pesan lain. `buildEdit(jid, id)` mengembalikan payload suntingannya tanpa mengirimnya.

Pembukuan item:

```js
rich.getIds()          // [ 'intro', 'pic' ]
rich.hasId('pic')      // true
rich.peek('pic')       // node di balik id itu
rich.assignId(0, 'first')  // memberi nama item yang belum punya id
rich.delete('pic')
```

`assignId` menolak mengganti nama item yang sudah punya id, dan menolak id yang sedang dipakai item lain.

Target yang salah melempar error bertipe ketimbang gagal tanpa suara — `ItemNotFoundError`, `DuplicateIdError`, `InvalidTargetError`, dan `ContentValidationError`, semuanya turunan `AIRichError` dengan field `code`.

### Mencampur Instance

`sections` dan `items` membuka apa yang dipegang sebuah builder, jadi konten yang dibangun di satu instance bisa dijatuhkan ke instance lain.

```js
const cards = new MB.AIRich(sock)
  .addProduct({ title: 'Elaina', brand: 'Baileys', product_url: 'https://example.com' })
  .addPost({ username: 'elaina', caption: 'Halo', url: 'https://example.com' })
  .items

rich.addSection(MB.newLayout('HScroll', cards), { id: 'mixed' })
await rich.sendEdit()
```

### Membaca Pesan Yang Sudah Ada

`loadFrom` membangun ulang sebuah builder dari pesan yang kamu terima, jadi pesan interaktif yang masuk bisa disunting dan dikirim lagi.

```js
const rich = new MB.AIRich(sock).loadFrom(m.message)
const button = new MB.Button(sock).loadFrom(m.message)
const carousel = new MB.Carousel(sock).loadFrom(m.message)
const buttonV2 = new MB.ButtonV2(sock).loadFrom(m.message)
```

### Primitif Yang Belum Punya Helper

MessageBuilder mencakup 11 dari primitif yang digambar langsung WA Web. Sisanya dibuka di sini sebagai pembangun section biasa yang kamu jatuhkan ke `addSection`; katalog Meta AI yang lebih luas ada di [Sisa Katalog Meta AI](#sisa-katalog-meta-ai).

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock)
  .setTitle('Elaina AI')
  .setFooter('Dibuat dengan AIRich')

rich.addText('*Laporan render*')
rich.addSection(MB.dividerSection(), { id: 'rule' })
rich.addSection(MB.spacerSection({ spacing: 3 }))
rich.addSection(MB.imageSection('https://example.com/photo.jpg'))
rich.addSection(MB.taskSection({ taskId: 'job-1', title: 'Rendering', subtitle: 'frame 12/60', status: MB.TaskStatus.RUNNING }))
rich.addSection(MB.latexSection('E = mc^2'))
rich.addSection(MB.thinkingSection('Mencari di web…', { icon: MB.ThinkingIcon.WEB_SEARCH }))
rich.addSection(MB.progressSection('Hampir selesai', { inProgress: false }))

await rich.send(jid)
```

| Builder | Primitif | Field |
|---|---|---|
| `dividerSection` | `GenAIDividerPrimitive` | `divider_type` — `HORIZONTAL_LINE` atau `DOT` |
| `spacerSection` | `GenAISpacerPrimitive` | `spacing`; nilai 1 atau kurang menggambar garis, lebih dari itu menggambar sebanyak itu baris kosong |
| `imageSection` | `GenAIImagePrimitive` | `full_image` / `preview_image`, masing-masing dengan `url` dan `url_fallback` |
| `taskSection` | `GenAITaskPrimitive` | `task_id`, `title`, `subtitle`, `status`; `task_id` yang kosong membuat klien membuang item-nya |
| `latexSection` | `GenAILatexUXPrimitive` | `latex_expression`, plus `latex_image` hasil render yang opsional |
| `thinkingSection` | `GenAIBotThinkingStatusPrimitive` | `title`, `icon`, `is_in_progress`, `meta_search_apps`, `thought_duration_sec` |
| `progressSection` | `GenAIBotProgressStatusPrimitive` | field-nya sama dengan thinking |

Dua primitif sengaja tidak disertakan: `GenAIMetaSubsQuotaUpsellPrimitive` itu kartu penawaran langganan Meta, dan `FOABloksPrimitive` menyebut satu layar Bloks yang diambil klien dari server Meta, bukan dibaca dari pesannya — dan keduanya tidak bisa diisi bot.

### Sisa Katalog Meta AI

`AIRichMessage` adalah bentuk yang dikirim Meta AI sendiri, dan bot mencapainya dengan meneruskan salah satunya. Jadi katalognya jauh lebih besar daripada yang dicakup section di atas: klien WhatsApp mem-parse sekitar empat puluh primitif, dan `AI_RICH_PRIMITIVES` sekarang mendaftar semuanya, dengan `AI_RICH_ITEMS` untuk node item yang dibawa sebuah layout.

Satu catatan yang perlu diketahui sebelum kamu membangun kartu di sekitar salah satunya: katalog penuhnya tergambar di aplikasi WhatsApp, dan di situlah penerimamu berada. WA Web desktop yang tertinggal — ia membawa renderer untuk delapan belas nama dan memetakan sisanya ke node kosong. Pesannya tetap sampai bagaimanapun dan section lainnya tetap tergambar, jadi penonton di desktop melihat bolong, bukan kegagalan.

#### Bagian yang juga tergambar di desktop

`AI_RICH_PRIMITIVES_WEB_RENDERED` adalah bagian katalog yang juga bisa digambar WA Web, jadi kartu yang dibangun hanya dari nama-nama ini tampil sama di aplikasi dan di browser. Daftarnya dibaca dari `getPlainTextFromUnifiedResponse`, satu-satunya modul yang mencacah setiap primitif yang dikenal klien Web, plus `WAWebUnifiedResponseUtils` untuk dua nama lagi. Sampai revisi `1047301412` jumlahnya delapan belas primitif, ditambah tiga layout:

| | |
|---|---|
| Teks & struktur | `GenAIMarkdownTextUXPrimitive`, `GenAICodeUXPrimitive`, `GenAILatexUXPrimitive`, `GenATableUXPrimitive`, `GenAIMetadataTextPrimitive`, `GenAIDividerPrimitive`, `GenAISpacerPrimitive` |
| Media & kartu | `GenAIImagePrimitive`, `GenAIImaginePrimitive`, `GenAIReelPrimitive`, `GenAIPostPrimitive`, `GenAIProductItemCardPrimitive`, `GenAISearchResultPrimitive` |
| Status | `GenAIBotThinkingStatusPrimitive`, `GenAIBotProgressStatusPrimitive` |
| Penawaran | `GenAIMetaSubsQuotaUpsellPrimitive` |
| FOA | `FOATextPrimitive`, `FOABloksPrimitive` |
| Layout | `GenAISingleLayoutViewModel`, `GenAIGridLayoutViewModel`, `GenAIHScrollLayoutViewModel` |

Sisa `AI_RICH_PRIMITIVES` — peta, video, pengingat, olahraga, langkah search-planner, permukaan 3P dan Clippy, section HTML, serta layout `VStack`, `ActionRow`, `AddonAction`, `FlexibleCountGrid`, `RichListItem`, `MultipleResponse`, dan `IGSuggestedBloomCard` — tergambar di aplikasi dan keluar sebagai node kosong di browser.

Dua nama duduk aneh di tengah: `GenAIFollowUpSuggestionPillPrimitive` dan `GenAITaskPrimitive` punya parser hanya di `cometComposedTextV2GenAiUxPrimitiveParser`, renderer Comet milik Facebook, dan tidak ada di modul `WAWeb*` mana pun — tapi kedua namanya ada di dex Android, jadi aplikasi itu tempat mengujinya. Di desktop keduanya mendarat di node kosong seperti semua yang di luar tabel di atas.

Inline entity satu-satunya tempat nama yang tidak dikenal jadi fatal, bukan diabaikan — lihat peringatan di [Inline Entity di Dalam Teks](#inline-entity-di-dalam-teks). `AI_RICH_INLINE_ENTITIES` tetap tertutup di empat karena alasan itu.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock).setTitle('Elaina AI')

rich.addSection(MB.mapSection({
  staticMapUrl: 'https://example.com/static-map.png',
  motivation: 'Tempat makan dekat kamu',
  items: [
    MB.placeItem({
      id: '1',
      name: 'Warung Sederhana',
      rating: 4.6,
      latitude: -6.2,
      longitude: 106.8,
      categoryName: 'Rumah makan'
    })
  ]
}))

rich.addSection(MB.sportsSection({
  gameId: 'g-1',
  league: MB.SportsLeague.EURO,
  status: MB.SportsGameStatus.LIVE,
  statusDetail: "72'",
  homeTeam: { name: 'Indonesia', abbreviation: 'IDN' },
  awayTeam: { name: 'Vietnam', abbreviation: 'VIE' },
  homeScore: 2,
  awayScore: 1
}))

rich.addSection(MB.actionListSection([
  MB.actionListRow({ title: 'Buka peta', url: 'https://maps.example.com' }),
  MB.actionListRow({ title: 'Telepon', action: 'tel:+62800000000' })
]))

rich.addSection(MB.searchPlannerSection({
  queryUrl: 'https://search.example.com?q=cuaca',
  steps: [
    MB.plannerStep({ title: 'Cari cuaca', status: MB.SearchPlannerStepStatus.COMPLETED }),
    MB.plannerStep({ title: 'Ringkas hasil', status: MB.SearchPlannerStepStatus.IN_PROGRESS })
  ]
}))

await rich.send(jid)
```

| Builder | Primitif | Field utama |
|---|---|---|
| `mapSection` | `GenAIMapPrimitive` | `map_query_status`, `static_map`, `items`, `motivation` — untuk peta yang benar-benar tergambar pakai `rich.addMap`, lihat di bawah |
| `placeItem` | `GenAIPlaceDetailsItem` | `id`, `name`, `image_url`, `item_type`, `category`, `price_level`, `opening_status`, `opening_hours`, `rating`, `address`, `marketplace_metadata` |
| `sportsSection` | `GenAISportsWidgetPrimitive` | `game_id`, `league`, `status`, `status_detail`, `start_time_utc_seconds`, `venue`, `group`, `content` |
| `videoSection` | `GenAIVideoPrimitive` | `post_id`, `reels_url`, `reels_title`, `creator`, `video_delivery_response` |
| `reminderSection` | `GenAIReminderPrimitive` | `reminder_id`, `title`, `trigger_type`, `trigger_time`, `thumbnail_url` |
| `commentSection` | `GenAICommentPrimitive` | `comment_text`, `comment_url`, `actor_name`, `likes_count`, `replies_count` |
| `compactEntitySection` | `GenAICompactEntityPrimitive` | `title`, `subtitle`, `entity_id`, `entity_type`, `action_type` |
| `actionListSection` / `actionListRow` | `GenAIActionListPrimitive` | `rows` of `title`, `subtitle`, `action`, `icon`, `url`, `row_type` |
| `searchPlannerSection` / `plannerStep` | `GenAISearchPlannerStepsPrimitive` | `sources`, `steps`, `query_url`, `search_engine`, `facepile_favicons` |
| `searchResultV2Section` | `GenAISearchResultV2Primitive` | field yang sama plus `response_id` |
| `plannerSnippetSection` | `GenAISearchPlannerStepSnippetPrimitive` | `header`, `current_step`, `total_steps`, `status` |
| `chainOfThoughtSection` | `GenAIChainOfThoughtStepPrimitive` | `header`, `subtitle`, `markdown_text` |
| `searchAdSection` | `GenAISearchAdPrimitive` | `story_id`, `actor_name`, `actor_image_url`, `image_url`, `message` |
| `chainingSuggestionSection` | `GenAIChainingSuggestionPrimitive` | `prompt_text`, `image_uri`, `external_conversation_id`, `topic`, `card_id` |
| `locationPermissionSection` | `GenAILocationPermissionPrimitive` | `placeholder` |
| `timestampPlaceholderSection` | `GenAITimestampPlaceholderPrimitive` | `placeholder` |
| `transparencySection` / `transparencySignal` | `GenAIP13NTransparencyPrimitive` | `annotation`, `signals`, `response_id` |
| `professionalConsentSection` | `GenAIProfessionalConsentPrimitive` | `title`, `body`, `status`, `provider_label`, `cta_label` |
| `accountLinkingSection` / `accountLinkingApp` | `GenAI3PAccountLinkingUpsellPrimitive` | `integration_type`, `integration_status`, `cta_url`, `bottomsheet.apps` |
| `calendarWidgetSection` / `calendarEvent` | `GenAI3PExtWidgetPrimitive` | `header`, `sections` of dates and events, `ctas`, `toast` |

#### Peta digambar dari submessage, bukan dari section

`GenAIMapPrimitive` itu node peta milik aplikasi Meta AI sendiri. Klien WhatsApp membaca peta dari tempat yang sama sekali lain: dari daftar submessage protobuf, sebagai `AIRichResponseSubMessageType.AI_RICH_RESPONSE_MAP` (7) yang membawa `mapMetadata`. Section yang berdiri sendiri memang tiba, tapi tidak menggambar apa-apa.

`rich.addMap` memancarkan kedua paruhnya sekaligus, sama seperti `addTable` dan `addCode` memasangkan section dengan metadata-nya:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock).setTitle('Elaina AI')

rich.addText('*Tempat makan dekat kamu*')
rich.addMap([
  { latitude: -6.2088, longitude: 106.8456, title: 'Warung Sederhana', body: 'Rumah makan padang' },
  { latitude: -6.2150, longitude: 106.8500, title: 'Bakso Pak Kumis', body: 'Bakso urat' }
])

await rich.send(jid)
```

Setiap tempat butuh `latitude` dan `longitude` berupa angka — selain itu dilempar error, bukan menjatuhkan pin di 0,0. Pin dinomori dari satu mengikuti urutan yang kamu serahkan. Petanya berpusat di rata-rata tempat-tempatnya kecuali kamu memberi `center`, dan `latitudeDelta` / `longitudeDelta` (bawaan `0.05` keduanya) menentukan seberapa luas area yang masuk frame. `showInfoList` menggambar daftarnya di bawah peta, `motivation` baris di atasnya, dan `staticMapUrl` mengisi paruh section untuk klien yang justru membaca itu.

Item itu node yang dibawa sebuah layout, bukan section yang berdiri sendiri, jadi bangun dulu lalu serahkan ke sebuah layout:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock).setTitle('Elaina AI')

rich.addSection(MB.mediaGridSection([
  MB.mediaItem({ previewUrl: 'https://example.com/1-small.jpg', fullUrl: 'https://example.com/1.jpg' }),
  MB.mediaItem({ previewUrl: 'https://example.com/2-small.jpg', fullUrl: 'https://example.com/2.jpg' })
]))

rich.addSection(MB.contextualSourcesSection([
  { url: 'https://example.com/a', title: 'Sumber A', favicon: 'https://example.com/a.ico' }
]))

await rich.send(jid)
```

`mediaItem`, `placeEntityItem`, `socialEntityItem`, `productEntityItem`, `threadSurfingItem`, `sideBySideSurveyItem`, `accountLinkingApp`, `calendarEvent`, `actionListRow`, `plannerStep`, dan `transparencySignal` semuanya mengembalikan node item.

Dua layout bergabung dengan delapan yang sudah didukung: `multipleResponseSection(responses, { layoutType })` membangun `GenAIMultipleResponseLayoutViewModel`, dan `bloomCardSection(primitives)` membangun `GenAIIGSuggestedBloomCardLayoutViewModel`. `addonActionSection(primitives, { actionType, alignment })` mengisi field `addon_action_alignment` yang tidak disetel helper addon sebelumnya.

Untuk apa pun yang belum dimodelkan di sini, `customSection` mengirim node-nya langsung — klien memilih jalur berdasarkan `__typename` dan tidak ada yang lain:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock).setTitle('Elaina AI')

rich.addSection(MB.customSection('GenAISourcedItem', { sourced_item_type: 'THREADS_POST' }))
rich.addSection(MB.customSection('GenAITopicLinkItem', { title: 'Bali' }, { layout: 'HScroll' }))

await rich.send(jid)
```

Enum untuk semua yang di atas ikut bersama builder-nya: `MapQueryStatus`, `PlaceDetailsItemType`, `PlaceOpeningStatus`, `PlacePriceLevel`, `SportsLeague`, `SportsGameStatus`, `SportsSeasonType`, `CompactEntityType`, `CompactEntityActionType`, `ActionListRowType`, `SocialEntityItemType`, `SourceApp`, `PostType`, `PostOrientation`, `ProductSourceType`, `SearchPlannerStepStatus`, `OrchestratorSearchEngine`, `ProfessionalConsentStatus`, `AccountLinkingIntegration`, `AccountLinkingStatus`, `CalendarEventOperation`, `CalendarEventState`, `WidgetCtaKind`, `WidgetCtaState`, `MultipleResponseLayoutType`, `ThreadSurfingEntityType`, `ThreadSurfingActionType`, `MediaShape`, `MediaHorizontalAlignment`, `MediaVerticalAlignment`, `AddonActionAlignment`, `ImageAssetQueryStatus`, `CodeBlockType`, `FollowUpSuggestionCategory`, `InformTreatmentRenderingType`, `UnifiedResponseSectionType`, dan `UnifiedResponseMessageGroupKind`.

`FooterActionType` juga mendapat `COPY_LINK`, `REMIX_MEDIA`, dan `USE_TEMPLATE`.

### Meneruskan Jawaban Meta AI Yang Asli

Semua yang di atas membangun respons rich dari nol. Ada jalur kedua yang berperilaku berbeda dalam satu hal penting: merelay pesan yang benar-benar datang dari Meta AI.

Klien memverifikasi pesan bot yang diteruskan terhadap sertifikat root yang dibawanya sendiri — `CN=Meta WA Feature Root CA`, ECDSA P-256, diekspor di sini sebagai `BOT_SIGNATURE_ROOT_CERTIFICATE`. Payload yang ditandatangani pendek:

```
version ("1")  ||  fbid bot  ||  byte unified response
```

Tidak ada apa pun tentang pengirim, id pesan, timestamp, atau penerima di dalamnya. Itulah yang membuat penerusan bisa bekerja sama sekali: relay ketiga hal itu tanpa diubah dan buktinya tetap terverifikasi, siapa pun yang meneruskannya.

`forwardRichResponse` merelay tanpa menyentuh satu pun di antaranya:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const msg of messages) {
    if (MB.verifyRichResponseSignature(msg).status !== 'passed') continue
    await MB.forwardRichResponse(sock, '120363xxxx@g.us', msg, { quoted: msg })
  }
})
```

`contextInfo` bukan bagian dari payload yang ditandatangani, jadi kutipan, mention, dan sisanya bebas berubah. Byte unified response, buktinya, dan `forwardedAiBotMessageInfo.botJid` tidak.

`MB.loadFrom` juga mempertahankan buktinya. Kalau pesan masuk membawa rantai sertifikat yang asli, byte aslinya dan metadata verifikasi aslinya langsung keluar kembali saat `build` — tanpa diserialisasi ulang, tanpa placeholder. `rich.isSignaturePreserved` memberi tahu apakah itu masih berlaku.

Konsekuensinya lebih penting daripada fiturnya: **suntingan apa pun membatalkannya.** `addText`, `addSection`, `delete`, `addFooterSection`, `clearFooterSections`, `addEmbeddedScreen`, `setResponseId`, `refreshResponseId`, dan `setResponseMeta` semuanya membuang tanda tangan yang dipertahankan, karena byte yang dicakupnya sudah tidak cocok lagi. Setelah salah satunya, build-nya jatuh ke JSON yang baru diserialisasi dan metadata placeholder, persis seperti sebelumnya.

Jadi: relay atau muat-lalu-kirim-ulang kalau kamu mau buktinya selamat, dan perlakukan `AIRich` sebagai alat penulisan begitu kamu mengubah apa pun.

| Fungsi | Menjawab |
|---|---|
| `readSignedRichResponse(msg)` | bagian yang dicakup sebuah bukti: `unifiedResponseBytes`, `botJid`, `proof`, plus `hasProof` untuk sekadar tahu apakah field-nya terisi |
| `verifyRichResponseSignature(msg)` | `{ status: 'passed' \| 'failed', reason }` — pemeriksaan sungguhan: rantai ke root Meta, jendela masa berlaku, lalu Ed25519 atas payload di atas |
| `verifyBotSignature({ botJid, unifiedResponseBytes, proof })` | pemeriksaan yang sama dengan bagian-bagiannya diserahkan manual |
| `constructSignaturePayload({ botFbid, messageDigest })` | byte persis yang ditandatangani |

Pencabutan sertifikat tidak diperiksa. Klien mengambil CRL dari Meta dan menganggap daftar yang tidak tersedia atau kedaluwarsa sebagai tercabut; `verifyRichResponseSignature` melewati langkah itu, jadi `passed` di sini berarti rantai dan tanda tangannya baik, bukan berarti sertifikatnya masih hidup.

#### Yang tidak bisa dimiliki respons bikinan sendiri

Tanda tangan atas konten yang bukan produksi Meta bukan sesuatu yang bisa dicetak bot — itu butuh sertifikat leaf yang diterbitkan di bawah root tersebut. `AIRich` mengisi `verificationMetadata` dengan byte placeholder supaya field-nya ada dan berbentuk benar; `verifyRichResponseSignature` atas keluaranmu sendiri mengembalikan `failed`, dan itu benar.

Apakah itu merugikanmu atau tidak bergantung pada sakelar sisi server yang tidak bisa kamu lihat:

- `ai_rich_response_forwarding_verification_enabled_v1` — `none`, `log_only`, atau `enforce_blocking`. Hanya yang terakhir bertindak atas kegagalan.
- `ai_rich_response_unknown_sender_verification_masking_enabled` — menentukan kapan pesan yang gagal diganti bubble cadangan ketimbang digambar.
- `ai_rich_response_unknown_sender_preview_enabled` — melipat respons rich yang membawa media kalau pengirimnya tidak ada di kontak penerima, verifikasinya jalan atau tidak.
- `ai_unified_response_receiver_web_timestamp_v2` — WA Web hanya menggambar unified response kalau timestamp pesannya sama atau setelah nilai ini.

Keempatnya disetel per akun oleh server. Sebuah respons bisa sempurna secara struktur dan tetap keluar sebagai bubble cadangan, dan tidak ada cara mengetahuinya dari sisi pengirim.

### Membaca Balik Pesan Rich

Pesan AI Rich, A2UI, atau Bloks tiba dengan keadaan kosong di tempat yang biasa dilihat bot — `conversation` kosong, `extendedTextMessage` tidak ada, dan `getContentType` hanya melaporkan pembungkusnya (`botForwardedMessage` atau `interactiveMessage`). `readRichMessage` menormalkan semuanya menjadi satu bentuk.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

sock.ev.on('messages.upsert', ({ messages }) => {
    for (const msg of messages) {
        const rich = MB.readRichMessage(msg)
        if (!rich) continue
        console.log(rich.kind, rich.text)
    }
})
```

Ia mengembalikan `null` untuk apa pun yang bukan salah satunya, jadi aman dipanggil di setiap pesan.

| Field | Isinya |
|---|---|
| `kind` | `a2ui`, `airich`, `bloks`, atau `interactive` |
| `text` | semua string yang bisa dibaca, disambung dengan baris baru — primitif teks AI Rich, komponen `Text` A2UI, serta badan dan footer interaktifnya |
| `title` | `botMetadata.messageDisclaimerText`, jatuh ke judul header interaktifnya |
| `buttons` | button native flow dengan `buttonParamsJson` yang sudah di-parse; `params` bernilai `null` kalau tidak bisa di-parse |
| `html` | payload dari primitif HTML mana pun, termasuk yang ada di dalam layar tertanam |
| `a2ui` | `surfaceId`, `catalogId`, `version`, dan daftar komponennya |
| `bloks` | `type`, `uuid`, `fallback`, dan `params` yang sudah di-parse |
| `typenames`, `sections`, `footerSections`, `embeddedScreens`, `embeddedTabs`, `submessages`, `responseId` | bagian AI Rich-nya, kosong kalau tidak ada |

Ia membuka view-once dan pembungkus lainnya dulu, jadi kartu di dalam `viewOnceMessageV2` terbaca sama dengan yang tanpa pembungkus.

### Kartu A2UI

`interactiveMessage.bloksWidget` dengan `type: "im_a2ui"` menghasilkan kartu yang digambar klien **dari spesifikasi deklaratif yang dibawa pesannya**. Tanpa HTML, tanpa hosting, dan berbeda dari Bloks lainnya, tidak ada yang diambil dari Meta — komponennya berjalan di dalam `data` dan klien yang menata letaknya.

> [!WARNING]
> Bentuk payload di bawah sudah terkonfirmasi: `bloksWidget` bentuk ini yang ditulis tangan tergambar di Android, dan klien menjawab yang cacat dengan `A2UIValidationException` bernama. Helper `sendA2UI` **belum** terkonfirmasi — kartu yang dikirim lewatnya belum pernah terlihat tergambar, dan penyebabnya masih terbuka. Sampai itu selesai, bangun `bloksWidget`-nya dengan tangan kalau kamu butuh ini bekerja.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

await MB.sendA2UI(sock, jid, [
    MB.a2uiColumn('root', ['card_image', 'card_title', 'card_body']),
    MB.a2uiImage('card_image', 'https://example.com/header.jpg'),
    MB.a2uiText('card_title', 'Selamat datang!', { variant: 'h1' }),
    MB.a2uiText('card_body', 'Senang kamu di sini.')
], {
    buttons: [{
        name: 'cta_url',
        buttonParamsJson: JSON.stringify({ display_text: 'Gabung Grup', url: 'https://chat.whatsapp.com/…' })
    }]
})
```

Layout-nya daftar datar yang dialamati lewat id: tepat satu komponen harus bernama `root`, dan kontainer menyebut anaknya lewat id ketimbang menyarangkannya. `sendA2UI` melempar error kalau `root` tidak ada.

| Builder | Memancarkan |
|---|---|
| `a2uiColumn(id, children)` | `Column` — anaknya ditumpuk vertikal |
| `a2uiRow(id, children)` | `Row` |
| `a2uiText(id, text, { variant })` | `Text` — `variant` bisa `h1`, `body`, dan seterusnya |
| `a2uiImage(id, url, { variant, fit })` | `Image` — bawaannya `header` dan `cover` |
| `a2uiCard(id, child)` | `Card` — menerima satu id anak, bukan array |

Pembungkus `a2uiSurface` membangun payload-nya sendiri kalau kamu mau menulis tangan komponen yang belum dicakup helper-nya:

```js
{
  version: 'v0.9',
  createSurface: {
    surfaceId: 'card-<uuid>',
    catalogId: 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
    sendDataModel: false,
    components: [ … ]
  }
}
```

`catalogId` menyebut kosakata komponennya, jadi komponen di luar katalog dasar tidak akan tergambar. `Column`, `Row`, `Text`, `Image`, dan `Card` sudah terkonfirmasi di perangkat — `Card` membungkus tepat satu anak dan memakai field tunggal `child`, itu sebabnya `a2uiCard` menolak array; katalognya mendaftar lebih banyak, dan `a2uiSurface` akan membawa objek apa pun yang kamu beri, tapi anggap sisanya belum teruji.

Kartu A2UI dan button native-flow hidup di `interactiveMessage` yang sama, dan begitulah kartunya mendapat baris button di bawahnya. `decodeBloksWidget(msg)` membacanya kembali, dengan `params` yang sudah di-parse.

### Mini App HTML

`htmlSection` membawa satu dokumen HTML utuh — style dan `<script>` termasuk — yang digambar aplikasi WhatsApp di dalam WebView di dalam bubble chat. Itulah cara satu halaman interaktif, game canvas kecil, atau grafik langsung sampai ke pengguna tanpa menghosting apa pun. Ia bagian dari `AI_RICH_PRIMITIVES` dan bukan bagian dari `AI_RICH_PRIMITIVES_WEB_RENDERED`: namanya tidak muncul di mana pun di bundle WA Web, jadi penonton desktop mendapat node kosong di tempat halaman itu seharusnya.

**Typename-nya tidak divalidasi.** `GenAIaeacdsnwHtmlPrimitive` juga tidak muncul di mana pun di APK — tidak di dex, resource, maupun library native. Klien mendekode unified response lewat runtime Pando milik Meta (`com.facebook.pando.TreeJNI`), yang menafsirkan ulang sebuah node pohon menjadi kelas model **tanpa membandingkan `__typename`**. Renderer-nya justru memilih jalur berdasarkan bentuk field-nya, dan mencatat `JarvisRichContent/render skipped malformed HtmlSectionContent` kalau bentuknya tidak pas. Yang benar-benar harus ada adalah `payload` dan `trusted_sources` — dua nama field itu, plus kelas `HtmlSectionContent(payload=, trustedSources=)`, ada di APK. Model Kotlin untuk section-nya adalah `FOAHtmlPrimitive`, diekspor sebagai `AI_RICH_HTML_PRIMITIVE_CLASS`. Yang perlu diketahui sebelum kamu bersandar pada penggantian itu: satu-satunya kelas dex yang membawa nama `FOAHtmlPrimitive` adalah `FOAHtmlPrimitiveDemoDONOTUSEImpl`, sementara jalur render yang benar-benar mencatat baris di atas dibangun di sekitar `HtmlSectionContent`. Jadi typename bawaannya yang sebaiknya dipakai, dan penggantinya itu cadangan untuk dicoba, bukan padanan.

Beri `typename` untuk mengirim section-nya dengan nama lain:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock).setTitle('Dashboard')

rich.addSection(MB.htmlSection(html, { typename: MB.AI_RICH_HTML_PRIMITIVE_CLASS }))

await rich.send(jid)
```

Bawaannya tetap `GenAIaeacdsnwHtmlPrimitive` karena itu nama yang teramati bekerja di produksi.

| Klien | Hasilnya |
|---|---|
| Android | tergambar di WebView, script jalan, ketukan dan tombol bekerja |
| Web / Desktop | section-nya tiba kosong; `label` tetap tampil |
| iOS | belum diuji |

WebView tempatnya digambar itu offline dan tidak punya penyimpanan — baca [apa yang sebenarnya disediakannya](#apa-yang-sebenarnya-disediakan-webview) sebelum merancang di sekitarnya.

#### sendHtmlApp

Satu panggilan, tanpa menyusun pembungkusnya sendiri.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'
import { readFileSync } from 'node:fs'

await MB.sendHtmlApp(sock, m.chat, readFileSync('./dino.html', 'utf8'), {
  title: 'NIXEL DINO',
  label: 'Dino Runner',
  trustedSources: ['nixel.dev']
})
```

```
MB.sendHtmlApp(sock, jid, html, options?) => Promise<WAMessage>
```

| Argumen | Wajib | Artinya |
|---|---|---|
| `sock` | ya | socket yang dikembalikan `makeWASocket` |
| `jid` | ya | chat tujuan |
| `html` | ya | dokumen HTML-nya; harus string yang tidak kosong |

| Opsi | Bawaan | Artinya |
|---|---|---|
| `title` | `''` | baris disclaimer bot di atas kartunya |
| `label` | tidak ada | submessage teks biasa; satu-satunya bagian yang bisa ditampilkan Web dan Desktop |
| `trustedSources` | `[]` | origin yang digambar sebagai atribusi di bawah kartunya |
| `height` | tidak ada | paku halamannya ke sebanyak ini piksel supaya host berhenti mengukurnya ulang |
| `id` | tidak ada | id section, supaya kamu bisa `replace` nanti di builder yang sama |

Apa pun selain itu diteruskan ke `MB.send`, jadi `bypassDownload`, `forwarded`, `notification`, `includesUnifiedResponse`, `includesSubmessages`, `messageId`, dan `additionalNodes` semuanya jalan.

**`bypassDownload` di sini bawaannya `false`**, berbeda dari `MB.send` yang `true`. Kalau dinyalakan, setiap pengiriman merelay dua kali — pesan yang sebenarnya, lalu satu suntingan langsung (`protocolMessage` tipe 14) yang membawa isi identik — dan klien menggambar kartunya, lalu menggambarnya ulang. Untuk kartu statis itu cuma kedipan; untuk halaman yang menjalankan loop animasi itu memulai ulang seluruh WebView-nya. Jadi mini app mengirim sekali saja secara bawaan. Nyalakan lagi kalau ada kartu yang gagal muncul tanpa itu.

| Yang diberikan | Jumlah relay | Akibatnya |
|---|---|---|
| *(bawaan)* | 1 | satu pesan, tanpa suntingan lanjutan |
| `bypassDownload: true` | 2 | pesan, lalu suntingannya — halamannya digambar ulang |
| `includesUnifiedResponse: false` | 1 | mengosongkan `unifiedResponse` — **HTML-mu hilang** |
| `messageId: 'ABC123'` | 1 | memakai id-mu, bukan yang dibangkitkan |
| `forwarded: false` | 1 | mengirim `contextInfo` kosong, membuang metadata forward Meta AI |

Suntingannya hanya pernah terjadi di bawah `includesUnifiedResponse && bypassDownload`, jadi keduanya harus aktif supaya ada relay kedua.

Yang berikut ini diisi untukmu, sesuai yang diharapkan klien:

```js
contextInfo: {
  forwardingScore: 1,
  isForwarded: true,
  forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
  forwardOrigin: 4
}
```

ditambah `messageType: 1`, satu `botResponseId` baru, dan blok `verificationMetadata`.

#### htmlSection

Use the section builder when the HTML sits alongside other sections on a builder you control.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const rich = new MB.AIRich(sock)
rich.setTitle('Dashboard')
rich.addText('Penjualan hari ini')
rich.addSection(MB.dividerSection())
rich.addSection(MB.htmlSection(chartHtml, { trustedSources: ['nixel.dev'] }), { id: 'chart' })
await rich.send(m.chat)
```

```
MB.htmlSection(html, { trustedSources?, height? }) => section
```

| Builder | Primitive | Fields |
|---|---|---|
| `htmlSection` | `GenAIaeacdsnwHtmlPrimitive` | `payload` — the HTML document; `trusted_sources` — attribution origins |

It throws a `TypeError` on an empty or non-string `html`, and on a `trustedSources` that is not an array, so a malformed card fails at build time instead of arriving blank.

#### Apa Yang Sebenarnya Disediakan WebView

Measured on an Android device, not inferred. The page is injected into a blank frame, so it runs in an opaque origin:

| Signal | Value |
|---|---|
| `location.origin` | `null` |
| `location.protocol` | `about:` |
| `document.baseURI` | `about:blank` |
| `window.isSecureContext` | `false` |
| `navigator.onLine` | `true` — it lies, ignore it |

Every remote subresource fails: images from four unrelated hosts, `fetch`, `XMLHttpRequest`, a remote `<script>`, and an `<iframe>`. No `securitypolicyviolation` event fires for any of them.

`trustedSources` does not widen that. Tested on a device with one host listed in `trustedSources` and one absent: **both images failed**. Whatever the option does, it does not buy you a remote image, so images stay `data:` URIs.

Loading is dead, but talking is not. Two transports were measured on the same device in the same bubble:

| Transport | Result |
|---|---|
| `new WebSocket('wss://…')` | **connects** — `onopen` fires |
| `RTCPeerConnection` + STUN | **gathers an `srflx` candidate**, so outbound UDP and NAT reflection work |
| `fetch` / `XMLHttpRequest` / `<img>` / `<script>` / `<iframe>` | dead |

So a mini app is offline for anything it wants to *load*, and online for anything it wants to *talk to*. That is the whole difference, and it is what makes a networked mini app possible at all. Why the two split that way has not been established, so do not reason from a mechanism here — go by the table.

The opaque origin then takes the storage with it. Every one of these throws `SecurityError`, `indexedDB.open()` included:

```
localStorage   THROW SecurityError
sessionStorage THROW SecurityError
cookie         THROW SecurityError
indexedDB.open THROW SecurityError
caches         undefined
```

So a mini app here **ships everything it needs and remembers nothing on its own**. Plan for that:

- Embed media as `data:` URIs. A `data:` image loads fine; an `https:` one never will.
- Do not ship storage fallbacks. Wrapping `localStorage` in `try/catch` is correct, but the catch always runs — a high score cannot survive the bubble being re-rendered on its own.
- Persistence and any channel back to your bot go over a WebSocket to a server you run. The page talks to your server and your bot reads from the same place.
- Nothing measured so far tells the page who is viewing it, and one message in a group is one page for everybody — so identity has to be baked in per message, or asked for on screen.
- No `crypto.subtle`, since it requires a secure context. `wss://` is still encrypted by TLS; it is only the page that is not a secure context.
- The whole app travels inside the message, so its size is your budget.

What does work: `canvas` 2D, WebGL and WebGL2, `OffscreenCanvas`, WebAssembly, Web Audio, `requestAnimationFrame`, and video or audio decoded from a `data:` URI.

#### Menulis HTML Yang Berperilaku Benar di WebView

The page runs inside a bubble in a scrolling chat list, not in a tab of its own. Five things that are harmless in a browser are not harmless here.

**Give the page a fixed height.** This is the one that makes a card visibly shudder. If the content height depends on the width — a `<canvas>` at `width:100%; height:auto`, an image with no dimensions, anything with `aspect-ratio` — then the host measures the bubble from the content while the content measures itself from the width the host just handed it, and the two chase each other. A page measured across widths 300px to 460px should report the same height every time.

Pass `height` and the library handles it, whatever the page does:

```js
await MB.sendHtmlApp(sock, m.chat, html, { height: 300 })
```

It prepends `lockHeight(300)`, which pins `html`/`body` to that many pixels and moves the page's own content into a `#__wrap` scroll container on `DOMContentLoaded`. The container is what makes it work: pinning `body` alone is not enough, because `overflow:hidden` clips the view without shrinking `scrollHeight`, and the host still measures the overflow.

**Or let the page say its own height.** The bridge the host injects carries exactly one method, and it works:

```js
window.AndroidBridge.updateSize(520)
```

The bubble resizes to that many pixels. Confirmed on a device by tapping a button that made the call — so a mini app does not have to be pinned from the outside at all. Note the page must not also pin `html`/`body` in CSS, or the frame grows while the content stays where the stylesheet put it.

`checkHtmlApp` treats an `AndroidBridge.updateSize` call as settling the height, so a page that reports for itself no longer draws the "no height settled" warning.

To do it by hand instead, pin the outer height in pixels, give the canvas a fixed CSS size, and let anything longer scroll inside its own `overflow-y: auto` container rather than growing the page:

```css
#wrap { width: 100%; height: 300px; overflow: hidden }
#game { width: 312px; height: 106px }
```

**Stop the animation loop.** A bare `requestAnimationFrame` chain keeps drawing while the bubble is mounted — after the game ends, after the user scrolls away, after the screen turns off. Gate it:

```js
let rafId = null, running = true
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
  } else if (!running) {
    running = true
    last = 0
    rafId = requestAnimationFrame(loop)
  }
})
```

then end `loop()` with `if (running) rafId = requestAnimationFrame(loop)`.

**Close IndexedDB.** `indexedDB.open` without a matching `close()` leaves a connection behind every single time. Save on a hot path and they pile up:

```js
rq.onsuccess = () => {
  const db = rq.result
  const tx = db.transaction('kv', 'readwrite')
  tx.objectStore('kv').put(value, 'best')
  tx.oncomplete = () => db.close()
  tx.onerror = () => db.close()
}
```

**Scale the canvas to the device.** A `<canvas width="560">` shown at 352 CSS px on a `devicePixelRatio: 3` phone needs 1056 real pixels and gets 560 — visibly soft. Size the backing store and keep your game coordinates in constants:

```js
const W = 560, H = 190
const dpr = Math.min(devicePixelRatio || 1, 3)
canvas.width = W * dpr
canvas.height = H * dpr
ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
```

**Scope your input handler.** `document.addEventListener('pointerdown', e => e.preventDefault())` cancels the gesture for the whole document, including the padding around your app, so the host can lose the scroll it was about to start. Bind to the element that actually needs it:

```js
canvas.addEventListener('pointerdown', e => { e.preventDefault(); jump() })
document.addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); jump() } })
```

**One escaping trap.** If you build the HTML as a JavaScript string literal, `"\d"` becomes `d` and `"\s"` becomes `s` before the page ever sees them — a regex like `/dino_best=(\d+)/` silently turns into one that matches literal `d` characters and never fires. Write `\\d` and `\\s`, or read the document from a file as in the first example and sidestep it.

#### Membaca Balik Mini App

`decodeAIRich` handles the primitive like any other — there is no whitelist to update:

```js
const rich = MB.decodeAIRich(msg)
const section = rich?.sections.find(s => s.view_model?.primitive?.__typename === MB.AI_RICH_HTML_PRIMITIVE)
if (section) {
  const html = section.view_model.primitive.payload
}
```

Do not reach for `sections[0]` — the HTML lands wherever you added it, so a card with text and a divider in front of it puts the page at index 2.

Enum values, read from the client rather than guessed:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'
```

`AI_RICH_LAYOUTS` lists all eight layout names accepted by `MB.newLayout` — `Single`, `HScroll`, and `ActionRow` are the ones MessageBuilder uses; `VStack`, `Grid`, `FlexibleCountGrid`, `RichListItem`, and `AddonAction` also exist.

### Layar Tertanam

An embedded screen is a **second surface carried by the same message**. The bubble in the chat stays small — a line of text, a preview card — and tapping it opens a full sheet that has its own sections, or several tabs of them. It is how one message can be both a short answer and a whole mini app.

Two things to know before you build one:

- **WhatsApp Web does not render it.** Its parser hits the field and gives up, logging `CometComposedTextV2UnsupportedURType typename="embedded_screens"`. This is an Android and iOS surface. Test it on a phone.
- **Tabs are nested inside `content`, not beside it.** The screen holds `content[]`; each entry is either a section (it has `view_model`) or a tab container (it has `tabs`). Getting this backwards is the single most common reason a screen opens blank.

#### Contoh lengkap

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const gameHtml = `
<body style="margin:0;background:transparent;color:#eee;font-family:Arial">
  <canvas id="game" width="560" height="190" style="width:100%;height:auto"></canvas>
  <script>
    const x = document.getElementById('game').getContext('2d')
    x.fillStyle = '#6c5ce7'
    x.fillRect(20, 120, 27, 30)
  <\/script>
</body>`

const scoreHtml = '<body style="margin:0;color:#eee;font-family:Arial"><h3>Best: 00000</h3></body>'

const rich = new MB.AIRich(sock)
  .addSection(MB.htmlSection('<b>Dino Runner</b> — tap to play'))

rich.addEmbeddedScreen(MB.embeddedScreen({
  title: 'Preview',
  tabs: [
    MB.embeddedTab({ id: 'tab_0', tabHeader: 'Dino Runner', sections: [MB.htmlSection(gameHtml)] }),
    MB.embeddedTab({ id: 'tab_1', tabHeader: 'Scores', sections: [MB.htmlSection(scoreHtml)] })
  ]
}))

await rich.send(m.chat)
```

A screen without tabs is just as valid — pass `content` instead, and the sheet shows one page:

```js
rich.addEmbeddedScreen(MB.embeddedScreen({
  title: 'Rincian',
  content: [MB.htmlSection(detailHtml)]
}))
```

You can pass both. The tab container is appended **after** whatever plain `content` you gave, so the flat sections render first and the tab strip below them.

#### Apa yang benar-benar dikirim

`MB.send` base64-encodes all of this into `botForwardedMessage.message.richResponseMessage.unifiedResponse.data`. The example above produces:

```jsonc
{
  "response_id": "183d0aee-fb35-4349-8bc5-7793b11859db",
  "sections": [
    {
      "__typename": "GenAIUnifiedResponseSection",
      "view_model": {
        "__typename": "GenAISingleLayoutViewModel",
        "primitive": {
          "__typename": "GenAIaeacdsnwHtmlPrimitive",
          "payload": "<b>Dino Runner</b> — tap to play",
          "trusted_sources": []
        }
      }
    }
  ],
  "embedded_screens": [
    {
      "id": "0f2c…",
      "title": "Preview",
      "content": [
        {
          "__typename": "FOAEmbeddedScreenContentTabbed",
          "tabs": [
            {
              "id": "tab_0",
              "tab_header": "Dino Runner",
              "sections": [
                {
                  "__typename": "GenAIUnifiedResponseSection",
                  "view_model": {
                    "__typename": "GenAISingleLayoutViewModel",
                    "primitive": { "__typename": "GenAIaeacdsnwHtmlPrimitive", "payload": "<body…>" }
                  }
                }
              ]
            },
            { "id": "tab_1", "tab_header": "Scores", "sections": [ /* … */ ] }
          ]
        }
      ]
    }
  ]
}
```

Read the nesting from the outside in: **screen → `content[]` → `tabs[]` → `sections[]` → `view_model` → `primitive`**. Every level except the tab and the screen itself carries a `__typename`, and the builder fills all of them in.

#### Hal yang sama tanpa builder

If you would rather assemble the payload by hand — or you are porting one you received from another bot — this is the equivalent `relayMessage` call. Nothing here is magic; it is exactly what `AIRich` produces:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

await sock.relayMessage(m.chat, {
  messageContextInfo: {
    deviceListMetadata: {},
    deviceListMetadataVersion: 2,
    botMetadata: {
      messageDisclaimerText: '',
      botResponseId: 'f090cd0f-bad1-4a4a-b0c3-b8f8e852c197',
      verificationMetadata: MB.generateVerificationMetadata()
    }
  },
  botForwardedMessage: {
    message: {
      richResponseMessage: {
        messageType: 1,
        submessages: [{ messageType: 2, messageText: '> Dino Runner' }],
        unifiedResponse: {
          data: Buffer.from(JSON.stringify({
            response_id: '183d0aee-fb35-4349-8bc5-7793b11859db',
            sections: [
              {
                __typename: 'GenAIUnifiedResponseSection',
                view_model: {
                  __typename: 'GenAISingleLayoutViewModel',
                  primitive: { __typename: 'GenAIMarkdownTextUXPrimitive', text: '> Dino Runner' }
                }
              }
            ],
            embedded_screens: [
              {
                title: 'Preview',
                content: [
                  {
                    __typename: 'FOAEmbeddedScreenContentTabbed',
                    tabs: [
                      {
                        id: 'tab_0',
                        tab_header: 'Dino Runner',
                        sections: [
                          {
                            __typename: 'GenAIUnifiedResponseSection',
                            view_model: {
                              __typename: 'GenAISingleLayoutViewModel',
                              primitive: {
                                __typename: 'GenAIaeacdsnwHtmlPrimitive',
                                payload: gameHtml,
                                trusted_sources: ['nixel.dev']
                              }
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          })).toString('base64')
        },
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedAiBotMessageInfo: { botJid: '867051314767696@bot' },
          forwardOrigin: 4
        }
      }
    }
  }
}, {})
```

The builder is worth using anyway — it generates the ids, drops empty fields instead of sending `null`, and keeps the typenames in one place — but the payload is plain JSON and there is nothing stopping you from writing it out.

#### Typename-nya

| Constant | Value | Where it goes |
| --- | --- | --- |
| `AI_RICH_SECTION_TYPENAME` | `GenAIUnifiedResponseSection` | every section, top level or nested |
| `AI_RICH_UNIFIED_RESPONSE_TYPENAME` | `XMSGGenAIUnifiedResponse` | the unified response root |
| `EMBEDDED_SCREEN_TABBED_TYPENAME` | `FOAEmbeddedScreenContentTabbed` | the `content` entry that holds tabs |
| `EMBEDDED_SCREEN_TAB_TYPENAME` | `FOAUnifiedResponseTab` | a tab, when you want it named |
| `EMBEDDED_SCREEN_TYPENAME` | `FOAUnifiedResponseEmbeddedScreen` | the screen itself, when you want it named |

Where these come from, so you can check them yourself:

- `GenAIUnifiedResponseSection` and `XMSGGenAIUnifiedResponse` are in the WhatsApp Web bundle, in the `injectRichResponseTestMessage` debug command, which builds that exact section shape.
- The three `FOA…` names are the Android client's Kotlin models: `FOAEmbeddedScreenContentTabbedImpl.kt`, `FOAUnifiedResponseTabImpl.kt`, `FOAUnifiedResponseEmbeddedScreenImpl.kt`. The field names `embedded_screens`, `tab_header`, `step_entries` and `poll_id` are in the same dex.

Sections always get their typename. The screen and the tabs stay untyped unless you ask for it:

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

MB.embeddedScreen({ typename: MB.EMBEDDED_SCREEN_TYPENAME, tabs: [tab] })
MB.embeddedTab({ typename: MB.EMBEDDED_SCREEN_TAB_TYPENAME, sections: [...] })

// a build that expects a different container name
MB.embeddedScreen({ tabs: [tab], tabsTypename: 'FOAIDButtonSheets' })
```

That last line matters. As with `htmlSection`, **Android does not compare `__typename`** — Pando reinterprets the tree node by field shape, so payloads in the wild carry all sorts of container names and still render. `tabsTypename` exists so you can match whatever a given build expects instead of being locked to one string.

#### Opsi

`embeddedScreen({ … })`:

| Option | Wire field | Notes |
| --- | --- | --- |
| `id` | `id` | a UUID is generated when omitted |
| `title` | `title` | the sheet header |
| `content` | `content` | array of sections, or hand-built content entries |
| `tabs` | `content[n].tabs` | wrapped in a tab container and appended to `content` |
| `tabsTypename` | `content[n].__typename` | defaults to `FOAEmbeddedScreenContentTabbed` |
| `typename` | `__typename` | omitted unless given |
| `header`, `body` | `header`, `body` | passed through as-is |
| `artifacts`, `steps`, `sources` | same names | must be arrays |
| `stepEntries` | `step_entries` | must be an array |
| `pollId` | `poll_id` | |

`embeddedTab({ … })`:

| Option | Wire field | Notes |
| --- | --- | --- |
| `id` | `id` | a UUID is generated when omitted |
| `tabHeader` | `tab_header` | the label on the tab strip |
| `header` | `header` | passed through as-is |
| `sections` | `sections` | each one gets `GenAIUnifiedResponseSection` |
| `typename` | `__typename` | omitted unless given |

`embeddedTabbedContent(tabs, { typename })` builds the container on its own, for when you want to place it inside `content` yourself.

Anything left `undefined` is dropped, never sent as `null`. Passing a non-array where an array belongs throws a `TypeError` at build time rather than producing a payload the phone silently ignores.

`EMBEDDED_SCREEN_PRESENTATION` (`HALF_HEIGHT`, `FULL_HEIGHT`) is exported too. Both values and the field `overwrite_first_screen_presentation` are in the Android client, but which object carries that field is not determinable from the client alone, so the builder does not set it — add it yourself if you know where a given build wants it.

#### Membaca balik layar tertanam

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const info = MB.decodeAIRich(m.message)

info.embeddedScreens   // the raw screens, exactly as they arrived
info.embeddedTabs      // every tab, flattened, from either nesting shape
info.embeddedSections  // every section inside those screens

// or per screen
MB.readEmbeddedTabs(info.embeddedScreens[0])
MB.readEmbeddedSections(info.embeddedScreens[0])

// pull the HTML a tab is carrying
const html = MB.readEmbeddedSections(info.embeddedScreens[0])
  .map(section => section.view_model?.primitive?.payload)
  .filter(Boolean)
```

`readRichMessage(m).html` also collects HTML that sits inside an embedded screen, so a page delivered through a tab is no longer invisible to it. `readEmbeddedTabs` reads both shapes — nested under `content`, and the older flat `tabs` at screen level — so a payload from another bot parses either way.

#### Kalau sheet-nya terbuka kosong

| Symptom | Cause |
| --- | --- |
| Nothing opens at all | You are looking at WhatsApp Web. It does not render embedded screens; use a phone. |
| The sheet opens empty | Tabs were placed beside `content` instead of inside it. Pass them to `embeddedScreen({ tabs })` and let it nest them. |
| The tab strip shows, pages are blank | A section is missing its `view_model`, or the primitive is missing `payload`. Log `readEmbeddedSections(screen)` and look at the shape. |
| Text renders, HTML does not | the viewer is on WA Web desktop, which has no renderer for the HTML section. See [HTML Mini App](#mini-app-html) for the primitive and its `trusted_sources`. |

### Memeriksa Pesan AI Rich Yang Diterima

`decodeAIRich` unpacks the base64 `unifiedResponse` so you can see exactly which primitives a message uses — useful for reproducing something another bot sent.

```js
import { MB } from '@rexxhayanasi/elaina-baileys'

const info = MB.decodeAIRich(m.message)
console.log(info.layouts)     // [ 'Single', 'HScroll' ]
console.log(info.typenames)   // [ 'GenAIMarkdownTextUXPrimitive', 'GenAIProductItemCardPrimitive' ]
console.log(info.sections)
```

> [!WARNING]
> AIRich and some experimental interactive payloads depend on WhatsApp client/server compatibility. Rendering may change between WhatsApp versions.

---

## 🖼️ Pesan Album

Send multiple images or videos as one album.

```js
await sock.sendMessage(jid, {
  album: [
    {
      image: { url: 'https://example.com/1.jpg' },
      caption: 'Image 1'
    },
    {
      image: { url: 'https://example.com/2.jpg' },
      caption: 'Image 2'
    },
    {
      video: { url: 'https://example.com/3.mp4' },
      caption: 'Video 3'
    }
  ],
  caption: 'Caption for the album itself'
})
```

The per-item `caption` rides on each image or video. The `caption` beside `album` is the album's own — `AlbumMessage.caption`, field 1.

**It is opt-in on purpose.** The field was found by auditing the APK; the WA Web protobuf has no `caption` on `AlbumMessage` at all. That asymmetry is a sender-side problem, not a rendering one: this library links as a Web device no matter which phone scanned the code, so a field the real Web client cannot even express is a fingerprint on the wire. Leave the key out — as every existing caller already does — and nothing is written. Set it only when you have decided that trade is worth it.

An album requires at least two image/video media items.

---

## 📸 Status

A status goes to the special jid `status@broadcast`, and the people who receive it are the ones you list in `statusJidList`. That list is the whole audience mechanism — there is no separate privacy setting to flip from here.

```js
await sock.sendMessage('status@broadcast', {
  text: 'Halo semua'
}, {
  statusJidList: ['628xxxx@s.whatsapp.net', '628yyyy@s.whatsapp.net']
})
```

### Latar, Warna Teks dan Font

A **text** status is an `extendedTextMessage` with three styling fields, and all three are options on the third argument, not part of the content:

```js
import { StatusFont } from '@rexxhayanasi/elaina-baileys'

await sock.sendMessage('status@broadcast', { text: 'Halo semua' }, {
  statusJidList,
  backgroundColor: '#7C3AED',
  textColor: '#FFFFFF',
  font: StatusFont.CALISTOGA_REGULAR
})
```

| Option | Wire field | Tag |
| --- | --- | --- |
| `backgroundColor` | `backgroundArgb` | 8, `FIXED32` |
| `textColor` | `textArgb` | 7, `FIXED32` |
| `font` | `font` | 9, enum |

#### Warna

Both colors take the same shapes:

| You pass | Result |
| --- | --- |
| `'#7C3AED'` or `'7C3AED'` | `0xFF7C3AED` — the hash is optional, six digits are made opaque |
| `'807C3AED'` | `0x807C3AED` — eight digits keep your alpha |
| `0xFF7C3AED` | used as-is |
| `-1` | wrapped into the unsigned range, so `0xFFFFFFFF` |

Leave an option out and nothing is written to the message at all — the client picks its own.

#### Font

`StatusFont` is `ExtendedTextMessage.FontType`. These eight are the entire accepted set — WhatsApp Web validates against exactly this list and drops anything else, so a ninth value is the same as sending no font at all.

| Constant | Value | Looks like | Font file in the Android client |
| --- | --- | --- | --- |
| `SYSTEM` | 0 | the plain default — what you get with no `font` at all | the platform face |
| `SYSTEM_TEXT` | 1 | the same plain face, kept as its own value | the platform face |
| `FB_SCRIPT` | 2 | flowing handwritten script, Meta's own cursive | `FacebookScriptWA-Regular.otf` |
| `SYSTEM_BOLD` | 6 | the plain face, heavy | the platform face, bold |
| `MORNINGBREEZE_REGULAR` | 7 | casual marker-pen handwriting, loose and informal | `MorningBreeze-Regular.ttf` |
| `CALISTOGA_REGULAR` | 8 | chunky rounded display serif, warm and poster-like | `Calistoga-Regular.ttf` |
| `EXO2_EXTRABOLD` | 9 | geometric sans at its heaviest weight, loud and modern | `Exo2-ExtraBold.ttf` |
| `COURIERPRIME_BOLD` | 10 | monospace typewriter, every character the same width | `CourierPrime-Bold.ttf` |

Picking one:

- **Plain text** → leave `font` out, or `SYSTEM`. `SYSTEM_TEXT` is the same face; the client keeps both values, so there is no visible reason to prefer one.
- **Loud and short** → `EXO2_EXTRABOLD` for a heavy modern shout, `CALISTOGA_REGULAR` for something rounder and friendlier. Both are display faces: they carry a few words well and a paragraph badly.
- **Personal or handwritten** → `FB_SCRIPT` for neat cursive, `MORNINGBREEZE_REGULAR` for scrawled marker. Script faces suffer at small sizes and with long text.
- **Code, numbers, ASCII art** → `COURIERPRIME_BOLD`. It is the only monospace one, so it is the only one where columns line up.

Two things worth knowing before you commit to a face:

- **Only these three names are certain from the file list alone.** `FB_SCRIPT`, `MORNINGBREEZE_REGULAR`, `CALISTOGA_REGULAR`, `EXO2_EXTRABOLD` and `COURIERPRIME_BOLD` each match a bundled file one-for-one by name. The APK also ships `Roboto-Medium.ttf` and `RobotoMono-Regular.ttf`, which are almost certainly what the three `SYSTEM*` values resolve to, but the dex does not spell out which goes with which — so the table says "the platform face" rather than guessing.
- **The gap in the numbering is real.** The values jump 2 → 6, so 3, 4 and 5 are retired or unused. Do not send them; they are not in the accepted list and will be dropped like any other unknown value.

```js
import { StatusFont } from '@rexxhayanasi/elaina-baileys'

await sock.sendMessage('status@broadcast', {
  text: 'PENGUMUMAN'
}, { statusJidList, backgroundColor: '#7C3AED', textColor: '#FFFFFF', font: StatusFont.EXO2_EXTRABOLD })
```

`font` also takes the raw number if you would rather not import anything — `font: 8` is `CALISTOGA_REGULAR`.

> [!NOTE]
> The fonts ship inside the Android APK, under `assets/fonts/`. The WhatsApp Web bundle parses the field and validates the eight values but has **no font-family mapping for any of them** — so a status you style will look styled on a phone and plain on Web. That is the client, not the message.

### Status Gambar, Video dan Suara

Media statuses are ordinary media messages sent to `status@broadcast`:

```js
await sock.sendMessage('status@broadcast', {
  image: { url: './foto.jpg' },
  caption: 'Halo semua'
}, { statusJidList })

await sock.sendMessage('status@broadcast', {
  video: { url: './klip.mp4' },
  caption: 'Halo semua'
}, { statusJidList })
```

A **voice note** status is the one media kind that also takes a background color — `AudioMessage.backgroundArgb`, tag 20 — and only when `ptt` is on:

```js
await sock.sendMessage('status@broadcast', {
  audio: { url: './suara.ogg' },
  mimetype: 'audio/ogg; codecs=opus',
  ptt: true
}, {
  statusJidList,
  backgroundColor: '#7C3AED'
})
```

### Stiker Status

An image or video status can carry tappable stickers — a place, a channel, a link, a song. They ride on the media message as `interactiveAnnotations`, and each one is positioned by a rectangle given in **fractions of the media**, not pixels: the client multiplies every coordinate by the rendered width and height.

```js
import {
  locationSticker,
  channelSticker,
  linkSticker,
  musicSticker,
  StatusLinkType
} from '@rexxhayanasi/elaina-baileys'

await sock.sendMessage('status@broadcast', {
  image: { url: './liburan.jpg' },
  caption: 'Weekend',
  statusStickers: [
    locationSticker({
      latitude: -6.2088,
      longitude: 106.8456,
      name: 'Jakarta',
      area: { x: 0.1, y: 0.72, width: 0.5, height: 0.1 }
    }),
    linkSticker({
      url: 'https://example.com/blog',
      title: 'Baca ceritanya',
      linkType: StatusLinkType.RASTERIZED_LINK_FULL_URL,
      area: { x: 0.1, y: 0.06, width: 0.8, height: 0.09 }
    })
  ]
})
```

The option is `statusStickers`, not `stickers` — that key already builds a sticker pack. A single sticker does not need an array. Anything other than an image or a video is refused, because the field exists nowhere else.

| Builder | Puts | Needs |
|---|---|---|
| `locationSticker` | `location` | numeric `latitude` and `longitude`, optional `name` |
| `channelSticker` | `newsletter` | `jid` ending in `@newsletter`, optional `name`, `serverMessageId` |
| `linkSticker` | `tapAction` + `statusLinkType` | `url`, optional `title` |
| `musicSticker` | `embeddedContent.embeddedMusic` | `songId` or `mediaId`, plus `title`, `author`, `startTimeMs`, `durationMs`, artwork fields |
| `messageSticker` | `embeddedContent.embeddedMessage` | the `message` to embed, optional `stanzaId` |

`location`, `newsletter`, `embeddedAction` and `tapAction` are one `oneof` in the protobuf, so a sticker carries exactly one of them — passing two throws instead of silently dropping one. Music and embedded messages sit outside that group and can pair with an action.

`stickerArea({ x, y, width, height })` builds the four corners by hand if you want them; every value is between 0 and 1 and an area running off the edge is refused. Left out, a sticker lands on `STICKER_DEFAULT_AREA` in the middle.

Reading them back:

```js
import { readStickers } from '@rexxhayanasi/elaina-baileys'

for (const sticker of readStickers(msg.message)) {
  if (sticker.kind === 'location') console.log(sticker.location.degreesLatitude)
  if (sticker.kind === 'music') console.log(sticker.music.title)
}
```

`readStickers` returns `[]` for anything without annotations, so it is safe on every message.

#### Mengirim Lagu

An ordinary audio message with the cover art, title and artist in `externalAdReply`. Nothing here depends on Meta's music catalog, so it renders for any file you have:

```js
await sock.sendMessage(jid, {
  song: {
    audio: { url: './lagu.mp3' },
    artwork: { url: './sampul.jpg' },
    title: 'Judul Lagu',
    author: 'Penyanyi',
    url: 'https://example.com/track'
  }
})
```

`audio` is required; everything else is optional. The artwork is downscaled to a 640px jpeg before it goes in, because a full cover is far past what a thumbnail may weigh — pass `thumbnailWidth` to change that, and if no image library is installed the file is sent through untouched. `largeThumbnail` defaults to `true` for the big card; set it `false` for the compact one. `url` fills both `sourceUrl` and `mediaUrl`, so tapping the card opens it. Any other key is handed to the audio upload, so `ptt`, `seconds` and `waveform` work as usual.

`mediaType` stays on `1` (IMAGE) unless you change it. `2` is VIDEO, and with that the client waits for a video and draws no thumbnail at all — the cover bytes are simply ignored.

`ptt: true` turns it into a voice note and keeps the card:

```js
await sock.sendMessage(jid, {
  song: {
    audio: { url: './pesan.opus' },
    mimetype: 'audio/ogg; codecs=opus',
    ptt: true,
    artwork: { url: './sampul.jpg' },
    title: 'Judul'
  }
})
```

Set the mimetype yourself when you do. A voice note is opus in an ogg container, the default here is `audio/mpeg`, and nothing in this library transcodes — handing an mp3 to `ptt: true` gets you a warning in the log and a bubble that may not play. The waveform is still computed for you when ffmpeg is around.

The card here is an `externalAdReply`, so it carries that field's delivery risk: a consumer recipient whose account has the suppression prop on drops the entire audio message, not merely the artwork. See [External Ad Reply](#-external-ad-reply) for the exact condition, and [Rich Link Card](#-kartu-rich-link) for a cover that renders with no ad field involved — as its own message beside the audio, since a preview belongs to text and an audio bubble has no room for one.

Reading music that arrives is `readMusicMessage(msg.message)`, which returns `null` for anything that is not one.

### Status Grup

A group status is the same message with `groupStatus: true` on it. That wraps the finished message in `groupStatusMessageV2` and sets `contextInfo.isGroupStatus`, which is what makes the relay layer attach the `<meta is_group_status="true">` node the client looks for:

```js
await sock.sendMessage(groupJid, {
  text: 'halo grup',
  groupStatus: true
})
```

**The styling works here too, and there is nothing extra to pass.** The wrap happens after the message is built, so `backgroundColor`, `textColor` and `font` land on the `extendedTextMessage` inside the wrapper exactly as they would on a normal status:

```js
import { StatusFont } from '@rexxhayanasi/elaina-baileys'

await sock.sendMessage(groupJid, {
  text: 'halo grup',
  groupStatus: true,
  statusAudience: { listName: 'Besties', listEmoji: '💜' }
}, {
  backgroundColor: '#7C3AED',
  textColor: '#FFEE58',
  font: StatusFont.EXO2_EXTRABOLD
})
```

```jsonc
{
  "groupStatusMessageV2": {
    "message": {
      "extendedTextMessage": {
        "text": "halo grup",
        "backgroundArgb": 4286331629,
        "textArgb": 4294962776,
        "font": 9,
        "contextInfo": {
          "statusAudienceMetadata": { "audienceType": 1, "listName": "Besties", "listEmoji": "💜" },
          "isGroupStatus": true
        }
      }
    }
  }
}
```

#### Font apa saja yang bisa dipakai status grup

The same eight as a normal status, because it is the same `extendedTextMessage` underneath — the wrapper is added afterwards and changes nothing about the styling. There is no group-only face and no extra one to unlock.

| Constant | Value | Looks like |
| --- | --- | --- |
| `SYSTEM` | 0 | the plain default, identical to sending no `font` |
| `SYSTEM_TEXT` | 1 | the same plain face, kept as its own value |
| `FB_SCRIPT` | 2 | flowing handwritten script, Meta's own cursive |
| `SYSTEM_BOLD` | 6 | the plain face, heavy |
| `MORNINGBREEZE_REGULAR` | 7 | casual marker-pen handwriting |
| `CALISTOGA_REGULAR` | 8 | chunky rounded display serif |
| `EXO2_EXTRABOLD` | 9 | geometric sans at its heaviest weight |
| `COURIERPRIME_BOLD` | 10 | monospace typewriter |

Three things carry over unchanged from [Background, Text Color and Font](#latar-warna-teks-dan-font), where each face is described in full:

- **3, 4 and 5 do not exist.** The values jump 2 → 6. The client validates against the eight above and drops anything else, so an unknown value behaves exactly like sending no font.
- **`font` takes the raw number too**, if you would rather not import — `font: 8` is `CALISTOGA_REGULAR`.
- **The faces live in the Android APK**, under `assets/fonts/`. WA Web validates the field but has no font-family mapping for any of them, so a styled group status looks styled on a phone and plain in a browser.

All eight survive the wrap, which is worth checking rather than assuming — `SYSTEM` writes `font: 0` into the message rather than being dropped as a falsy value:

```
SYSTEM                 nilai= 0 | font=0  | bg=0xff7c3aed | isGroupStatus=true
SYSTEM_TEXT            nilai= 1 | font=1  | bg=0xff7c3aed | isGroupStatus=true
FB_SCRIPT              nilai= 2 | font=2  | bg=0xff7c3aed | isGroupStatus=true
SYSTEM_BOLD            nilai= 6 | font=6  | bg=0xff7c3aed | isGroupStatus=true
MORNINGBREEZE_REGULAR  nilai= 7 | font=7  | bg=0xff7c3aed | isGroupStatus=true
CALISTOGA_REGULAR      nilai= 8 | font=8  | bg=0xff7c3aed | isGroupStatus=true
EXO2_EXTRABOLD         nilai= 9 | font=9  | bg=0xff7c3aed | isGroupStatus=true
COURIERPRIME_BOLD      nilai=10 | font=10 | bg=0xff7c3aed | isGroupStatus=true
```

A caption on an `image` or `video` group status is **not** an `extendedTextMessage`, so it takes no `font` at all — the three styling options only reach a text status. A voice note keeps `backgroundArgb` and nothing else.

Media works the same way — `groupStatus: true` alongside an `image`, `video` or voice note wraps whichever message got built, and a voice note keeps its background colour:

```js
await sock.sendMessage(groupJid, {
  audio: { url: './suara.ogg' },
  mimetype: 'audio/ogg; codecs=opus',
  ptt: true,
  groupStatus: true
}, { backgroundColor: '#7C3AED' })
```

Because the payload is wrapped, `message.conversation` is `undefined` on the receiving end and the real content sits a layer down. Run it through `normalizeMessageContent` before reading it, the same as any other wrapper — see [Every Message Type](#-semua-jenis-pesan).

> [!NOTE]
> `groupStatusMessageV2` is `Message` field 103; the older `groupStatusMessage` is field 96. Both are `FutureProofMessage` wrappers and the relay layer adds the meta node for either, but `groupStatus: true` always builds V2. WhatsApp Web only ever *parses* these — it has no send path for a group status at all, so this is posted from a phone in the official client.

### Apa Saja Yang Benar-Benar Bisa Digayakan

Worth being blunt about, because it is the most common wrong assumption:

| Status kind | Background | Text color | Font | Caption |
| --- | --- | --- | --- | --- |
| Text | ✅ | ✅ | ✅ | — |
| Voice note (`ptt: true`) | ✅ | ❌ | ❌ | ❌ |
| Image | ❌ | ❌ | ❌ | ✅ |
| Video | ❌ | ❌ | ❌ | ✅ |
| Audio without `ptt` | ❌ | ❌ | ❌ | ❌ |

A group status is not a separate row: `groupStatus: true` wraps whichever of those you built, and the wrapped message keeps whatever styling it already had.

`ImageMessage` and `VideoMessage` have **no color or font fields in the protobuf** — not in the WhatsApp Web spec, not in the Android one. The colored text you see over a photo in the app is burned into the image by the media editor before it is uploaded, so if you want that from a bot, draw it into the picture yourself and send a plain image.

To put a custom audience badge on any of these, see [Custom Status Audience](#audiens-status-kustom-teman-dekat).

---

## 📢 Newsletter / Channel

### Membuat dan Menyunting Channel

#### Membuat Channel

```js
const newsletter = await sock.newsletterCreate(
  'Elaina Updates',
  'Official update channel'
)

console.log(newsletter)
```

#### Mengubah Nama

```js
await sock.newsletterUpdateName(
  '123456789@newsletter',
  'Elaina News'
)
```

#### Mengubah Deskripsi

```js
await sock.newsletterUpdateDescription(
  '123456789@newsletter',
  'Fresh updates from Elaina'
)
```

#### Mengubah Foto

```js
await sock.newsletterUpdatePicture(
  '123456789@newsletter',
  { url: 'https://example.com/channel.jpg' }
)
```

#### Pengaturan Reaksi

```js
await sock.newsletterUpdateReactions('123456789@newsletter', 'BASIC')
```

`ALL` allows any emoji, `BASIC` the default set only, `NONE` disables reactions, `BLOCKLIST` uses the server-side blocklist. Anything else is rejected before the request leaves.

### Mengikuti Channel

#### Follow / Unfollow

```js
await sock.newsletterFollow('123456789@newsletter')
await sock.newsletterUnfollow('123456789@newsletter')
```

#### Mute / Unmute

```js
await sock.newsletterMute('123456789@newsletter')
await sock.newsletterUnmute('123456789@newsletter')
```

#### Membisukan Aktivitas Admin atau Follower

WhatsApp Web replaced the old mute/unmute pair with one setting that separates admin notifications from follower notifications.

```js
await sock.newsletterUpdateUserSetting('123456789@newsletter', 'ADMIN_NOTIFICATIONS', true)
await sock.newsletterUpdateUserSetting('123456789@newsletter', 'FOLLOWER_NOTIFICATIONS', false)
```

`newsletterMute` and `newsletterUnmute` are shorthands for the same mutation with `ADMIN_NOTIFICATIONS`, which is exactly what the mute toggle in WhatsApp Web sends. They used to call a separate pair of operations that no longer exists in either client, so they now return the same `{ id, state }` the setting call returns.

#### Mengambil Daftar Channel Yang Diikuti

```js
const newsletters = await sock.newsletterSubscribed()
console.log(newsletters)
```

### Membaca Channel

#### Mengambil Metadata Channel

```js
const metadata = await sock.newsletterMetadata(
  'jid',
  '123456789@newsletter'
)

console.log(metadata.thread_metadata.handle)          // the channel's @username
console.log(metadata.thread_metadata.subscribers_count)
console.log(metadata.thread_metadata.settings.reaction_codes.value)
```

`handle` is the channel's public username — the part after `wa.me/channel/`. It comes back on every call, whether or not you own the channel.

Three extra sections are off by default because they cost the server extra work:

```js
const metadata = await sock.newsletterMetadata('jid', '123456789@newsletter', {
  fetchPinnedMessages: true,
  fetchStatusMetadata: true,
  fetchWamoSub: true
})

metadata.thread_metadata.pinned_messages   // [ { message_id, expiry_ts } ]
metadata.thread_metadata.wamo_sub          // { plan_id }
metadata.status_metadata                   // { last_status_server_id, last_status_sent_time }
```

#### Pembaruan Pesan Bertahap

Poll only what changed on a channel since a timestamp, instead of refetching history.

```js
const { messages } = await sock.newsletterFetchMessageUpdates('123456789@newsletter', {
  count: 50,
  since: 1770000000
})
```

#### Follower

```js
const followers = await sock.newsletterFollowers('123456789@newsletter', { count: 100 })
```

#### Insight

Admin analytics for a channel you own.

```js
const insights = await sock.newsletterInsights('123456789@newsletter', {
  metrics: ['NET_FOLLOWS', 'UNFOLLOWS']
})
// { result: [{ id, values }], last_update_time, metrics_status }
```

`metrics_status` is `OK` or `MISSING`; `MISSING` means the server has no data for the requested window yet.

#### Reaksi dan Vote Milik Sendiri

What you reacted or voted on across channels, without walking every message.

```js
const groups = await sock.newsletterMyAddOns({ limit: 100 })
const oneChannel = await sock.newsletterMyAddOns({ limit: 50, jid: '123456789@newsletter' })
const onStatuses = await sock.newsletterStatusMyAddOns({ limit: 50 })

for (const group of groups) {
  for (const m of group.messages) {
    console.log(group.jid, m.serverId, m.reaction?.code, m.pollVote?.hashes)
  }
}
```

`pollVote.hashes` are the SHA-256 option hashes, hex encoded — match them against the poll's options to know which one you picked.

### Memposting dan Bereaksi

#### Bereaksi ke Pesan Channel

```js
await sock.newsletterReactMessage(
  '123456789@newsletter',
  '175',
  '🔥'
)
```

Remove a reaction by using an empty value:

```js
await sock.newsletterReactMessage(
  '123456789@newsletter',
  '175',
  ''
)
```

#### Pin / Unpin Pesan

Takes the message `server_id`, not the message key.

```js
await sock.newsletterPinMessages('123456789@newsletter', [175])
await sock.newsletterUnpinMessages('123456789@newsletter', 175)
```

#### Label Konten

```js
await sock.newsletterLabelAiContent('123456789@newsletter', 175)
await sock.newsletterLabelPaidPartnership('123456789@newsletter', 175)
```

`messageType` is the third argument and defaults to `MESSAGE`; pass `STATUS` to label a channel status.

#### Vote di Polling Channel

Channel votes are sent unencrypted as option hashes, unlike the encrypted votes used in chats.

```js
await sock.newsletterSendPollVote('123456789@newsletter', pollServerId, ['Jakarta'])
```

#### Pemberi Vote Polling

```js
const voters = await sock.newsletterPollVoters('123456789@newsletter', 175, {
  limit: 100,
  voteHash: undefined
})
```

The response groups voters per `vote_hash`, each with a `voter_list.edges` array.

#### Pengirim Reaksi

```js
const senders = await sock.newsletterReactionSenders('123456789@newsletter', 175)
```

### Status Channel

#### Memposting Status Channel

A channel can publish its own status — the ring around the channel avatar, playable like a story. It is a real WhatsApp feature with its own stanza, not a `status@broadcast` post addressed to a channel.

```js
await sock.sendNewsletterStatus('123456789@newsletter', {
  image: { url: './poster.jpg' },
  caption: 'New drop today'
})

await sock.sendNewsletterStatus('123456789@newsletter', {
  text: 'Thanks for 10k followers'
})
```

React to one, or take a reaction back:

```js
await sock.sendNewsletterStatusReaction('123456789@newsletter', 175, '🔥')
await sock.sendNewsletterStatusReaction('123456789@newsletter', 175, undefined)
```

Delete one:

```js
await sock.revokeNewsletterStatus('123456789@newsletter', statusId)
```

##### Status Channel vs `status@broadcast`

They look the same to a viewer and are completely different on the wire.

| | `status@broadcast` | Channel status |
|---|---|---|
| Stanza | `<status to="status@broadcast" id t>` | `<status to="…@newsletter" id>` |
| Payload | `<enc>` nodes, one per recipient device | `<plaintext>` — the raw protobuf |
| Encryption | end-to-end, sender-key fanout | none, channels are not E2EE |
| Audience | your contact list, `statusJidList` | everyone following the channel |
| Who may post | anyone | channel admins with the producer capability |
| Media | normal media upload | newsletter upload, referenced by `media_id` |

The library handles the media difference for you: `sendNewsletterStatus` uploads through the newsletter path and puts the returned handle into `media_id` automatically. Supported types are text, image, video, gif, and audio — documents and stickers are rejected. WhatsApp Web itself only publishes image and video, so the other two get a warning and may be refused by the server.

##### Dari Mana Server Id Datangnya

The `<ack>` that answers a published status carries `from`, `class`, `id` and `t` — and no server id at all. That is not a failure; the id arrives a moment later, on the `<status>` stanza the server echoes back to the publisher, marked `is_sender="true"`.

`sendNewsletterStatus` waits for that echo and fills it in, so the id you need to react to or revoke your own status is on the result:

```js
const posted = await sock.sendNewsletterStatus('123456789@newsletter', {
  image: { url: 'https://example.com/drop.jpg' },
  caption: 'New drop today'
})

posted.newsletterStatusServerId   // 175 — from the echo, not the ack
posted.newsletterStatusAck        // the ack itself, which never has one
posted.newsletterStatusDelivered  // the raw <status> node the id came from

await sock.sendNewsletterStatusReaction('123456789@newsletter', posted.newsletterStatusServerId, '🔥')
```

The wait is capped and never blocks the send: if no echo arrives, `newsletterStatusServerId` is `undefined` and everything else is unchanged. Tune it with `serverIdTimeoutMs`, or skip it with `resolveServerId: false` when you only care that the status went out.

##### Memeriksa Apakah Channel Boleh Memposting

WhatsApp gates channel status creation on a per-channel capability the server grants, not on a setting you can flip. Check it before building a posting flow:

```js
const { canPost, canPostMusic, capabilities } = await sock.newsletterCanPostStatus('123456789@newsletter')
```

`canPost` is `CHANNEL_STATUS_PRODUCER` in the capability list. The full gate WhatsApp Web applies is: the `channel_status_creation` flag is on, you are admin or owner, the channel is not suspended or terminated, and the channel holds `CHANNEL_STATUS_PRODUCER`. Only the last one is visible to a client, and it is the one that actually varies per channel — the rollout flag is off by default on Web, which is why the button is missing there while the phone shows it.

##### Status Pertanyaan

A channel status can carry a question box, and followers answer it.

```js
await sock.sendNewsletterStatus('123456789@newsletter', {
  image: { url: './bg.jpg' },
  question: { text: 'Ask me anything' }
})
```

Answers come back as `questionResponseMessage`. Reshare one on top of a new status with `interactionType: 'question_reshare'` plus `parentServerId` and `responseServerId`; publish your own answer with `interactionType: 'question_response'` and `parentServerId`. A question status has to sit on media — WhatsApp Web never publishes a text-only one.

#### Membaca Status Channel

```js
const list = await sock.getNewsletterStatuses('123456789@newsletter', { count: 20 })

for (const status of list.statuses) {
  console.log(status.serverId, status.type, status.viewsCount, status.responsesCount)
  console.log(status.adminProfile?.name)
  console.log(status.reactionCounts) // [ { code: '👍', count: 12 } ]
}
```

Page backwards with `{ before: serverId }` or forwards with `{ after: serverId }`.

To poll only what changed since a timestamp, use the updates feed — it goes to the channel jid, not to the server:

```js
const updates = await sock.getNewsletterStatusUpdates('123456789@newsletter', {
  count: 20,
  since: 1770000000
})
```

#### Atribusi Status Channel

Elaina Baileys exposes `StatusAttribution.Type.NEWSLETTER_STATUS` with the channel reshare metadata already present in WAProto.

```js
await sock.sendMessage('status@broadcast', {
  image: { url: 'https://example.com/status.jpg' },
  caption: 'Shared from Elaina Updates',
  newsletterStatus: {
    newsletterJid: '123456789@newsletter',
    messageId: 42,
    duration: 24,
    hasMultipleReshares: false
  }
}, {
  statusJidList: audienceJids
})
```

The attribution can also be created manually.

```js
const attribution = makeNewsletterStatusAttribution({
  newsletterJid: '123456789@newsletter',
  messageId: 42
})

await sock.sendMessage('status@broadcast', {
  text: 'Newsletter status',
  contextInfo: {
    statusAttributions: [attribution]
  }
}, {
  statusJidList: audienceJids
})
```

#### Siapa Yang Mengirim Pesan Channel

A channel message carries the posting admin's display name and picture in a `<meta>` block that used to be dropped on the floor. It is now decoded into `newsletterMeta`.

```js
sock.ev.on('messages.upsert', ({ messages }) => {
  for (const msg of messages) {
    if (!msg.newsletterMeta) continue
    console.log(msg.newsletterMeta.adminProfile.name)               // 'Rexx Hayanasi'
    console.log(msg.newsletterMeta.adminProfile.pictureDirectPath)
    console.log(msg.newsletterMeta.paidPartnership)                 // sponsored post
    console.log(msg.newsletterMeta.aiContent)                       // self-declared AI content
    console.log(msg.newsletterMeta.editTimestamp)
  }
})
```

There is **no username here** — WhatsApp only ships `id`, `name` and `picture` for a channel admin. `name` is the admin profile name the channel owner set, which is not the same as the account's `@username`, and it is only present when the channel turned admin profiles on. `pushName` falls back to it so existing code that reads `msg.pushName` starts showing the admin instead of nothing.

Messages the bot itself posted to a channel now arrive with `key.fromMe: true` (WhatsApp marks them `is_sender`), plus `key.isNewsletterSender`. Before this they looked like someone else's messages, so a bot could answer its own channel post.

### Pertanyaan

#### Jawaban Pertanyaan

Answers to a channel question, with the follower behind each one.

```js
const { responses } = await sock.newsletterQuestionResponses('123456789@newsletter', 175, {
  count: 50,
  filter: 'starred',
  searchText: 'harga'
})

for (const r of responses) {
  console.log(r.sender.notifyName, r.sender.lid)
  console.log(r.message?.conversation)
  console.log(r.starred, r.replied)
}
```

`filter` accepts `contacts`, `replied`, or `starred`; `searchText` searches the answers; `before` pages backwards.

#### Menyembunyikan Jawaban Pertanyaan

Moderates a follower's answer to a channel question.

```js
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'HIDDEN')
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'VISIBLE')
```

---

### Admin

#### Kemampuan Admin

Which channel features the server has enabled for you. This is the gate WhatsApp Web itself checks before offering a feature.

```js
const capabilities = await sock.newsletterAdminCapabilities('123456789@newsletter')
console.log(capabilities)
// [ 'INSIGHTS', 'ADMIN_NOTIFICATIONS', 'PHOTO_POLLS', 'QUESTIONS', 'QUIZ', 'THREAD_MENU' ]
```

Requires admin or owner rights on the channel; other channels answer `Not Authorized`.

#### Profil Admin

A channel admin can set a name and photo of their own that ride along with every update they post, so followers see who wrote it instead of only the channel. WhatsApp calls the channel-level switch **Show admin profile**.

Three parts of this are readable from the library:

```js
const info = await sock.newsletterAdminInfo('123456789@newsletter')
// {
//   id: '123456789@newsletter',
//   adminCount: 3,
//   adminProfile: { id, name, picture: { id, directPath } },
//   adminProfilesEnabled: true
// }

const caps = await sock.newsletterAdminCapabilities('123456789@newsletter')
caps.includes('ADMIN_PROFILE')   // has WhatsApp granted the feature to this channel
```

Incoming updates carry the posting admin in `newsletterMeta`, and the library now also surfaces the live change notification:

```js
sock.ev.on('newsletter-admin-profile.update', ({ id, adminProfile }) => {
  console.log(id, adminProfile)
  // { id, name, pictureId, pictureDirectPath } — or null when an admin clears theirs
})
```

Setting your own admin name or photo is **not possible from any client API**. WhatsApp Web only ever receives admin profiles: there is no mutation for it, `newsletterUpdate` accepts only name, description, picture and reaction settings, and the "Show admin profile" switch in the Web UI is rendered without a handler. It is set from the phone, and only on channels that hold the `ADMIN_PROFILE` capability.

#### Undangan Admin

```js
await sock.newsletterCreateAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterRevokeAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterAcceptAdminInvite('123456789@newsletter')
```

#### Undangan Admin Yang Menggantung

```js
const pending = await sock.newsletterPendingAdminInvites('123456789@newsletter')
// [ { id: '628xxxxxxxxx@s.whatsapp.net', phoneNumber: '628xxxxxxxxx' } ]
```

### Mencari Channel

#### Penemuan

```js
const recommended = await sock.newsletterRecommended({ limit: 20, countryCodes: ['ID'] })
const similar = await sock.newsletterSimilar('123456789@newsletter', { limit: 20 })
```

#### Direktori

Channel discovery, the same queries the Updates tab uses. Categories are `BUSINESS`, `ENTERTAINMENT`, `LIFESTYLE`, `NEWS`, `ORGANIZATIONS`, `PEOPLE`, `SPORTS` and `SPECIAL_EVENTS` through `SPECIAL_EVENTS_5`.

```js
const list = await sock.newsletterDirectoryList({
  view: 'RECOMMENDED',        // RECOMMENDED | NEW | POPULAR | FEATURED | TRENDING
  categories: ['NEWS'],
  countryCodes: ['ID'],
  limit: 20
})

const found = await sock.newsletterDirectorySearch('elaina', { limit: 20 })
const preview = await sock.newsletterDirectoryCategories({ categories: ['NEWS'], countryCode: 'ID' })
```

### Penindakan

#### Penindakan dan Banding

When a channel feature quietly disappears — the admin profile setting, the status ring, the ability to post — the cause is often an enforcement on the channel, not a missing rollout. This reads what WhatsApp is holding against it.

```js
const enf = await sock.newsletterEnforcements('123456789@newsletter')

console.log(enf.suspensions)
console.log(enf.adminProfiles)            // enforcement aimed at the admin profile feature
console.log(enf.profilePictureDeletions)
console.log(enf.violatingMessages)
console.log(enf.geoSuspensions)
```

Every entry carries the same shape:

```js
{
  enforcementId: '...',
  createdAt: 1770000000,
  violationCategory: 'GENERIC_VIOLATION',
  source: '...',
  appealState: '...',
  appealCreatedAt: undefined,
  appealReasonOptions: [ { reason: 'RM_COPS', label: 'I own the rights' } ],
  appealFormUrl: 'https://...',
  policy: { headline, subtitle, overview, explanation, adminDisclaimer }
}
```

`appealReasonOptions` and `appealFormUrl` are the appeal path WhatsApp itself offers — there is no other way to ask for a decision to be reviewed. An empty result in every bucket means the channel is clean and whatever is missing is a rollout, not a penalty.

Reports you filed, and appealing their outcome:

```js
const reports = await sock.newsletterReports()
await sock.newsletterAppealReport(reports[0].report_id, 'RESPONSE_VIOLATES_GUIDELINES')
```

## 🪪 Username & Info

WhatsApp Web moved usernames and the About text to MEX queries. These call the same persisted queries the Web client uses.

### Username

```js
const current = await sock.getUsername()
console.log(current) // { username: 'elaina', state: 'ACTIVE', pin: '1234' }

await sock.setUsername('elaina')
await sock.setUsernamePin('1234')
await sock.removeUsername()
```

Check a name before claiming it:

```js
const { available, suggestions } = await sock.checkUsernameAvailability('elaina')
```

`setUsername` resolves `true` only when the server answers `SUCCESS`. `state` is `ACTIVE` or `RESERVED`; pass `{ reserved: true }` when claiming a reserved name.

#### Aturan Username

`setUsername` and `checkUsernameAvailability` reject a bad name locally before it reaches the server, so you get the reason instead of a generic failure. The rules are read straight out of the Web client:

| Rule | Error |
|---|---|
| Only `a-z`, `A-Z`, `0-9`, `_`, `.` | `INVALID_CHARACTER` |
| 3 to 35 characters | `INVALID_LENGTH` |
| At least one letter | `INVALID_NO_LETTERS` |
| No leading or trailing `.`, no `..` | `INVALID_PERIODS` |
| Cannot start with `www.` | `INVALID_WWW_PREFIX` |
| Cannot end with `.com .org .net .int .edu .gov .mil .arpa .html .htm .txt .xml` | `INVALID_DOMAIN_SUFFIX` |
| Cannot contain `whatsapp`, `instagram`, `facebook`, `oculus` | `INVALID_WORD` |

The PIN is exactly four digits.

Validate without calling the server:

```js
import { validateUsername, isUsernamePin, displayUsername } from '@rexxhayanasi/elaina-baileys'

validateUsername('rexx.hayanasi')  // { isValid: true }
validateUsername('rexx.com')       // { isValid: false, errorType: 'INVALID_DOMAIN_SUFFIX' }
isUsernamePin('1234')              // true
displayUsername('rexx')            // '@rexx'
```

A leading `@` is stripped for you, so `setUsername('@elaina')` and `setUsername('elaina')` are the same call.

### Info / Status Teks

```js
await sock.updateTextStatus('Building bots', { emoji: '🤖', ephemeralDurationSec: 0 })

const mine = await sock.fetchTextStatus(['6281234567890@s.whatsapp.net'])
const about = await sock.fetchAbout('6281234567890@s.whatsapp.net')
console.log(about.status)
```

`updateTextStatus()` with no text clears it. `fetchTextStatus` takes one or many JIDs and answers per JID with the text, emoji, last update time and ephemeral duration. `fetchAbout` reads a single user's About through `xwa2_users_updates_since`.

The classic `updateProfileStatus` IQ still works and is untouched.

### Pemberitahuan Ketentuan Layanan

WhatsApp gates some features behind a notice the user has to move through. These read the notice list and report progress back, the same IQs the Web client uses.

```js
const notices = await sock.fetchUserNotices()
// [ { id: '20601216', stage: '2', t: '...', version: '...', type: '...' } ]

await sock.updateUserNoticeStage('20601216', 5)
```

`stage` is the server's own counter for that notice — read the current value from `fetchUserNotices` before advancing it.

### Daftar Opt-Out Pemasaran

```js
const list = await sock.fetchOptOutList({ category: 'marketing' })

await sock.updateOptOut({
  jid: '6281234567890@s.whatsapp.net',
  category: 'marketing',
  action: 'add',
  reason: 'user_request'
})
```

### Pengaturan Push

```js
const settings = await sock.fetchPushSettings()
```

### Link Preview Dari Sisi Server

Lets WhatsApp generate the preview instead of scraping the page yourself.

```js
const preview = await sock.fetchServerLinkPreview('https://example.com')
// { direct_path, hash, title, description, preview_type, thumb_data, width, height }
```

---

## 👥 Pengelolaan Grup

### Membuat Grup

```js
const group = await sock.groupCreate(
  'Elaina Community',
  [
    '6281234567890@s.whatsapp.net',
    '6289876543210@s.whatsapp.net'
  ]
)

console.log(group.id)
```

### Menambah Anggota

```js
await sock.groupParticipantsUpdate(
  groupJid,
  ['6281234567890@s.whatsapp.net'],
  'add'
)
```

### Mengeluarkan Anggota

```js
await sock.groupParticipantsUpdate(
  groupJid,
  ['6281234567890@s.whatsapp.net'],
  'remove'
)
```

### Promote / Demote

```js
await sock.groupParticipantsUpdate(groupJid, [userJid], 'promote')
await sock.groupParticipantsUpdate(groupJid, [userJid], 'demote')
```

### Mengubah Deskripsi Grup

```js
await sock.groupUpdateDescription(
  groupJid,
  'Welcome to Elaina Community 💜'
)
```

### Subjek dan Pengaturan

```js
await sock.groupUpdateSubject(groupJid, 'New name')
await sock.groupSettingUpdate(groupJid, 'announcement')
```

`groupSettingUpdate` takes one of `announcement` (only admins may send), `not_announcement`, `locked` (only admins may edit group info) or `unlocked`.

### Siapa Yang Boleh Masuk dan Siapa Yang Boleh Menambah

```js
await sock.groupMemberAddMode(groupJid, 'admin_add')
await sock.groupJoinApprovalMode(groupJid, 'on')
```

`groupMemberAddMode` is `admin_add` or `all_member_add`. `groupJoinApprovalMode` is `on` or `off`; with it on, people who use the invite link land in a request queue instead of the group.

### Antrean Permintaan Masuk

```js
const pending = await sock.groupRequestParticipantsList(groupJid)
await sock.groupRequestParticipantsUpdate(groupJid, [userJid], 'approve')
await sock.groupRequestParticipantsUpdate(groupJid, [userJid], 'reject')
```

### Link Undangan

```js
const code = await sock.groupInviteCode(groupJid)
console.log('https://chat.whatsapp.com/' + code)

const fresh = await sock.groupRevokeInvite(groupJid)

const preview = await sock.groupGetInviteInfo(code)
await sock.groupAcceptInvite(code)
```

`groupGetInviteInfo` reads the group behind a code without joining. There is also a direct invite pair — `groupRevokeInviteV4(groupJid, invitedJid)` and `groupAcceptInviteV4` — for the invite sent to one person rather than a link.

### Pesan Sementara

```js
await sock.groupToggleEphemeral(groupJid, 7 * 24 * 60 * 60)
await sock.groupToggleEphemeral(groupJid, 0)
```

The duration is in seconds; `0` turns it off. WhatsApp's own options are 24 hours, 7 days and 90 days.

### Membaca Grup

```js
const metadata = await sock.groupMetadata(groupJid)
const all = await sock.groupFetchAllParticipating()

await sock.groupLeave(groupJid)
```

`groupFetchAllParticipating` returns every group you are in, keyed by jid. It is one request for all of them, so prefer it over calling `groupMetadata` in a loop.

---

## 🏘️ Komunitas

A community is a parent that owns groups. Every method mirrors its group counterpart, plus the linking calls that have no group equivalent.

### Membuat dan Menautkan

```js
const community = await sock.communityCreate('Elaina Community', 'What this community is for')

const group = await sock.communityCreateGroup('Announcements', [userJid], community.id)

await sock.communityLinkGroup(existingGroupJid, community.id)
await sock.communityUnlinkGroup(existingGroupJid, community.id)

const linked = await sock.communityFetchLinkedGroups(community.id)
```

`communityCreateGroup` makes a group already attached to the community. `communityLinkGroup` attaches one that exists — you must be admin of both.

### Anggota dan Pengaturan

```js
await sock.communityParticipantsUpdate(communityJid, [userJid], 'promote')
await sock.communityUpdateSubject(communityJid, 'New name')
await sock.communityUpdateDescription(communityJid, 'New description')
await sock.communitySettingUpdate(communityJid, 'announcement')
await sock.communityMemberAddMode(communityJid, 'admin_add')
await sock.communityJoinApprovalMode(communityJid, 'on')
await sock.communityToggleEphemeral(communityJid, 7 * 24 * 60 * 60)
```

The actions and values match the group ones above.

### Undangan dan Pembacaan

```js
const code = await sock.communityInviteCode(communityJid)
await sock.communityRevokeInvite(communityJid)
await sock.communityAcceptInvite(code)
const preview = await sock.communityGetInviteInfo(code)

const metadata = await sock.communityMetadata(communityJid)
const all = await sock.communityFetchAllParticipating()
await sock.communityLeave(communityJid)
```

---

## 🔒 Pengaturan Privasi

```js
const settings = await sock.fetchPrivacySettings(true)
```

Pass `true` to bypass the cache. Each setting has its own updater, and the value goes to the server unchanged — an unknown one is rejected there, not here:

| Call | Accepts |
|---|---|
| `updateLastSeenPrivacy(value)` | `all`, `contacts`, `contact_blacklist`, `none` |
| `updateOnlinePrivacy(value)` | `all`, `match_last_seen` |
| `updateProfilePicturePrivacy(value)` | `all`, `contacts`, `contact_blacklist`, `none` |
| `updateStatusPrivacy(value)` | `all`, `contacts`, `contact_blacklist`, `none` |
| `updateReadReceiptsPrivacy(value)` | `all`, `none` |
| `updateGroupsAddPrivacy(value)` | `all`, `contacts`, `contact_blacklist` |
| `updateCallPrivacy(value)` | `all`, `known` |
| `updateMessagesPrivacy(value)` | `all`, `contacts` |
| `updateDisableLinkPreviewsPrivacy(disabled)` | a boolean |

```js
await sock.updateLastSeenPrivacy('contacts')
await sock.updateOnlinePrivacy('match_last_seen')
await sock.updateDisableLinkPreviewsPrivacy(true)
```

### Pesan Sementara Bawaan

```js
await sock.updateDefaultDisappearingMode(7 * 24 * 60 * 60)
const durations = await sock.fetchDisappearingDuration(jidA, jidB)
```

The default applies to new chats. `fetchDisappearingDuration` takes any number of jids and reports what each is set to.

### Pemblokiran

```js
await sock.updateBlockStatus(jid, 'block')
await sock.updateBlockStatus(jid, 'unblock')
const blocked = await sock.fetchBlocklist()
```

### Melaporkan Spam

```js
import { SPAM_FLOWS } from '@rexxhayanasi/elaina-baileys'

await sock.reportSpam(jid)

await sock.reportSpam(groupJid, {
    flow: SPAM_FLOWS.GroupInfoReport,
    source: senderJid
})
```

`reportSpam` sends the chat-level report, the same one WhatsApp Web sends when you report a contact or a group without picking a message. `flow` tells the server where the report came from and defaults to `SPAM_FLOWS.OverflowMenuReport`; `SPAM_FLOWS` carries the values WhatsApp Web itself uses. `source` names the participant being reported inside a group, `subject` carries the entity name, and `isKnownChat` says whether the chat was already known to you. Reporting one specific message is not covered — that needs the franking tags the client derives when it receives the message.

---

## 📨 Semua Jenis Pesan

`message.message` is a box with exactly one key set, and the key names the
kind. There are **115** of them. Two things trip up almost everyone starting
out, so read this part before hunting for a bug that is not there.

### Kenapa `conversation` kadang kosong

**31 of the 115 are wrappers.** They carry no content of their own — they hold
another message inside. A view-once photo is not `imageMessage`, it is
`viewOnceMessageV2` containing an `imageMessage`. A group status reply is
`groupStatusMessageV2` containing whatever was actually said. Read the outer
key and you find nothing:

```js
const m = messages[0]
console.log(m.message.conversation)          // undefined
console.log(Object.keys(m.message))          // [ 'groupStatusMessageV2' ]
```

`normalizeMessageContent` peels them off for you, up to five layers deep,
because wrappers nest — an edited view-once photo inside an ephemeral chat is
three of them stacked:

```js
import { normalizeMessageContent, getContentType } from '@rexxhayanasi/elaina-baileys'

const content = normalizeMessageContent(m.message)
const type = getContentType(content)        // 'imageMessage'
const text = content?.conversation || content?.extendedTextMessage?.text
```

Always normalise before you look. The full list of wrappers, so you can
recognise one when you see it:

| Group | Wrappers |
|---|---|
| Disappearing and view-once | `ephemeralMessage`, `viewOnceMessage`, `viewOnceMessageV2`, `viewOnceMessageV2Extension`, `limitSharingMessage` |
| Edits and replies | `editedMessage`, `associatedChildMessage`, `questionMessage`, `questionReplyMessage` |
| Status | `statusMentionMessage`, `statusAddYours`, `groupStatusMessage`, `groupStatusMessageV2`, `groupStatusMentionMessage` |
| Groups | `groupMentionedMessage` |
| Bots | `botInvokeMessage`, `botTaskMessage`, `botForwardedMessage`, `botPlatformRegistrationSuccessMessage` |
| Newsletter | `newsletterAdminProfileMessage`, `newsletterAdminProfileMessageV2`, `newsletterAdminProfileStatusMessage`, `newsletterScheduledMessage` |
| Polls and media | `pollCreationMessageV4`, `pollCreationOptionImageMessage`, `documentWithCaptionMessage`, `lottieStickerMessage`, `audioStickerMessage`, `eventCoverImage`, `spoilerMessage` |
| Settings | `acp2SettingMessage` |

The list is kept honest by `npm run verify:proto`: it reads every
`FutureProofMessage` field out of the live WhatsApp Web bundle and fails if
`normalizeMessageContent` would leave one of them wrapped. That check is how
`acp2SettingMessage` and `audioStickerMessage` were caught — both had been
sitting in the protocol unwrapped, so a bot receiving one saw an opaque key
and an empty `conversation`.

`audioStickerMessage` (field 134) arrived with a sibling, `stickerMessage.audioMessage`
(field 26, in a new `audio` oneof): a sticker that carries a voice clip. Both
decode, and nothing draws them yet — WhatsApp Web maps `audioStickerMessage` to
no message type at all, and its sticker parser does not read `audioMessage`
back out. Treat them as fields to recognise when they start arriving, not as
something to send.

### 84 sisanya

These carry the content. You will use a handful constantly and never touch
most of the rest, but knowing they exist saves you from assuming a message is
malformed when it is simply a kind you have not met.

| Group | Types |
|---|---|
| Text and location | `conversation`, `extendedTextMessage`, `locationMessage`, `liveLocationMessage`, `contactMessage`, `contactsArrayMessage`, `groupInviteMessage`, `albumMessage`, `musicMessage`, `conditionalRevealMessage` |
| Media | `imageMessage`, `videoMessage`, `audioMessage`, `documentMessage`, `stickerMessage`, `stickerPackMessage`, `stickerSyncRmrMessage`, `ptvMessage` |
| Legacy | `chat` |
| Buttons and lists | `buttonsMessage`, `buttonsResponseMessage`, `listMessage`, `listResponseMessage`, `templateMessage`, `templateButtonReplyMessage`, `interactiveMessage`, `interactiveResponseMessage`, `highlyStructuredMessage` |
| Polls and events | `pollCreationMessage` … `pollCreationMessageV6`, `pollUpdateMessage`, `pollAddOptionMessage`, `pollResultSnapshotMessage`, `pollResultSnapshotMessageV3`, `eventMessage`, `eventInviteMessage`, `questionResponseMessage`, `keepInChatMessage` |
| Status | `statusNotificationMessage`, `statusQuestionAnswerMessage`, `statusQuotedMessage`, `statusStickerInteractionMessage`, `statusLinkPreviewMetadata` |
| Newsletter | `newsletterFollowerInviteMessage`, `newsletterFollowerInviteMessageV2`, `newsletterAdminInviteMessage` |
| Calls | `call`, `bcallMessage`, `callLogMesssage`, `scheduledCallCreationMessage`, `scheduledCallEditMessage` |
| Payments and shop | `sendPaymentMessage`, `requestPaymentMessage`, `declinePaymentRequestMessage`, `cancelPaymentRequestMessage`, `paymentInviteMessage`, `paymentReminderMessage`, `splitPaymentMessage`, `splitPaymentUpdateMessage`, `productMessage`, `orderMessage`, `invoiceMessage` |
| Reactions and comments | `reactionMessage`, `encReactionMessage`, `commentMessage`, `encCommentMessage`, `pinInChatMessage`, `encEventResponseMessage` |
| Bots and AI | `richResponseMessage`, `placeholderMessage` |
| Protocol and sync | `protocolMessage`, `deviceSentMessage`, `senderKeyDistributionMessage`, `fastRatchetKeySenderKeyDistributionMessage`, `messageContextInfo`, `messageHistoryBundle`, `messageHistoryNotice`, `secretEncryptedMessage`, `requestPhoneNumberMessage`, `groupRootKeyShare`, `rootSecretDistributeMessage` |

`protocolMessage` is worth singling out: deletions, edits, ephemeral-timer
changes and app-state syncs all arrive as one, distinguished by its `type`.
A bot that ignores it will look like it never notices a deleted message.

### Membaca pesan rich

A message from another bot — AI Rich, A2UI, Bloks — leaves `conversation`
empty and `getContentType` reporting only the wrapper. `readRichMessage`
normalises all of them into one shape; see
[Reading Rich Messages Back](#membaca-balik-pesan-rich).

---

## 👀 Presence dan Tanda Dibaca

```js
await sock.presenceSubscribe(jid)

await sock.sendPresenceUpdate('composing', jid)
await sock.sendPresenceUpdate('recording', jid)
await sock.sendPresenceUpdate('paused', jid)

await sock.sendPresenceUpdate('available')
await sock.sendPresenceUpdate('unavailable')
```

You only receive someone's presence after `presenceSubscribe` on their jid. `available` and `unavailable` are your own global state and take no jid; the rest are per-chat typing indicators. `recording` goes on the wire as `composing` with `media: audio`, which is what produces "recording audio…".

### Menandai Sudah Dibaca

```js
await sock.readMessages([msg.key])

await sock.sendReceipt(jid, participant, [messageId], 'read')
await sock.sendReceipts([msg.key], 'read')
```

`readMessages` is the one to reach for. `sendReceipt` and `sendReceipts` are the lower layer underneath it, with the receipt type spelled out — `read`, `read-self`, `played` or `undefined` for a plain delivery receipt.

### Memeriksa Nomor

```js
const results = await sock.onWhatsApp('6281234567890', '6289876543210')
for (const entry of results) {
  console.log(entry.jid, entry.exists)
}
```

---

## 🗂️ Keadaan Chat

`chatModify` writes to app state, so a change syncs to the phone and to every other linked device.

```js
await sock.chatModify({ archive: true, lastMessages: [msg] }, jid)
await sock.chatModify({ pin: true }, jid)
await sock.chatModify({ mute: 8 * 60 * 60 * 1000 }, jid)
await sock.chatModify({ mute: null }, jid)
await sock.chatModify({ markRead: false, lastMessages: [msg] }, jid)
await sock.chatModify({ star: { messages: [{ id: msg.key.id, fromMe: msg.key.fromMe }], star: true } }, jid)
await sock.chatModify({ clear: true, lastMessages: [msg] }, jid)
await sock.chatModify({ delete: true, lastMessages: [msg] }, jid)
await sock.chatModify({ contact: { fullName: 'Elaina' } }, jid)
```

`mute` is a duration in milliseconds, and `null` unmutes. Several of these need `lastMessages` — the server uses it to place the change in the chat's timeline, and it throws without it.

### Riwayat dan Sinkronisasi Ulang

```js
await sock.fetchMessageHistory(50, oldestMsgKey, oldestMsgTimestamp)
await sock.requestPlaceholderResend(messageKey)
await sock.resyncAppState(['regular_high'], false)
```

`fetchMessageHistory` asks the phone for messages older than the key you pass; they arrive through `messaging-history.set`. `requestPlaceholderResend` asks for one message again when it arrived as a placeholder.

---

## 🏷️ Label

Labels are a WhatsApp Business feature.

```js
await sock.addLabel(jid, { id: '1', name: 'Customer', color: 0, deleted: false })

await sock.addChatLabel(jid, labelId)
await sock.removeChatLabel(jid, labelId)

await sock.addMessageLabel(jid, messageId, labelId)
await sock.removeMessageLabel(jid, messageId, labelId)
```

---

## 🛍️ Bisnis dan Katalog

```js
const profile = await sock.getBusinessProfile(jid)
await sock.updateBusinessProfile({ description: 'Toko Elaina', address: 'Jakarta', email: 'halo@example.com' })

const catalog = await sock.getCatalog({ jid, limit: 10 })
const collections = await sock.getCollections(jid, 51)
const order = await sock.getOrderDetails(orderId, tokenBase64)
```

`updateBusinessProfile` is also exported under its original misspelling, `updateBussinesProfile`; both are the same function.

### Mengelola Produk

```js
const created = await sock.productCreate({
  name: 'Elaina Sticker Pack',
  description: 'A pack of stickers',
  price: 15000,
  currency: 'IDR',
  isHidden: false,
  images: [{ url: 'https://example.com/product.jpg' }]
})

await sock.productUpdate(created.id, { price: 20000 })
await sock.productDelete([created.id])
```

### Profil dan Balasan Cepat

```js
await sock.updateProfileName('Elaina')
await sock.updateCoverPhoto(buffer)
await sock.addOrEditQuickReply({ shortcut: 'hi', message: 'Hello!', keywords: ['halo'] })

await sock.addOrEditContact(jid, { fullName: 'Elaina' })
await sock.removeContact(jid)
```

`removeContact` is `chatModify({ contact: null })` under a friendlier name, so it syncs to the phone like any other contact edit.

### Mengambil Ulang Media Kedaluwarsa

```js
const refreshed = await sock.updateMediaMessage(msg)
```

WhatsApp's media URLs expire. When a download fails on an old message, this asks the sender's device for a fresh `directPath` and returns the message with it filled in — then download again.

### Label Anggota Grup

```js
await sock.updateMemberLabel(groupJid, memberLabel)
```

Sends a `GROUP_MEMBER_LABEL_CHANGE` protocol message, which is how the per-group label beside a participant's name is set.

---

## 📞 Panggilan

```js
import { CALL_AUDIO_PREFIX, CALL_VIDEO_PREFIX } from '@rexxhayanasi/elaina-baileys'

const token = await sock.createCallLink('video')
console.log(CALL_VIDEO_PREFIX + token)

const scheduled = await sock.createCallLink('audio', { startTime: Math.floor(Date.now() / 1000) + 3600 })
console.log(CALL_AUDIO_PREFIX + scheduled)

await sock.rejectCall(callId, callFrom)
```

`createCallLink` takes `audio` or `video` and returns just the token. The two prefixes are exported because they do not match the media name — video links live under `/video/` but audio links under `/voice/`. Pass an `event` with a `startTime` in unix seconds to schedule the call instead of opening it now.

### Melakukan Panggilan Suara

The VoIP stack runs the WhatsApp Web calling engine in-process and rides **the socket you are already logged in with**. There is no second pairing and no second QR: pair once, and the same session places calls.

```js
import { makeVoipClient } from '@rexxhayanasi/elaina-baileys'

sock.ev.on('connection.update', async ({ connection }) => {
    if (connection !== 'open') {
        return
    }

    const voip = await makeVoipClient(sock)
    const call = await voip.call('628123456789', {
        durationMs: 60000,
        audioSource: './halo.mp3'
    })

    call.on('ringing', () => console.log('ringing'))
    call.on('connected', () => console.log('answered'))
    call.on('ended', reason => console.log('ended:', reason))

    await call.waitForEnd()
})
```

`audioSource` is anything ffmpeg can read — a file, a URL, or `lavfi:sine=frequency=440` for a tone. Leave it out and the call carries silence. `durationMs` hangs up on its own; pass `0` to stay on until someone ends it. `call.mute(true)` and `call.end()` do what they say, and `call.on('audio', pcm)` hands you the far end as 16 kHz mono `Float32Array` frames.

Audio is Opus at 16 kHz wideband. 48 kHz needs native audio device hooks the JS-only WASM build does not have.

When the socket reconnects, hand the new one over instead of building a second client:

```js
const voip = await makeVoipClient(sock)

sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
        await voip.attach(sock)
    }
})
```

### Memainkan Antrean Audio

Every call takes a playlist, and the queue drives the call rather than the other way round: play a song, hang up when it ends; or play, wait while the next track is being found, play that one, then hang up.

```js
const call = await voip.call('628123456789', {
    playlist: ['satu.mp3'],
    durationMs: 0
})
```

One track, then the call ends by itself — `endWhenQueueEmpty` is on by default and `durationMs: 0` takes the hard timeout out of the way.

For a queue where the next track has to be looked up, give the gap a grace window and fill it while the call stays up:

```js
const call = await voip.call('628123456789', {
    playlist: [await findTrack('lagu pertama')],
    idleGraceMs: 30000,
    durationMs: 0
})

call.on('track', track => console.log('playing', track))
call.on('trackend', track => console.log('finished', track))

call.on('idle', async () => {
    const next = await findTrack(queue.shift())
    if (next) {
        call.enqueue(next)
    }
})

await call.waitForEnd()
```

`idle` fires the moment the queue empties. Anything enqueued before the grace window closes cancels the hang up and plays straight away; if nothing arrives, the call ends. Set `endWhenQueueEmpty: false` to stay on the call indefinitely and hang up yourself.

`enqueue` also takes an array, `skip()` drops the current track, `play()` replaces the queue with one track now, and `queued()` and `nowPlaying()` report what is left and what is running. Audio buffered from a finished track is played out before the next one starts, so a song is never cut off mid-tail by the queue advancing.

### Panggilan Video

Both one to one and group calls take video. The frames come from ffmpeg the same way the audio does, so a video source is a file, a URL, a still image, or an `lavfi:` generator.

```js
const call = await voip.call('628123456789', {
    video: true,
    videoPlaylist: ['klip.mp4'],
    playlist: ['lagu.mp3'],
    durationMs: 0
})

call.on('videotrack', track => console.log('now showing', track))
```

```js
const call = await voip.callGroup('12345-67890@g.us', {
    video: true,
    videoPlaylist: ['klip.mp4']
})
```

Video has its own queue, separate from the audio one: `playVideo`, `enqueueVideo`, `skipVideo`, `queuedVideo` and `nowPlayingVideo`, with `videotrack` and `videotrackend` events. The hang-up rules stay tied to the audio queue, so a call ends when the audio runs out rather than when the picture does.

A still image is looped rather than shown for a single frame, which is the easy way to send a fixed card:

```js
await voip.call('628123456789', { video: true, videoSource: './poster.jpg', playlist: ['lagu.mp3'] })
```

The engine picks the resolution and frame rate when the call connects and the feeder scales to fit, padding to keep the aspect ratio. Frames go out as I420 straight into the WASM encoder — there is no WebCodecs in Node, so the browser encode path is not used. When the queue runs dry the last frame is held rather than cutting to black, so a stall reads as a freeze instead of a flash.

Audio and video are two ffmpeg processes with two clocks. Playing the same file through both will drift; if you need them locked together, pass the same file only to `playlist` and leave the picture on a still image.

### Berbagi Layar

The same video, sent as a screen share instead of a camera. It is a separate wasm entry point, so the recipient sees it labelled as a shared screen rather than as the bot turning its camera on.

```js
const call = await voip.call('628123456789', {
    screenShare: true,
    videoPlaylist: ['slide.png'],
    playlist: ['narasi.mp3']
})
```

`screenShare: true` implies `video: true`. Turn it on and off mid-call with `call.startScreenShare()` and `call.stopScreenShare()`; `call.isScreenShare()` reports which one is live.

Which to prefer depends on what you are sending, and it is worth testing both on a real call:

- **Screen share** suits still content — slides, lyrics, a card. The encoder favours sharpness over motion, and a 16:9 source is not padded into a portrait camera frame.
- **The camera path** suits moving pictures, and reaches everyone. Screen share is gated by `calling_screen_share_milestone_version`: a recipient on an older WhatsApp gets a "please update" dialog instead of your content. In a group there is also a participant cap for sharing, and typically only one participant may share at a time.

### Panggilan Grup

```js
const call = await voip.callGroup('12345-67890@g.us', {
    playlist: ['satu.mp3', 'dua.mp3'],
    idleGraceMs: 30000,
    durationMs: 0
})
```

`callGroup` reads the participant list from the group metadata, resolves each member's LID and devices, and rings them all. Pass `participants` to ring only some of them, or `metadata` if you already have it and want to skip the fetch.

To join a call someone else started, hand `joinGroupCall` what the incoming offer told you:

```js
const call = await voip.joinGroupCall({
    callId,
    callCreatorJid,
    groupJid,
    playlist: ['satu.mp3']
})
```

The queue behaves the same on a group call as on a one-to-one call.

The stack ships `whatsapp.wasm`, `loader.js` and `worker-modules.js` under `lib/assets/wasm/`, so it works out of the box; `wasmPath`, `resourcesPath` and `wasmBinary` are there for when you want to point it at a fresher build, and `storageDir` moves the engine's scratch directory off the default under the system temp dir. It needs `ffmpeg` for the outgoing media; set `ffmpegPath` on the client or `FFMPEG_PATH` in the environment when the binary is not on `PATH`.

Those three files are WhatsApp Web's own, vendored byte for byte. A supply-chain scanner will call them obfuscated code and a large binary, so `lib/assets/wasm/README.md` records their checksums, what they can and cannot reach, and why they are not reformatted; `npm run verify:assets` re-checks all of it in one command.

Nothing is written to stdout unless you ask: pass `debug: true` for the built-in tracing, or `logger: (...args) => …` to route it into your own logger.

### Keluar

```js
await sock.logout()
```

This unlinks the device on WhatsApp's side, so the stored credentials become useless. To stop the socket without unlinking, use `sock.end()`.

---

## 📷 Foto Profil

### Mengambil URL Foto Profil

```js
const url = await sock.profilePictureUrl(jid, 'image')
console.log(url)
```

### Mengubah Foto Profil

```js
await sock.updateProfilePicture(jid, {
  url: 'https://example.com/profile.jpg'
})
```

### Menghapus Foto Profil

```js
await sock.removeProfilePicture(jid)
```

---

## 🧰 Ekspor Yang Berguna

Some commonly used exports include:

```js
import {
  makeWASocket,
  useMultiFileAuthState,
  useSingleFileAuthState,
  useSqliteAuthState,
  usePostgresAuthState,
  useMySQLAuthState,
  useMongoAuthState,
  useRedisAuthState,
  useNekoDBAuth,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  DisconnectReason,
  jidDecode,
  jidEncode,
  jidNormalizedUser,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
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

Check the builder version:

```js
console.log(MESSAGE_BUILDER_VERSION)
console.log(MessageBuilder.VERSION)
```

---

## 🔄 Memperbarui Versi WhatsApp Web

One command performs the whole check:

```bash
npm run wa:update
```

It reads the pinned revision, fetches the live one, downloads the bundle into `.wa-bundle/<revision>/`, parses WhatsApp Web's protobuf specs and compares them against `WAProto`, diffs the new snapshot against the previous one, round-trips every field through the encoder, and writes `.wa-bundle/report.md` and `report.json`.

The report ends in one verdict:

| Verdict | Meaning |
|---|---|
| `no-change` | live revision matches the pinned one |
| `bump-only` | revision moved, no wire surface changed |
| `bump-and-review` | revision moved **and** a wire surface changed — read the diff |
| `needs-work` | WhatsApp declares protobuf fields `WAProto` does not |
| `blocked` | the round-trip encoder failed; do not bump |

Add `--apply` to bump the pinned revision, which is refused unless the verdict is a bump and the encoder passed.

```bash
npm run wa:update -- --apply
```

Supporting commands:

| Command | Purpose |
|---|---|
| `npm run wa:diff -- <old> <new>` | diff two bundle snapshots on their own |
| `npm run check:proto` | protobuf gap check only |
| `npm run sync:proto` | add missing protobuf fields to `WAProto` |
| `npm run verify:proto` | round-trip encoder only |
| `npm run verify:assets` | checksum and scan the vendored VoIP resources |
| `npm run fetch:bundle -- <dir>` | download the raw bundle |
| `npm run update:version` | bump the pinned revision without any of the checks |
| `npm run audit:apk -- <dir>` | diff `WAProto` against an extracted Android APK |
| `npm run sync:proto -- --gaps <file>` | patch `WAProto` from an audit's `--json` output |
| `npm run proto:update` | the whole round trip: sync, verify, bump |

`proto:update` runs `sync:proto`, then `verify:proto`, then `wa:update --apply`, then `update:version`, and that order is load-bearing. `wa:update` exits non-zero on the `needs-work` verdict and refuses `--apply`, so closing the protobuf gaps has to come first or the chain stops before it reaches them.

**Auditing against Android.** Everything above reads the WhatsApp **Web** bundle, so a field the Android client knows and Web does not never reaches `WAProto` at all. `audit:apk` closes that blind spot: point it at a directory of extracted `classes*.dex` and it parses the protobuf model classes straight out of the dex — reading each `*_FIELD_NUMBER` constant and its value — then reports which fields and which whole types are missing, with their field numbers.

```
npm run audit:apk -- /path/to/extracted-apk
```

Add `--json <file>` and it writes the gaps in the shape `sync:proto` consumes, so the same code generator that patches from the Web bundle can patch from the APK:

```
npm run audit:apk -- /path/to/extracted-apk /dev/null --json gaps.json
npm run sync:proto -- --gaps gaps.json
npm run verify:proto
```

Nothing is written by hand, so `npm run proto:update` will not undo it — `sync:proto` is additive and reads the existing `WAProto` as its baseline.

**Android is not the client this library presents as.** Baileys links as a WhatsApp Web device, so a field the Web bundle does not declare is one the real Web client never sends — decoding it costs nothing, sending it makes this client look like neither Web nor Android. The auditor cross-checks every candidate against the Web bundle and marks the difference:

```
KHUSUS ANDROID Message.AlbumMessage.caption — aman didekode, kirim hanya kalau memang disengaja
```

Treat that mark as a reason to keep the field readable but off by default. All four fields patched in so far carry it.

**Two more guards matter, because a name can match while the numbering does not.** The auditor keeps only the single APK class that overlaps a type best — several classes carry similar field names and the loser is a false positive — and it refuses any field whose number is already taken in that type. Without the second guard, `CtwaContextData.canonicalUrl=3` would have been written straight over `sourceUrl`, silently corrupting the wire format. libsignal's own records are skipped outright.

The diff covers every surface a WhatsApp change can reach the wire through — protobuf specs, stanza tags and attributes, `xmlns`, MEX operations, media paths — so a release that only moves UI code is reported as exactly that. `AGENTS.md` documents which surfaces matter and which are client-side noise.

Set `PROTO_BUNDLE_DIR` to read from a local directory and `PROTO_OFFLINE=1` to skip the live revision lookup. Where the built-in `fetch` is refused, the scripts fall back to `curl` automatically.

For automated releases, only commit the files actually changed by the updater and `package.json`. Do not commit `node_modules`.

Recommended `.gitignore` entries:

```gitignore
node_modules/
npm-debug.log*
```

If your repository intentionally does not track a lockfile for this library package, add `package-lock.json` as well. Otherwise, keep the lockfile tracked normally.


---

## ⏰ Pesan Terjadwal

WhatsApp schedules a message by sending it **immediately, encrypted**, and letting the server hand out the key at the chosen time. The envelope is `conditionalRevealMessage`; the key travels in a `<meta type="scheduled_message">` node beside the message.

The pieces are exposed as building blocks, reconstructed from the WhatsApp Web client:

```js
import {
  encodeScheduledMessage,
  decodeScheduledMessage,
  buildScheduledMsgMetaNode,
  buildUnscheduleProtocolMessage,
  isScheduledTimeValid,
  SCHEDULED_MSG_WINDOW
} from '@rexxhayanasi/elaina-baileys'

const at = Math.floor(Date.now() / 1000) + 3600
if (!isScheduledTimeValid(at)) throw new Error('outside the allowed window')

const scheduled = encodeScheduledMessage({ conversation: 'sent later' })
// { revealKey, revealKeyId, encIv, encPayload, message: { conditionalRevealMessage } }

const meta = buildScheduledMsgMetaNode({
  scheduledTimestampS: at,
  revealKeyId: scheduled.revealKeyId,
  revealKey: scheduled.revealKey
})
// <meta type="scheduled_message" st="…"><key rkid="…">{32 bytes}</key></meta>

await sock.relayMessage(jid, scheduled.message, {
  messageId: sock.generateMessageTag(),
  additionalNodes: [meta]
})
```

Reading one back, once you hold the reveal key:

```js
const message = decodeScheduledMessage(msg.message, revealKey)
```

Cancelling a scheduled message is a protocol message:

```js
await sock.relayMessage(jid, buildUnscheduleProtocolMessage(scheduledKey), { messageId })
```

Limits taken from the client, not guessed:

| | Chat | Channel |
|---|---|---|
| Earliest | 10 minutes ahead | 10 minutes ahead |
| Latest | 14 days | 30 days |
| Per chat | 30 scheduled messages | 30 |
| Media per schedule | 1 | 1 |

The reveal key is AES-256-GCM, 32 bytes, with a 12-byte IV and the tag appended to `encPayload`. The server keeps reveal keys for 30 days, and answers `419` when a chat is over its limit.

> [!WARNING]
> Every gate for this feature is off by default in the client WhatsApp ships (`scheduled_messages_sender_enabled`, `scheduled_messages_receiver_enabled`, `channels_scheduling_updates_enabled`). These builders match the wire format the client uses, but until WhatsApp enables the feature for an account the server may reject or ignore the request. Treat it as experimental.

## 🧪 API Pesan WhatsApp Modern
Elaina Baileys exposes helpers for newer protobuf message types already present in the bundled WAProto. These APIs are experimental because WhatsApp can gate rendering or server acceptance by account, platform, or rollout.

```js
import {
  makeNewsletterStatusAttribution,
  LOCATION_BROADCAST_JID,
  isJidLocationBroadcast
} from '@rexxhayanasi/elaina-baileys'
```

### Message Key

Almost everything in this chapter takes a **message key** — `addYours`, `statusMention`, `statusNotification`, `groupStatusReaction`, `statusQuoted`, `pollAddOption`, and so on. The examples write `myStatus.key` or `promptStatus.key` and that is easy to skim past, so here is where those actually come from.

A key is four fields, and it identifies one message anywhere on the account:

```js
{
  remoteJid: 'status@broadcast',        // the chat it lives in
  fromMe: false,                        // did this account send it
  id: '3EB03AC13066A48D44FF59',         // the message id
  participant: '628000@s.whatsapp.net'  // who sent it, in a group or on status
}
```

#### Pesan yang kamu kirim

`sendMessage` returns the message it sent. Keep it and read `.key`:

```js
const myStatus = await sock.sendMessage('status@broadcast', {
  image: { url: './foto.jpg' },
  caption: 'halo semua'
}, { statusJidList })

console.log(myStatus.key)
// { remoteJid: 'status@broadcast', fromMe: true, id: '3EB03AC13066A48D44FF59' }
```

Your own status key has **no `participant`** — you are the sender, so there is nothing to disambiguate. A group status keeps the group jid instead:

```js
const myGroupStatus = await sock.sendMessage(groupJid, { text: 'halo grup', groupStatus: true })
// key: { remoteJid: '120363000000000000@g.us', fromMe: true, id: '…' }
```

That return value is the whole `WebMessageInfo`, so `myStatus.message` and `myStatus.messageTimestamp` are there too if you need them.

#### Pesan yang kamu terima

Every incoming message arrives with its key already attached, on the `messages.upsert` event:

```js
sock.ev.on('messages.upsert', async ({ messages }) => {
  for (const m of messages) {
    if (m.key.remoteJid !== 'status@broadcast') continue

    console.log(m.key)
    // { remoteJid: 'status@broadcast', fromMe: false, id: '…', participant: '628000@s.whatsapp.net' }
  }
})
```

Here `participant` **is** set, and it is the person who posted the status — that is the piece that tells one poster's status from another's, since `remoteJid` is `status@broadcast` for all of them.

To answer a specific prompt you have to hold onto its key when it arrives, because you cannot rebuild one later:

```js
const prompts = new Map()

sock.ev.on('messages.upsert', ({ messages }) => {
  for (const m of messages) {
    if (m.key.remoteJid === 'status@broadcast' && !m.key.fromMe) {
      prompts.set(m.key.id, m.key)
    }
  }
})

// …later
await sock.sendMessage('status@broadcast', {
  text: 'ikutan!',
  addYours: prompts.get(chosenId)
}, { statusJidList })
```

A key you kept stays valid — it is just four strings, so storing it in a database or a JSON file works fine. Nothing here needs the original message body.

#### Pesan yang dibalas orang

When a message quotes another one, the quoted key is in its `contextInfo`:

```js
const context = m.message?.extendedTextMessage?.contextInfo
const quotedKey = context && {
  remoteJid: m.key.remoteJid,
  fromMe: context.participant === sock.user.id,
  id: context.stanzaId,
  participant: context.participant
}
```

#### Key mana untuk apa

The mistake that costs the most time is passing your own key where the other person's belongs, or the reverse. This is who owns each one:

| Field | Whose key |
| --- | --- |
| `addYours` | **theirs** — the prompt status you are answering |
| `messageAssociation.parentMessageKey` | **theirs** — the status, poll or question being answered |
| `statusMention.key` | **yours** — the status you just posted and are announcing |
| `statusNotification.responseMessageKey` | **yours** — your answer |
| `statusNotification.originalMessageKey` | **theirs** — the prompt |
| `groupStatusReaction.key` | **theirs** — the group status you are reacting to |
| `statusQuoted.originalStatusId` | **theirs** — the status id, not a whole key |

Every maker checks the key before building anything, and throws a `TypeError` naming the exact field — `addYours.key must be an object` when it is missing, `addYours.key.id is required` when it is there but half-built. Either way it fails at build time rather than going out and being quietly ignored.

### Polling Foto

Give an option an `image` and the poll is sent as a photo poll: the option images go out as associated messages and each option carries the hash the server expects.

These work in groups and one-to-one chats as well as channels, and `hideVoter` and `endDate` can be combined with them — the poll stays on `pollCreationMessageV3`, which is the version the option images attach to. See [Poll settings](#pengaturan-polling).

```js
await sock.sendMessage(jid, {
  poll: {
    name: 'Which cover?',
    values: [
      { name: 'Jakarta', image: { url: './jakarta.jpg' } },
      { name: 'Bandung', image: { url: './bandung.jpg' } }
    ],
    selectableCount: 1
  }
})
```

Each option image is uploaded and then sent as its own `pollCreationOptionImageMessage`, linked back to the poll by `MEDIA_POLL` association. A poll with two image options is three messages on the wire.

Plain string options still send a normal text poll, and the two can be mixed. The rest of the poll switches — multiple answers, hidden voters, add-option, end time — are listed under [Poll settings](#pengaturan-polling).

### Pesan Pertanyaan

```js
await sock.sendMessage(jid, {
  question: {
    text: 'What feature should be added next?'
  }
})
```

The same payload can be sent to a newsletter JID. Newsletter questions are keyed by a `<meta questiontype>` node, which the socket adds automatically:

```js
await sock.sendMessage('123456789@newsletter', {
  question: {
    text: 'Which update do you want next?'
  }
})
```

```xml
<message to="123456789@newsletter" id="MESSAGE_ID" type="text">
  <meta questiontype="question"/>
  <plaintext>PROTO_MESSAGE</plaintext>
</message>
```

`questiontype` is `question` when posting a question, `response` when a follower answers it, and `reply` when the channel replies to an answer.

### Jawaban Pertanyaan Masuk

A follower answering a question. Sent with `questiontype="response"`.

```js
await sock.sendMessage(jid, {
  questionResponse: {
    key: questionMessage.key,
    text: 'MessageBuilder'
  }
})
```

### Balasan Pertanyaan

The channel replying to an answer, quoting it by the question's server id. Sent with `questiontype="reply"`.

```js
await sock.sendMessage('123456789@newsletter', {
  questionReply: {
    text: 'Good pick, shipping it next',
    serverQuestionId: 175,
    quotedQuestion: questionMessage.message,   // optional
    quotedResponse: responseMessage.message    // optional
  }
})
```

### Jawaban Pertanyaan di Status

```js
await sock.sendMessage(jid, {
  statusQuestionAnswer: {
    key: statusQuestion.key,
    text: 'Elaina Baileys'
  }
})
```

### Pesan Kutipan Status

```js
await sock.sendMessage(jid, {
  statusQuoted: {
    originalStatusId: statusMessage.key,
    type: 'QUESTION_ANSWER',
    text: 'Quoted status answer'
  }
})
```

### Interaksi Stiker Status

```js
await sock.sendMessage(jid, {
  statusStickerInteraction: {
    key: statusMessage.key,
    stickerKey: 'heart',
    type: 'REACTION'
  }
})
```

### Notifikasi Status

Supported notification types are `UNKNOWN` 0, `STATUS_ADD_YOURS` 1, `STATUS_RESHARE` 2, `STATUS_QUESTION_ANSWER_RESHARE` 3 and `STATUS_GROUP_STATUS_REPLY` 4, exported as `StatusNotificationType`.

`STATUS_GROUP_STATUS_REPLY` is in the WhatsApp Web bundle but not in the generated `WAProto` enum, which only carries the first four — the sync tooling reads message fields, not enum values. `StatusNotificationType` and `statusNotification` both resolve against the bundle's list, so the name works here even though `proto.Message.StatusNotificationMessage.StatusNotificationType.STATUS_GROUP_STATUS_REPLY` is `undefined`.

```js
await sock.sendMessage(jid, {
  statusNotification: {
    responseMessageKey: responseMessage.key,
    originalMessageKey: statusMessage.key,
    type: 'STATUS_RESHARE'
  }
})
```

### Undangan Admin Channel

```js
await sock.sendMessage(userJid, {
  newsletterAdminInvite: {
    newsletterJid: '123456789@newsletter',
    newsletterName: 'Elaina Updates',
    caption: 'Join as an admin',
    inviteExpiration: Math.floor(Date.now() / 1000) + 86400
  }
})
```

`jpegThumbnail` and `contextInfo` can also be supplied.

### Undangan Follower Channel V2

```js
await sock.sendMessage(userJid, {
  newsletterFollowerInvite: {
    newsletterJid: '123456789@newsletter',
    newsletterName: 'Elaina Updates',
    caption: 'Follow this channel'
  }
})
```

### Audiens Status Kustom (Teman Dekat)

This is the status that shows a badge with an emoji and a list name, and opens a dialog reading **"You're in {name}'s custom audience"** — *"Anda ada di audiens kustom {nama}"*. The emoji and the name are yours to pick, which is where the "custom emoji" part comes from.

It is **not** `groupStatusMessageV2`. Two different features get mixed up here, so before the code:

| | Field | What the viewer sees |
| --- | --- | --- |
| **Custom audience** | `contextInfo.statusAudienceMetadata` | a purple ring on the status, a badge with your emoji and list name, and the "custom audience" dialog |
| **Group status** | `groupStatusMessageV2` wrapper + `contextInfo.isGroupStatus` | "Added by {name}" under the poster's name |

They are independent. A status can be one, the other, or both.

#### Audiens kustomnya

```js
await sock.sendMessage('status@broadcast', {
  text: 'Halo besties 💜',
  statusAudience: {
    listName: 'Besties',
    listEmoji: '💜'
  }
}, {
  statusJidList: bestiesJids
})
```

A bare string is shorthand for the list name:

```js
await sock.sendMessage('status@broadcast', {
  image: { url: './foto.jpg' },
  caption: 'buat kalian aja',
  statusAudience: 'Besties'
}, { statusJidList: bestiesJids })
```

Leave a field out and you get the client's own fallback — `⭐` and `Close friends`, exported as `STATUS_AUDIENCE_DEFAULT_EMOJI` and `STATUS_AUDIENCE_DEFAULT_LIST_NAME`:

```js
await sock.sendMessage('status@broadcast', { text: 'halo', statusAudience: {} }, { statusJidList })
// → { audienceType: 1, listName: 'Close friends', listEmoji: '⭐' }
```

> [!IMPORTANT]
> `statusAudience` is the **label**, not the lock. Who actually receives the status is decided by `statusJidList` — the people you fan it out to. Setting the metadata without narrowing that list posts to everyone with a "Besties" badge on it.

#### Status grupnya

`groupStatus: true` wraps whatever you send in `groupStatusMessageV2` and sets `contextInfo.isGroupStatus`, which is what makes the relay layer add the `is_group_status` meta node:

```js
await sock.sendMessage(groupJid, {
  text: 'halo grup',
  groupStatus: true
})
```

Both together, which is the payload the question was really about:

```js
await sock.sendMessage(groupJid, {
  text: 'halo grup',
  groupStatus: true,
  statusAudience: { listName: 'Besties', listEmoji: '💜' }
})
```

produces:

```jsonc
{
  "groupStatusMessageV2": {
    "message": {
      "extendedTextMessage": {
        "text": "halo grup",
        "contextInfo": {
          "statusAudienceMetadata": {
            "audienceType": 1,
            "listName": "Besties",
            "listEmoji": "💜"
          },
          "isGroupStatus": true
        }
      }
    }
  }
}
```

Note that `message.conversation` is `undefined` there — the text is two layers down. Run it through `normalizeMessageContent` first, as with every other wrapper (see [Every Message Type](#-semua-jenis-pesan)).

#### Field-nya

`contextInfo.statusAudienceMetadata` is field **69** of `ContextInfo`:

| Field | Tag | Values |
| --- | --- | --- |
| `audienceType` | 1 | `UNKNOWN` = 0, `CLOSE_FRIENDS` = 1 — defaults to `CLOSE_FRIENDS` |
| `listName` | 2 | free text, defaults to `Close friends` |
| `listEmoji` | 3 | free text, defaults to `⭐` |

`audienceType` accepts the enum name or the number:

```js
import { makeStatusAudienceMetadata, proto } from '@rexxhayanasi/elaina-baileys'

makeStatusAudienceMetadata({ listName: 'Kerja', listEmoji: '💼', audienceType: 'CLOSE_FRIENDS' })
makeStatusAudienceMetadata({ listName: 'Kerja', audienceType: proto.ContextInfo.StatusAudienceMetadata.AudienceType.CLOSE_FRIENDS })
```

Or write the contextInfo yourself, if you are relaying rather than sending:

```js
await sock.sendMessage('status@broadcast', {
  text: 'Halo besties',
  contextInfo: {
    statusAudienceMetadata: makeStatusAudienceMetadata({ listName: 'Besties', listEmoji: '💜' })
  }
}, { statusJidList: bestiesJids })
```

#### Membaca yang kamu terima

```js
import { normalizeMessageContent, getContentType } from '@rexxhayanasi/elaina-baileys'

const content = normalizeMessageContent(m.message)
const audience = content?.[getContentType(content)]?.contextInfo?.statusAudienceMetadata

if (audience) {
  console.log(audience.listEmoji, audience.listName)   // 💜 Besties
}
```

#### Kalau namanya tetap "Close friends"

The emoji and the name travel in the same submessage, so if one of them arrives the other did too. Check what you actually put on the wire before blaming the phone — `sendMessage` returns the message it sent:

```js
const sent = await sock.sendMessage('status@broadcast', {
  text: 'Halo besties',
  statusAudience: { listName: 'Besties', listEmoji: '💜' }
}, { statusJidList })

console.log(sent.message.extendedTextMessage.contextInfo.statusAudienceMetadata)
// StatusAudienceMetadata { audienceType: 1, listName: 'Besties', listEmoji: '💜' }
```

If that prints your name, the payload is right. `listName` is tag 2 and `listEmoji` tag 3 of `ContextInfo.StatusAudienceMetadata`, matching the WhatsApp Web spec exactly, and both are plain strings with no length or character rules on our side.

If it prints `Close friends`, one of these is happening:

| Cause | Fix |
| --- | --- |
| The key was never read | `statusAudience` is resolved by `sock.sendMessage`. Going straight to `generateWAMessageFromContent` and `relayMessage` skips it — set `contextInfo.statusAudienceMetadata` yourself there. |
| It was spelled `listname` or `name` | The key is `listName`. An unknown key is not an error, it just leaves the default in place. |
| Only the emoji was given | `{ listEmoji: '💜' }` keeps the default name, the same way `{ listName: 'Besties' }` keeps the default star. |
| It rode along with a modern builder | `statusAudience` next to `groupStatusReaction`, `question`, `comment` and friends now throws instead of disappearing — those builders replace the whole content and have no contextInfo. |

And if the payload is right but the phone still shows the default, that is the client, not the message: the badge is a rollout-gated feature, and WhatsApp may fall back to the default label on a build that has the parser but not the UI. Try a viewer on a current Android build before changing the code.

> [!NOTE]
> On WhatsApp Web the badge is behind a viewer-side rollout gate (`isStatusCloseFriendsViewerSideEnabled`), and Web has no sender-side path for it at all — it only reads the field. Android and iOS are where you will see it. As with everything in this chapter, WhatsApp can gate rendering per account.

### Add Yours

"Add Yours" is not a message type — it is an **association**. Someone posts a status carrying an Add Yours prompt; when you post your own answer, your status carries a `messageAssociation` pointing back at theirs, and that is what threads the two together.

```js
await sock.sendMessage('status@broadcast', {
  text: 'ikutan!',
  addYours: promptStatus.key
}, { statusJidList })
```

`promptStatus` is **their** status — the one carrying the prompt, as it arrived on `messages.upsert`. You have to keep its key when it comes in; see [Message Keys](#message-key).

That writes `messageContextInfo.messageAssociation` (tag 10) with `associationType: STATUS_ADD_YOURS` (8) and your `parentMessageKey`:

```jsonc
{
  "messageContextInfo": {
    "messageAssociation": {
      "associationType": 8,
      "parentMessageKey": { "remoteJid": "status@broadcast", "id": "ABC123", "participant": "628000@s.whatsapp.net" }
    }
  },
  "extendedTextMessage": { "text": "ikutan!" }
}
```

It works on any status content, media included, because the association sits beside the message rather than inside it:

```js
await sock.sendMessage('status@broadcast', {
  image: { url: './jawaban.jpg' },
  caption: 'ikutan!',
  addYours: promptStatus.key
}, { statusJidList })
```

There are three Add Yours flavours, and you can name the one you want:

| `type` | Value | Prompt it answers |
| --- | --- | --- |
| `STATUS_ADD_YOURS` | 8 | the ordinary Add Yours sticker (default) |
| `STATUS_ADD_YOURS_AI_IMAGINE` | 15 | the AI image prompt |
| `STATUS_ADD_YOURS_DIWALI` | 17 | the seasonal Diwali prompt |

```js
await sock.sendMessage('status@broadcast', {
  text: 'ikutan!',
  addYours: { key: promptStatus.key, type: 'STATUS_ADD_YOURS_AI_IMAGINE' }
}, { statusJidList })
```

#### Asosiasi lainnya

`addYours` is a shorthand over the general mechanism, which is worth knowing because the same field threads status polls, questions, reactions and album items:

```js
import { AssociationType } from '@rexxhayanasi/elaina-baileys'

await sock.sendMessage('status@broadcast', {
  text: 'jawaban',
  messageAssociation: {
    type: AssociationType.STATUS_QUESTION,
    parentMessageKey: questionStatus.key,
    messageIndex: 0
  }
}, { statusJidList })
```

`AssociationType` is the client's own enum: `MEDIA_ALBUM` 1, `STATUS_POLL` 4, `STATUS_EXTERNAL_RESHARE` 6, `MEDIA_POLL` 7, `STATUS_ADD_YOURS` 8, `STATUS_NOTIFICATION` 9, `STICKER_ANNOTATION` 11, `STATUS_LINK_ACTION` 13, `STATUS_ADD_YOURS_AI_IMAGINE` 15, `STATUS_QUESTION` 16, `STATUS_ADD_YOURS_DIWALI` 17, `STATUS_REACTION` 18, `POLL_ADD_OPTION` 20, among others. Unlike `addYours`, the general form defaults to `UNKNOWN` rather than guessing for you.

#### Memberi tahu pemosting aslinya

Posting the answer does not by itself notify whoever wrote the prompt. That is a separate `statusNotification`, and `STATUS_ADD_YOURS` is one of its types:

```js
await sock.sendMessage(promptAuthorJid, {
  statusNotification: {
    responseMessageKey: myStatus.key,
    originalMessageKey: promptStatus.key,
    type: 'STATUS_ADD_YOURS'
  }
})
```

> [!NOTE]
> The Add Yours **sticker** — the prompt itself, with its own text — is composed on Android and its wire layout is not expressed anywhere in the WhatsApp Web bundle. Only the association is, so that is all this library builds. Answering an existing prompt works; authoring a new prompt from a bot does not, and nothing here guesses at the tags for it.

### Mention di Status

Mentioning people in a status is two messages: the status itself goes to `status@broadcast` with a `mentioned_users` meta node, and each mentioned chat gets a small pointer message so the mention surfaces there — `statusMentionMessage` for a person, `groupStatusMentionMessage` for a group, both wrapping a `protocolMessage` of type `STATUS_MENTION_MESSAGE` (25).

**Pass an array of jids as the target and the whole flow is done for you:**

```js
await sock.sendMessage(
  ['628000@s.whatsapp.net', '120363000000000000@g.us'],
  { image: { url: './foto.jpg' }, caption: 'halo semua' },
  { delayMs: 1500 }
)
```

That posts the status once — expanding any group in the list into its participants for the audience — then sends one mention pointer per jid, picking the group or the personal wrapper for each and attaching the right meta attribute (`is_group_status_mention` or `is_status_mention`). `delayMs` spaces the pointers out and defaults to 1500 ms.

To send the pointer on its own, against a status you already posted:

```js
const myStatus = await sock.sendMessage('status@broadcast', { text: 'halo semua' }, { statusJidList })

await sock.sendMessage(userJid, { statusMention: { key: myStatus.key } })
await sock.sendMessage(groupJid, { statusMention: { key: myStatus.key, group: true } })
```

`myStatus.key` is **yours** — `sendMessage` hands back the message it just sent, so keep that return value. See [Message Keys](#message-key).

Or build it without sending, for a custom relay:

```js
import { makeStatusMentionMessage } from '@rexxhayanasi/elaina-baileys'

const content = makeStatusMentionMessage({ key: myStatus.key, group: false })
// { statusMentionMessage: { message: { protocolMessage: { key, type: 25 } } } }
```

Both wrappers are `FutureProofMessage`s — `statusMentionMessage` is `Message` field 87, `groupStatusMentionMessage` field 92 — so a received one needs `normalizeMessageContent` like any other wrapper.

### Reaksi Status Grup

```js
await sock.sendMessage(groupJid, {
  groupStatusReaction: {
    key: groupStatusMessage.key,
    text: '❤️'
  }
})
```

The reaction is wrapped in `groupStatusMessageV2`, allowing the existing relay layer to include group-status metadata.

### Menambah Opsi Polling

The original poll must have been created with `canAddOption: true` (see [Poll settings](#pengaturan-polling)). One message carries one option — `addOption` is a single value in the protobuf, not a list, so send several messages to add several options.

```js
await sock.sendMessage(jid, {
  pollAddOption: {
    pollCreationMessageKey: pollMessage.key,
    option: 'New option'
  }
})
```

`addOption` can be supplied directly when you already have the protobuf option object.

### Pesan Komentar

`content` accepts text or protobuf message fields. Raw protobuf content can be supplied as `message`.

```js
await sock.sendMessage(jid, {
  comment: {
    targetMessageKey: targetMessage.key,
    content: {
      text: 'Comment on this message'
    }
  }
})
```

### Pesan Undangan Acara

```js
await sock.sendMessage(jid, {
  eventInvite: {
    eventId: 'elaina-event-001',
    eventTitle: 'Elaina Community Event',
    startTime: new Date(Date.now() + 3600000),
    endTime: new Date(Date.now() + 7200000),
    caption: 'See you there'
  }
})
```

### Panggilan Terjadwal

```js
const created = await sock.sendMessage(jid, {
  scheduledCall: {
    scheduledTimestampMs: new Date(Date.now() + 3600000),
    callType: 'VIDEO',
    title: 'Elaina Call'
  }
})
```

Cancel a scheduled call with its message key.

```js
await sock.sendMessage(jid, {
  scheduledCallEdit: {
    key: created.key,
    editType: 'CANCEL'
  }
})
```

### Penanda Broadcast Lokasi

WhatsApp Desktop recognizes `location@broadcast` separately from `status@broadcast`. Elaina Baileys exposes the identifier and detector without treating it as normal status fanout.

```js
console.log(LOCATION_BROADCAST_JID)
console.log(isJidLocationBroadcast('location@broadcast'))
```

### Builder Tingkat Rendah

```js
import {
  makeQuestionMessage,
  makeQuestionResponseMessage,
  makeStatusQuestionAnswerMessage,
  makeStatusQuotedMessage,
  makeStatusStickerInteractionMessage,
  makeStatusNotificationMessage,
  makeNewsletterAdminInviteMessage,
  makeNewsletterFollowerInviteMessage,
  makePollAddOptionMessage,
  makeCommentMessage,
  makeEventInviteMessage,
  makeScheduledCallCreationMessage,
  makeScheduledCallEditMessage,
  makeGroupStatusReactionMessage,
  makeNewsletterStatusAttribution,
  makeGroupStatusAttribution,
  makeStatusAudienceMetadata
} from '@rexxhayanasi/elaina-baileys'
```

These helpers return protobuf-compatible message content that can be passed to `generateWAMessageFromContent` or custom relay logic.

> [!IMPORTANT]
> The inspected WhatsApp Desktop build also exposes schema names related to bot history sharing and identity verification. They are intentionally not added until their protobuf field numbers, parent messages, and wire layout are confirmed. Elaina Baileys does not guess protobuf tags.

---

## 🛡️ Sinyal Kesehatan Akun

WhatsApp tracks how an account reaches out to people it has not spoken to before, and it tells the client where it stands. Reading those two signals is far more reliable than guessing at a safe delay.

### Kuota Pesan ke Chat Baru

```js
const cap = await sock.fetchNewChatMessageCap()
// {
//   status: 'NONE' | 'FIRST_WARNING' | 'SECOND_WARNING' | 'CAPPED',
//   capped: false, warned: false,
//   totalQuota: 200, usedQuota: 41, remaining: 159,
//   cycleStart, cycleEnd, serverTime, oteStatus, mvStatus, subscriptionStatus
// }
```

`status` is WhatsApp's own escalation ladder for messaging **new** chats: `NONE` → `FIRST_WARNING` → `SECOND_WARNING` → `CAPPED`. `remaining` is what is left in the current cycle, and `cycleEnd` is when it resets.

Only first contact with a new chat consumes quota. Replying inside a conversation the other person started does not.

### Timelock Reachout

```js
const lock = await sock.fetchAccountReachoutTimelock()
// { isActive: true, timeEnforcementEnds: Date, enforcementType: 'BIZ_QUALITY' }
```

`isActive` means the account is already restricted from reaching out, and `timeEnforcementEnds` is when that lifts. `enforcementType` says why — `BIZ_QUALITY` is the quality-based one, the `BIZ_COMMERCE_VIOLATION_*` values are policy categories.

Both signals also arrive unprompted:

```js
sock.ev.on('connection.update', ({ reachoutTimeLock }) => {
  if (reachoutTimeLock?.isActive) stopSending()
})
```

### Memakainya Sebagai Pengaman

```js
const guard = async () => {
  const lock = await sock.fetchAccountReachoutTimelock()
  if (lock.isActive) return { send: false, reason: 'reachout timelock until ' + lock.timeEnforcementEnds }

  const cap = await sock.fetchNewChatMessageCap()
  if (cap.capped) return { send: false, reason: 'new-chat quota exhausted until ' + new Date(cap.cycleEnd * 1000) }
  if (cap.warned) return { send: false, reason: 'WhatsApp already warned this account: ' + cap.status }
  if (cap.remaining !== undefined && cap.remaining < 10) return { send: false, reason: 'only ' + cap.remaining + ' left this cycle' }

  return { send: true, remaining: cap.remaining }
}
```

Check it before a run and again every batch — `SECOND_WARNING` is the last state before the cap lands, so stopping there is the difference between a pause and a block.

> [!NOTE]
> Sending in bulk through an unofficial client is outside WhatsApp's Terms of Service whatever the recipients agreed to. The sanctioned route for opt-in bulk messaging is the WhatsApp Business Platform. These signals reduce the odds of tripping automated limits; they do not make an account safe.

## 🐞 Penanganan Masalah

### `Cannot read properties of undefined (reading 'undefined')` saat membalas

The full trace looks like this:

```
TypeError: Cannot read properties of undefined (reading 'undefined')
    at generateWAMessageFromContent (.../lib/Utils/messages.js:1443:64)
    at generateWAMessage (.../lib/Utils/messages.js:1507:12)
    at async Object.sendMessage (.../lib/Socket/messages-send.js:1300:33)
    at async Object.before (.../plugins/system/_firstchat.js:18:9)
```

You passed `quoted` a message with **no readable content**. The quote path normalised it, got nothing back, and indexed `undefined` with `undefined`. Three ways to end up there, all common:

| What you quoted | Why it has no content |
| --- | --- |
| A message that did not decrypt | `messageStubType` is `CIPHERTEXT`; the key is real but `message` is not there |
| A message read back from a store | Some stores keep the key and drop the body |
| A hand-built `{ key }` | No `message` field at all |

It is guarded now — the send goes out **without** the quote and logs once:

```
WARN  nothing quotable here, sending without the quote
      jid: "120363000000000000@g.us"  quotedId: "3EB0…"  quotedContentType: undefined
```

That matters more than it sounds. A bot that quotes the message it is replying to, in a chat where messages are not decrypting, used to throw on **every single send** — so it went completely silent in that one chat while every other chat looked fine. The failure was in building the reply, not in the group.

If you would rather not send at all than send unquoted, check before you call:

```js
import { normalizeMessageContent, getContentType } from '@rexxhayanasi/elaina-baileys'

const quotable = !!getContentType(normalizeMessageContent(m.message))
await sock.sendMessage(m.key.remoteJid, { text: 'halo' }, quotable ? { quoted: m } : {})
```

### Bot menjawab di semua grup kecuali satu

A group where nothing gets through — not one reply, while every other group is fine — is almost always a **sender key** problem, not your handler. Group messages are encrypted once with a group sender key and fanned out; that key has to reach each member device separately, and the library remembers who already has it in `sender-key-memory`, keyed **per group**. That is why the symptom is one group and not the account.

Until this release there was a way for that memory to lie. Encryption is attempted per device and a single device failing is swallowed — the send still goes out to everyone else — but every device was marked as holding the key regardless. A device that never received it was recorded as done, so it was never sent one again, and it could not read anything the bot said in that group from then on. It recovered only if that device happened to send a retry receipt for that exact group.

Now a device is marked only once its key node is actually in the stanza, and the rest are logged and retried on the next send:

```
WARN  sender key did not reach every device, leaving them unmarked so the next send retries
      jid: "120363000000000000@g.us"
      skipped: [ "628000:12@s.whatsapp.net" ]
```

If a group is already stuck from before the fix, clear its memory once and the next message redistributes the key to everyone:

```js
const reset = await sock.resetGroupSenderKey('120363000000000000@g.us')
console.log(reset)
// { jid: '120363000000000000@g.us', cleared: 4, devices: [ '628000:12@s.whatsapp.net', … ] }

await sock.sendMessage('120363000000000000@g.us', { text: 'halo' })
```

It only accepts a group jid, and it does not delete sessions or keys — it just forgets who was told, so the next send tells everyone again. Safe to run on any group at any time; the cost is one larger stanza.

**Read the `cleared` count, it is the diagnosis.** A number above zero means there really was a stale record and the next send should fix the group. `cleared: 0` means nothing was stored for that jid at all — so the sender key was never the problem, and the cause is one of the three below. Clearing again will not help.

Before blaming the sender key, rule out the two cheaper causes:

| Check | What it means |
| --- | --- |
| Do the group's messages reach `messages.upsert` at all? | If nothing arrives, it is inbound decryption, not sending. Look for `failed to decrypt message` in the log — the library answers those with a retry request on its own. |
| Does `messageStubType` say `CIPHERTEXT`? | The message arrived but could not be read. Same as above; it usually clears itself within a message or two. |
| Does `sendMessage` throw for that jid? | Then it is the group metadata fetch, not encryption — check the error rather than the key. |

### Kode pairing harus tepat 8 karakter

When using a custom pairing code:

```js
await sock.requestPairingCode(phone, 'ELAINA01')
```

The custom value must contain exactly eight characters.

### Kode pairing muncul tapi ponselnya tidak pernah menampilkan prompt

Check what the request threw before assuming the notification is at fault. `requestPairingCode` now waits for the server and reports a rejection instead of returning a code that was never registered:

| Message | Meaning |
|---|---|
| `rate-overlimit` (`429`) | too many attempts — wait, retrying makes it worse |
| `not-allowed` / feature errors | link-by-phone-number is not enabled for that account |
| `must be in international format` (`400`) | the number is not `<country code><national number>` |
| `accepted without registering` | the server replied without a pairing ref |
| `never answered` | no reply arrived at all |

If none of these fire and the code is registered, type it manually through **WhatsApp → Linked Devices → Link with phone number**. If it is accepted there, the registration was fine and only the push notification did not arrive, which is decided server-side.

Verify from outside your bot with `node script/testpairing.js <number> --check-only`.

### Permintaan pairing ditolak dengan 409

Another code is still pending. Wait it out or call `sock.cancelPairingCode()` first — see [Pairing Code](#-kode-pairing).

### `Socket is required`

Builder classes require an active Baileys socket:

```js
const button = new MB.Button(sock)
```

Do not create them without passing `sock`.

### Button atau AIRich tergambar berbeda

Interactive WhatsApp payloads may depend on:

- WhatsApp application version
- Web protocol changes
- Account/server rollout
- Message type compatibility

Always test experimental message formats before production use.

### Yang muncul LID, bukan JID nomor telepon

This is expected on newer WhatsApp addressing flows. Check `participantAlt` or `remoteJidAlt` when available instead of blindly converting `@lid` into `@s.whatsapp.net`.

### Sesi ter-logout

If WhatsApp returns `DisconnectReason.loggedOut`, remove the invalid local session and pair the account again.

---

## 🐞 Menemukan Bug?

If you encounter a bug or compatibility issue, you can contact the maintainer or follow the WhatsApp Channel for project updates.

<p align="center">
  <a href="https://wa.me/6285924647929">
    <img src="https://img.shields.io/badge/Chat%20on%20WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Chat on WhatsApp" />
  </a>
  <a href="https://whatsapp.com/channel/0029Vb8RvQKEFeXmGnJr621s">
    <img src="https://img.shields.io/badge/WhatsApp%20Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp Channel" />
  </a>
</p>

---

## 🙏 Kredit

This project exists thanks to the work of many developers and open-source projects.

### Pemelihara Proyek

- **RexxHayanasi** — maintainer, fork development, integration, fixes, features, and project branding.

### Baileys / Upstream

- **WhiskeySockets/Baileys** — upstream Baileys project and core WhatsApp Web implementation.
- **adiwajshing** — original Baileys author and early ecosystem work.

### Kontribusi Fork / Sumber

- **Lia Wynn / ItsLia** — fork lineage and prior Baileys modifications retained where applicable.
- **Kyuu / kiuur** — project contributor and support.

### MessageBuilder Terintegrasi

The integrated MessageBuilder is based on **NIXCODE / Advanced WhatsApp Interactive Message Builder**.

- **Nixel** — original creator of the MessageBuilder implementation. [WhatsApp](https://wa.me/6285188349341) · [Channel](https://whatsapp.com/channel/0029VbCV1ck8fewpdNb2TY2k)
- **Ahmad tumbuh kembang** — MessageBuilder contributor.

The original builder attribution and licensing notices must be respected when modifying or redistributing its source. The builder is integrated into this package so users do not need to install `baileys-mbuilder` separately.

### Kontributor Open Source

Thanks to every upstream Baileys contributor, library author, tester, issue reporter, and developer whose work helped make this project possible.

> Forking and modifying open-source projects is welcome. Please preserve applicable copyright, license, attribution, and contributor notices.

---

## 💜 TQTO

<details>
<summary><strong>Thanks To</strong></summary>

Terima kasih kepada semua pihak yang telah memberikan dukungan, inspirasi, dan kontribusi dalam pengembangan proyek ini.

- **Allah SWT** — atas rahmat, kemudahan, dan perlindungan-Nya.
- **Orang Tua** — atas doa dan dukungan yang tiada henti.
- **RexxHayanasi** — pengembang dan maintainer proyek.
- Seluruh contributor dan komunitas open source yang membantu perkembangan Baileys.

</details>
<h2 align="center">✨ Contributors & Credits</h2>

<p align="center">
  Thanks to everyone who contributed to this project.
</p>

<table align="center">
  <tr>
    <td align="center" width="180">
      <a href="https://github.com/RexxHayanasi">
        <img
          src="https://avatars.githubusercontent.com/u/150516773?v=4"
          width="90"
          height="90"
          alt="RexxHayanasi"
        />
        <br />
        <b>RexxHayanasi</b>
      </a>
      <br />
      <sub>Project Maintainer</sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/kiuur">
        <img
          src="https://avatars.githubusercontent.com/u/182334162?v=4"
          width="90"
          height="90"
          alt="Kyuu"
        />
        <br />
        <b>Kyuu</b>
      </a>
      <br />
      <sub>Contributor</sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/ValdazGT">
        <img
          src="https://avatars.githubusercontent.com/u/108647595?v=4"
          width="90"
          height="90"
          alt="ValdazGT"
        />
        <br />
        <b>ValdazGT</b>
      </a>
      <br />
      <sub>MBuilder · Owner</sub>
    </td>
    <td align="center" width="180">
      <a href="https://github.com/itsliaaa">
        <img
          src="https://avatars.githubusercontent.com/u/88979678?v=4"
          width="90"
          height="90"
          alt="ITSLIAAA"
        />
        <br />
        <b>ITSLIAAA</b>
      </a>
      <br />
      <sub>messages-send.js Reference</sub>
      <br />
      <sub>Early Migration Reference</sub>
    </td>
  </tr>
</table>

<p align="center">
  <sub>Built and maintained with contributions from the community ❤️</sub>
</p>

---

## 📄 Lisensi

This project is distributed under the license included with the repository/package.

Elaina-specific modifications are maintained by **RexxHayanasi**. Portions of the codebase are derived from Baileys and other open-source work and therefore retain applicable upstream copyright, license, and attribution notices.

Do not remove third-party copyright or attribution notices required by their respective licenses.

---

<div align="center">
  <b>💫 @rexxhayanasi/elaina-baileys</b>
  <br>
  <sub>Built with respect for the Baileys open-source ecosystem.</sub>
</div>

<img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">
