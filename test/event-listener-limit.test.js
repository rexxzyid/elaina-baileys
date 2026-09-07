import assert from 'node:assert/strict';
import { DEFAULT_MAX_EVENT_LISTENERS, makeEventBuffer } from '../lib/Utils/event-buffer.js';
import { DEFAULT_CONNECTION_CONFIG } from '../lib/Defaults/index.js';

const logger = { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } };

/**
 * The bus is one emitter shared by the socket, the store and every plugin a bot
 * registers, so node's default of ten per event fires a leak warning on an
 * ordinary setup and buries the real lines in the log.
 */
{
    assert.equal(DEFAULT_MAX_EVENT_LISTENERS, 64);
    assert.equal(DEFAULT_CONNECTION_CONFIG.maxEventListeners, DEFAULT_MAX_EVENT_LISTENERS);
    assert.equal(makeEventBuffer(logger).getMaxListeners(), DEFAULT_MAX_EVENT_LISTENERS);
}

/** Still finite by default, so a runaway registration is still reported. */
{
    const ev = makeEventBuffer(logger);
    const warnings = [];
    const onWarning = warning => warnings.push(warning);
    const printers = process.listeners('warning');
    process.removeAllListeners('warning');
    process.on('warning', onWarning);

    for (let i = 0; i < DEFAULT_MAX_EVENT_LISTENERS + 1; i++) {
        ev.on('call', () => {});
    }
    await new Promise(resolve => setImmediate(resolve));
    process.off('warning', onWarning);
    for (const printer of printers) {
        process.on('warning', printer);
    }

    assert.ok(
        warnings.some(warning => warning.name === 'MaxListenersExceededWarning'),
        'passing the ceiling still warns rather than hiding a real leak'
    );
    ev.removeAllListeners('call');
}

/** A bot that genuinely wants more, or none, can say so. */
{
    assert.equal(makeEventBuffer(logger, 8).getMaxListeners(), 8);
    assert.equal(makeEventBuffer(logger, 0).getMaxListeners(), 0, 'zero is unlimited, node treats it that way');
    assert.equal(makeEventBuffer(logger, undefined).getMaxListeners(), DEFAULT_MAX_EVENT_LISTENERS);
    assert.equal(makeEventBuffer(logger, -1).getMaxListeners(), DEFAULT_MAX_EVENT_LISTENERS, 'nonsense falls back');
    assert.equal(makeEventBuffer(logger, 'lots').getMaxListeners(), DEFAULT_MAX_EVENT_LISTENERS);
}

/**
 * The buffer forwarded on, off and removeAllListeners and nothing else, so a bot
 * could add listeners but never inspect them — and cleaning up duplicates left
 * behind by a hot reload meant dropping the library's own handler with them.
 */
{
    const ev = makeEventBuffer(logger);
    const first = () => {};
    const second = () => {};
    ev.on('call', first);
    ev.addListener('call', second);
    ev.once('call', () => {});

    assert.equal(ev.listenerCount('call'), 3);
    assert.equal(ev.listeners('call').length, 3);
    assert.equal(ev.rawListeners('call').length, 3);
    assert.equal(ev.listeners('call')[0], first, 'in registration order, so the oldest is index 0');

    ev.removeListener('call', first);
    assert.equal(ev.listenerCount('call'), 2);
    assert.equal(ev.listeners('call')[0], second);

    assert.ok(ev.eventNames().includes('call'));
    ev.removeAllListeners('call');
    assert.equal(ev.listenerCount('call'), 0);
}

/** Duplicates from a reload share their source, which is what makes them removable. */
{
    const ev = makeEventBuffer(logger);
    const make = () => function onCall(node) { return node };
    ev.on('call', make());
    ev.on('call', make());
    ev.on('call', () => 'different');

    const seen = new Set();
    for (const listener of ev.listeners('call')) {
        const source = listener.toString();
        if (seen.has(source)) ev.off('call', listener);
        else seen.add(source);
    }
    assert.equal(ev.listenerCount('call'), 2, 'one of each distinct listener survives');
}

console.log('event listener limit tests passed');
