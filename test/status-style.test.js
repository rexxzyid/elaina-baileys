import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { proto } from '../WAProto/index.js';
import { StatusFont } from '../lib/Types/Message.js';
import { generateWAMessage, normalizeMessageContent, getContentType } from '../lib/Utils/messages.js';

const base = { upload: async () => ({ mediaUrl: 'https://media.test/x', directPath: '/x' }), logger: { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } } };
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

/**
 * groupStatus wraps the finished message, so the styling is applied first and
 * ends up on the extendedTextMessage inside groupStatusMessageV2, not lost at
 * the wrapper.
 */
{
    const { message } = await generateWAMessage(
        '120363000000000000@g.us',
        { text: 'halo grup', groupStatus: true },
        { ...base, backgroundColor: '#7C3AED', textColor: '#FFEE58', font: StatusFont.EXO2_EXTRABOLD }
    );
    assert.deepEqual(Object.keys(message).sort(), ['groupStatusMessageV2', 'messageContextInfo']);
    const inner = message.groupStatusMessageV2.message.extendedTextMessage;
    assert.equal(argb(inner.backgroundArgb), 'ff7c3aed');
    assert.equal(argb(inner.textArgb), 'ffffee58');
    assert.equal(inner.font, StatusFont.EXO2_EXTRABOLD);
    assert.equal(inner.contextInfo.isGroupStatus, true);
    assert.equal(getContentType(normalizeMessageContent(message)), 'extendedTextMessage');

    const decoded = proto.Message.decode(proto.Message.encode(message).finish());
    const wire = decoded.groupStatusMessageV2.message.extendedTextMessage;
    assert.equal(argb(wire.backgroundArgb), 'ff7c3aed');
    assert.equal(argb(wire.textArgb), 'ffffee58');
    assert.equal(wire.font, StatusFont.EXO2_EXTRABOLD);
    assert.equal(wire.contextInfo.isGroupStatus, true);
}

const dir = mkdtempSync(join(tmpdir(), 'status-style-'));
try {
    /**
     * The voice note background is a plain colour conversion, but it used to sit
     * in the same try as the duration and waveform passes. Those shell out and
     * fail on a host with no decoder, which silently took the colour with them.
     */
    const audio = join(dir, 'suara.ogg');
    writeFileSync(audio, Buffer.from('T2dnUwACAAAAAAAAAAA=', 'base64'));

    const { message } = await generateWAMessage(
        'status@broadcast',
        { audio: { url: audio }, mimetype: 'audio/ogg; codecs=opus', ptt: true },
        { ...base, backgroundColor: '#7C3AED' }
    );
    assert.equal(message.audioMessage.waveform, null, 'the waveform pass did fail on this fixture');
    assert.equal(argb(message.audioMessage.backgroundArgb), 'ff7c3aed', 'the colour survives it');

    /** A voice note group status keeps both the colour and the wrapper. */
    const group = await generateWAMessage(
        '120363000000000000@g.us',
        { audio: { url: audio }, mimetype: 'audio/ogg; codecs=opus', ptt: true, groupStatus: true },
        { ...base, backgroundColor: '#7C3AED' }
    );
    const inner = group.message.groupStatusMessageV2.message.audioMessage;
    assert.equal(argb(inner.backgroundArgb), 'ff7c3aed');
    assert.equal(inner.contextInfo.isGroupStatus, true);

    /** Without ptt there is no background at all, whatever the caller passed. */
    const plain = await generateWAMessage(
        'status@broadcast',
        { audio: { url: audio }, mimetype: 'audio/ogg' },
        { ...base, backgroundColor: '#7C3AED' }
    );
    assert.equal(plain.message.audioMessage.backgroundArgb, null);
}
finally {
    rmSync(dir, { recursive: true, force: true });
}

console.log('status style tests passed');
