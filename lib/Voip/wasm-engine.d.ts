/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export declare class WasmEngine {
    constructor(config?: {
        wasmPath?: string;
        wasmBinary?: Uint8Array | Buffer;
        resourcesPath?: string;
        storageDir?: string;
        loaderCode?: string;
        workerModulesCode?: string;
        enableLogs?: boolean;
        options?: Record<string, unknown>;
        callbacks?: Record<string, unknown>;
    });
    initialize(): Promise<void>;
    isInitialized(): boolean;
    initVoipStack(selfPnJid: string, selfJid: string, selfLidJid: string): void;
    waitForVoipStackReady(): Promise<void>;
    startGroupCall(options: Record<string, unknown>): unknown;
    joinOngoingCall(options: Record<string, unknown>): unknown;
    acceptCall(isMicEnabled?: boolean, isCameraEnabled?: boolean): unknown;
    destroy(): void;
}
export default WasmEngine;
