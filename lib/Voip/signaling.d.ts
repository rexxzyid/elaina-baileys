/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export declare class SignalingBridge {
    constructor(config: { sock: any; logger?: (...args: any[]) => void; debug?: boolean });
    setSocket(socket: any): void;
    resolveLid(jid: string): Promise<string | null>;
    discoverPeerDevices(jid: string): Promise<string[]>;
    attachEngine(engine: any): void;
    sendSignaling(peerJid: string, callId: string, xmlPayload: any): Promise<any>;
    processIncomingCall(node: any, engine: any, activeCallId: string): void;
    processIncomingReceipt(node: any, engine: any, activeCallId: string): void;
}
export default SignalingBridge;
