import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getContentType } from '../lib/Utils/messages.js';

const src = readFileSync(new URL('../lib/Socket/messages-send.js', import.meta.url), 'utf8');
const awal = src.indexOf('let toEncode = patched;');
const akhir = src.indexOf('const bytes = encodeWAMessage(toEncode);');
assert.ok(awal > 0 && akhir > awal, 'blok inline SKDM harus ada');
const blok = src.slice(awal, akhir);

assert.ok(blok.includes("config.inlineSenderKeyDistribution !== false"), 'aktif secara default, bisa dimatikan');
assert.ok(blok.includes('isGroup'), 'hanya untuk grup');
assert.ok(blok.includes('!patched.senderKeyDistributionMessage'), 'jangan timpa SKDM dari pemanggil');
assert.ok(blok.includes('hasSenderKey'), 'hanya kalau sender key sudah ada');
assert.ok(blok.includes('getSenderKeyDistributionMessage'), 'ambil lewat signalRepository');
assert.ok(blok.includes('catch'), 'kegagalan tidak menjatuhkan pengiriman');

assert.ok(src.includes('reportingMessage = toEncode;'), 'token laporan atas pesan yang benar-benar dikirim');
assert.ok(!src.includes('const bytes = encodeWAMessage(patched);'), 'jalur lama tidak tersisa');

const dengan = {
    senderKeyDistributionMessage: { groupId: '1@g.us', axolotlSenderKeyDistributionMessage: Buffer.alloc(4) },
    extendedTextMessage: { text: 'halo' }
};
assert.equal(getContentType(dengan), 'extendedTextMessage', 'SKDM sebaris tidak boleh dikira tipe konten');
assert.equal(getContentType({ conversation: 'halo', senderKeyDistributionMessage: {} }), 'conversation');

const decode = readFileSync(new URL('../lib/Utils/decode-wa-message.js', import.meta.url), 'utf8');
assert.ok(decode.includes('if (msg.senderKeyDistributionMessage)'), 'penerima memproses SKDM sebaris');
assert.ok(decode.includes('processSenderKeyDistributionMessage'), 'lalu meneruskan kontennya');

console.log('inline skdm tests passed');
