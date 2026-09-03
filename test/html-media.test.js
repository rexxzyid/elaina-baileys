import assert from 'node:assert/strict';
import { dataUri, htmlMedia } from '../lib/MessageBuilder/extras.js';
import { HTML_APP_BYTE_BUDGET, checkHtmlApp } from '../lib/Utils/html-app.js';

assert.throws(() => dataUri(Buffer.from('x'), 'mp4'), TypeError);
assert.throws(() => dataUri(Buffer.alloc(0), 'video/mp4'), TypeError);
assert.equal(dataUri(Buffer.from('hi'), 'video/mp4'), 'data:video/mp4;base64,aGk=');

assert.throws(() => htmlMedia(Buffer.from('x'), { mimetype: 'video/mp4', tag: 'iframe' }), TypeError);
assert.throws(() => htmlMedia(Buffer.from('x'), { mimetype: 'video/mp4', id: '9bad' }), TypeError);

const clip = htmlMedia(Buffer.from('fake mp4 bytes'), { mimetype: 'video/mp4', id: 'clip', label: 'Tap untuk memuat' });

assert.match(clip, /<video id="clip" controls preload="none" playsinline><\/video>/);
assert.match(clip, /<button id="clip_go"/);
assert.match(clip, /Tap untuk memuat/);
assert.match(clip, /data:video\/mp4;base64,/);

/** The source must not sit in the src attribute, or the tap gate is decorative. */
assert.equal(/<video[^>]*\ssrc=/.test(clip), false);

/** A label with markup in it must not be able to break out of the button. */
const nasty = htmlMedia(Buffer.from('x'), { mimetype: 'audio/mpeg', tag: 'audio', label: '<img src=x onerror=alert(1)>' });
assert.equal(nasty.includes('<img src=x'), false);
assert.match(nasty, /&lt;img src=x/);

/** Nor may the media bytes close the script tag they are embedded in. */
const closing = htmlMedia(Buffer.from('</script><b>'), { mimetype: 'text/plain' });
assert.equal(closing.split('</script>').length, 2);

const poster = htmlMedia(Buffer.from('x'), { mimetype: 'video/mp4', poster: 'data:image/png;base64,AA"onerror=1' });
assert.match(poster, /poster="data:image\/png;base64,AA&quot;onerror=1"/);

const page = '<style>body{height:300px}</style>' + clip;
const report = checkHtmlApp(page, { height: 300 });
assert.equal(report.ok, true, report.problems.join(' | '));

/** Oversized pages are a cost to report, not a refusal -- a base64 clip is legitimately large. */
const heavy = checkHtmlApp('<style>body{height:100px}</style>' + 'x'.repeat(HTML_APP_BYTE_BUDGET + 1), { height: 100 });
assert.equal(heavy.ok, true);
assert.match(heavy.warnings.join(' '), /over the .*KB budget/);
assert.deepEqual(heavy.problems, []);
