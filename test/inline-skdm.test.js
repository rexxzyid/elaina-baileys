import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../lib/Socket/messages-send.js', import.meta.url), 'utf8');
const blok = src.slice(src.indexOf('let toEncode = patched;'), src.indexOf('const bytes = encodeWAMessage(toEncode);'));

assert.ok(blok.includes('config.inlineSenderKeyDistribution'), 'harus opt-in lewat config');
assert.ok(blok.includes('isGroup'), 'hanya berlaku untuk grup');
assert.ok(blok.includes('!patched.senderKeyDistributionMessage'), 'jangan timpa SKDM yang sudah ada');
assert.ok(blok.includes('hasSenderKey'), 'hanya inline kalau sender key sudah ada');
assert.ok(blok.includes('getSenderKeyDistributionMessage'), 'ambil SKDM lewat signalRepository');
assert.ok(blok.includes('catch'), 'kegagalan tidak boleh menjatuhkan pengiriman');

assert.ok(src.includes('reportingMessage = toEncode;'), 'token laporan dihitung atas pesan yang benar-benar dikirim');
assert.ok(!src.includes('const bytes = encodeWAMessage(patched);'), 'jalur lama tidak boleh tersisa');

console.log('inline skdm tests passed');
