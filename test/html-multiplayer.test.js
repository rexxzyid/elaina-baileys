import assert from 'node:assert/strict';
import { checkHtmlApp } from '../lib/Utils/html-app.js';
import { htmlMultiplayerPrelude, withHtmlMultiplayer } from '../lib/Utils/html-multiplayer.js';

assert.throws(() => htmlMultiplayerPrelude({ url: 'ws://x.example', room: 'a' }), TypeError);
assert.throws(() => htmlMultiplayerPrelude({ url: 'https://x.example', room: 'a' }), TypeError);
assert.throws(() => htmlMultiplayerPrelude({ url: 'wss://x.example', room: '  ' }), TypeError);
assert.throws(() => withHtmlMultiplayer('', { url: 'wss://x.example', room: 'a' }), TypeError);

const prelude = htmlMultiplayerPrelude({ url: 'wss://game.example/ws', room: 'catur-1', seat: 2 });

assert.match(prelude, /wss:\/\/game\.example\/ws/);
assert.match(prelude, /"room":"catur-1"/);
assert.match(prelude, /"seat":2/);
assert.match(prelude, /visibilitychange/);
assert.match(prelude, /window\.room = api/);

const injected = htmlMultiplayerPrelude({ url: 'wss://game.example/ws', room: '</script><img onerror=alert(1)>' });
assert.equal(injected.includes('</script><img'), false);
assert.match(injected, /\\u003c\/script\\u003e/);

const page = withHtmlMultiplayer('<style>html,body{height:300px;margin:0}</style><div id="board"></div>', {
    url: 'wss://game.example/ws',
    room: 'catur-1'
});

assert.ok(page.indexOf('<script>') < page.indexOf('<div id="board">'));

const report = checkHtmlApp(page, { height: 300 });
assert.equal(report.ok, true, report.problems.join(' | '));
assert.deepEqual(report.warnings, []);

const cleartext = checkHtmlApp('<style>body{height:100px}</style><script>new WebSocket("ws://x.example")</script>', { height: 100 });
assert.equal(cleartext.ok, false);
assert.match(cleartext.problems.join(' '), /other than wss/);

const unclosed = checkHtmlApp('<style>body{height:100px}</style><script>new WebSocket("wss://x.example")</script>', { height: 100 });
assert.equal(unclosed.ok, true);
assert.match(unclosed.warnings.join(' '), /nothing closing it/);
