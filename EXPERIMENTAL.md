# Experimental

Features reconstructed from the WhatsApp Web bundle rather than from an existing
library. Each one lists where its wire format came from and how far it has been
verified, so you know what to trust before shipping it.

Verification levels used below:

| Level | Meaning |
|---|---|
| **Live** | executed against WhatsApp's servers and answered as expected |
| **Offline** | stanza, proto or parser verified locally, never sent to a server |
| **Derived** | shape taken from the bundle, no execution at all |

---

## Newsletter status

`sendNewsletterStatus`, `sendNewsletterStatusReaction`, `revokeNewsletterStatus`,
`getNewsletterStatuses`.

Source: the Web status-publish RPC — `WASmaxOutStatusPublishPostNewsletterStatusRequest`
and its mixins, plus `WASmaxInStatusPublishStatusAckMixin` for the ack.

The stanza is a single flat element; every mixin merges onto the same `<status>`:

```xml
<status to="123@newsletter" id="MSGID" type="text">
  <plaintext>PROTO_MESSAGE</plaintext>
</status>
```

Media adds `type="media" media_id="UPLOAD_HANDLE"` and `<plaintext mediatype="image">`.
`media_id` is the `handle` field of the newsletter upload response, which the upload
result now keeps. Questions ride on media with `<meta interaction_type="question"/>`,
question responses are text statuses carrying the parent `server_id`, reaction revoke
is `edit="7"` and status revoke is `edit="8"`.

The payload is the plain message proto. WhatsApp Web never wraps an outgoing status in
`newsletterAdminProfileStatusMessage`; that field is only a future-proof container on
the receiving side. Every status carries
`contextInfo.statusAttributions = [{ type: NEWSLETTER_STATUS }]` and
`featureEligibilities.canBeReshared`, matching the Web client. Pass
`statusAttribution: false` to omit them.

The ack is `<ack from class="status" id t [server_id] [edit]>`; a negative ack adds
`error` plus optional `application_error` and `backoff`.

**Verification: Live (partly).** The server accepts the stanza and answers a positive
ack with `class="status"`. It did **not** return `server_id`, and the published status
did not appear in `getNewsletterStatuses` — consistent with the account lacking the
`CHANNEL_STATUS_PRODUCER` capability, which gates posting. The transport is correct;
whether the status is stored depends on that capability.

> [!IMPORTANT]
> Posting a channel status needs the `channel_status_creation` feature, admin or owner
> rights, and `CHANNEL_STATUS_PRODUCER` in the channel capabilities. Check with
> `newsletterAdminCapabilities` first — without it the server acks and discards.

`server_id` is optional on the ack. When it is missing, read it back with
`getNewsletterStatuses`; reactions and question responses need it as `parentServerId`.

---

## Newsletter questions and polls

Newsletter questions never worked because the `<meta>` node they are keyed by was never
sent. The Web client publishes them as:

```xml
<message to="123@newsletter" id="MSGID" type="text">
  <meta questiontype="question"/>
  <plaintext>PROTO</plaintext>
</message>
```

`questiontype` is `question` when the channel asks, `response` when a follower answers,
and `reply` when the channel answers back. The `questionReply` content shortcut was added
for the third case; it wraps `questionReplyMessage` and carries
`contextInfo.questionReplyQuotedMessage` with the question server id.

Poll result snapshots were also mis-keyed: they now send `type="poll"` with
`<meta polltype="result_snapshot">`. Valid `polltype` values are `creation`,
`quiz_creation`, `vote` and `result_snapshot`.

**Verification: Offline.** Message generation checked for all three question types;
the meta node is derived from the message wrapper, never guessed.

### Photo polls

Give a poll option an `image` and the poll becomes a photo poll:

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

Each image is uploaded once, `pollContentType` becomes `IMAGE`, and each option carries
the hash the Web client derives. The option images follow the poll as
`pollCreationOptionImageMessage` children associated by `MEDIA_POLL` with
`<meta message_association_type="media_poll">`, while the poll is keyed
`<meta polltype="creation" contenttype="image">`. String options still send a plain
text poll and may be mixed with image options.

**Verification: Offline.** The proto is verified — `pollContentType: IMAGE` with per
option hashes. One detail is inferred rather than read: the option hash is
`sha256(sha256hex(name) + base64(fileSha256))`, and the base64 representation of the
file hash is the part that was not directly observable in the bundle.

### Channel poll votes

`newsletterSendPollVote(jid, pollServerId, ['Jakarta'])` sends the votes node newsletters
use, where each `<vote>` is the raw sha256 of the option name rather than the encrypted
vote used in chats.

**Verification: Derived.**

---

## Newsletter queries

