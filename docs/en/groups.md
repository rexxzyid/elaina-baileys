# Groups

A group JID ends in `@g.us`. Participants are addressed by their user JID — which, on recent WhatsApp versions, may be a `@lid` address rather than a phone-number JID. See [Messages](./messages.html#addressing-jid-pn-and-lid) before you assume the format.

## Creating a group

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

The returned `id` is the group JID you use for everything else.

## Participants

Every participant change goes through one method, with the action as the third argument:

```js
await sock.groupParticipantsUpdate(groupJid, [userJid], 'add')
await sock.groupParticipantsUpdate(groupJid, [userJid], 'remove')
await sock.groupParticipantsUpdate(groupJid, [userJid], 'promote')
await sock.groupParticipantsUpdate(groupJid, [userJid], 'demote')
```

It takes an array, so batch changes in one call rather than looping.

> [!NOTE]
> `add` does not always add. If the user's privacy settings do not allow being added to groups, WhatsApp sends them an invite instead. Check the per-participant status in the response rather than assuming success.

## Metadata and settings

```js
await sock.groupUpdateDescription(groupJid, 'Welcome to Elaina Community 💜')
```

The socket also exposes group metadata, subject updates, settings, invite codes and join-request handling. They are listed in full under **Groups** in the [API reference](./api.html#group).

## Communities

Communities are groups that contain other groups. They have their own set of methods, all prefixed `community`:

```js
const community = await sock.communityCreate('Elaina Community', 'Description')

await sock.communityLinkGroup(groupJid, parentCommunityJid)
await sock.communityUnlinkGroup(groupJid, parentCommunityJid)

const linked = await sock.communityFetchLinkedGroups(communityJid)
```

Participant handling mirrors groups:

```js
await sock.communityParticipantsUpdate(communityJid, [userJid], 'add')
```

The full list is under **Communities** in the [API reference](./api.html#community).

## Profile pictures

These work for a user JID, a group JID, or your own account:

```js
const url = await sock.profilePictureUrl(jid, 'image')
```

```js
await sock.updateProfilePicture(jid, { url: 'https://example.com/profile.jpg' })
await sock.removeProfilePicture(jid)
```

`profilePictureUrl` takes `'image'` for the full-size picture or `'preview'` for the thumbnail. It throws when the account has no picture or their privacy settings hide it — catch it rather than letting it stop a message handler:

```js
const url = await sock.profilePictureUrl(jid, 'image').catch(() => null)
```
