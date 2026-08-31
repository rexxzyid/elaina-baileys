import assert from 'node:assert/strict';
import { generateMessageIDHex } from '../lib/Utils/generics.js';

const polos = generateMessageIDHex();
assert.equal(polos.length, 32);
assert.match(polos, /^[0-9A-F]{32}$/);

const a51 = generateMessageIDHex(32, 'A51');
assert.equal(a51.length, 32);
assert.ok(a51.startsWith('A51'));
assert.match(a51, /^[0-9A-F]{32}$/);

assert.equal(generateMessageIDHex(20, 'A').length, 20);
assert.equal(generateMessageIDHex(3, 'A51'), 'A51');
assert.ok(generateMessageIDHex(32, 'a51').startsWith('A51'));

const banyak = new Set(Array.from({ length: 500 }, () => generateMessageIDHex(32, 'A51')));
assert.equal(banyak.size, 500);
for (const id of banyak) {
    assert.equal(id, id.toUpperCase());
}

assert.throws(() => generateMessageIDHex(0), TypeError);
assert.throws(() => generateMessageIDHex(-4), TypeError);
assert.throws(() => generateMessageIDHex(2.5), TypeError);
assert.throws(() => generateMessageIDHex(2, 'A51'), TypeError);
const rexx = generateMessageIDHex(32, 'REXX-');
assert.equal(rexx.length, 32);
assert.ok(rexx.startsWith('REXX-'));
assert.match(rexx.slice(5), /^[0-9A-F]{27}$/);

const rexxUnik = new Set(Array.from({ length: 500 }, () => generateMessageIDHex(32, 'REXX-')));
assert.equal(rexxUnik.size, 500);

assert.equal(generateMessageIDHex(5, 'REXX-'), 'REXX-');
assert.throws(() => generateMessageIDHex(4, 'REXX-'), TypeError);

console.log('message id hex tests passed');
