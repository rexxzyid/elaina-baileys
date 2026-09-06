/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export declare class AudioFeeder {
    constructor(sampleRate: number, channels: number, framesPerChunk: number, onChunk: (chunk: Float32Array) => void, source?: string);
    readonly queuedChunks: number;
    droppedChunks: number;
    underflowChunks: number;
    rebuffers: number;
    bytesProduced: number;
    chunksEmitted: number;
    start(): void;
    stop(): void;
}
export default AudioFeeder;
