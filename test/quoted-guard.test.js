import assert from 'node:assert/strict';
import { generateWAMessage } from '../lib/Utils/messages.js';

const makeLogger = () => {
    const warnings = [];
    const logger = {
        warnings,
        info() {}, debug() {}, error() {}, trace() {},
        warn(...args) { warnings.push(args) },
        child() { return this }
    };
    return logger;
};

const send = (quoted) => {
    const logger = makeLogger();
    return generateWAMessage('120363000000000000@g.us', { text: 'halo' }, {
        upload: async () => ({}),
        logger,
        userJid: '628999:12@s.whatsapp.net',
        quoted
    }).then(message => ({ message, logger }));
};

const key = id => ({ remoteJid: '120363000000000000@g.us', id, participant: '628000@s.whatsapp.net' });

/**
 * A quote with nothing readable inside used to reach quotedMsg[msgType] with
 * both sides undefined and throw "Cannot read properties of undefined (reading
 * 'undefined')". Every send in that chat died with it, so a bot quoting an
 * undecrypted message went completely silent there while other chats carried on.
 */
{
    const cases = {
        'no message at all': { key: key('A') },
        'a null message': { key: key('B'), message: null },
        'an empty message': { key: key('C'), message: {} },
        'a ciphertext stub': { key: key('D'), messageStubType: 2, message: undefined }
    };

    for (const [name, quoted] of Object.entries(cases)) {
        const { message, logger } = await send(quoted);
        assert.equal(message.message.extendedTextMessage.text, 'halo', `${name}: the message still goes out`);
        assert.equal(message.message.extendedTextMessage.contextInfo?.stanzaId, undefined, `${name}: without a quote`);
        assert.equal(logger.warnings.length, 1, `${name}: and says so once`);
        assert.match(logger.warnings[0][1], /nothing quotable/);
        assert.equal(logger.warnings[0][0].quotedId, quoted.key.id, `${name}: naming the message it dropped`);
    }
}

/** A real quote is untouched — same participant, stanza id and quoted body. */
{
    const quoted = { key: key('F'), message: { conversation: 'asli' } };
    const { message, logger } = await send(quoted);
    const contextInfo = message.message.extendedTextMessage.contextInfo;
    assert.equal(contextInfo.stanzaId, 'F');
    assert.equal(contextInfo.participant, '628000@s.whatsapp.net');
    assert.equal(contextInfo.quotedMessage.conversation, 'asli');
    assert.equal(logger.warnings.length, 0, 'and nothing is logged about it');
}

/** A wrapped quote is normalised first, so the inner content is what gets quoted. */
{
    const quoted = { key: key('G'), message: { viewOnceMessageV2: { message: { conversation: 'dalam' } } } };
    const { message } = await send(quoted);
    assert.equal(message.message.extendedTextMessage.contextInfo.quotedMessage.conversation, 'dalam');
}

/** A protocolMessage is a real content type, so quoting one keeps working. */
{
    const quoted = { key: key('H'), message: { protocolMessage: { key: { id: 'X' }, type: 25 } } };
    const { message, logger } = await send(quoted);
    assert.equal(message.message.extendedTextMessage.contextInfo.stanzaId, 'H');
    assert.equal(logger.warnings.length, 0);
}

/** No logger is not a crash either — the guard must not depend on one. */
{
    const message = await generateWAMessage('120363000000000000@g.us', { text: 'halo' }, {
        upload: async () => ({}),
        logger: { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } },
        userJid: '628999:12@s.whatsapp.net',
        quoted: { key: key('I') }
    });
    assert.equal(message.message.extendedTextMessage.text, 'halo');
}

console.log('quoted guard tests passed');
