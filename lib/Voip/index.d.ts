/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { EventEmitter } from 'node:events';
export declare const CallState: Readonly<{
    Idle: 0;
    Calling: 1;
    PreacceptReceived: 2;
    ReceivedCall: 3;
    AcceptSent: 4;
    AcceptReceived: 5;
    Active: 6;
    ActiveElsewhere: 7;
    Ending: 13;
}>;
export declare class ActiveCall extends EventEmitter {
    readonly callId: string;
    readonly state: number;
    groupJid?: string;
    end(): void;
    mute(muted: boolean): void;
    waitForEnd(): Promise<string>;
    play(source: string): boolean;
    playVideo(source: string): boolean;
    enqueueVideo(source: string | string[]): number;
    skipVideo(): boolean;
    queuedVideo(): number;
    nowPlayingVideo(): string | null;
    isVideo(): boolean;
    enqueue(source: string | string[]): number;
    skip(): boolean;
    queued(): number;
    nowPlaying(): string | null;
}
export interface VoipClientOptions {
    socket?: any;
    sock?: any;
    conn?: any;
    logger?: (...args: any[]) => void;
    debug?: boolean;
    wasmPath?: string;
    wasmBinary?: Uint8Array | Buffer;
    resourcesPath?: string;
    storageDir?: string;
    ffmpegPath?: string;
}
export interface VoipCallOptions {
    durationMs?: number;
    audioSource?: string;
    playlist?: string[];
    endWhenQueueEmpty?: boolean;
    idleGraceMs?: number;
    audioStartDelayMs?: number;
    video?: boolean;
    isVideo?: boolean;
    videoSource?: string;
    videoPlaylist?: string[];
}
export interface VoipGroupCallOptions extends VoipCallOptions {
    participants?: string[];
    metadata?: any;
}
export interface VoipCallInvite {
    callId: string;
    callCreatorJid: string;
    groupJid?: string;
    initialPeerJid?: string;
    pnUserJids?: string[];
    lidUserJids?: string[];
    deviceJidsCsv?: string[];
    chatName?: string;
}
export declare class VoipClient {
    constructor(options?: VoipClientOptions);
    connect(): Promise<void>;
    attach(socket: any): Promise<void>;
    call(phoneNumber: string, options?: VoipCallOptions): Promise<ActiveCall>;
    callGroup(groupJid: string, options?: VoipGroupCallOptions): Promise<ActiveCall>;
    joinGroupCall(invite: VoipCallInvite, options?: VoipCallOptions): Promise<ActiveCall>;
    acceptCall(isMicEnabled?: boolean): void;
    disconnect(): void;
    resetCallState(): void;
}
export { VideoFeeder, VIDEO_FORMAT_I420 } from './video-feeder.js';
export { AudioFeeder } from './audio-feeder.js';
export declare function makeVoipClient(socket: any, options?: VoipClientOptions): Promise<VoipClient>;
export default VoipClient;
