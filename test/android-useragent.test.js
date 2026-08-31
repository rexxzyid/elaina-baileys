import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { proto } from '../WAProto/index.js';

const src = readFileSync(new URL('../lib/Utils/validate-connection.js', import.meta.url), 'utf8');
const body = src.slice(src.indexOf('const getUserAgent'), src.indexOf('const PLATFORM_MAP'));
const getUserAgent = new Function('proto', body + '; return getUserAgent')(proto);
const P = proto.ClientPayload.UserAgent.Platform;

const dasar = { version: [2, 3000, 1046401417], countryCode: 'ID' };

const web = getUserAgent({ ...dasar, browser: ['Mac OS', 'Chrome', '14.4.1'] });
assert.equal(web.platform, P.WEB);
assert.equal(web.device, 'Desktop');
assert.equal(web.osVersion, '0.1');
assert.equal(web.manufacturer, undefined);

const android = getUserAgent({ ...dasar, browser: ['Redmi Note 12', 'Android', ''] });
assert.equal(android.platform, P.ANDROID);
assert.equal(android.device, 'Redmi Note 12');
assert.equal(android.manufacturer, 'Google');
assert.equal(android.osVersion, '14');

const custom = getUserAgent({
    ...dasar,
    browser: ['Redmi Note 12', 'Android', ''],
    deviceInfo: { osVersion: '13', manufacturer: 'Xiaomi', osBuildNumber: 'TKQ1.221114.001', mcc: '510', mnc: '10', localeLanguage: 'id' }
});
assert.equal(custom.osVersion, '13');
assert.equal(custom.manufacturer, 'Xiaomi');
assert.equal(custom.osBuildNumber, 'TKQ1.221114.001');
assert.equal(custom.mcc, '510');
assert.equal(custom.mnc, '10');
assert.equal(custom.localeLanguageIso6391, 'id');

for (const ua of [web, android, custom]) {
    assert.ok(proto.ClientPayload.UserAgent.encode(proto.ClientPayload.UserAgent.fromObject(ua)).finish().length > 0);
}

console.log('android user agent tests passed');
