import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { AIRich } from '../lib/MessageBuilder/index.js';
import { forwardRichResponse, readSignedRichResponse, verifyRichResponseSignature } from '../lib/MessageBuilder/metaai.js';

const unifiedBytes = Buffer.from(JSON.stringify({
    response_id: 'r-1',
    sections: [{ __typename: 'GenAIUnifiedResponseSection', view_model: { primitive: { text: 'halo', __typename: 'GenAIMarkdownTextUXPrimitive' }, __typename: 'GenAISingleLayoutViewModel' } }]
}));

/** A message shaped the way one really arrives from the Meta AI bot. */
const source = {
    messageContextInfo: {
        botMetadata: {
            botResponseId: 'b-1',
            messageDisclaimerText: 'Meta AI',
            verificationMetadata: {
                proofs: [{
                    version: 1,
                    useCase: 1,
                    signature: Buffer.alloc(64, 9),
                    certificateChain: [Buffer.alloc(48, 3), Buffer.alloc(48, 4)]
                }]
            }
        }
    },
    botForwardedMessage: {
        message: {
            richResponseMessage: {
                messageType: 1,
                unifiedResponse: { data: unifiedBytes },
                submessages: [{ messageType: 2, messageText: 'halo' }],
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 1,
                    forwardedAiBotMessageInfo: { botJid: '867051314767696@bot', botName: 'Meta AI' }
                }
            }
        }
    }
};

const incoming = () => proto.Message.decode(proto.Message.encode(proto.Message.fromObject(source)).finish());

/**
 * The signed payload is version || botFbid || unified response bytes. Nothing
 * about the sender, the message id or the timestamp goes into it, so relaying
 * those three unchanged keeps the proof valid — that is what makes forwarding
 * a Meta AI answer work at all.
 */
{
    const signed = readSignedRichResponse({ message: incoming() });
    assert.equal(signed.hasProof, true);
    assert.equal(signed.botJid, '867051314767696@bot');
    assert.equal(signed.proof.useCase, 1);
    assert.deepEqual(Buffer.from(signed.unifiedResponseBytes), unifiedBytes);
}

/** Relaying keeps the bytes, the proof and the bot jid identical. */
{
    const calls = [];
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => calls.push(message) };
    await forwardRichResponse(sock, '120363@g.us', { message: incoming() });

    const [relayed] = calls;
    const encoded = proto.Message.decode(proto.Message.encode(proto.Message.fromObject(relayed)).finish());
    const rich = encoded.botForwardedMessage.message.richResponseMessage;

    assert.deepEqual(Buffer.from(rich.unifiedResponse.data), unifiedBytes, 'the signed bytes are untouched');
    assert.equal(rich.contextInfo.forwardedAiBotMessageInfo.botJid, '867051314767696@bot');

    const proof = encoded.messageContextInfo.botMetadata.verificationMetadata.proofs[0];
    assert.equal(proof.useCase, 1);
    assert.deepEqual(Buffer.from(proof.signature), Buffer.alloc(64, 9), 'the proof travels verbatim');
    assert.equal(proof.certificateChain.length, 2);
    assert.equal(rich.submessages[0].messageText, 'halo');
}

/** Quoting and extra contextInfo are safe: contextInfo is not part of the payload. */
{
    const calls = [];
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => calls.push(message) };
    await forwardRichResponse(sock, '120363@g.us', { message: incoming() }, {
        quoted: { key: { id: 'Q1', participant: '628@s.whatsapp.net' }, message: { conversation: 'tanya' } },
        contextInfo: { mentionedJid: ['628@s.whatsapp.net'] }
    });

    const rich = calls[0].botForwardedMessage.message.richResponseMessage;
    assert.equal(rich.contextInfo.stanzaId, 'Q1');
    assert.deepEqual(rich.contextInfo.mentionedJid, ['628@s.whatsapp.net']);
    assert.equal(rich.contextInfo.forwardedAiBotMessageInfo.botJid, '867051314767696@bot', 'the signed bot jid stays');
    assert.deepEqual(Buffer.from(rich.unifiedResponse.data), unifiedBytes);
}

/**
 * hasProof only says the fields are populated. Whether the client accepts it is
 * a separate question, and the placeholder MessageBuilder attaches never does.
 */
{
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
    const rich = new AIRich(sock);
    rich.addText('halo');
    const built = await rich.build('120363@g.us');

    const signed = readSignedRichResponse(built);
    assert.equal(signed.hasProof, true, 'the fields are filled in');

    const verdict = verifyRichResponseSignature(built);
    assert.equal(verdict.status, 'failed', 'but it is not a signature Meta issued');
    assert.notDeepEqual(Buffer.from(signed.unifiedResponseBytes), unifiedBytes);
}

/** The fixture proof here is filler too, so the relayed copy fails the same way. */
{
    const verdict = verifyRichResponseSignature({ message: incoming() });
    assert.equal(verdict.status, 'failed');
    assert.match(verdict.reason, /did not parse|chain/);
}

/** Anything that is not a rich response is refused rather than half-relayed. */
{
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => {} };
    assert.equal(readSignedRichResponse({ message: { conversation: 'halo' } }), null);
    await assert.rejects(forwardRichResponse(sock, '120363@g.us', { message: { conversation: 'halo' } }), TypeError);
}

console.log('forward rich response tests passed');
