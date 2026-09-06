/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { spawn } from 'node:child_process';
const PREBUFFER_FRAMES = 3;
const MAX_QUEUED_FRAMES = 90;
const RESUME_QUEUE_FRAMES = 30;
const RESYNC_AFTER_MS = 400;
export const VIDEO_FORMAT_I420 = 0;
export class VideoFeeder {
    constructor(width, height, fps, onFrame, source = null, hooks = {}) {
        this.width = width;
        this.height = height;
        this.fps = fps;
        this.onFrame = onFrame;
        this.source = source;
        this.onTrackStart = hooks.onTrackStart ?? (() => {});
        this.onTrackEnd = hooks.onTrackEnd ?? (() => {});
        this.onIdle = hooks.onIdle ?? (() => {});
        this.ffmpegPath = hooks.ffmpegPath || process.env.FFMPEG_PATH || 'ffmpeg';
        this.underflowFrames = 0;
        this.framesEmitted = 0;
        this.tracksPlayed = 0;
        this.rebuffers = 0;
        this._proc = null;
        this._playlist = [];
        this._current = null;
        this._sourceEnded = false;
        this._idle = false;
        this._pendingParts = [];
        this._pendingBytes = 0;
        this._queue = [];
        this._emitTimer = null;
        this._startedAtMs = 0;
        this._emitIndex = 0;
        this._buffering = true;
        this._running = false;
        this._lastFrame = null;
        this._frameBytes = Math.floor(this.width * this.height * 3 / 2);
        this._frameIntervalMs = 1000 / this.fps;
    }
    get queuedFrames() {
        return this._queue.length;
    }
    get playlistLength() {
        return this._playlist.length;
    }
    get currentTrack() {
        return this._current;
    }
    get idle() {
        return this._idle;
    }
    enqueue(source) {
        const tracks = Array.isArray(source) ? source : [source];
        for (const track of tracks) {
            if (track) {
                this._playlist.push(track);
            }
        }
        if (this._running && !this._proc) {
            this._advance();
        }
        return this._playlist.length;
    }
    clearPlaylist() {
        this._playlist = [];
    }
    skip() {
        if (!this._proc) {
            return false;
        }
        this._stopSource();
        this._advance();
        return true;
    }
    start(playlist) {
        if (this._running) {
            return;
        }
        this._running = true;
        this._idle = false;
        this._buffering = true;
        this._emitIndex = 0;
        this._startedAtMs = 0;
        const initial = playlist ?? (this.source ? [this.source] : []);
        this._playlist = Array.isArray(initial) ? [...initial] : [initial];
        this._advance();
        this._schedule();
    }
    stop() {
        this._running = false;
        if (this._emitTimer) {
            clearTimeout(this._emitTimer);
            this._emitTimer = null;
        }
        this._stopSource();
        this._playlist = [];
        this._current = null;
        this._pendingParts = [];
        this._pendingBytes = 0;
        this._queue = [];
        this._lastFrame = null;
        this._buffering = true;
    }
    _stopSource() {
        const proc = this._proc;
        this._proc = null;
        if (proc) {
            proc.stdout?.removeAllListeners('data');
            proc.removeAllListeners('exit');
            try {
                proc.kill?.('SIGTERM');
            }
            catch {}
        }
    }
    _advance() {
        const next = this._playlist.shift();
        if (!next) {
            this._current = null;
            if (!this._idle) {
                this._idle = true;
                this.onIdle();
            }
            return;
        }
        this._idle = false;
        this._current = next;
        this._sourceEnded = false;
        this._buffering = true;
        this._spawn(next);
        this.tracksPlayed += 1;
        this.onTrackStart(next);
    }
    _spawn(source) {
        const proc = spawn(this.ffmpegPath, [
            '-hide_banner',
            '-loglevel', 'error',
            '-thread_queue_size', '512',
            ...this._resolveInputArgs(source),
            '-vf', `scale=${this.width}:${this.height}:force_original_aspect_ratio=decrease,pad=${this.width}:${this.height}:(ow-iw)/2:(oh-ih)/2,fps=${this.fps}`,
            '-pix_fmt', 'yuv420p',
            '-f', 'rawvideo',
            '-an',
            'pipe:1'
        ]);
        this._proc = proc;
        proc.stdout.on('data', chunk => this._absorb(chunk));
        proc.stderr.on('data', chunk => {
            process.stderr.write(`[VideoFeeder] ${chunk.toString().trim()}\n`);
        });
        proc.on('exit', code => {
            if (this._proc !== proc) {
                return;
            }
            if (code !== 0 && code !== null) {
                process.stderr.write(`[VideoFeeder] ffmpeg exited with code=${code}\n`);
            }
            this._proc = null;
            this._sourceEnded = true;
        });
    }
    _resolveInputArgs(source = this.source) {
        if (!source || source === 'black') {
            return ['-re', '-f', 'lavfi', '-i', `color=c=black:s=${this.width}x${this.height}:r=${this.fps}`];
        }
        if (source.startsWith('lavfi:')) {
            return ['-re', '-f', 'lavfi', '-i', source.slice('lavfi:'.length)];
        }
        if (/\.(jpe?g|png|webp|bmp|gif)$/i.test(source)) {
            return ['-re', '-loop', '1', '-i', source];
        }
        return ['-re', '-i', source];
    }
    _absorb(chunk) {
        this._pendingParts.push(chunk);
        this._pendingBytes += chunk.length;
        while (this._pendingBytes >= this._frameBytes) {
            if (this._queue.length >= MAX_QUEUED_FRAMES) {
                this._proc?.stdout.pause();
                return;
            }
            this._queue.push(this._takeFrame());
        }
    }
    _takeFrame() {
        const frame = this._pendingParts.length === 1 && this._pendingParts[0].length === this._frameBytes
            ? this._pendingParts.shift()
            : this._takeFromParts();
        this._pendingBytes -= this._frameBytes;
        return frame;
    }
    _takeFromParts() {
        const frame = Buffer.allocUnsafe(this._frameBytes);
        let filled = 0;
        while (filled < this._frameBytes) {
            const part = this._pendingParts[0];
            const take = Math.min(part.length, this._frameBytes - filled);
            part.copy(frame, filled, 0, take);
            filled += take;
            if (take === part.length) {
                this._pendingParts.shift();
            }
            else {
                this._pendingParts[0] = part.subarray(take);
            }
        }
        return frame;
    }
    _schedule() {
        if (!this._running) {
            return;
        }
        if (this._startedAtMs === 0) {
            this._startedAtMs = Date.now();
        }
        const target = this._startedAtMs + this._emitIndex * this._frameIntervalMs;
        const now = Date.now();
        if (now - target > RESYNC_AFTER_MS) {
            this._startedAtMs = now - this._emitIndex * this._frameIntervalMs;
        }
        this._emitTimer = setTimeout(() => {
            this._emitTimer = null;
            this._tick();
        }, Math.max(0, target - now));
    }
    _tick() {
        if (!this._running && !this._proc) {
            return;
        }
        if (this._sourceEnded && !this._queue.length && !this._pendingBytes) {
            this._sourceEnded = false;
            const finished = this._current;
            this._current = null;
            this.onTrackEnd(finished);
            this._advance();
        }
        if (this._buffering) {
            if (this._queue.length < PREBUFFER_FRAMES && this._proc) {
                this._startedAtMs = 0;
                this._emitIndex = 0;
                this._schedule();
                return;
            }
            this._buffering = false;
        }
        const frame = this._queue.shift();
        if (frame) {
            this._lastFrame = frame;
            this.onFrame(frame, this.width, this.height, this.fps);
        }
        else {
            this.underflowFrames += 1;
            if (this._lastFrame) {
                this.onFrame(this._lastFrame, this.width, this.height, this.fps);
            }
            if (this._proc) {
                this.rebuffers += 1;
                this._buffering = true;
            }
        }
        this.framesEmitted += 1;
        this._emitIndex += 1;
        if (this._proc?.stdout.isPaused() && this._queue.length <= RESUME_QUEUE_FRAMES) {
            this._proc.stdout.resume();
        }
        this._schedule();
    }
}
export default VideoFeeder;
