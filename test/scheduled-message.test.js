import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import {
    SCHEDULED_MSG_META_TYPE,
    SCHEDULED_MSG_REVEAL_KEY_BYTES,
    SCHEDULED_MSG_REVEAL_KEY_IV_BYTES,
    SCHEDULED_MSG_WINDOW,
    buildScheduledMsgMetaNode,
    buildUnscheduleProtocolMessage,
    decodeScheduledMessage,
    encodeScheduledMessage,
    generateRevealKey,
    isScheduledTimeValid
} from '../lib/Utils/scheduled-message.js';

const key = generateRevealKey();
assert.equal(key.length, SCHEDULED_MSG_REVEAL_KEY_BYTES);

const original = { conversation: 'pesan terjadwal' };
const encoded = encodeScheduledMessage(original, key);

assert.equal(encoded.encIv.length, SCHEDULED_MSG_REVEAL_KEY_IV_BYTES);
assert.equal(
    encoded.message.conditionalRevealMessage.conditionalRevealMessageType,
    proto.Message.ConditionalRevealMessage.ConditionalRevealMessageType.SCHEDULED_MESSAGE
);
assert.ok(encoded.revealKeyId.length > 0);

const decoded = decodeScheduledMessage(encoded.message, key);
assert.equal(decoded.conversation, original.conversation);

assert.throws(() => decodeScheduledMessage(encoded.message, generateRevealKey()));

const scheduleNode = buildScheduledMsgMetaNode({
    scheduledTimestampS: 1800000000,
    revealKeyId: encoded.revealKeyId,
    revealKey: key
});
assert.equal(scheduleNode.tag, 'meta');
assert.equal(scheduleNode.attrs.type, SCHEDULED_MSG_META_TYPE);
assert.equal(scheduleNode.attrs.st, '1800000000');
assert.equal(scheduleNode.content[0].tag, 'key');
assert.equal(scheduleNode.content[0].attrs.rkid, encoded.revealKeyId);
assert.equal(scheduleNode.content[0].content.length, SCHEDULED_MSG_REVEAL_KEY_BYTES);

const revealNode = buildScheduledMsgMetaNode({ kind: 'reveal', revealKeyId: encoded.revealKeyId });
assert.equal(revealNode.attrs.st, undefined);
assert.equal(revealNode.content[0].content, undefined);

assert.throws(() => buildScheduledMsgMetaNode({ revealKeyId: 'x' }));
assert.throws(() => buildScheduledMsgMetaNode({ scheduledTimestampS: 1, revealKey: key }));

const unschedule = buildUnscheduleProtocolMessage({ id: 'ABC', remoteJid: '628@s.whatsapp.net', fromMe: true });
assert.equal(unschedule.protocolMessage.type, proto.Message.ProtocolMessage.Type.MESSAGE_UNSCHEDULE);

const now = 1800000000;
assert.equal(isScheduledTimeValid(now + 600, now), true);
assert.equal(isScheduledTimeValid(now + 599, now), false);
assert.equal(isScheduledTimeValid(now + SCHEDULED_MSG_WINDOW.chat.maxSeconds, now), true);
assert.equal(isScheduledTimeValid(now + SCHEDULED_MSG_WINDOW.chat.maxSeconds + 1, now), false);
assert.equal(isScheduledTimeValid(now + 2592000, now, SCHEDULED_MSG_WINDOW.newsletter), true);

console.log('scheduled message tests passed');
