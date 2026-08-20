# MessageBuilder

MessageBuilder is included in the package. It builds WhatsApp's interactive message types without you assembling the protobuf by hand.

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

The classes are also reachable through the `MessageBuilder` namespace or its short alias `MB`:

```js
const button = new MessageBuilder.Button(sock)
const carousel = new MB.Carousel(sock)
```

Every builder takes the socket in its constructor and ends with `.send(jid)`. Use `.build(jid)` instead when you want the message object without sending it.

## Button

`Button` builds native-flow interactive messages — the modern button type.

```js
import { Button } from '@rexxhayanasi/elaina-baileys'

const message = new Button(sock)
  .setTitle('Elaina Menu')
  .setBody('Choose an option below.')
  .setFooter('@rexxhayanasi/elaina-baileys')
  .addReply('Ping', 'ping')
  .addUrl('Open Website', 'https://example.com')
  .addCopy('Copy Code', 'ELAINA2026')

await message.send(jid)
```

`addReply(text, id)` sends `id` back to your bot when tapped — that `id` is what you match on in `messages.upsert`.

### With a media header

```js
const message = new Button(sock)
  .setImage('https://example.com/elaina.jpg')
  .setTitle('Elaina')
  .setBody('Interactive message with image header.')
  .setFooter('Powered by Elaina Baileys')
  .addReply('Menu', 'menu')
  .addUrl('Website', 'https://example.com')

await message.send(jid)
```

### Button types

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

### Content methods

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

## Lists

A single-select list is a `Button` with `addSelection`, then sections and rows:

```js
const list = new Button(sock)
  .setTitle('Elaina Menu')
  .setBody('Select one menu.')
  .setFooter('Elaina Baileys')
  .addSelection('Open Menu')
  .makeSection('Main Menu')
  .makeRow('', 'Profile', 'Open profile menu', 'profile')
  .makeRow('', 'Settings', 'Open settings menu', 'settings')
  .makeSection('Other')
  .makeRow('', 'About', 'About this bot', 'about')

await list.send(jid)
```

`makeRow(header, title, description, id)` — the last argument is the id delivered back to you, the same as `addReply`.

Rows attach to the section declared above them, so call `makeSection` before the rows that belong to it.

## ButtonV2

`ButtonV2` is the simpler classic button builder. Fewer button types, less to configure.

```js
import { ButtonV2 } from '@rexxhayanasi/elaina-baileys'

const message = new ButtonV2(sock)
  .setTitle('Elaina')
  .setSubtitle('WhatsApp Bot')
  .setBody('Choose an action.')
  .setFooter('Elaina Baileys')
  .setThumbnail('https://example.com/elaina.jpg')
  .addButton('Menu', 'menu')
  .addButton('Ping', 'ping')

await message.send(jid)
```

## Carousel

A carousel is several cards you can swipe. Build each card with `Button.toCard()`, then hand them to `Carousel`.

```js
import { Button, Carousel } from '@rexxhayanasi/elaina-baileys'

const card1 = await new Button(sock)
  .setImage('https://example.com/card1.jpg')
  .setBody('First card')
  .addReply('Select', 'card_1')
  .toCard()

const card2 = await new Button(sock)
  .setImage('https://example.com/card2.jpg')
  .setBody('Second card')
  .addUrl('Open', 'https://example.com')
  .toCard()

const carousel = new Carousel(sock)
  .setBody('Choose one of the cards below.')
  .setFooter('Elaina Carousel')
  .addCard([card1, card2])

await carousel.send(jid)
```

`toCard()` is async because it uploads the media — remember the `await`.

> [!IMPORTANT]
> Every carousel card needs an image or video in its header. A card without media will not render.

## AIRich

`AIRich` builds rich responses with mixed content blocks — text, code, tables — in one message.

```js
import { AIRich } from '@rexxhayanasi/elaina-baileys'

const rich = new AIRich(sock)
  .setTitle('Elaina AI')
  .setFooter('Generated with AIRich')
  .addText('Hello! This is a rich response.')
  .addCode('javascript', `console.log('Hello Elaina')`)

await rich.send(jid)
```

Blocks render in the order you add them, so the call order is the layout.

## Choosing one

| Use | When |
|---|---|
| `Button` | modern interactive buttons, URLs, copy, calls, lists |
| `ButtonV2` | plain reply buttons, nothing more |
| `Carousel` | several media cards in one swipeable message |
| `AIRich` | mixed blocks of text, code and tables |

## Rendering differences

Interactive messages depend on the recipient's WhatsApp version and platform. A button that renders on Android may fall back to plain text on an older desktop client. Test on the platforms you actually support, and keep the message readable if the interactive part does not render.
