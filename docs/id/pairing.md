# Kode Pairing

Pairing lewat kode menghindari scan QR. Kode bisa diminta setelah socket dibuat, dan hanya kalau akun belum terdaftar.

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
// Boom 400: phoneNumber harus dalam format internasional:
// kode negara lalu nomor nasionalnya, hanya digit
```

## Permintaannya dikonfirmasi server

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

Dua penolakan yang paling sering muncul: `rate-overlimit` — terlalu banyak percobaan, tunggu dulu sebelum mencoba lagi — dan varian not-allowed, artinya tautan-lewat-nomor-telepon tidak diaktifkan untuk akun itu.

## Satu kode dalam satu waktu

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

## Kode pairing kustom

Kode pairing kustom harus berisi tepat **8 karakter**. Lebih pendek atau lebih panjang akan ditolak.

```js
const code = await sock.requestPairingCode(
  '6281234567890',
  'ELAINA01'
)

console.log(code)
```

## Memeriksa pairing tanpa menyentuh bot yang jalan

`script/testpairing.js` menjalankan satu permintaan pairing ke direktori sesi sekali pakai, jadi kredensial bot yang sudah tersambung tidak pernah tertimpa:

```bash
node script/testpairing.js 6281234567890 --check-only
```

`--check-only` melaporkan apakah server menerima registrasinya dan tidak pernah mencetak kodenya — pakai itu di tempat mana pun yang outputnya bisa dibaca orang lain. Lepas flag-nya untuk mencetak kode dan menunggu penautannya selesai.

> [!IMPORTANT]
> Kalau kode muncul tapi ponsel tidak pernah menampilkan prompt, biasanya nomor yang diminta bukan nomor yang membuka WhatsApp di ponsel itu. Kode dikirim ke nomor di argumen, bukan ke perangkat yang menjalankan botmu.

## Selanjutnya

Setelah tersambung, lanjut ke [Pesan](./messages.html) untuk membaca yang masuk dan membalasnya, atau [Event](./events.html) untuk melihat semua yang dipancarkan socket.
