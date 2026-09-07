import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { AssociationType, StatusNotificationType } from '../lib/Types/Message.js';
import {
    STATUS_NOTIFICATION_TYPES,
    makeMessageAssociation,
    makeStatusAddYoursAssociation,
    makeStatusMentionMessage,
    prepareModernMessageContent
} from '../lib/Utils/modern-messages.js';
import { generateWAMessage } from '../lib/Utils/messages.js';

const base = { upload: async () => ({}), logger: { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } } };
const build = (jid, content) => generateWAMessage(jid, prepareModernMessageContent(content), base);
const key = { remoteJid: 'status@broadcast', fromMe: false, id: 'ABC123', participant: '628000@s.whatsapp.net' };

/** An Add Yours reply is an association back to the prompt, not a message type. */
{
    assert.equal(AssociationType.STATUS_ADD_YOURS, 8);
    assert.equal(AssociationType.STATUS_ADD_YOURS_AI_IMAGINE, 15);
    assert.equal(AssociationType.STATUS_ADD_YOURS_DIWALI, 17);

    const association = makeStatusAddYoursAssociation(key);
    assert.equal(association.associationType, AssociationType.STATUS_ADD_YOURS);
    assert.deepEqual({ ...association.parentMessageKey }, key);
    assert.equal(association.messageIndex, null, 'nothing invented for an index nobody gave');
}

/** A key alone or a wrapped key both work, and the variant can be named. */
{
    assert.equal(makeStatusAddYoursAssociation({ key }).associationType, AssociationType.STATUS_ADD_YOURS);
    assert.equal(
        makeStatusAddYoursAssociation({ key, type: 'STATUS_ADD_YOURS_AI_IMAGINE' }).associationType,
        AssociationType.STATUS_ADD_YOURS_AI_IMAGINE
    );
    assert.equal(makeStatusAddYoursAssociation({ key, type: 17 }).associationType, AssociationType.STATUS_ADD_YOURS_DIWALI);
    assert.throws(() => makeStatusAddYoursAssociation({}), TypeError);
    assert.throws(() => makeStatusAddYoursAssociation({ key: { remoteJid: 'x' } }), TypeError);
}

/** The generic maker defaults to UNKNOWN rather than assuming Add Yours. */
{
    const association = makeMessageAssociation({ parentMessageKey: key, type: 'STATUS_QUESTION', messageIndex: 2 });
    assert.equal(association.associationType, AssociationType.STATUS_QUESTION);
    assert.equal(association.messageIndex, 2);
    assert.equal(makeMessageAssociation({ key }).associationType, AssociationType.UNKNOWN);
}

/** addYours lands in messageContextInfo, where the client reads it. */
{
    const { message } = await build('status@broadcast', { text: 'ikutan', addYours: key });
    const association = message.messageContextInfo.messageAssociation;
    assert.equal(association.associationType, AssociationType.STATUS_ADD_YOURS);
    assert.deepEqual({ ...association.parentMessageKey }, key);
    assert.equal('addYours' in message, false, 'the shorthand is consumed');

    const decoded = proto.Message.decode(proto.Message.encode(message).finish());
    assert.equal(decoded.messageContextInfo.messageAssociation.associationType, AssociationType.STATUS_ADD_YOURS);
    assert.equal(decoded.messageContextInfo.messageAssociation.parentMessageKey.id, 'ABC123');
}

/** The raw messageAssociation key takes any association, not just Add Yours. */
{
    const { message } = await build('status@broadcast', {
        text: 'x',
        messageAssociation: { type: 'STATUS_REACTION', parentMessageKey: key }
    });
    assert.equal(message.messageContextInfo.messageAssociation.associationType, AssociationType.STATUS_REACTION);
}

