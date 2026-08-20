# Newsletter

Newsletters are WhatsApp channels. A channel JID ends in `@newsletter`, and messages inside one are addressed by a numeric **server id** rather than by a message key.

That distinction matters: most of the moderation and analytics methods below take a `server_id`, which you read from an incoming channel message, not the `key.id` you would use in a chat.

## Creating and editing

```js
const newsletter = await sock.newsletterCreate(
  'Elaina Updates',
  'Official update channel'
)

console.log(newsletter)
```

```js
await sock.newsletterUpdateName('123456789@newsletter', 'Elaina News')
await sock.newsletterUpdateDescription('123456789@newsletter', 'Fresh updates from Elaina')
await sock.newsletterUpdatePicture('123456789@newsletter', { url: 'https://example.com/channel.jpg' })
await sock.newsletterRemovePicture('123456789@newsletter')
```

## Following and muting

```js
await sock.newsletterFollow('123456789@newsletter')
await sock.newsletterUnfollow('123456789@newsletter')

await sock.newsletterMute('123456789@newsletter')
await sock.newsletterUnmute('123456789@newsletter')
```

## Reading a channel

```js
const metadata = await sock.newsletterMetadata('jid', '123456789@newsletter')
const newsletters = await sock.newsletterSubscribed()
```

## Reacting

Reactions are addressed by server id:

```js
await sock.newsletterReactMessage('123456789@newsletter', '175', '🔥')
```

Remove one by passing an empty string:

```js
await sock.newsletterReactMessage('123456789@newsletter', '175', '')
```

## Check what you are allowed to do first

Before offering a channel feature, WhatsApp Web asks the server which ones are enabled for this account. Do the same — it saves you from debugging a feature the server was never going to allow.

```js
const capabilities = await sock.newsletterAdminCapabilities('123456789@newsletter')
console.log(capabilities)
// [ 'INSIGHTS', 'ADMIN_NOTIFICATIONS', 'PHOTO_POLLS', 'QUESTIONS', 'QUIZ', 'THREAD_MENU' ]
```

Requires admin or owner rights. Other channels answer `Not Authorized`.

> [!IMPORTANT]
> This is the single most useful call on this page. Several channel features are gated server-side per account, and when a capability is missing the server does not error — it accepts the request and quietly discards it.

```js
const info = await sock.newsletterAdminInfo('123456789@newsletter')
```

## Moderation

```js
await sock.newsletterPinMessages('123456789@newsletter', [175])
await sock.newsletterUnpinMessages('123456789@newsletter', 175)
```

Content labels — `messageType` is the third argument and defaults to `MESSAGE`; pass `STATUS` to label a channel status:

```js
await sock.newsletterLabelAiContent('123456789@newsletter', 175)
await sock.newsletterLabelPaidPartnership('123456789@newsletter', 175)
```

Hide or restore a follower's answer to a channel question:

```js
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'HIDDEN')
await sock.newsletterQuestionResponseState('123456789@newsletter', questionServerId, responseServerId, 'VISIBLE')
```

## Admins

```js
await sock.newsletterCreateAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterRevokeAdminInvite('123456789@newsletter', '6281234567890@s.whatsapp.net')
await sock.newsletterAcceptAdminInvite('123456789@newsletter')

const pending = await sock.newsletterPendingAdminInvites('123456789@newsletter')
```

## Polls and who voted

Channel votes are sent unencrypted as option hashes, unlike the encrypted votes used in chats:

```js
await sock.newsletterSendPollVote('123456789@newsletter', pollServerId, ['Jakarta'])
```

```js
const voters = await sock.newsletterPollVoters('123456789@newsletter', 175, {
  limit: 100,
  voteHash: undefined
})
```

The response groups voters per `vote_hash`, each with a `voter_list.edges` array.

```js
const senders = await sock.newsletterReactionSenders('123456789@newsletter', 175)
```

## Followers and insights

```js
const followers = await sock.newsletterFollowers('123456789@newsletter', { count: 100 })
```

```js
const insights = await sock.newsletterInsights('123456789@newsletter', {
  metrics: ['NET_FOLLOWS', 'UNFOLLOWS']
})
// { result: [{ id, values }], last_update_time, metrics_status }
```

`metrics_status` is `OK` or `MISSING`. `MISSING` means the server has no data for that window yet — it is not an error, and retrying immediately will not help.

Only `NET_FOLLOWS` and `UNFOLLOWS` appear as literals in the WhatsApp Web bundle and are the defaults, but the metric list is a parameter, so other names can be tried.

## Discovery

```js
const recommended = await sock.newsletterRecommended({ limit: 20, countryCodes: ['ID'] })
const similar = await sock.newsletterSimilar('123456789@newsletter', { limit: 20 })
```

The directory is what the Updates tab uses:

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

Views are `RECOMMENDED`, `NEW`, `POPULAR`, `FEATURED` and `TRENDING`. Categories are `BUSINESS`, `ENTERTAINMENT`, `LIFESTYLE`, `NEWS`, `ORGANIZATIONS`, `PEOPLE`, `SPORTS` and `SPECIAL_EVENTS` through `SPECIAL_EVENTS_5`.

## How far this is verified

Most of this page was reconstructed from the WhatsApp Web bundle rather than from an existing implementation.

| Method | Status |
|---|---|
| `newsletterAdminCapabilities` | **Live** — answered with a real capability list, and `Not Authorized` for a channel the account does not administer |
| Everything else on this page | **Derived** — shape read from the bundle, never executed |

Derived does not mean broken; it means untested against a server. When one answers with a GraphQL error, the error text usually names the field that is wrong, and the fix is normally a variable name rather than a redesign.

> [!NOTE]
> `newsletterSubscribers` uses a query id that in the current bundle belongs to the pending-admin-invites query, and its data path does not exist in that response. Use `newsletterFollowers`, which is what WhatsApp Web itself uses. The old binding was left in place rather than silently repointed.

Full detail is in [EXPERIMENTAL.md](https://github.com/rexxzyid/elaina-baileys/blob/main/EXPERIMENTAL.md).
