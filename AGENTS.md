# Panduan agen: update WhatsApp Web untuk Elaina Baileys

File ini adalah instruksi kerja untuk agen AI (ChatGPT Codex, Claude Code, atau
sejenisnya) yang diminta memeriksa dan menerapkan update WhatsApp Web ke fork
ini. Kalau kamu memakai ChatGPT versi chat biasa, salin seluruh isi file ini
sebagai *system prompt* / *custom instruction*, lalu berikan output perintah di
bawah sebagai bahan analisis.

Repo ini adalah **distribusi Baileys yang dipelihara sendiri**. Jangan pernah
membandingkannya dengan WhiskeySockets/Baileys atau fork lain, jangan menyalin
kode dari sana, dan jangan berasumsi perilaku upstream berlaku di sini. Satu-
satunya sumber kebenaran adalah **bundle JavaScript WhatsApp Web yang live** dan
kode di repo ini.

---

## 1. Aturan keras

Langgar salah satu dari ini dan hasil kerjamu tidak bisa dipakai.

1. **Jangan pernah mengarang temuan.** Setiap klaim tentang WhatsApp Web harus
   berasal dari string yang benar-benar kamu temukan di bundle. Kalau kamu tidak
   menemukannya, katakan "tidak ditemukan", bukan "kemungkinan besar".
2. **Ekstraktor yang menghasilkan nol baris bukan bukti bahwa tidak ada
   perubahan.** Sebelum menyimpulkan "tidak ada X baru", pastikan dulu ekstraktor
   X memang menghasilkan data pada kedua bundle. Laporan dari `wa:update` sudah
   mencantumkan `Total sekarang` untuk setiap permukaan — kalau totalnya 0,
   ekstraktornya rusak, bukan WhatsApp-nya yang diam.
3. **Jangan bump versi kalau `verify:proto` gagal.** Round-trip encoder adalah
   pengaman terakhir terhadap field protobuf yang salah nomor atau salah tipe.
4. **Jangan menambah field protobuf secara manual.** Pakai `npm run sync:proto`.
   Skrip itu aditif dan idempoten; tangan manusia pernah membuat field ganda
   (`faviconMmsMetadata` vs `faviconMMSMetadata` di field 33) yang hanya
   ketahuan karena round-trip test.
5. **Kode yang kamu tulis tidak boleh memakai komentar `//` atau `/** */`**
   kecuali komentar itu menjelaskan sesuatu yang benar-benar tidak terbaca dari
   kodenya. Dokumen markdown berbahasa Indonesia bebas dari aturan ini.
6. **Commit langsung ke `main`.** Jangan membuat branch baru, jangan membuka PR,
   kecuali diminta eksplisit.
7. **Identitas commit** harus milik pemilik repo, bukan milik agen:
   ```
   git -c commit.gpgsign=false \
       -c user.name="RexxHayanasi Pengen S.Kom" \
       -c user.email="150516773+rexxzyid@users.noreply.github.com" \
       commit -am "<pesan>"
   ```
   Tanpa trailer `Co-Authored-By`, tanpa menyebut model atau alat apa pun di
   pesan commit.

---

## 2. Alur kerja: satu perintah

```bash
npm run wa:update
```

Skrip ini melakukan seluruh rantai kerja:

1. Membaca revisi yang terpasang di `lib/Defaults/index.js`.
2. Mengambil revisi live dari `https://web.whatsapp.com/sw.js`.
3. Mengunduh seluruh chunk bundle (±540 file, ±80 MB) ke `.wa-bundle/<revisi>/`.
   Kalau snapshot revisi itu sudah ada, dipakai ulang tanpa mengunduh.
4. Mem-parse spesifikasi protobuf dari bundle dan membandingkannya dengan
   `WAProto/index.d.ts`.
5. Membandingkan snapshot baru dengan snapshot revisi sebelumnya di seluruh
   permukaan protokol.
6. Menjalankan round-trip encoder atas ±2870 field.
7. Menulis `.wa-bundle/report.md` dan `.wa-bundle/report.json`.

Opsi:

