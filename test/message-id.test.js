import assert from 'node:assert/strict';
import { generateMessageID, generateMessageIDV2 } from '../lib/Utils/generics.js';

const WEB_SHA256 = /^3EB0[0-9A-F]{18}$/;
const WEB_LEGACY = /^3EB0[0-9A-F]{16}$/;

for (const userId of ['628111@s.whatsapp.net', '628111:12@s.whatsapp.net', undefined]) {
    const id = generateMessageIDV2(userId);
    assert.match(id, WEB_SHA256);
    assert.equal(id.length, 22);
    assert.equal(id.includes('STARFALL'), false);
}

for (let i = 0; i < 4; i++) {
    const id = generateMessageID();
    assert.match(id, WEB_LEGACY);
    assert.equal(id.length, 20);
}

const banyak = new Set(Array.from({ length: 500 }, () => generateMessageIDV2('628111@s.whatsapp.net')));
assert.equal(banyak.size, 500);

const legacy = new Set(Array.from({ length: 500 }, () => generateMessageID()));
assert.equal(legacy.size, 500);

for (const id of [...banyak, ...legacy]) {
    assert.equal(id, id.toUpperCase());
}

console.log('message id tests passed');
