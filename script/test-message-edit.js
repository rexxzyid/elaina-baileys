import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { aesEncryptGCM, hmacSign } from '../lib/Utils/crypto.js';
import processMessage from '../lib/Utils/process-message.js';

const ME = '628111111111@s.whatsapp.net';
const CONTACT = '628222222222@s.whatsapp.net';
const GROUP = '120363000000000000@g.us';
const LID = '123456789012345@lid';
const LID_PN = '628333333333@s.whatsapp.net';
const SECRET = Buffer.from('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff', 'hex');
const IV = Buffer.from('0102030405060708090a0b0c', 'hex');
const ENVELOPE_TIMESTAMP = 1700000123;

const deriveCiphertext = ({ originalMsgId, originalSenderJid, editorJid, message, timestampMs }) => {
    const sign = Buffer.concat([
        Buffer.from(originalMsgId),
        Buffer.from(originalSenderJid),
        Buffer.from(editorJid),
        Buffer.from('Message Edit'),
        new Uint8Array([1])
    ]);
    const key0 = hmacSign(SECRET, new Uint8Array(32), 'sha256');
    const decKey = hmacSign(sign, key0, 'sha256');
    const protocolMessage = { editedMessage: message };
    if (timestampMs !== undefined) {
        protocolMessage.timestampMs = timestampMs;
    }
    const plaintext = proto.Message.encode({ protocolMessage }).finish();
    return aesEncryptGCM(Buffer.from(plaintext), decKey, IV, Buffer.alloc(0));
};

const makeContext = ({ targetKey, targetMessage, mappings = {} }) => {
    const events = [];
    const warnings = [];
    return {
        events,
        warnings,
        context: {
            shouldProcessHistoryMsg: false,
            placeholderResendCache: undefined,
            ev: {
                emit(name, payload) {
                    events.push({ name, payload });
                }
            },
            creds: {
                me: { id: ME },
                accountSettings: {}
            },
            signalRepository: {
                lidMapping: {
                    async getPNForLID(jid) {
                        return mappings[jid];
                    }
                }
            },
            keyStore: {},
            logger: {
                warn(data, message) {
                    warnings.push({ data, message });
                }
            },
            options: {},
            async getMessage(key) {
                if (key?.id === targetKey?.id) {
                    return targetMessage;
                }
            }
        }
    };
};

const makeEnvelope = ({ targetKey, editorKey, ciphertext }) => ({
    key: editorKey,
    messageTimestamp: ENVELOPE_TIMESTAMP,
    message: {
        secretEncryptedMessage: {
            targetMessageKey: targetKey,
            encPayload: ciphertext,
            encIv: IV,
            secretEncType: proto.Message.SecretEncryptedMessage.SecretEncType.MESSAGE_EDIT
        }
    }
});

const getUpdate = events => events.find(event => event.name === 'messages.update')?.payload?.[0];

const runSuccess = async ({ name, targetKey, editorKey, originalSenderJid, editorJid, mappings = {}, timestampMs = 1700000000123, omitTimestamp = false }) => {
    const edited = { conversation: name };
    const ciphertext = deriveCiphertext({
        originalMsgId: targetKey.id,
        originalSenderJid,
        editorJid,
        message: edited,
        timestampMs: omitTimestamp ? undefined : timestampMs
    });
    const state = makeContext({
        targetKey,
        targetMessage: { messageContextInfo: { messageSecret: SECRET } },
        mappings
    });
    await processMessage(makeEnvelope({ targetKey, editorKey, ciphertext }), state.context);
    const update = getUpdate(state.events);
    assert.ok(update, `${name}: messages.update missing`);
    assert.deepEqual(update.key, targetKey, `${name}: target key mismatch`);
    assert.equal(update.update.message.editedMessage.message.conversation, name, `${name}: edited payload mismatch`);
    assert.equal(update.update.messageTimestamp, omitTimestamp ? ENVELOPE_TIMESTAMP : Math.floor(timestampMs / 1000), `${name}: timestamp mismatch`);
};

await runSuccess({
    name: 'self-1to1',
    targetKey: { remoteJid: CONTACT, fromMe: true, id: 'SELF-1' },
    editorKey: { remoteJid: CONTACT, fromMe: true, id: 'EDIT-SELF-1' },
    originalSenderJid: ME,
    editorJid: ME
});

await runSuccess({
    name: 'contact-1to1',
    targetKey: { remoteJid: CONTACT, fromMe: false, id: 'CONTACT-1' },
    editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-CONTACT-1' },
    originalSenderJid: CONTACT,
    editorJid: CONTACT
});

