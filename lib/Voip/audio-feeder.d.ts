/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export declare class AudioFeeder {
    constructor(sampleRate: number, channels: number, framesPerChunk: number, onChunk: (chunk: Float32Array) => void, source?: string, hooks?: {
        onTrackStart?: (track: string) => void;
        onTrackEnd?: (track: string) => void;
        onIdle?: () => void;
    });
    readonly queuedChunks: number;
    droppedChunks: number;
    underflowChunks: number;
    rebuffers: number;
    bytesProduced: number;
    chunksEmitted: number;
    readonly playlistLength: number;
    readonly currentTrack: string | null;
    readonly idle: boolean;
    tracksPlayed: number;
    enqueue(source: string | string[]): number;
    clearPlaylist(): void;
    skip(): boolean;
    start(playlist?: string[]): void;
    stop(): void;
}
export default AudioFeeder;
