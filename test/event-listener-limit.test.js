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

console.log('event listener limit tests passed');
