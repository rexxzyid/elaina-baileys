import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { AIRich } from '../lib/MessageBuilder/index.js';
import { forwardRichResponse, readSignedRichResponse, verifyRichResponseSignature } from '../lib/MessageBuilder/metaai.js';
import { BOT_SIGNATURE_ROOT_CERTIFICATE } from '../lib/MessageBuilder/bot-signature.js';
import { X509Certificate } from 'node:crypto';

/** A real, parsable certificate stands in for the chain; it will not verify. */
const realDer = Buffer.from(new X509Certificate(BOT_SIGNATURE_ROOT_CERTIFICATE).raw);

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
                    certificateChain: [realDer, realDer]
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
    assert.deepEqual(Buffer.from(proof.certificateChain[0]), realDer);
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
    assert.match(verdict.reason, /chain broken|validity window|does not match/);
}

/** Anything that is not a rich response is refused rather than half-relayed. */
{
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => {} };
    assert.equal(readSignedRichResponse({ message: { conversation: 'halo' } }), null);
    await assert.rejects(forwardRichResponse(sock, '120363@g.us', { message: { conversation: 'halo' } }), TypeError);
}

/**
 * Loading and rebuilding used to re-serialise the JSON and swap in placeholder
 * metadata, so a copy could never verify even when nothing was touched. As long
 * as nothing is edited the original bytes and the original proof go back out.
 */
{
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
    const rich = new AIRich(sock);
    rich.loadFrom({ message: incoming() });
    assert.equal(rich.isSignaturePreserved, true);

    const built = await rich.build('120363@g.us');
    const out = built.message.botForwardedMessage.message.richResponseMessage;
    assert.deepEqual(Buffer.from(out.unifiedResponse.data), unifiedBytes, 'byte for byte, not re-serialised');
    assert.deepEqual(
        Buffer.from(built.message.messageContextInfo.botMetadata.verificationMetadata.proofs[0].signature),
        Buffer.alloc(64, 9),
        'the real proof, not the placeholder'
    );
}

/** Every mutation drops it, because the bytes it covers no longer match. */
{
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
    const mutations = [
        rich => rich.addText('tambahan'),
        rich => rich.addSection({ __typename: 'GenAIUnifiedResponseSection', view_model: { primitive: { text: 'x', __typename: 'GenAIMarkdownTextUXPrimitive' }, __typename: 'GenAISingleLayoutViewModel' } }),
        rich => { rich.assignId(0, 'n0'); rich.delete('n0'); },
        rich => rich.addFooterSection({ __typename: 'GenAIUnifiedResponseSection' }),
        rich => rich.clearFooterSections(),
        rich => rich.addEmbeddedScreen({ id: 's1' }),
        rich => rich.setResponseId('r-2'),
        rich => rich.refreshResponseId(),
        rich => rich.setResponseMeta({ surface: 'x' })
    ];
    for (const mutate of mutations) {
        const rich = new AIRich(sock);
        rich.loadFrom({ message: incoming() });
        mutate(rich);
        assert.equal(rich.isSignaturePreserved, false, mutate.toString());
    }

    const edited = new AIRich(sock);
    edited.loadFrom({ message: incoming() });
    edited.addText('tambahan');
    const built = await edited.build('120363@g.us');
    const data = built.message.botForwardedMessage.message.richResponseMessage.unifiedResponse.data;
    assert.notDeepEqual(Buffer.from(String(data), 'base64'), unifiedBytes);
}

/** A message that never carried a proof has nothing to preserve. */
{
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
    const plain = new AIRich(sock);
    plain.addText('halo');
    const built = await plain.build('120363@g.us');

    const reloaded = new AIRich(sock);
    reloaded.loadFrom(built);
    assert.equal(reloaded.isSignaturePreserved, false, 'placeholder metadata is not a proof to carry over');
}

console.log('forward rich response tests passed');
