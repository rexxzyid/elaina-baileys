import assert from 'node:assert/strict';
import {
    AI_RICH_HTML_PRIMITIVE,
    AI_RICH_PRIMITIVES,
    AI_RICH_PRIMITIVES_ANDROID_ONLY,
    decodeAIRich,
    htmlSection,
    lockHeight,
    sendHtmlApp
} from '../lib/MessageBuilder/extras.js';

const section = htmlSection('<body>halo</body>', { trustedSources: ['nixel.dev'] });
assert.equal(section.view_model.__typename, 'GenAISingleLayoutViewModel');
assert.equal(section.view_model.primitive.__typename, AI_RICH_HTML_PRIMITIVE);
assert.equal(section.view_model.primitive.payload, '<body>halo</body>');
assert.deepEqual(section.view_model.primitive.trusted_sources, ['nixel.dev']);

assert.deepEqual(htmlSection('<b>x</b>').view_model.primitive.trusted_sources, []);

assert.equal(htmlSection('<b>x</b>').view_model.primitive.payload, '<b>x</b>');

const locked = htmlSection('<b>x</b>', { height: 300 }).view_model.primitive.payload;
assert.ok(locked.endsWith('<b>x</b>'));
assert.ok(locked.includes('height:300px'));
assert.ok(locked.includes('max-height:300px'));
assert.ok(locked.includes('__wrap'));
assert.ok(locked.includes('<' + '/script>'));
assert.equal(lockHeight(300) + '<b>x</b>', locked);

assert.throws(() => htmlSection('<b>x</b>', { height: 0 }), TypeError);
assert.throws(() => htmlSection('<b>x</b>', { height: -5 }), TypeError);
assert.throws(() => htmlSection('<b>x</b>', { height: 'tall' }), TypeError);

assert.throws(() => htmlSection(''), TypeError);
assert.throws(() => htmlSection('   '), TypeError);
assert.throws(() => htmlSection(123), TypeError);
assert.throws(() => htmlSection('<b>x</b>', { trustedSources: 'nixel.dev' }), TypeError);

assert.equal(AI_RICH_PRIMITIVES.includes(AI_RICH_HTML_PRIMITIVE), false);
assert.equal(AI_RICH_PRIMITIVES_ANDROID_ONLY.includes(AI_RICH_HTML_PRIMITIVE), true);

const calls = [];
const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => { calls.push({ jid, message }); } };

const html = '<body><canvas id="game"></canvas><script>let a=1</script></body>';
const sent = await sendHtmlApp(sock, '2@s.whatsapp.net', html, {
    title: 'NIXEL DINO',
    label: 'Fiora Sylvie',
    trustedSources: ['nixel.dev']
});

assert.ok(sent.key.id);
assert.equal(calls.length, 1);
assert.equal(calls[0].jid, '2@s.whatsapp.net');

const rich = calls[0].message.botForwardedMessage.message.richResponseMessage;
assert.equal(rich.messageType, 1);
assert.deepEqual(rich.submessages, [{ messageType: 2, messageText: 'Fiora Sylvie' }]);
assert.equal(rich.contextInfo.isForwarded, true);
assert.equal(rich.contextInfo.forwardOrigin, 4);
assert.equal(rich.contextInfo.forwardedAiBotMessageInfo.botJid, '867051314767696@bot');

const meta = calls[0].message.messageContextInfo.botMetadata;
assert.equal(meta.messageDisclaimerText, 'NIXEL DINO');
assert.ok(meta.botResponseId);
assert.ok(meta.verificationMetadata);

const decoded = decodeAIRich({ message: calls[0].message });
assert.deepEqual(decoded.typenames, [AI_RICH_HTML_PRIMITIVE]);
assert.deepEqual(decoded.layouts, ['Single']);
assert.equal(decoded.sections[0].view_model.primitive.payload, html);

calls.length = 0;
await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>ringkas</b>');
const bare = calls[0].message.botForwardedMessage.message.richResponseMessage;
assert.deepEqual(bare.submessages, []);
assert.ok(bare.unifiedResponse.data);

calls.length = 0;
await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>x</b>', { bypassDownload: true });
assert.equal(calls.length, 2);
assert.equal(calls[1].message.botForwardedMessage.message.protocolMessage.type, 14);

calls.length = 0;
await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>x</b>', { bypassDownload: false });
assert.equal(calls.length, 1);

calls.length = 0;
await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>x</b>', { includesUnifiedResponse: false });
assert.equal(calls.length, 1);
assert.equal(calls[0].message.botForwardedMessage.message.richResponseMessage.unifiedResponse.data, '');

calls.length = 0;
await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>tinggi</b>', { height: 300 });
const dikunci = decodeAIRich({ message: calls[0].message }).sections[0].view_model.primitive.payload;
assert.ok(dikunci.includes('height:300px'));
assert.ok(dikunci.endsWith('<b>tinggi</b>'));

await assert.rejects(() => sendHtmlApp(null, '2@s.whatsapp.net', '<b>a</b>'), TypeError);
await assert.rejects(() => sendHtmlApp(sock, '', '<b>a</b>'), TypeError);

console.log('html section tests passed');
