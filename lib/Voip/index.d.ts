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
    end(): void;
    mute(muted: boolean): void;
    waitForEnd(): Promise<string>;
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
}
export interface VoipCallOptions {
    durationMs?: number;
    audioSource?: string;
}
export declare class VoipClient {
    constructor(options?: VoipClientOptions);
    connect(): Promise<void>;
    attach(socket: any): Promise<void>;
    call(phoneNumber: string, options?: VoipCallOptions): Promise<ActiveCall>;
    disconnect(): void;
    resetCallState(): void;
}
export declare function makeVoipClient(socket: any, options?: VoipClientOptions): Promise<VoipClient>;
export default VoipClient;