All taken id-by-id from the persisted queries in the bundle.

| Method | What it answers |
|---|---|
| `newsletterAdminCapabilities` | which channel features the server enabled for you |
| `newsletterAdminInfo` | the channel admin profile |
| `newsletterInsights` | admin analytics, per metric values with timestamps |
| `newsletterFollowers` | the follower list |
| `newsletterPendingAdminInvites` | admin invites still awaiting an answer |
| `newsletterPinMessages` / `newsletterUnpinMessages` | pin by message server id |
| `newsletterPollVoters` | voters grouped per vote hash |
| `newsletterReactionSenders` | who reacted to a message |
| `newsletterLabelAiContent` / `newsletterLabelPaidPartnership` | content labels |
| `newsletterCreateAdminInvite` / `Revoke` / `Accept` | the admin invite mutations |
| `newsletterQuestionResponseState` | hide or show a follower's answer |
| `newsletterRecommended` / `newsletterSimilar` | discovery |
| `newsletterDirectoryList` / `Search` / `Categories` | the channel directory |

Directory views are `RECOMMENDED`, `NEW`, `POPULAR`, `FEATURED` and `TRENDING`.
Categories are `BUSINESS`, `ENTERTAINMENT`, `LIFESTYLE`, `NEWS`, `ORGANIZATIONS`,
`PEOPLE`, `SPORTS` and `SPECIAL_EVENTS` through `SPECIAL_EVENTS_5`.

**Verification: `newsletterAdminCapabilities` is Live** — it answered with the capability
list for a channel and `Not Authorized` for a channel the account does not administer.
Everything else is **Derived**.

For insights, only `NET_FOLLOWS` and `UNFOLLOWS` appear as string literals in the bundle
and are the defaults; the metric list is a parameter so other names can be tried.
`metrics_status: MISSING` means the server has no data for the window yet, not an error.

> [!NOTE]
> `newsletterSubscribers` uses query id `9783111038412085`, which in the current bundle
> is the pending-admin-invites query, and its `xwa2_newsletter_subscribers` path does not
> exist in that response. `newsletterFollowers` is what the Web client uses instead. The
> old binding was left in place rather than silently repointed.

---

## Username, About and link preview

| Method | Query |
|---|---|
| `getUsername` | `xwa2_username_get` |
| `setUsername` / `removeUsername` | `xwa2_username_set` |
| `setUsernamePin` | `xwa2_username_pin_set` |
| `checkUsernameAvailability` | `xwa2_username_check`, with server suggestions |
| `updateTextStatus` / `fetchTextStatus` | `xwa2_update_text_status`, `xwa2_text_status_list` |
| `fetchAbout` | `xwa2_users_updates_since` |
| `fetchServerLinkPreview` | `xwa2_newsletter_link_preview` |

WhatsApp Web moved About to MEX, where it is `{ text, emoji: { content }, ephemeral_duration_sec }`
— an About can now carry an emoji and expire on its own, which the classic `status` IQ
cannot express. That IQ (`updateProfileStatus`) is untouched.

`fetchServerLinkPreview` lets the server build the preview instead of scraping the page.

**Verification: Derived.**

---

## Terms of service, opt-out and push

| Method | Namespace |
|---|---|
| `fetchUserNotices` / `updateUserNoticeStage` | `tos` |
| `fetchOptOutList` / `updateOptOut` | `optoutlist` |
| `fetchPushSettings` | `urn:xmpp:whatsapp:push` |

WhatsApp gates features behind notices — the channel terms notice among them — so a
client that never answers them stays gated. `stage` is the server's own counter for a
notice: read the current value from `fetchUserNotices` before advancing it.

**Verification: Derived.**

---

## WAProto additions

Four Message types the Web bundle declares and `WAProto` did not:

| Field | Type |
|---|---|
| 128 | `splitPaymentUpdateMessage` — `splitId`, `participantJid` |
| 129 | `musicMessage` — `embeddedMusic`, `songUri`, `artworkUri`, `style`, `contextInfo` |
| 130 | `statusLinkPreviewMetadata` — `style` |
| 131 | `botPlatformRegistrationSuccessMessage` — a `FutureProofMessage` |

Without these, messages of those types decode incompletely on arrival; `musicMessage` is
the one likely to be seen in practice.

`statusLinkPreviewMetadata.style` is declared `int32` rather than an enum: the field is an
enum in the bundle, but its value names were not resolvable there, and an int32 is wire
compatible with an enum. `MusicMessage.style` is `int32` in the bundle itself.

**Verification: Offline.** Each field was encoded and decoded again, and the field number
on the wire was read back from the raw bytes to confirm 128 through 131.

