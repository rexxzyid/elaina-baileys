import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AudioFeeder } from '../lib/Voip/audio-feeder.js';
import { ActiveCall, CallState, VoipClient, makeVoipClient } from '../lib/Voip/index.js';
import { readFileSync, readdirSync } from 'node:fs';
import { EventEmitter } from 'node:events';
import { spawnSync } from 'node:child_process';
import { VideoFeeder, VIDEO_FORMAT_I420 } from '../lib/Voip/video-feeder.js';
import { Worker } from 'node:worker_threads';
import { bindVoiceRecognition, matchVoiceWakePhrase, normalizeVoiceText, removeVoiceWakePhrase } from '../lib/Utils/voice-recognition.js';

test('voip-audio-feeder', async () => {
    const SAMPLE_RATE = 16000;
    const FRAMES = 320;
    const CHUNK_BYTES = FRAMES * Float32Array.BYTES_PER_ELEMENT;

    const makeFeeder = () => {
        const emitted = [];
        const feeder = new AudioFeeder(SAMPLE_RATE, 1, FRAMES, chunk => emitted.push(chunk));
        feeder._running = true;
        feeder._proc = {
            kill() {},
            removeAllListeners() {},
            stdout: { isPaused: () => false, pause() {}, resume() {}, removeAllListeners() {} }
        };
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
});

test('voip-playlist', async () => {
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
});

test('voip-session', async () => {
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

    /**
     * worker-bootstrap.js is only ever loaded by a Worker at call time, so an ESM
     * slip in it -- a bare require, __dirname, __filename -- would not surface
     * until someone placed a real call. Importing every file keeps that honest.
     */
    for (const { name } of sources) {
        await import(`../lib/Voip/${name}`);
    }

    assert.equal(typeof makeVoipClient, 'function');
    assert.equal(CallState.Active, 6);
    assert.equal(Object.isFrozen(CallState), true);
});

test('voip-video', async () => {
    const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
    const hasFfmpeg = spawnSync(FFMPEG, ['-version']).status === 0;

    /** I420 is one luma plane plus two half-size chroma planes: w * h * 3 / 2. */
    {
        const feeder = new VideoFeeder(640, 480, 24, () => {});
        assert.equal(feeder._frameBytes, 640 * 480 * 1.5);
        assert.equal(feeder._frameIntervalMs, 1000 / 24);
        assert.equal(VIDEO_FORMAT_I420, 0);
    }

    /** Odd sizes must not produce a fractional frame length. */
    {
        const feeder = new VideoFeeder(321, 241, 30, () => {});
        assert.equal(Number.isInteger(feeder._frameBytes), true);
    }

    /** A frame split across reads is reassembled in order, same as the audio path. */
    {
        const seen = [];
        const feeder = new VideoFeeder(4, 4, 10, frame => seen.push(frame));
        feeder._proc = { kill() {}, removeAllListeners() {}, stdout: { isPaused: () => false, pause() {}, resume() {}, removeAllListeners() {} } };
        const bytes = feeder._frameBytes;
        const first = Buffer.alloc(bytes - 5, 1);
        const second = Buffer.alloc(5 + 7, 2);
        feeder._absorb(first);
        assert.equal(feeder.queuedFrames, 0, 'a partial frame waits');
        feeder._absorb(second);
        assert.equal(feeder.queuedFrames, 1, 'the seam completes exactly one frame');
        assert.equal(feeder._pendingBytes, 7, 'the tail stays pending');
        assert.equal(feeder._queue[0].length, bytes);
        assert.equal(feeder._queue[0][0], 1);
        assert.equal(feeder._queue[0][bytes - 1], 2, 'bytes keep their order across the seam');
    }

    /**
     * Video has no silence to fall back on, so a starved feeder repeats the last
     * frame rather than sending a black one, which reads as a freeze instead of a
     * flash.
     */
    {
        const seen = [];
        const feeder = new VideoFeeder(4, 4, 10, frame => seen.push(frame));
        feeder._running = true;
        feeder._proc = { kill() {}, removeAllListeners() {}, stdout: { isPaused: () => false, pause() {}, resume() {}, removeAllListeners() {} } };
        feeder._buffering = false;
        feeder._absorb(Buffer.alloc(feeder._frameBytes, 9));
        feeder._tick();
        clearTimeout(feeder._emitTimer);
        assert.equal(seen.length, 1);
        feeder._tick();
        clearTimeout(feeder._emitTimer);
        assert.equal(seen.length, 2, 'the tick still fires when the queue is dry');
        assert.equal(seen[1], seen[0], 'it repeats the last frame');
        assert.equal(feeder.underflowFrames, 1);
        feeder.stop();
    }

    /** ffmpeg is told to scale, pad and pace every input kind. */
    {
        const feeder = new VideoFeeder(640, 480, 24, () => {});
        assert.deepEqual(feeder._resolveInputArgs('black').slice(0, 3), ['-re', '-f', 'lavfi']);
        assert.deepEqual(feeder._resolveInputArgs('lavfi:testsrc'), ['-re', '-f', 'lavfi', '-i', 'testsrc']);
        assert.deepEqual(feeder._resolveInputArgs('./clip.mp4'), ['-re', '-i', './clip.mp4']);
        assert.deepEqual(feeder._resolveInputArgs('./poster.jpg'), ['-re', '-loop', '1', '-i', './poster.jpg'], 'a still image loops instead of ending after one frame');
    }

    /** The binary is configurable, because plenty of hosts only have ffmpeg-static. */
    {
        assert.equal(new VideoFeeder(4, 4, 1, () => {}, null, { ffmpegPath: '/opt/ffmpeg' }).ffmpegPath, '/opt/ffmpeg');
    }

    /** A call carries an independent video queue alongside the audio one. */
    {
        const call = new ActiveCall('V1', { endCall() {} }, 0);
        assert.equal(call.isVideo(), false, 'audio only unless asked');
        call._video = true;
        assert.equal(call.isVideo(), true);
        assert.equal(call.enqueueVideo(['a.mp4', 'b.mp4']), 2);
        assert.equal(call.queuedVideo(), 2);
        assert.equal(call.queued(), 0, 'the audio queue is untouched');
        const events = [];
        call.on('videotrack', track => events.push(['start', track]));
        call.on('videotrackend', track => events.push(['end', track]));
        call._onVideoTrackStart('a.mp4');
        call._onVideoTrackEnd('a.mp4');
        assert.deepEqual(events, [['start', 'a.mp4'], ['end', 'a.mp4']]);
        call.end();
    }

    /** Screen share is the same feeder on a different wasm entry point. */
    {
        const seen = [];
        const engine = { endCall() {}, startScreenShare() { seen.push('start'); }, stopScreenShare() { seen.push('stop'); } };
        const call = new ActiveCall('S1', engine, 0);

        assert.throws(() => call.startScreenShare(), /needs a video call/, 'sharing a screen on an audio call is refused up front');

        call._video = true;
        call.startScreenShare();
        assert.equal(call.isScreenShare(), true);
        assert.deepEqual(seen, ['start']);

        call.stopScreenShare();
        assert.equal(call.isScreenShare(), false);
        assert.deepEqual(seen, ['start', 'stop']);

        /** A call opened with screenShare starts sharing the moment it connects. */
        call._screenShare = true;
        call._updateState(6);
        assert.deepEqual(seen, ['start', 'stop', 'start'], 'connecting kicks the share off');
        call.end();
    }

    if (!hasFfmpeg) {
        console.log('voip video tests passed (ffmpeg absent, decode test skipped)');
    }
    else {
        /** End to end through a real ffmpeg: the frames are the right size and arrive on time. */
        const frames = [];
        const feeder = new VideoFeeder(320, 240, 15, frame => frames.push(frame.length), 'lavfi:testsrc=size=320x240:rate=15:duration=10', { ffmpegPath: FFMPEG });
        feeder.start();
        await new Promise(resolve => setTimeout(resolve, 2000));
        feeder.stop();

        assert.ok(frames.length >= 24 && frames.length <= 36, `expected roughly 30 frames in two seconds at 15 fps, got ${frames.length}`);
        assert.deepEqual([...new Set(frames)], [320 * 240 * 1.5], 'every frame is exactly one I420 image');
        assert.equal(feeder.underflowFrames, 0, 'a source that outruns the clock never starves');

        /**
         * The camera and the screen share differ in exactly one thing once the
         * frames exist: useDesktopCapture, which picks onDesktopCaptureDataFromJs
         * over onVideoDataFromJs inside the worker. Drive the client's own capture
         * handler so the flag is read from the wiring rather than restated here.
         */
        const runCapture = async useDesktop => {
            const sent = [];
            const client = new VoipClient({ socket: { ws: {} }, ffmpegPath: FFMPEG });
            const call = new ActiveCall('C1', { endCall() {} }, 0);
            call._video = true;
            call._videoPlaylist = ['lavfi:testsrc=size=160x120:rate=10:duration=5'];
            client._activeCall = call;
            client._engine = {
                isInitialized: () => true,
                sendVideoFrame: (frame, w, h, rate, format, orientation, desktop) => sent.push({ len: frame.length, w, h, format, desktop }),
                releaseVideoFrameBuffer() {}
            };
            client._startVideoFeeder({ width: 160, height: 120, fps: 10 }, useDesktop);
            await new Promise(resolve => setTimeout(resolve, 1200));
            client._stopVideoFeeder('TEST');
            call.end();
            return sent;
        };

        const camera = await runCapture(false);
        assert.ok(camera.length > 0, 'the camera path produced frames');
        assert.equal(camera.every(f => f.desktop === false), true, 'camera frames are not flagged as desktop');
        assert.equal(camera[0].len, 160 * 120 * 1.5);
        assert.equal(camera[0].format, VIDEO_FORMAT_I420);

        const screen = await runCapture(true);
        assert.ok(screen.length > 0, 'the screen share path produced frames');
        assert.equal(screen.every(f => f.desktop === true), true, 'screen frames take the desktop entry point');
        assert.equal(screen[0].len, camera[0].len, 'the pixels are identical either way');

        console.log('voip video tests passed');
    }
});

test('voip-worker-boot', async () => {
    /**
     * worker-bootstrap.js runs as a worker_threads entry point, never as an import
     * on the main thread, so a module-scope mistake in it stays invisible until a
     * call is placed. It shipped once with a bare `require`, which threw
     * "require is not defined in ES module scope" the first time a worker started.
     * Booting it for real is the only check that covers that.
     */
    const bootWorker = () => new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../lib/Voip/worker-bootstrap.js', import.meta.url), {
            workerData: { storageDir: '/tmp/elaina-voip-test', resourcesPath: '/nonexistent' },
            stdout: true,
            stderr: true
        });
        const timer = setTimeout(() => {
            worker.terminate();
            reject(new Error('worker never reported worker_ready'));
        }, 15000);
        worker.on('message', message => {
            if (message?.type === 'worker_ready') {
                clearTimeout(timer);
                worker.terminate();
                resolve(true);
            }
        });
        worker.on('error', err => {
            clearTimeout(timer);
            worker.terminate();
            reject(err);
        });
    });

    assert.equal(await bootWorker(), true, 'the worker boots and announces itself');
});

