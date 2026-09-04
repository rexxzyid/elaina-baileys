import assert from 'node:assert/strict';
import { HTML_APP_BYTE_LIMIT, checkHtmlApp } from '../lib/Utils/html-app.js';

const clean = checkHtmlApp('<style>html,body{height:300px;margin:0}</style><div>halo</div>', { height: 300 });
assert.equal(clean.ok, true);
assert.deepEqual(clean.problems, []);
assert.deepEqual(clean.warnings, []);

const remote = checkHtmlApp('<img src="https://example.com/a.png"><img src="//cdn.example.com/b.png">', { height: 100 });
assert.equal(remote.ok, false);
assert.match(remote.problems.join(' '), /2 remote subresources/);

const network = checkHtmlApp('<script>fetch("/x").then(r => r.json())</script>', { height: 100 });
assert.equal(network.ok, false);
assert.match(network.problems.join(' '), /HTTP stack/);

const socket = checkHtmlApp('<style>body{height:100px}</style><script>const ws = new WebSocket("wss://x.example"); addEventListener("visibilitychange", () => ws.close())</script>', { height: 100 });
assert.equal(socket.ok, true);
assert.deepEqual(socket.warnings, []);

const storage = checkHtmlApp('<script>try { localStorage.setItem("a", 1) } catch {}</script>', { height: 100 });
assert.equal(storage.ok, false);
assert.match(storage.problems.join(' '), /localStorage/);

const runaway = checkHtmlApp('<script>const loop = () => { requestAnimationFrame(loop) }; loop()</script>', { height: 100 });
assert.equal(runaway.ok, false);
assert.match(runaway.problems.join(' '), /burning CPU/);

const guarded = checkHtmlApp('<script>const loop = () => { if (document.hidden) return; requestAnimationFrame(loop) }; loop()</script>', { height: 100 });
assert.equal(guarded.ok, true);

const stoppable = checkHtmlApp('<script>const t = setInterval(tick, 16); addEventListener("visibilitychange", () => clearInterval(t))</script>', { height: 100 });
assert.equal(stoppable.ok, true);

const noHeight = checkHtmlApp('<div>halo</div>');
assert.equal(noHeight.ok, true);
assert.match(noHeight.warnings.join(' '), /no height settled/);

const pinned = checkHtmlApp('<style>body{height:240px}</style><div>halo</div>');
assert.equal(pinned.warnings.length, 0);

const ratio = checkHtmlApp('<style>body{height:200px}.a{aspect-ratio:16/9}</style>');
assert.match(ratio.warnings.join(' '), /aspect-ratio/);

const tooBig = checkHtmlApp('<style>body{height:100px}</style>' + 'x'.repeat(HTML_APP_BYTE_LIMIT + 1), { height: 100 });
assert.equal(tooBig.ok, false, 'past the budget the receiving client drops the message');
assert.match(tooBig.problems.join(' '), /over the .*KB budget/);
assert.match(tooBig.problems.join(' '), /dropped by the receiving client/);

const emoji = checkHtmlApp('<style>body{height:100px}</style><div>' + '\u2b07\ufe0f'.repeat(200) + '</div>', { height: 100 });
assert.ok(emoji.wireBytes > emoji.bytes, 'escaping is counted');
assert.match(emoji.warnings.join(' '), /escaping inflates/);

const inComment = checkHtmlApp('<style>body{height:100px}</style><!-- <img src="https://example.com/a.png"> -->', { height: 100 });
assert.equal(inComment.ok, true);

const embedded = checkHtmlApp('<style>body{height:100px}</style><img src="data:image/png;base64,' + 'A'.repeat(4000) + '">', { height: 100 });
assert.equal(embedded.ok, true);
assert.ok(embedded.embeddedBytes >= 4000);
assert.match(embedded.warnings.join(' '), /embedded media/);

assert.throws(() => checkHtmlApp(null), TypeError);