| Opsi | Arti |
|---|---|
| `--apply` | Bump revisi terpasang, tapi hanya kalau kesimpulannya `bump-only` atau `bump-and-review` |
| `--cache <dir>` | Lokasi cache snapshot (default `.wa-bundle/`) |
| `--out <dir>` | Lokasi file laporan |
| `--keep <n>` | Jumlah snapshot yang disimpan (minimum 2, default 3) |

Perintah pendukung:

| Perintah | Kegunaan |
|---|---|
| `npm run wa:diff -- <dir-lama> <dir-baru>` | Diff dua snapshot saja |
| `npm run check:proto` | Cek celah protobuf saja |
| `npm run sync:proto` | Tambahkan field protobuf yang hilang ke WAProto |
| `npm run verify:proto` | Round-trip encoder saja |
| `npm run fetch:bundle -- <dir>` | Unduh bundle mentah ke direktori |

Variabel lingkungan `PROTO_BUNDLE_DIR` membuat semua skrip membaca dari
direktori lokal, dan `PROTO_OFFLINE=1` melewati pengambilan revisi live —
berguna kalau jaringan diblokir.

> **Catatan jaringan.** Di sebagian lingkungan, `fetch` bawaan Node ditolak
> `403` oleh web.whatsapp.com sementara `curl` lolos. `script/protobundle.js`
> sudah otomatis jatuh ke `curl` ketika itu terjadi, jadi kamu tidak perlu
> menanganinya sendiri. Kalau keduanya gagal, laporkan apa adanya — jangan
> mematikan verifikasi TLS dan jangan menebak isi bundle.

---

## 3. Membaca kesimpulan

`report.json` berisi field `verdict` dengan salah satu nilai berikut.

| Verdict | Artinya | Tindakanmu |
|---|---|---|
| `no-change` | Revisi live sama dengan yang terpasang | Tidak ada. Laporkan saja. |
| `bump-only` | Revisi naik, tidak ada permukaan protokol yang berubah | Bump versi, commit `chore: WA update, client revision <n>` |
| `bump-and-review` | Revisi naik **dan** ada permukaan protokol yang berubah | Baca diff-nya dulu. Putuskan apa yang perlu diterapkan ke fork, baru bump. |
| `needs-work` | Ada field protobuf yang belum ada di WAProto | `npm run sync:proto`, lalu `npm run verify:proto`, lalu ulangi `wa:update` |
| `blocked` | Round-trip encoder gagal | **Jangan bump.** Cari tahu field mana yang rusak dari output verifikasi. |

---

## 4. Permukaan mana yang penting

Ini bagian yang paling sering disalahpahami. Bundle WhatsApp Web sebagian besar
berisi kode antarmuka yang **tidak bisa** memengaruhi klien Baileys. Yang
menentukan apakah sebuah update relevan adalah apakah ia menyentuh apa yang
dikirim ke server.

**Penting — kalau ini berubah, fork mungkin perlu diubah:**

| Permukaan | Kenapa penting |
|---|---|
| Spesifikasi protobuf | Isi pesan. Field baru berarti fitur pesan baru. |
| Tag stanza (`smax("...")`) | Bentuk elemen XMPP yang dikirim/diterima |
| Atribut stanza | Atribut baru pada stanza yang sudah ada sering berarti perubahan perilaku |
| `xmlns` | Namespace query baru berarti kelompok fitur baru |
| Operasi MEX | GraphQL persisted query — id-nya harus cocok persis |
| Path media (`/mms/…`) | Endpoint upload/download |

**Tidak penting — abaikan, jangan dilaporkan sebagai "update":**

- Modul React/UI (`*.react`), string terjemahan, ikon, animasi.
- Modul telemetri: QPL, Flipper, Sapienz, `QuickLogEvents`, nama modul logging
  seperti `world_remixing`.
- Encoder media sisi klien (mozjpeg WASM, OffscreenCanvas, thumbnail generator).
  Ini mengubah cara browser meng-encode gambar, bukan apa yang dikirim.