test('voice-recognition', async () => {
    const BOT = '628111111111@s.whatsapp.net';
    const USER = '628222222222@s.whatsapp.net';

    const makeHarness = options => {
        const listeners = new Map();
        const emitted = [];
        const ev = {
            on(name, handler) {
                const list = listeners.get(name) || [];
                list.push(handler);
                listeners.set(name, list);
            },
            off(name, handler) {
                listeners.set(name, (listeners.get(name) || []).filter(item => item !== handler));
            },
            emit(name, data) {
                if (name !== 'messages.upsert') {
                    emitted.push({ name, data });
                }
            }
        };
        const sock = {
            ev,
            authState: {
                creds: {
                    me: {
                        id: BOT
                    }
                }
            }
        };
        const downloadContentFromMessage = async () => (async function* () {
            yield Buffer.from('voice');
        })();
        bindVoiceRecognition(sock, {
            getMessage: async () => undefined,
            voiceRecognition: {
                enabled: true,
                transcribe: async () => options.transcript,
                wakePhrases: options.wakePhrases,
                getWakePhrases: options.getWakePhrases,
                allowQuotedActivation: options.allowQuotedActivation,
                pttOnly: options.pttOnly,
                maxDuration: options.maxDuration
            }
        }, { downloadContentFromMessage });
        return {
            emitted,
            async dispatch(message) {
                await Promise.all((listeners.get('messages.upsert') || []).map(handler => handler({ messages: [message], type: 'notify' })));
            }
        };
    };

    const message = ({ contextInfo, ptt = true, seconds = 8 } = {}) => ({
        key: {
            remoteJid: USER,
            fromMe: false,
            id: 'VOICE-1'
        },
        message: {
            audioMessage: {
                ptt,
                seconds,
                mimetype: 'audio/ogg; codecs=opus',
                mediaKey: Buffer.alloc(32, 1),
                directPath: '/voice',
                contextInfo
            }
        }
    });

    assert.equal(normalizeVoiceText('Hai, Elaina-Baileys!'), 'hai elaina baileys');
    assert.equal(matchVoiceWakePhrase('Hai Elaina Baileys tolong buka menu', ['hai elaina-baileys'])?.phrase, 'hai elaina-baileys');
    assert.equal(removeVoiceWakePhrase('Hai Elaina Baileys tolong buka menu', 'hai elaina-baileys'), 'tolong buka menu');

    const wake = makeHarness({
        transcript: 'Hai Elaina Baileys, tolong buka menu',
        getWakePhrases: async ({ senderJid }) => senderJid === USER ? ['hai elaina-baileys'] : []
    });
    await wake.dispatch(message());
    assert.equal(wake.emitted.filter(event => event.name === 'voice.transcription').length, 1);
    assert.equal(wake.emitted.filter(event => event.name === 'voice.command').length, 1);
    assert.equal(wake.emitted.find(event => event.name === 'voice.command').data.activation, 'wake-phrase');
    assert.equal(wake.emitted.find(event => event.name === 'voice.command').data.commandText, 'tolong buka menu');

    const quoted = makeHarness({ transcript: 'Tolong buka menu' });
    await quoted.dispatch(message({
        contextInfo: {
            stanzaId: 'BOT-MESSAGE',
            participant: BOT,
            quotedMessage: {
                conversation: 'menu'
            }
        }
    }));
    assert.equal(quoted.emitted.find(event => event.name === 'voice.command').data.activation, 'quoted');
    assert.equal(quoted.emitted.find(event => event.name === 'voice.command').data.commandText, 'tolong buka menu');

    const ignored = makeHarness({ transcript: 'Besok kita pergi jam tujuh', wakePhrases: ['hai elaina'] });
    await ignored.dispatch(message());
    assert.equal(ignored.emitted.filter(event => event.name === 'voice.transcription').length, 1);
    assert.equal(ignored.emitted.filter(event => event.name === 'voice.command').length, 0);

    const notPtt = makeHarness({ transcript: 'Hai Elaina buka menu', wakePhrases: ['hai elaina'] });
    await notPtt.dispatch(message({ ptt: false }));
    assert.equal(notPtt.emitted.length, 0);

    const tooLong = makeHarness({ transcript: 'Hai Elaina buka menu', wakePhrases: ['hai elaina'], maxDuration: 5 });
    await tooLong.dispatch(message({ seconds: 8 }));
    assert.equal(tooLong.emitted.length, 0);
});
