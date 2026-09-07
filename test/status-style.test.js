import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { StatusFont } from '../lib/Types/Message.js';
import { generateWAMessage } from '../lib/Utils/messages.js';

const base = { upload: async () => ({}), logger: { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } } };
const text = (options) => generateWAMessage('status@broadcast', { text: 'Halo' }, { ...base, ...options });
const argb = value => (value >>> 0).toString(16).padStart(8, '0');

/** The font enum is the client's own, not the media editor's five-font list. */
{
    assert.deepEqual({ ...StatusFont }, {
        SYSTEM: 0,
        SYSTEM_TEXT: 1,
        FB_SCRIPT: 2,
        SYSTEM_BOLD: 6,
        MORNINGBREEZE_REGULAR: 7,
        CALISTOGA_REGULAR: 8,
        EXO2_EXTRABOLD: 9,
        COURIERPRIME_BOLD: 10
    });
    assert.equal(StatusFont, proto.Message.ExtendedTextMessage.FontType);
}

/** Six-digit hex is opaque, and the leading hash is optional. */
{
    const { message } = await text({ backgroundColor: '#7C3AED', textColor: '#FFFFFF' });
    assert.equal(argb(message.extendedTextMessage.backgroundArgb), 'ff7c3aed');
    assert.equal(argb(message.extendedTextMessage.textArgb), 'ffffffff');
    const bare = await text({ backgroundColor: '7C3AED' });
    assert.equal(argb(bare.message.extendedTextMessage.backgroundArgb), 'ff7c3aed');
}

/** Eight digits keep the alpha the caller asked for. */
{
    const { message } = await text({ backgroundColor: '807C3AED' });
    assert.equal(argb(message.extendedTextMessage.backgroundArgb), '807c3aed');
}

/** A number passes through, and a negative one wraps into the unsigned range. */
{
    const { message } = await text({ backgroundColor: 0xff000000, textColor: -1 });
    assert.equal(argb(message.extendedTextMessage.backgroundArgb), 'ff000000');
    assert.equal(argb(message.extendedTextMessage.textArgb), 'ffffffff');
}

/** Nothing is written when nothing is asked for. */
{
    const { message } = await text({});
    assert.equal('backgroundArgb' in message.extendedTextMessage, false);
    assert.equal('textArgb' in message.extendedTextMessage, false);
    assert.equal('font' in message.extendedTextMessage, false);
}

/** All three survive the wire, which is where FIXED32 could have gone wrong. */
{
    const { message } = await text({ backgroundColor: '#7C3AED', textColor: '#FFEE58', font: StatusFont.CALISTOGA_REGULAR });
    const decoded = proto.Message.decode(proto.Message.encode(message).finish()).extendedTextMessage;
    assert.equal(argb(decoded.backgroundArgb), 'ff7c3aed');
    assert.equal(argb(decoded.textArgb), 'ffffee58');
    assert.equal(decoded.font, StatusFont.CALISTOGA_REGULAR);
}

console.log('status style tests passed');
