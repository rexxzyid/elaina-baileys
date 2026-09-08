export declare const BOT_SIGNATURE_VERSION: '1';
export declare const BOT_SIGNATURE_USE_CASE_WA_BOT_MSG: 1;
export declare const BOT_SIGNATURE_ROOT_VERSION: string;
export declare const BOT_SIGNATURE_ROOT_CERTIFICATE: string;

export declare function loadBotSignatureRoot(): import('crypto').X509Certificate;

export declare function constructSignaturePayload(options: {
    botFbid: string;
    messageDigest: Buffer | Uint8Array;
    version?: string;
}): Buffer;

export declare function verifyBotSignature(options: {
    botJid?: string;
    unifiedResponseBytes?: Buffer | Uint8Array;
    proof?: any;
    at?: number;
    root?: import('crypto').X509Certificate;
}): { status: 'passed' | 'failed'; reason?: string };
