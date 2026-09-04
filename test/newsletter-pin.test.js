import assert from 'node:assert/strict';
import { toNewsletterServerIds } from '../lib/Socket/newsletter.js';

/**
 * WAWebMexNewsletterPinMessagesJob sends { newsletter_id, input: { message_ids } }
 * and WAWebNewsletterPinMessageAction hands it [String(id)], so the ids go out as
 * decimal strings however the caller spelled them.
 */
assert.deepEqual(toNewsletterServerIds(607), ['607']);
assert.deepEqual(toNewsletterServerIds([607]), ['607']);
assert.deepEqual(toNewsletterServerIds('607'), ['607']);
assert.deepEqual(toNewsletterServerIds([607, '608']), ['607', '608']);

/** The server accepts 99..2147476647; both ends are inside the range. */
assert.deepEqual(toNewsletterServerIds(99), ['99']);
assert.deepEqual(toNewsletterServerIds(2147476647), ['2147476647']);

/**
 * Anything else comes back from the server as an opaque "Bad Request" with no
 * hint of which value it disliked, so it is refused here where the message can
 * say what a server id is and where to get one.
 */
for (const bad of [0, 98, -1, 2147476648, 'abc', null, undefined, NaN, 1.5, {}]) {
    assert.throws(() => toNewsletterServerIds(bad), TypeError, 'rejects ' + JSON.stringify(bad));
}
assert.throws(() => toNewsletterServerIds([]), TypeError, 'rejects an empty list');
assert.throws(() => toNewsletterServerIds([607, 0]), TypeError, 'rejects a bad id inside a good list');

assert.throws(() => toNewsletterServerIds(5), err => {
    assert.match(err.message, /newsletterFetchMessages/, 'names where to get one');
    assert.match(err.message, /99\.\.2147476647/, 'names the range');
    assert.match(err.message, /^5 is not/, 'quotes the value it refused');
    return true;
});

/** A float is not silently truncated into a different message. */
assert.throws(() => toNewsletterServerIds(607.9), TypeError);
