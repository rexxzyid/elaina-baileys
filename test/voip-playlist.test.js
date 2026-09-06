import assert from 'node:assert/strict';
import { AudioFeeder } from '../lib/Voip/audio-feeder.js';
import { ActiveCall } from '../lib/Voip/index.js';

const FRAMES = 320;
const CHUNK_BYTES = FRAMES * Float32Array.BYTES_PER_ELEMENT;

const stubProc = () => ({
    kill() {},
    removeAllListeners() {},
    stdout: { isPaused: () => false, pause() {}, resume() {}, removeAllListeners() {} }
});

const makeFeeder = () => {
    const events = [];
    const feeder = new AudioFeeder(16000, 1, FRAMES, () => {}, 'silence', {
        onTrackStart: track => events.push(['start', track]),
        onTrackEnd: track => events.push(['end', track]),
        onIdle: () => events.push(['idle'])
    });
    feeder._spawn = source => {
        feeder._proc = stubProc();
        events.push(['spawn', source]);
    };
    return { feeder, events };
};

/** One track: it plays, it ends, and the feeder reports it has nothing left. */
{
    const { feeder, events } = makeFeeder();
    feeder.start(['satu.mp3']);
    clearTimeout(feeder._emitTimer);
    assert.deepEqual(events, [['spawn', 'satu.mp3'], ['start', 'satu.mp3']]);
    assert.equal(feeder.currentTrack, 'satu.mp3');

    feeder._proc = null;
    feeder._sourceEnded = true;
    feeder._tick();
    clearTimeout(feeder._emitTimer);
    assert.deepEqual(events.slice(2), [['end', 'satu.mp3'], ['idle']], 'the end of the last track goes idle');
    assert.equal(feeder.currentTrack, null);
    feeder.stop();
}

/** A queue: the next track starts by itself, with no gap to arrange. */
{
    const { feeder, events } = makeFeeder();
    feeder.start(['satu.mp3', 'dua.mp3']);
    clearTimeout(feeder._emitTimer);
    feeder._proc = null;
    feeder._sourceEnded = true;
    feeder._tick();
    clearTimeout(feeder._emitTimer);
    assert.deepEqual(events.slice(2), [['end', 'satu.mp3'], ['spawn', 'dua.mp3'], ['start', 'dua.mp3']]);
    assert.equal(events.some(event => event[0] === 'idle'), false, 'a full queue never goes idle');
    feeder.stop();
}

/** A track arriving during the gap resumes the feeder without a restart. */
{
    const { feeder, events } = makeFeeder();
    feeder.start(['satu.mp3']);
    clearTimeout(feeder._emitTimer);
    feeder._proc = null;
    feeder._sourceEnded = true;
    feeder._tick();
    clearTimeout(feeder._emitTimer);
    assert.equal(feeder.idle, true);

    feeder.enqueue('dua.mp3');
    clearTimeout(feeder._emitTimer);
    assert.equal(feeder.idle, false, 'enqueueing while idle picks the feeder back up');
    assert.equal(feeder.currentTrack, 'dua.mp3');
    assert.deepEqual(events.slice(-2), [['spawn', 'dua.mp3'], ['start', 'dua.mp3']]);
    feeder.stop();
}

/** skip drops the current track and moves on. */
{
    const { feeder, events } = makeFeeder();
    feeder.start(['satu.mp3', 'dua.mp3']);
    clearTimeout(feeder._emitTimer);
    assert.equal(feeder.skip(), true);
    clearTimeout(feeder._emitTimer);
    assert.equal(feeder.currentTrack, 'dua.mp3');
    assert.equal(events.filter(event => event[0] === 'spawn').length, 2);
    feeder.stop();
}

/** enqueue takes a list, and playlistLength counts what is still waiting. */
{
    const { feeder } = makeFeeder();
    feeder.start(['satu.mp3']);
    clearTimeout(feeder._emitTimer);
    assert.equal(feeder.enqueue(['dua.mp3', 'tiga.mp3']), 2);
    assert.equal(feeder.playlistLength, 2);
    feeder.clearPlaylist();
    assert.equal(feeder.playlistLength, 0);
    feeder.stop();
}

/**
 * Audio buffered from the finished track is played out before the next one
 * starts, so the tail of a song is never cut off by the queue advancing.
 */
{
    const { feeder, events } = makeFeeder();
    feeder.start(['satu.mp3', 'dua.mp3']);
    clearTimeout(feeder._emitTimer);
    feeder._buffering = false;
    feeder._absorb(Buffer.alloc(CHUNK_BYTES * 3));
    feeder._proc = null;
    feeder._sourceEnded = true;
    feeder._tick();
    clearTimeout(feeder._emitTimer);
    assert.equal(feeder.currentTrack, 'satu.mp3', 'the buffered tail still belongs to the first track');
    assert.equal(events.some(event => event[1] === 'dua.mp3'), false);
    feeder.stop();
}

/** The call hangs up on its own once the queue runs dry. */
{
    const call = new ActiveCall('CALL1', { endCall() {} }, 0);
    call._endWhenQueueEmpty = true;
    call._idleGraceMs = 0;
    call._feeder = { playlistLength: 0, currentTrack: null };
    const seen = [];
    call.on('idle', () => seen.push('idle'));
    call.on('ended', reason => seen.push(reason));
    call._onPlaylistIdle();
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.deepEqual(seen, ['idle', 'local_end'], 'idle then hang up');
}

/** With endWhenQueueEmpty off it stays on the call and waits. */
{
    const call = new ActiveCall('CALL2', { endCall() {} }, 0);
    call._endWhenQueueEmpty = false;
    call._feeder = { playlistLength: 0, currentTrack: null };
    const seen = [];
    call.on('idle', () => seen.push('idle'));
    call.on('ended', () => seen.push('ended'));
    call._onPlaylistIdle();
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.deepEqual(seen, ['idle'], 'the call is held open');
    call.end();
}

/** A track queued inside the grace window cancels the hang up. */
{
    const call = new ActiveCall('CALL3', { endCall() {} }, 0);
    call._endWhenQueueEmpty = true;
    call._idleGraceMs = 50;
    const feeder = { playlistLength: 0, currentTrack: null, enqueue(track) { this.playlistLength += 1; return this.playlistLength; }, clearPlaylist() {}, skip() {} };
    call._feeder = feeder;
    const seen = [];
    call.on('ended', reason => seen.push(reason));
    call._onPlaylistIdle();
    call.enqueue('dua.mp3');
    await new Promise(resolve => setTimeout(resolve, 80));
    assert.deepEqual(seen, [], 'the queued track kept the call up');
    assert.equal(call.queued(), 1);
    call.end();
}

console.log('voip playlist tests passed');
