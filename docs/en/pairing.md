# Pairing code

Pairing by code avoids scanning a QR. A code can be requested after the socket is built, and only if the account is not yet registered.

```js
const phoneNumber = '6281234567890'

if (!state.creds.registered) {
  const code = await sock.requestPairingCode(phoneNumber)
  console.log('Pairing code:', code)
}
```

The number is normalised before use, so `+62 812-3456-7890` and `6281234567890` are the same request. What gets rejected is a number that cannot possibly be valid: fewer than 6 or more than 15 digits, or a leading `0` — a country code never starts with a zero, so `081234567890` is the local form, not the international form WhatsApp expects.

```js
await sock.requestPairingCode('081234567890')
// Boom 400: phoneNumber must be in international format:
// country code then the national number, digits only
```

## The request is confirmed by the server

`requestPairingCode` waits for WhatsApp's answer and only returns once the server has registered the code. Rejections are thrown, not swallowed, so the code you receive is the one the server actually knows:

```js
try {
  const code = await sock.requestPairingCode(phoneNumber)
  console.log('Pairing code:', code)
} catch (error) {
  console.log(error.message)   // e.g. rate-overlimit, not-allowed
  console.log(error.data)      // e.g. 429
}
```

The two rejections you meet most: `rate-overlimit` — too many attempts, wait before trying again — and a not-allowed variant, meaning link-by-phone-number is not enabled for that account.

## One code at a time

A pairing response can only be decrypted by the key that produced it, so a second request while the first is still pending destroys the first. That is rejected with a `409`:

```js
try {
  await sock.requestPairingCode(phoneNumber)
} catch (error) {
  if (error.output?.statusCode === 409) {
    console.log('still pending, seconds left:', error.data.secondsLeft)
  }
}
```

Call `cancelPairingCode()` to abandon a pending attempt and request a fresh one right away. It returns whether there was anything to cancel:

```js
sock.cancelPairingCode()
const code = await sock.requestPairingCode(phoneNumber)
```

The guard cleans up after itself once the code expires. WhatsApp rotates pairing codes every 3 minutes; adjust `pairingCodeTimeoutMs` if you need a different window.

## Custom pairing code

A custom pairing code must be exactly **8 characters**. Shorter or longer is rejected.

```js
const code = await sock.requestPairingCode(
  '6281234567890',
  'ELAINA01'
)

console.log(code)
```

## Checking pairing without touching a running bot

`script/testpairing.js` runs a single pairing request against a throwaway session directory, so a connected bot's credentials are never overwritten:

```bash
node script/testpairing.js 6281234567890 --check-only
```

`--check-only` reports whether the server accepted the registration and never prints the code — use it anywhere the output can be read by someone else. Drop the flag to print the code and wait for the link to finish.

> [!IMPORTANT]
> If a code appears but the phone never shows a prompt, the number requested is usually not the one that opens WhatsApp on that phone. The code goes to the number in the argument, not to the device running your bot.

## Next

Once connected, move on to [Messages](./messages.html) to read what comes in and reply, or [Events](./events.html) to see everything the socket emits.
