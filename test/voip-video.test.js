import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { ActiveCall, VoipClient } from '../lib/Voip/index.js';
import { VideoFeeder, VIDEO_FORMAT_I420 } from '../lib/Voip/video-feeder.js';

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