- Penyimpanan lokal browser (OPFS, CacheStorage, IndexedDB).
- AB props / gating. Ini hanya menyalakan fitur di UI WhatsApp Web sendiri, dan
  **tidak** membatasi apa yang boleh dikirim klien lain. Pernah ada kekeliruan
  di repo ini yang menyimpulkan "poll foto hanya untuk channel" dari AB prop
  `channel_photo_poll_*`; itu salah, dan dibuktikan salah oleh dump relay asli.

Kolom `Menyentuh protokol` di laporan sudah menerapkan pembagian ini secara
otomatis, tapi kamu tetap harus membaca daftar modul barunya untuk memastikan
tidak ada yang lolos klasifikasi.

---

## 5. Kalau ada yang benar-benar berubah

Urutan yang terbukti bekerja:

1. **Temukan definisinya di bundle.** Cari nama modul `__d("Nama"` lalu baca
   badan modulnya utuh. Jangan menyimpulkan dari potongan 200 karakter.
2. **Telusuri ke pemanggil konkret.** Nilai sebuah argumen baru berarti apa-apa
   hanya kalau kamu tahu nilai yang benar-benar dilewatkan. Kalau `grep` hanya
   menemukan definisinya, kamu belum selesai — cari komponen UI yang
   memanggilnya.
3. **Bandingkan dengan implementasi fork**, elemen per elemen, atribut per
   atribut, termasuk urutan anak elemen.
4. **Terapkan perubahan seminimal mungkin**, lalu jalankan `npm run verify:proto`.
5. **Laporkan yang tidak bisa kamu buktikan.** Kalau sebuah perbaikan mungkin
   tidak menyelesaikan masalah yang dilaporkan pengguna, katakan begitu.

---

## 6. Jebakan yang sudah pernah menjebak

Daftar ini berasal dari kesalahan nyata di repo ini. Baca sebelum mulai.

- **Nama daun yang bertabrakan.** Dua tipe protobuf bisa punya nama akhir sama
  di namespace berbeda. Perbandingan harus memakai nama berkualifikasi penuh dan
  tidak peka huruf besar-kecil.
- **Nama snake_case di bundle vs camelCase di WAProto.** Normalisasi dulu
  sebelum membandingkan.
- **Kata kunci yang dikutip di `.d.ts`** (`"static"?:`) lolos dari regex naif.
- **proto3 menghilangkan nilai default.** Field boolean bernilai `false` tidak
  dikirim WhatsApp. Fork ini pernah mengirim field 10 dan 11 sebagai `false`
  eksplisit dan menghasilkan payload 50 byte melawan 46 byte milik WhatsApp,
  yang membuat poll foto tidak tampil.
- **Perbedaan tipe di kawat.** `'0'` (string) dan `new Uint8Array(1)` (satu byte
  nol) adalah dua nilai berbeda: `0x30` melawan `0x00`.
- **Normalisasi nomor telepon.** Layar WhatsApp Web selalu menyusun nomor
  sebagai kode negara + nomor nasional dalam digit murni. Apa pun yang kamu
  terima dari pengguna harus dinormalisasi sebelum masuk ke JID.
- **`getMessage` bukan satu-satunya sumber.** Untuk kirim ulang, cache internal
  socket lebih dapat dipercaya.

---

## 7. Checklist sebelum push

- [ ] `npm run wa:update` selesai dan verdict-nya dipahami
- [ ] `npm run verify:proto` lulus
- [ ] `node --check` lolos untuk setiap file yang disentuh
- [ ] Tidak ada file di `.wa-bundle/` yang ikut ter-commit
- [ ] Pesan commit menjelaskan **kenapa**, bukan hanya **apa**
- [ ] Commit memakai identitas pemilik repo, langsung ke `main`
- [ ] Laporan ke pengguna memisahkan dengan jelas: apa yang **terbukti**, apa
      yang **diasumsikan**, dan apa yang **tidak bisa dipastikan**

Format pesan commit yang dipakai repo ini:

```
chore: WA update, client revision 1045732124

fix(<area>): <ringkasan satu baris, huruf kecil>

<paragraf yang menjelaskan bukti dari bundle dan alasan perubahan>
```
