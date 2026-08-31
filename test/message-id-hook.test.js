import assert from 'node:assert/strict';
import { AIRich } from '../lib/MessageBuilder/index.js';
import { htmlSection } from '../lib/MessageBuilder/extras.js';
import { generateMessageIDHex } from '../lib/Utils/generics.js';

const buatSock = (hook) => {
    const calls = [];
    const sock = {
        user: { id: '628111:5@s.whatsapp.net' },
        relayMessage: async (jid, message, options) => { calls.push(options.messageId); },
        calls
    };
    if (hook) sock.newMessageId = hook;
    return sock;
};

const kirim = async (sock) => {
    const rich = new AIRich(sock);
    rich.addSection(htmlSection('<b>x</b>'));
    await rich.send('2@s.whatsapp.net', { bypassDownload: false });
    return sock.calls[0];
};

const bawaan = await kirim(buatSock());
assert.match(bawaan, /^3EB0[0-9A-F]{18}$/);

const dikaitkan = await kirim(buatSock(() => generateMessageIDHex(32, 'A51')));
assert.ok(dikaitkan.startsWith('A51'));
assert.equal(dikaitkan.length, 32);

let diterima;
await kirim(buatSock((userId) => { diterima = userId; return generateMessageIDHex(32, 'A51') }));
assert.equal(diterima, '628111:5@s.whatsapp.net');

console.log('message id hook tests passed');
