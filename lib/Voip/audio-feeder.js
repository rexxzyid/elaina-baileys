"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioFeeder = void 0;

const child_process_1 = require("node:child_process");

const LOW_WATERMARK_CHUNKS = 16;
const MAX_QUEUED_CHUNKS = 1024;
const DEFAULT_WARMUP_MS = 500;

class AudioFeeder {
    constructor(sampleRate, channels, framesPerChunk, onChunk, source = "silence") {
        this.sampleRate = sampleRate;
        this.channels = channels;
        this.framesPerChunk = framesPerChunk;
        this.onChunk = onChunk;
        this.source = source;

        this._proc = null;
        this._pending = Buffer.alloc(0);
        this._queue = [];
        this._emitTimer = null;
        this._nextEmitAtMs = 0;
        this._warmupUntilMs = 0;

        this.droppedChunks = 0;
        this.underflowChunks = 0;
        this.bytesProduced = 0;
        this.chunksEmitted = 0;

        this.start = () => {
            if (this._proc) {
                return;
            }

            const chunkSamples = this.framesPerChunk * this.channels;
            const chunkBytes = chunkSamples * Float32Array.BYTES_PER_ELEMENT;
            const chunkIntervalMs = (this.framesPerChunk / this.sampleRate) * 1000;
            const inputArgs = this._resolveInputArgs();

            this._proc = (0, child_process_1.spawn)("ffmpeg", [
                "-hide_banner",
                "-loglevel",
                "error",
                "-thread_queue_size",
                "512",
                ...inputArgs,
                "-f",
                "f32le",
                "-ac",
                String(this.channels),
                "-ar",
                String(this.sampleRate),
                "pipe:1"
            ]);

            this._proc.stdout.on("data", chunk => {
                this._pending = Buffer.concat([this._pending, chunk]);

                while (this._pending.length >= chunkBytes) {
                    if (this._queue.length >= MAX_QUEUED_CHUNKS) {
                        this._proc?.stdout.pause();
                        break;
                    }

                    const frame = this._pending.subarray(0, chunkBytes);
                    this._pending = this._pending.subarray(chunkBytes);

                    const out = new Float32Array(chunkSamples);
                    out.set(new Float32Array(frame.buffer, frame.byteOffset, chunkSamples));

                    this.bytesProduced += chunkBytes;
                    this._queue.push(out);
                }
            });

            this._proc.stderr.on("data", chunk => {
                process.stderr.write(`[AudioFeeder] ${chunk.toString().trim()}\n`);
            });

            this._proc.on("exit", code => {
                if (code !== 0 && code !== null) {
                    process.stderr.write(`[AudioFeeder] ffmpeg exited with code=${code}\n`);
                }

                this._proc = null;
            });

            this._nextEmitAtMs = 0;
            this._warmupUntilMs = Date.now() + DEFAULT_WARMUP_MS;
            this._scheduleNext(chunkSamples, chunkIntervalMs);
        };

        this.stop = () => {
            if (this._emitTimer) {
                clearTimeout(this._emitTimer);
                this._emitTimer = null;
            }

            this._proc?.kill("SIGTERM");
            this._proc = null;
            this._pending = Buffer.alloc(0);
            this._queue = [];
            this._warmupUntilMs = 0;
        };

        this._resolveInputArgs = () => {
            if (!this.source || this.source === "silence") {
                return ["-f", "lavfi", "-i", `aevalsrc=0:d=3600:s=${this.sampleRate}`];
            }

            if (this.source.startsWith("lavfi:")) {
                return ["-f", "lavfi", "-i", this.source.slice("lavfi:".length)];
            }

            return ["-i", this.source];
        };

        this._scheduleNext = (chunkSamples, chunkIntervalMs) => {
            if (!this._proc) {
                return;
            }

            const now = Date.now();

            if (this._nextEmitAtMs === 0) {
                this._nextEmitAtMs = now;
            }

            const delayMs = Math.max(0, this._nextEmitAtMs - now);

            this._emitTimer = setTimeout(() => {
                this._emitTimer = null;

                if (this._queue.length < LOW_WATERMARK_CHUNKS && Date.now() < this._warmupUntilMs) {
                    this._nextEmitAtMs = Date.now() + 10;
                    this._scheduleNext(chunkSamples, chunkIntervalMs);
                    return;
                }

                this._flushOne(chunkSamples);
                this._nextEmitAtMs += chunkIntervalMs;
                this._scheduleNext(chunkSamples, chunkIntervalMs);
            }, delayMs);
        };

        this._flushOne = chunkSamples => {
            let nextChunk = this._queue.shift();

            if (!nextChunk) {
                nextChunk = new Float32Array(chunkSamples);
                this.underflowChunks += 1;
            }

            this.chunksEmitted += 1;
            this.onChunk(nextChunk);

            if (this._proc?.stdout.isPaused() && this._queue.length <= MAX_QUEUED_CHUNKS / 4) {
                this._proc.stdout.resume();
            }
        };
    }
}

exports.AudioFeeder = AudioFeeder;
exports.default = AudioFeeder;