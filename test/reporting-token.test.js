import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { generateWAMessage } from '../lib/Utils/messages.js';
import { encodeWAMessage } from '../lib/Utils/generics.js';
import { getMessageReportingToken, shouldIncludeReportingToken } from '../lib/Utils/reporting-utils.js';

const buat = async (isi) => generateWAMessage('2@s.whatsapp.net', isi, { userJid: '1:5@s.whatsapp.net' });
const kunci = (msg) => ({ id: msg.key.id, fromMe: true, remoteJid: '2@s.whatsapp.net' });

const contoh = await buat({ text: 'halo' });
assert.ok(contoh.message.messageContextInfo?.messageSecret, 'teks polos harus punya messageSecret');
assert.equal(shouldIncludeReportingToken(contoh.message), true);

let terbentuk = 0;
for (let i = 0; i < 120; i++) {
    const msg = await buat({ text: i % 2 ? 'halo' : 'halo dunia' });
    const node = await getMessageReportingToken(proto.Message.encode(msg.message).finish(), msg.message, kunci(msg));
    if (node) {
        terbentuk++;
        assert.equal(node.tag, 'reporting');
        assert.equal(node.content[0].tag, 'reporting_token');
        assert.equal(node.content[0].attrs.v, '2');
        assert.equal(node.content[0].content.length, 16);
    }
}
assert.equal(terbentuk, 120, 'protobuf tanpa padding harus selalu menghasilkan token');

let denganPadding = 0;
for (let i = 0; i < 120; i++) {
    const msg = await buat({ text: 'halo' });
    if (await getMessageReportingToken(encodeWAMessage(msg.message), msg.message, kunci(msg))) denganPadding++;
}
assert.ok(denganPadding < 120, 'padding acak merusak ekstraksi, itu sebab bug-nya');

console.log('reporting token tests passed');
