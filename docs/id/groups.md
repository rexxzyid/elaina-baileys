# Grup

JID grup berakhiran `@g.us`. Peserta dialamati dengan JID pengguna — yang pada versi WhatsApp terbaru bisa berupa alamat `@lid`, bukan JID nomor telepon. Baca [Pesan](./messages.html#pengalamatan-jid-pn-dan-lid) sebelum mengasumsikan formatnya.

## Membuat grup

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

`id` yang dikembalikan adalah JID grup yang kamu pakai untuk semua operasi lain.

## Peserta

Semua perubahan peserta lewat satu method, dengan aksinya sebagai argumen ketiga:

```js
await sock.groupParticipantsUpdate(groupJid, [userJid], 'add')
await sock.groupParticipantsUpdate(groupJid, [userJid], 'remove')
await sock.groupParticipantsUpdate(groupJid, [userJid], 'promote')
await sock.groupParticipantsUpdate(groupJid, [userJid], 'demote')
```

Method ini menerima array, jadi gabungkan perubahan dalam satu panggilan daripada melakukan loop.

> [!NOTE]
> `add` tidak selalu benar-benar menambahkan. Kalau pengaturan privasi pengguna tidak mengizinkan ditambahkan ke grup, WhatsApp mengirimi mereka undangan. Cek status per peserta di responsnya, jangan langsung menganggap berhasil.

## Metadata dan pengaturan

```js
await sock.groupUpdateDescription(groupJid, 'Selamat datang di Elaina Community 💜')
```

Socket juga menyediakan metadata grup, ubah subjek, pengaturan, kode undangan, dan penanganan permintaan bergabung. Daftar lengkapnya ada di bagian **Groups** pada [Referensi API](./api.html#group).

## Komunitas

Komunitas adalah grup yang berisi grup lain. Method-nya terpisah, semuanya berawalan `community`:

```js
const community = await sock.communityCreate('Elaina Community', 'Deskripsi')

await sock.communityLinkGroup(groupJid, parentCommunityJid)
await sock.communityUnlinkGroup(groupJid, parentCommunityJid)

const linked = await sock.communityFetchLinkedGroups(communityJid)
```

Penanganan pesertanya mengikuti pola grup:

```js
await sock.communityParticipantsUpdate(communityJid, [userJid], 'add')
```

Daftar lengkapnya ada di bagian **Communities** pada [Referensi API](./api.html#community).

## Foto profil

Ini berlaku untuk JID pengguna, JID grup, maupun akunmu sendiri:

```js
const url = await sock.profilePictureUrl(jid, 'image')
```

```js
await sock.updateProfilePicture(jid, { url: 'https://example.com/profile.jpg' })
await sock.removeProfilePicture(jid)
```

`profilePictureUrl` menerima `'image'` untuk ukuran penuh atau `'preview'` untuk thumbnail. Method ini melempar error kalau akunnya tidak punya foto atau pengaturan privasinya menyembunyikannya — tangkap errornya supaya tidak menghentikan handler pesan:

```js
const url = await sock.profilePictureUrl(jid, 'image').catch(() => null)
```
