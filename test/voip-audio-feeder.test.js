import assert from 'node:assert/strict';
import { AudioFeeder } from '../lib/Voip/audio-feeder.js';

const SAMPLE_RATE = 16000;
const FRAMES = 320;
const CHUNK_BYTES = FRAMES * Float32Array.BYTES_PER_ELEMENT;

const makeFeeder = () => {
    const emitted = [];
    const feeder = new AudioFeeder(SAMPLE_RATE, 1, FRAMES, chunk => emitted.push(chunk));
    feeder._proc = { kill() {}, stdout: { isPaused: () => false, pause() {}, resume() {} } };
    return { feeder, emitted };
};

const rampBuffer = (bytes, start = 0) => {
    const samples = bytes / Float32Array.BYTES_PER_ELEMENT;
    const floats = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
        floats[i] = start + i;
    }
    return Buffer.from(floats.buffer, floats.byteOffset, bytes);
};

/**
 * ffmpeg hands over whatever size the pipe gives it, so a chunk boundary lands
 * mid-buffer constantly. The old code rebuilt one growing Buffer with concat on
 * every read, which is quadratic and stalled the 20 ms emit timer often enough
 * to inject silence into live speech.
 */
{
    const { feeder } = makeFeeder();
    feeder._absorb(rampBuffer(CHUNK_BYTES / 2, 0));
    assert.equal(feeder.queuedChunks, 0, 'half a chunk is not emitted early');
    feeder._absorb(rampBuffer(CHUNK_BYTES / 2, FRAMES / 2));
    assert.equal(feeder.queuedChunks, 1, 'the two halves make exactly one chunk');

    const chunk = feeder._queue[0];
    assert.equal(chunk.length, FRAMES);
    assert.equal(chunk[0], 0);
    assert.equal(chunk[FRAMES / 2], FRAMES / 2, 'samples keep their order across the seam');
    assert.equal(chunk[FRAMES - 1], FRAMES - 1);
    assert.equal(feeder._pendingBytes, 0, 'nothing is left over');
}

/** A single read carrying several chunks is split, not merged. */
{
    const { feeder } = makeFeeder();
    feeder._absorb(rampBuffer(CHUNK_BYTES * 3));
    assert.equal(feeder.queuedChunks, 3);
    assert.equal(feeder._pendingParts.length, 0);
}

/** A read that straddles chunks leaves only the remainder pending. */
{
    const { feeder } = makeFeeder();
    feeder._absorb(rampBuffer(CHUNK_BYTES * 2 + 40));
    assert.equal(feeder.queuedChunks, 2);
    assert.equal(feeder._pendingBytes, 40, 'the tail waits for the next read');
}

/**
 * The old feeder emitted a silent chunk the moment the queue ran dry and then
 * carried on at full rate, so a stalled producer turned into a stream of
 * alternating audio and silence. It now goes back to buffering, which is what
 * makes the difference between a gap and a stutter.
 */
{
    const { feeder, emitted } = makeFeeder();
    feeder._buffering = false;
    feeder._tick();
    assert.equal(emitted.length, 1, 'the tick still produces a chunk on time');
    assert.equal(emitted[0].every(sample => sample === 0), true, 'the gap is filled with silence');
    assert.equal(feeder.underflowChunks, 1);
    assert.equal(feeder.rebuffers, 1);
    assert.equal(feeder._buffering, true, 'an underflow sends it back to buffering');
    feeder.stop();
}

/** While buffering it waits for a prebuffer rather than dribbling silence out. */
{
    const { feeder, emitted } = makeFeeder();
    feeder._absorb(rampBuffer(CHUNK_BYTES * 2));
    feeder._tick();
    assert.equal(emitted.length, 0, 'two chunks is under the prebuffer, so nothing goes out yet');
    assert.equal(feeder.underflowChunks, 0, 'waiting is not an underflow');
    feeder.stop();
}

/** Once the prebuffer is full it starts, and real audio goes out untouched. */
{
    const { feeder, emitted } = makeFeeder();
    feeder._absorb(rampBuffer(CHUNK_BYTES * 20));
    feeder._tick();
    assert.equal(emitted.length, 1);
    assert.equal(emitted[0][0], 0);
    assert.equal(emitted[0][1], 1, 'the samples are the ones ffmpeg produced');
    assert.equal(feeder.underflowChunks, 0);
    assert.equal(feeder._buffering, false);
    feeder.stop();
}

/**
 * The emit clock is anchored to a start time and a chunk index, so ordinary
 * jitter does not accumulate; only a stall longer than the resync window moves
 * the anchor.
 */
{
    const { feeder } = makeFeeder();
    feeder._startedAtMs = Date.now() - 1000;
    feeder._emitIndex = 50;
    const before = feeder._startedAtMs;
    feeder._schedule();
    assert.equal(feeder._startedAtMs, before, '50 chunks at 20 ms is exactly 1000 ms, so no resync');
    clearTimeout(feeder._emitTimer);

    feeder._startedAtMs = Date.now() - 5000;
    feeder._emitIndex = 50;
    feeder._schedule();
    assert.notEqual(feeder._startedAtMs, Date.now() - 5000, 'a four second stall re-anchors instead of firing a burst');
    clearTimeout(feeder._emitTimer);
    feeder.stop();
}

/** ffmpeg is asked to produce at wall-clock rate for every input kind. */
{
    const silence = new AudioFeeder(SAMPLE_RATE, 1, FRAMES, () => {});
    assert.equal(silence._resolveInputArgs()[0], '-re');
    const lavfi = new AudioFeeder(SAMPLE_RATE, 1, FRAMES, () => {}, 'lavfi:sine=frequency=440');
    assert.deepEqual(lavfi._resolveInputArgs(), ['-re', '-f', 'lavfi', '-i', 'sine=frequency=440']);
    const file = new AudioFeeder(SAMPLE_RATE, 1, FRAMES, () => {}, './voice.mp3');
    assert.deepEqual(file._resolveInputArgs(), ['-re', '-i', './voice.mp3']);
}

console.log('voip audio feeder tests passed');
