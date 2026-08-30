import assert from 'node:assert/strict';
import { hasOptionalMedia, loadFfmpeg, loadSharp } from '../lib/Utils/optional-media.js';

const sharp = await loadSharp();
assert.equal(typeof sharp, 'function');

const again = await loadSharp();
assert.equal(again, sharp);

const ffmpeg = await loadFfmpeg();
assert.equal(typeof ffmpeg, 'function');

assert.equal(await hasOptionalMedia('sharp'), true);
assert.equal(await hasOptionalMedia('fluent-ffmpeg'), true);
assert.equal(await hasOptionalMedia('a-package-that-does-not-exist'), false);

const builder = await import('../lib/MessageBuilder/index.js');
const pixels = await sharp({
    create: { width: 8, height: 8, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 1 } }
}).png().toBuffer();
const resized = await builder.Toolkit.resize(pixels, 4, 4);
assert.ok(resized.length > 0);

console.log('optional media tests passed');