await runSuccess({
    name: 'group-participant',
    targetKey: { remoteJid: GROUP, participant: CONTACT, fromMe: false, id: 'GROUP-1' },
    editorKey: { remoteJid: GROUP, participant: CONTACT, fromMe: false, id: 'EDIT-GROUP-1' },
    originalSenderJid: CONTACT,
    editorJid: CONTACT
});

await runSuccess({
    name: 'jid-alternative',
    targetKey: { remoteJid: LID, remoteJidAlt: LID_PN, fromMe: false, id: 'ALT-1' },
    editorKey: { remoteJid: LID, remoteJidAlt: LID_PN, fromMe: false, id: 'EDIT-ALT-1' },
    originalSenderJid: LID_PN,
    editorJid: LID_PN
});

await runSuccess({
    name: 'lid-mapping',
    targetKey: { remoteJid: LID, fromMe: false, id: 'LID-1' },
    editorKey: { remoteJid: LID, fromMe: false, id: 'EDIT-LID-1' },
    originalSenderJid: LID_PN,
    editorJid: LID_PN,
    mappings: { [LID]: LID_PN }
});

await runSuccess({
    name: 'timestamp-fallback',
    targetKey: { remoteJid: CONTACT, fromMe: false, id: 'FALLBACK-1' },
    editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-FALLBACK-1' },
    originalSenderJid: CONTACT,
    editorJid: CONTACT,
    omitTimestamp: true
});

{
    const targetKey = { remoteJid: CONTACT, fromMe: false, id: 'MISSING-TARGET' };
    const state = makeContext({ targetKey, targetMessage: undefined });
    await processMessage(makeEnvelope({
        targetKey,
        editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-MISSING-TARGET' },
        ciphertext: Buffer.alloc(16)
    }), state.context);
    assert.equal(getUpdate(state.events), undefined);
}

{
    const targetKey = { remoteJid: CONTACT, fromMe: false, id: 'MISSING-SECRET' };
    const state = makeContext({ targetKey, targetMessage: {} });
    await processMessage(makeEnvelope({
        targetKey,
        editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-MISSING-SECRET' },
        ciphertext: Buffer.alloc(16)
    }), state.context);
    assert.equal(getUpdate(state.events), undefined);
}

{
    const targetKey = { remoteJid: CONTACT, fromMe: false, id: 'BAD-PLAINTEXT' };
    const sign = Buffer.concat([
        Buffer.from(targetKey.id),
        Buffer.from(CONTACT),
        Buffer.from(CONTACT),
        Buffer.from('Message Edit'),
        new Uint8Array([1])
    ]);
    const key0 = hmacSign(SECRET, new Uint8Array(32), 'sha256');
    const decKey = hmacSign(sign, key0, 'sha256');
    const plaintext = proto.Message.encode({ conversation: 'not-an-edit' }).finish();
    const ciphertext = aesEncryptGCM(Buffer.from(plaintext), decKey, IV, Buffer.alloc(0));
    const state = makeContext({
        targetKey,
        targetMessage: { messageContextInfo: { messageSecret: SECRET } }
    });
    await processMessage(makeEnvelope({
        targetKey,
        editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-BAD-PLAINTEXT' },
        ciphertext
    }), state.context);
    assert.equal(getUpdate(state.events), undefined);
}

{
    const targetKey = { remoteJid: CONTACT, fromMe: false, id: '' };
    const state = makeContext({
        targetKey,
        targetMessage: { messageContextInfo: { messageSecret: SECRET } }
    });
    await processMessage(makeEnvelope({
        targetKey,
        editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-BAD-TARGET' },
        ciphertext: Buffer.alloc(16)
    }), state.context);
    assert.equal(getUpdate(state.events), undefined);
}

{
    const targetKey = { fromMe: false, id: 'MISSING-JID' };
    const state = makeContext({
        targetKey,
        targetMessage: { messageContextInfo: { messageSecret: SECRET } }
    });
    await processMessage({
        key: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-MISSING-JID' },
        messageTimestamp: ENVELOPE_TIMESTAMP,
        message: {
            secretEncryptedMessage: {
                targetMessageKey: targetKey,
                encPayload: Buffer.alloc(16),
                encIv: IV,
                secretEncType: proto.Message.SecretEncryptedMessage.SecretEncType.MESSAGE_EDIT
            }
        }
    }, state.context);
    assert.equal(getUpdate(state.events), undefined);
}

console.log('message edit E2EE tests passed');
