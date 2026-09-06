/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { spawn } from 'node:child_process';
const PREBUFFER_CHUNKS = 12;
const REBUFFER_CHUNKS = 6;
const MAX_QUEUED_CHUNKS = 1024;
const RESUME_QUEUE_CHUNKS = 256;
const RESYNC_AFTER_MS = 250;
export class AudioFeeder {
    constructor(sampleRate, channels, framesPerChunk, onChunk, source = 'silence') {
        this.sampleRate = sampleRate;
        this.channels = channels;
        this.framesPerChunk = framesPerChunk;
        this.onChunk = onChunk;
        this.source = source;
        this.droppedChunks = 0;
        this.underflowChunks = 0;
        this.bytesProduced = 0;
        this.chunksEmitted = 0;
        this.rebuffers = 0;
        this._proc = null;
        this._pendingParts = [];
        this._pendingBytes = 0;
        this._queue = [];
        this._emitTimer = null;
        this._startedAtMs = 0;
        this._emitIndex = 0;
        this._buffering = true;
        this._ended = false;
        this._chunkSamples = this.framesPerChunk * this.channels;
        this._chunkBytes = this._chunkSamples * Float32Array.BYTES_PER_ELEMENT;
        this._chunkIntervalMs = (this.framesPerChunk / this.sampleRate) * 1000;
    }
    get queuedChunks() {
        return this._queue.length;
    }
    start() {
        if (this._proc) {
            return;
        }
        this._ended = false;
        this._buffering = true;
        this._emitIndex = 0;
        this._startedAtMs = 0;
        this._proc = spawn('ffmpeg', [
            '-hide_banner',
            '-loglevel', 'error',
            '-thread_queue_size', '512',
            ...this._resolveInputArgs(),
            '-f', 'f32le',
            '-ac', String(this.channels),
            '-ar', String(this.sampleRate),
            'pipe:1'
        ]);
        this._proc.stdout.on('data', chunk => this._absorb(chunk));
        this._proc.stderr.on('data', chunk => {
            process.stderr.write(`[AudioFeeder] ${chunk.toString().trim()}\n`);
        });
        this._proc.on('exit', code => {
            if (code !== 0 && code !== null) {
                process.stderr.write(`[AudioFeeder] ffmpeg exited with code=${code}\n`);
            }
            this._proc = null;
        });
        this._schedule();
    }
    stop() {
        this._ended = true;
        if (this._emitTimer) {
            clearTimeout(this._emitTimer);
            this._emitTimer = null;
        }
        this._proc?.kill('SIGTERM');
        this._proc = null;
        this._pendingParts = [];
        this._pendingBytes = 0;
        this._queue = [];
        this._buffering = true;
    }
    _resolveInputArgs() {
        if (!this.source || this.source === 'silence') {
            return ['-re', '-f', 'lavfi', '-i', `aevalsrc=0:d=3600:s=${this.sampleRate}`];
        }
        if (this.source.startsWith('lavfi:')) {
            return ['-re', '-f', 'lavfi', '-i', this.source.slice('lavfi:'.length)];
        }
        return ['-re', '-i', this.source];
    }
    _absorb(chunk) {
        this._pendingParts.push(chunk);
        this._pendingBytes += chunk.length;
        while (this._pendingBytes >= this._chunkBytes) {
            if (this._queue.length >= MAX_QUEUED_CHUNKS) {
                this._proc?.stdout.pause();
                return;
            }
            this._queue.push(this._takeChunk());
        }
    }
    _takeChunk() {
        const frame = this._pendingParts.length === 1 && this._pendingParts[0].length === this._chunkBytes
            ? this._pendingParts.shift()
            : this._takeFromParts();
        this._pendingBytes -= this._chunkBytes;
        this.bytesProduced += this._chunkBytes;
        const out = new Float32Array(this._chunkSamples);
        out.set(new Float32Array(frame.buffer, frame.byteOffset, this._chunkSamples));
        return out;
    }
    _takeFromParts() {
        const frame = Buffer.allocUnsafe(this._chunkBytes);
        let filled = 0;
        while (filled < this._chunkBytes) {
            const part = this._pendingParts[0];
            const take = Math.min(part.length, this._chunkBytes - filled);
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
        if (this._ended) {
            return;
        }
        if (this._startedAtMs === 0) {
            this._startedAtMs = Date.now();
        }
        const target = this._startedAtMs + this._emitIndex * this._chunkIntervalMs;
        const now = Date.now();
        if (now - target > RESYNC_AFTER_MS) {
            this._startedAtMs = now - this._emitIndex * this._chunkIntervalMs;
        }
        this._emitTimer = setTimeout(() => {
            this._emitTimer = null;
            this._tick();
        }, Math.max(0, target - now));
    }
    _tick() {
        if (this._ended) {
            return;
        }
        if (this._buffering) {
            if (this._queue.length < PREBUFFER_CHUNKS && this._proc) {
                this._startedAtMs = 0;
                this._emitIndex = 0;
                this._schedule();
                return;
            }
            this._buffering = false;
        }
        const chunk = this._queue.shift();
        if (chunk) {
            this.onChunk(chunk);
        }
        else {
            this.underflowChunks += 1;
            this.onChunk(new Float32Array(this._chunkSamples));
            if (this._proc) {
                this.rebuffers += 1;
                this._buffering = true;
            }
        }
        this.chunksEmitted += 1;
        this._emitIndex += 1;
        if (this._buffering && this._queue.length >= REBUFFER_CHUNKS) {
            this._buffering = false;
        }
        if (this._proc?.stdout.isPaused() && this._queue.length <= RESUME_QUEUE_CHUNKS) {
            this._proc.stdout.resume();
        }
        this._schedule();
    }
}
export default AudioFeeder;
