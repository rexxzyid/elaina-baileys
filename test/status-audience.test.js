import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import {
    STATUS_AUDIENCE_DEFAULT_EMOJI,
    STATUS_AUDIENCE_DEFAULT_LIST_NAME,
    makeStatusAudienceMetadata,
    prepareModernMessageContent
} from '../lib/Utils/modern-messages.js';
import { generateWAMessage, normalizeMessageContent } from '../lib/Utils/messages.js';

const AudienceType = proto.ContextInfo.StatusAudienceMetadata.AudienceType;
const opts = { upload: async () => ({}), logger: { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } } };
const build = (jid, content) => generateWAMessage(jid, prepareModernMessageContent(content), opts);

/** The client falls back to a star and "Close friends" when the poster named neither. */
{
    assert.equal(STATUS_AUDIENCE_DEFAULT_EMOJI, '⭐');
    assert.equal(STATUS_AUDIENCE_DEFAULT_LIST_NAME, 'Close friends');
    const meta = makeStatusAudienceMetadata({});
    assert.equal(meta.listName, STATUS_AUDIENCE_DEFAULT_LIST_NAME);
    assert.equal(meta.listEmoji, STATUS_AUDIENCE_DEFAULT_EMOJI);
    assert.equal(meta.audienceType, AudienceType.CLOSE_FRIENDS, 'a named audience is a close friends list');
}

/** A bare string is the list name, since that is the only part with no sane default. */
{
    const meta = makeStatusAudienceMetadata('Besties');
    assert.equal(meta.listName, 'Besties');
    assert.equal(meta.listEmoji, STATUS_AUDIENCE_DEFAULT_EMOJI);
}

/** The enum takes a name as readily as a number. */
{
    assert.equal(makeStatusAudienceMetadata({ audienceType: 'UNKNOWN' }).audienceType, AudienceType.UNKNOWN);
    assert.equal(makeStatusAudienceMetadata({ audienceType: 0 }).audienceType, AudienceType.UNKNOWN);
    assert.equal(makeStatusAudienceMetadata({ audienceType: 'bukan enum' }).audienceType, AudienceType.CLOSE_FRIENDS);
    assert.throws(() => makeStatusAudienceMetadata(42), TypeError);
}

/** statusAudience is a shorthand for the contextInfo field, and lands on the message. */
{
    const { message } = await build('status@broadcast', {
        text: 'Halo besties',
        statusAudience: { listName: 'Besties', listEmoji: '💜' }
    });
    const meta = message.extendedTextMessage.contextInfo.statusAudienceMetadata;
    assert.equal(meta.listName, 'Besties');
    assert.equal(meta.listEmoji, '💜');
    assert.equal(meta.audienceType, AudienceType.CLOSE_FRIENDS);
    assert.equal('statusAudience' in message, false, 'the shorthand is consumed, not forwarded');
}

/** Writing contextInfo yourself works too, and the shorthand does not stomp on it. */
{
    const { message } = await build('status@broadcast', {
        text: 'Halo',
        statusAudience: { listName: 'Besties' },
        contextInfo: { isForwarded: true }
    });
    assert.equal(message.extendedTextMessage.contextInfo.isForwarded, true);
    assert.equal(message.extendedTextMessage.contextInfo.statusAudienceMetadata.listName, 'Besties');
}

/** It survives the wire, which is the only proof that matters. */
{
    const { message } = await build('status@broadcast', {
        text: 'Halo besties',
        statusAudience: { listName: 'Besties', listEmoji: '💜' }
    });
    const decoded = proto.Message.decode(proto.Message.encode(message).finish());
    const meta = decoded.extendedTextMessage.contextInfo.statusAudienceMetadata;
    assert.equal(meta.listName, 'Besties');
    assert.equal(meta.listEmoji, '💜');
    assert.equal(meta.audienceType, AudienceType.CLOSE_FRIENDS);
}

/**
 * A group status and a custom audience are two different fields and can ride
 * together: groupStatus wraps the whole thing in groupStatusMessageV2 and sets
 * isGroupStatus, the audience metadata sits beside it in the same contextInfo.
 */
{
    const { message } = await build('120363000000000000@g.us', {
        text: 'halo grup',
        groupStatus: true,
        statusAudience: { listName: 'Besties', listEmoji: '💜' }
    });
    assert.deepEqual(Object.keys(message).sort(), ['groupStatusMessageV2', 'messageContextInfo']);
    const inner = message.groupStatusMessageV2.message.extendedTextMessage;
    assert.equal(inner.contextInfo.isGroupStatus, true);
    assert.equal(inner.contextInfo.statusAudienceMetadata.listName, 'Besties');
    assert.equal(normalizeMessageContent(message).extendedTextMessage.text, 'halo grup');
}

/** A status attribution and an audience are independent, and both land. */
{
    const { message } = await build('status@broadcast', {
        text: 'reshare',
        statusAudience: 'Besties',
        newsletterStatus: { newsletterJid: '123@newsletter', messageId: 4 }
    });
    const contextInfo = message.extendedTextMessage.contextInfo;
    assert.equal(contextInfo.statusAudienceMetadata.listName, 'Besties');
    assert.equal(contextInfo.statusAttributions.length, 1);
}

/**
 * The modern builders replace the whole content and none of them has a
 * contextInfo slot, so an audience passed alongside one would vanish without a
 * trace. Say so instead.
 */
{
    assert.throws(
        () => prepareModernMessageContent({
            groupStatusReaction: { key: { id: 'X', remoteJid: 'a@g.us' }, text: '❤️' },
            statusAudience: { listName: 'Besties' }
        }),
        /statusAudience cannot be combined with groupStatusReaction/
    );
    const ok = prepareModernMessageContent({ groupStatusReaction: { key: { id: 'X', remoteJid: 'a@g.us' }, text: '❤️' } });
    assert.equal(ok.raw, true, 'the builder path still works on its own');
}

console.log('status audience tests passed');