/** A mention notification is a protocolMessage type 25 inside the right wrapper. */
{
    const direct = makeStatusMentionMessage({ key });
    assert.deepEqual(Object.keys(direct), ['statusMentionMessage']);
    const inner = direct.statusMentionMessage.message.protocolMessage;
    assert.equal(inner.type, proto.Message.ProtocolMessage.Type.STATUS_MENTION_MESSAGE);
    assert.equal(inner.type, 25);
    assert.deepEqual({ ...inner.key }, key);

    const group = makeStatusMentionMessage({ key, group: true });
    assert.deepEqual(Object.keys(group), ['groupStatusMentionMessage']);
    assert.equal(group.groupStatusMentionMessage.message.protocolMessage.type, 25);

    assert.throws(() => makeStatusMentionMessage({}), TypeError);
}

/** It is reachable through sendMessage as well, for a mention sent on its own. */
{
    const { message } = await build('628111@s.whatsapp.net', { statusMention: { key } });
    assert.equal(message.statusMentionMessage.message.protocolMessage.type, 25);
    const { message: grouped } = await build('120363000000000000@g.us', { statusMention: { key, group: true } });
    assert.equal(grouped.groupStatusMentionMessage.message.protocolMessage.type, 25);
}

/** An association next to a builder that discards it is refused, not silently lost. */
{
    assert.throws(
        () => prepareModernMessageContent({ statusMention: { key }, addYours: key }),
        /addYours cannot be combined with statusMention/
    );
    assert.throws(
        () => prepareModernMessageContent({ groupStatusReaction: { key, text: '❤️' }, statusAudience: { listName: 'B' }, addYours: key }),
        /statusAudience and addYours cannot be combined with groupStatusReaction/
    );
}

/**
 * The bundle carries a fifth notification type that WAProto's generated enum
 * does not, so the name would have resolved to UNKNOWN and gone out wrong.
 */
{
    assert.equal(STATUS_NOTIFICATION_TYPES.STATUS_GROUP_STATUS_REPLY, 4);
    assert.equal(StatusNotificationType.STATUS_GROUP_STATUS_REPLY, 4);
    assert.equal(proto.Message.StatusNotificationMessage.StatusNotificationType.STATUS_GROUP_STATUS_REPLY, undefined);

    const { message } = await build('628111@s.whatsapp.net', {
        statusNotification: { responseMessageKey: key, originalMessageKey: key, type: 'STATUS_GROUP_STATUS_REPLY' }
    });
    assert.equal(message.statusNotificationMessage.type, 4);

    const addYours = await build('628111@s.whatsapp.net', {
        statusNotification: { responseMessageKey: key, originalMessageKey: key, type: 'STATUS_ADD_YOURS' }
    });
    assert.equal(addYours.message.statusNotificationMessage.type, STATUS_NOTIFICATION_TYPES.STATUS_ADD_YOURS);
}

/**
 * The README tells people to read myStatus.key off what sendMessage returns and
 * to take the prompt key off messages.upsert. Lock the two shapes it describes.
 */
{
    const withUser = { ...base, userJid: '628999:12@s.whatsapp.net' };
    const own = await generateWAMessage('status@broadcast', { text: 'halo semua' }, withUser);
    assert.equal(own.key.remoteJid, 'status@broadcast');
    assert.equal(own.key.fromMe, true);
    assert.equal(own.key.participant, null, 'your own status names no participant');
    assert.ok(own.message && own.messageTimestamp, 'the whole WebMessageInfo comes back, not just a key');

    const group = await generateWAMessage('120363000000000000@g.us', { text: 'halo grup', groupStatus: true }, withUser);
    assert.equal(group.key.remoteJid, '120363000000000000@g.us');
    assert.equal(group.key.fromMe, true);
}

/** A half-built key is refused by name, at build time. */
{
    assert.throws(() => prepareModernMessageContent({ addYours: {} }), /addYours\.key must be an object/);
    assert.throws(() => prepareModernMessageContent({ addYours: { key: { remoteJid: 'x' } } }), /addYours\.key\.id is required/);
    assert.throws(() => makeStatusMentionMessage({ key: { remoteJid: 'x' } }), /statusMention\.key\.id is required/);
    assert.throws(
        () => prepareModernMessageContent({ messageAssociation: { parentMessageKey: { remoteJid: 'x' } } }),
        /messageAssociation\.parentMessageKey\.id is required/
    );
}

console.log('status add yours tests passed');
