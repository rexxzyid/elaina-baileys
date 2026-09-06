import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { CallState, VoipClient, makeVoipClient } from '../lib/Voip/index.js';

/**
 * The whole point of the rewrite: the call stack rides the socket the bot is
 * already logged in with. If any of these ever reappear, a bot would pair once
 * and then be asked for a second QR, which is the bug being fixed.
 */
const sources = readdirSync(new URL('../lib/Voip/', import.meta.url))
    .filter(name => name.endsWith('.js'))
    .map(name => ({ name, code: readFileSync(new URL(`../lib/Voip/${name}`, import.meta.url), 'utf8') }));

for (const { name, code } of sources) {
    for (const forbidden of ['makeWASocket', 'useMultiFileAuthState', 'useSingleFileAuthState', 'authDir']) {
        assert.equal(code.includes(forbidden), false, `${name} must not reach for ${forbidden}`);
    }
    assert.equal(code.includes('uncaughtException'), false, `${name} must not install a process-wide exception handler`);
    assert.equal(/\brequire\(/.test(code), false, `${name} must be ESM`);
}

/** A client with no socket says so before anything else happens. */
await assert.rejects(() => new VoipClient({}).connect(), err => {
    assert.match(err.message, /socket you are already logged in with/);
    assert.match(err.message, /no second pairing or QR scan/);
    return true;
});

/** A socket that has not finished connecting is refused with the reason. */
await assert.rejects(() => new VoipClient({ socket: {} }).connect(), /no websocket yet/);

/** socket, sock and conn all name the same thing, so all three are accepted. */
for (const key of ['socket', 'sock', 'conn']) {
    const client = new VoipClient({ [key]: { ws: new EventEmitter() } });
    assert.equal(client._sock !== null, true, `${key} is read`);
    assert.equal(client._externalSocket, true, `${key} marks the socket as borrowed`);
}

/** Nothing is written to stdout unless the caller asks for it. */
const quiet = new VoipClient({ socket: { ws: new EventEmitter() } });
assert.equal(quiet._log(), undefined, 'the default logger is a no-op');
const lines = [];
const loud = new VoipClient({ socket: { ws: new EventEmitter() }, logger: (...args) => lines.push(args) });
loud._log('hello');
assert.deepEqual(lines, [['hello']], 'a caller supplied logger receives the line');

/** A reconnect swaps the socket underneath without rebuilding the engine. */
const first = new EventEmitter();
const second = new EventEmitter();
const client = new VoipClient({ socket: { ws: first } });
client._signaling = { setSocket(socket) { this.seen = socket; } };
client._engine = { isInitialized: () => true };
client._bindSocketHandlers();
assert.equal(first.listenerCount('CB:call'), 1, 'the first socket is listened to');
await client.attach({ ws: second });
assert.equal(first.listenerCount('CB:call'), 0, 'the old socket is released');
assert.equal(second.listenerCount('CB:call'), 1, 'the new socket is listened to');
assert.equal(second.listenerCount('CB:receipt'), 1);
assert.equal(client._signaling.seen.ws, second, 'signaling follows the swap');

/** Binding twice must not leave two handlers behind, doubling every call event. */
client._bindSocketHandlers();
assert.equal(second.listenerCount('CB:call'), 1, 'rebinding replaces rather than stacks');

await assert.rejects(() => client.attach(null), /attach needs the reconnected socket/);

assert.equal(typeof makeVoipClient, 'function');
assert.equal(CallState.Active, 6);
assert.equal(Object.isFrozen(CallState), true);

console.log('voip session tests passed');
