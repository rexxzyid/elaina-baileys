# Newsletter

Newsletter adalah channel WhatsApp. JID channel berakhiran `@newsletter`, dan pesan di dalamnya dialamati dengan **server id** berupa angka, bukan dengan message key.

Perbedaan itu penting: sebagian besar method moderasi dan analitik di bawah menerima `server_id`, yang kamu baca dari pesan channel yang masuk — bukan `key.id` yang biasa dipakai di chat.

## Membuat dan menyunting

```js
const newsletter = await sock.newsletterCreate(
  'Elaina Updates',
  'Channel update resmi'
)

console.log(newsletter)
```

```js
await sock.newsletterUpdateName('123456789@newsletter', 'Elaina News')
await sock.newsletterUpdateDescription('123456789@newsletter', 'Update terbaru dari Elaina')
await sock.newsletterUpdatePicture('123456789@newsletter', { url: 'https://example.com/channel.jpg' })
await sock.newsletterRemovePicture('123456789@newsletter')
```

## Follow dan mute

```js
await sock.newsletterFollow('123456789@newsletter')
await sock.newsletterUnfollow('123456789@newsletter')

await sock.newsletterMute('123456789@newsletter')
await sock.newsletterUnmute('123456789@newsletter')
```

## Membaca channel

```js
const metadata = await sock.newsletterMetadata('jid', '123456789@newsletter')
const newsletters = await sock.newsletterSubscribed()
```

## Reaksi

Reaksi dialamati dengan server id:

```js
await sock.newsletterReactMessage('123456789@newsletter', '175', '🔥')
```

Hapus reaksi dengan string kosong:

```js
await sock.newsletterReactMessage('123456789@newsletter', '175', '')
```

## Cek dulu apa yang boleh kamu lakukan

Sebelum menawarkan fitur channel, WhatsApp Web bertanya ke server fitur mana yang aktif untuk akun ini. Lakukan hal yang sama — ini menyelamatkan kamu dari mendebug fitur yang memang tidak akan pernah diizinkan server.

```js
const capabilities = await sock.newsletterAdminCapabilities('123456789@newsletter')
console.log(capabilities)
// [ 'INSIGHTS', 'ADMIN_NOTIFICATIONS', 'PHOTO_POLLS', 'QUESTIONS', 'QUIZ', 'THREAD_MENU' ]
```

Butuh hak admin atau owner. Channel lain menjawab `Not Authorized`.

> [!IMPORTANT]
> Ini panggilan paling berguna di halaman ini. Beberapa fitur channel dibatasi di sisi server per akun, dan ketika sebuah capability tidak ada, server **tidak** mengembalikan error — ia menerima request lalu membuangnya diam-diam.

```js
const info = await sock.newsletterAdminInfo('123456789@newsletter')
```

## Moderasi

```js
await sock.newsletterPinMessages('123456789@newsletter', [175])
await sock.newsletterUnpinMessages('123456789@newsletter', 175)
```

Label konten — `messageType` adalah argumen ketiga dan default-nya `MESSAGE`; kirim `STATUS` untuk melabeli status channel:

```js
await sock.newsletterLabelAiContent('123456789@newsletter', 175)
await sock.newsletterLabelPaidPartnership('123456789@newsletter', 175)
```

Sembunyikan atau tampilkan lagi jawaban follower atas pertanyaan channel:

```js
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'HIDDEN')
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'VISIBLE')
```

## Admin

```js
await sock.newsletterCreateAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterRevokeAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterAcceptAdminInvite('123456789@newsletter')

const pending = await sock.newsletterPendingAdminInvites('123456789@newsletter')
```

## Polling dan siapa yang memilih

Vote channel dikirim tanpa enkripsi sebagai hash opsi, berbeda dengan vote terenkripsi yang dipakai di chat:

```js
await sock.newsletterSendPollVote('123456789@newsletter', pollServerId, ['Jakarta'])
```

```js
const voters = await sock.newsletterPollVoters('123456789@newsletter', 175, {
  limit: 100,
  voteHash: undefined
})
```

Responsnya mengelompokkan pemilih per `vote_hash`, masing-masing dengan array `voter_list.edges`.

```js
const senders = await sock.newsletterReactionSenders('123456789@newsletter', 175)
```

## Follower dan insight

```js
const followers = await sock.newsletterFollowers('123456789@newsletter', { count: 100 })
```

```js
const insights = await sock.newsletterInsights('123456789@newsletter', {
  metrics: ['NET_FOLLOWS', 'UNFOLLOWS']
})
// { result: [{ id, values }], last_update_time, metrics_status }
```

`metrics_status` bernilai `OK` atau `MISSING`. `MISSING` berarti server belum punya data untuk rentang itu — bukan error, dan mengulang seketika tidak akan membantu.

Hanya `NET_FOLLOWS` dan `UNFOLLOWS` yang muncul sebagai literal di bundle WhatsApp Web dan jadi default-nya, tapi daftar metrik adalah parameter, jadi nama lain bisa dicoba.

## Penemuan channel

```js
const recommended = await sock.newsletterRecommended({ limit: 20, countryCodes: ['ID'] })
const similar = await sock.newsletterSimilar('123456789@newsletter', { limit: 20 })
```

Direktori adalah yang dipakai tab Pembaruan:

```js
const list = await sock.newsletterDirectoryList({
  view: 'RECOMMENDED',
  categories: ['NEWS'],
  countryCodes: ['ID'],
  limit: 20
})

const found = await sock.newsletterDirectorySearch('elaina', { limit: 20 })
const preview = await sock.newsletterDirectoryCategories({ categories: ['NEWS'], countryCode: 'ID' })
```

Nilai `view`: `RECOMMENDED`, `NEW`, `POPULAR`, `FEATURED`, `TRENDING`. Kategori: `BUSINESS`, `ENTERTAINMENT`, `LIFESTYLE`, `NEWS`, `ORGANIZATIONS`, `PEOPLE`, `SPORTS`, dan `SPECIAL_EVENTS` sampai `SPECIAL_EVENTS_5`.

## Seberapa jauh ini terverifikasi

Sebagian besar halaman ini direkonstruksi dari bundle WhatsApp Web, bukan dari implementasi yang sudah ada.

| Method | Status |
|---|---|
| `newsletterAdminCapabilities` | **Live** — menjawab dengan daftar capability sungguhan, dan `Not Authorized` untuk channel yang tidak diadministrasi akun ini |
| Sisanya di halaman ini | **Derived** — bentuknya dibaca dari bundle, belum pernah dijalankan |

Derived bukan berarti rusak; artinya belum diuji ke server. Kalau salah satunya menjawab dengan error GraphQL, teks error-nya biasanya menyebut field mana yang salah, dan perbaikannya umumnya sekadar nama variabel, bukan rancang ulang.

> [!NOTE]
> `newsletterSubscribers` memakai query id yang di bundle sekarang justru milik query pending-admin-invites, dan data path-nya tidak ada di respons itu. Pakai `newsletterFollowers`, yang memang dipakai WhatsApp Web sendiri. Binding lama sengaja dibiarkan, bukan diam-diam diarahkan ulang.

Detail lengkapnya ada di [EXPERIMENTAL.md](https://github.com/rexxzyid/elaina-baileys/blob/main/EXPERIMENTAL.md).