---

## Known proto gaps beyond Message

Catching `Message` up to field 131 closed the top-level oneof, but the bundle declares
fields on other types that `WAProto` does not. These are recorded rather than patched:
adding them means regenerating the proto, and the watcher below reports them on every run.

The ones most likely to matter:

| Type | Missing fields |
|---|---|
| `PreKeySignalMessage` | `kyberCiphertext`, `kyberPreKeyId` — post-quantum prekeys |
| `ContextInfo` | `aiProvenance`, `instagramThreadLink` |
| `MessageContextInfo` | `accountEncryptionAttestation`, `associatedPrimaryIdentityKey` |
| `ProtocolMessage` | `coexStateSync`, `markAsVerifiedAction` |
| `SyncActionValue` | `bubbleLockMessageAction`, `ctwaMessageReceivedAction`, `deviceCapabilitiesV2`, `labelSublistAction` |
| `ExtendedTextMessage` | `faviconMmsMetadata` |
| `DeviceCapabilities` | `aiFbidMigration`, `bizAiSettingsSync`, `contactRefresh` |
| `Call` | `callReason` |
| `HistorySyncConfig` | `supportNewsletter` |

Smaller gaps sit on `BotMetadata`, `BotAgentDeepLinkMetadata`,
`BotSignatureVerificationUseCaseProof`, `BusinessBroadcastListAction`,
`BusinessInteractionPills`, `MessageHistoryNotice`, `MusicUserIdAction`,
`PaymentExtendedMetadata`, `PeerDataOperationResult`, `RootSecretEntry`,
`SenderKeyDistributionMessage` and `SettingsSyncAction`.

Unknown proto fields are skipped on decode rather than fatal, so these show up as data
quietly missing from received messages, not as errors.

---

## Unmodelled MEX notifications

WhatsApp Web routes 35 operations through its `w:mex` notification handler. This fork
named 16 and shared 14 of them with the Web list; the remaining 21 fell into a `default`
branch that logged and returned, so nothing downstream could ever see them:

| Area | Operations |
|---|---|
| Events | `NotificationEventDelete`, `Invite`, `InviteRemove`, `Reminder`, `Rsvp`, `Update` |
| Group properties | `NotificationGroupPropertyUpdate`, `GroupHiddenPropertyUpdate`, `GroupLimitSharingPropertyUpdate`, `GroupMemberLinkPropertyUpdate`, `GroupMemberShareGroupHistoryModePropertyUpdate`, `GroupSafetyCheckPropertyUpdate`, `GroupAppealStatusUpdate` |
| Communities | `NotificationCommunityOwnerUpdate` |
| Newsletters | `NotificationNewsletterAIContentUpdate`, `NotificationNewsletterAdminProfileUpdate`, `NotificationNewsletterPaidPartnershipUpdate` |
| Scheduled messages | `NotificationScheduledMessagePost`, `NotificationScheduledMessageReveal` |
| Integrity | `NotificationIntegrityChallengeRequest`, `NotificationUserBrigadingUpdate` |

One of those is a plain name mismatch rather than a missing feature: the fork listened for
`NotificationNewsletterPaidPartnership`, while the Web bundle sends
`NotificationNewsletterPaidPartnershipUpdate`. Both names now route to the newsletter
handler, so paid-partnership notifications reach it for the first time.

The default branch now re-emits the rest instead:

```js
sock.ev.on('mex.notification', ({ operation, updates, data }) => {
  console.log(operation, updates)
})
```

Modelling each one properly means knowing its payload shape, which the bundle only gives
for the operations WhatsApp Web itself renders. The passthrough is the honest middle
ground: the data reaches you unchanged, typed as whatever the server sent, and anything
worth modelling can be promoted to a real event later without breaking it.

**Verification: Offline.** The operation list is read from the Web bundle's notification
router; the payloads have not been observed on the wire.

---

## Keeping up with WhatsApp Web

```bash
npm run check:proto
```

Downloads the current bundle, extracts every proto spec in it, and compares both the
`Message` oneof and the fields of every other type with `WAProto`. It prints the live and
pinned client revisions and exits non-zero when WhatsApp declares fields this proto does
not.

The `Proto Watch` workflow runs it daily. When the client revision drifts it applies
`npm run update:version` and commits the bump. When new Message fields appear it opens or
updates an issue labelled `proto-watch` instead of patching anything: adding fields means
regenerating `WAProto`, which should be reviewed rather than committed by a robot.

---

## Testing what is only Derived

Most of the surface above has never been executed against a server. When something
answers with a GraphQL error or an unexpected stanza, the error text usually names the
field that is wrong, and the fix is normally a variable name rather than a redesign.
