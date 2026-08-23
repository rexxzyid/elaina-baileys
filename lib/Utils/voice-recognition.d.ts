export type VoiceRecognitionContext = {
    message: any;
    audioMessage: any;
    chatJid: string;
    senderJid: string;
    isGroup: boolean;
};
export type VoiceTranscriptionInput = VoiceRecognitionContext & {
    buffer: Buffer;
    mimetype: string;
};
export type VoiceTranscriptionResult = string | {
    text?: string;
    transcript?: string;
    language?: string;
    confidence?: number;
    [key: string]: any;
};
export type VoiceRecognitionOptions = {
    enabled?: boolean;
    transcribe: (input: VoiceTranscriptionInput) => VoiceTranscriptionResult | Promise<VoiceTranscriptionResult>;
    wakePhrases?: string | string[];
    getWakePhrases?: (context: VoiceRecognitionContext) => string | string[] | undefined | Promise<string | string[] | undefined>;
    shouldProcess?: (context: VoiceRecognitionContext) => boolean | Promise<boolean>;
    allowQuotedActivation?: boolean;
    pttOnly?: boolean;
    maxDuration?: number;
    maxBytes?: number;
    downloadOptions?: any;
};
export type VoiceRecognitionEvent = VoiceRecognitionContext & {
    transcript: string;
    commandText: string;
    activation: 'quoted' | 'wake-phrase' | null;
    wakePhrase: string | null;
    language?: string;
    confidence?: number;
    [key: string]: any;
};
export function normalizeVoiceText(value: any): string;
export function matchVoiceWakePhrase(transcript: any, phrases?: string | string[]): {
    phrase: string;
    normalizedPhrase: string;
    normalizedTranscript: string;
} | null;
export function removeVoiceWakePhrase(transcript: any, wakePhrase: any): string;
export function bindVoiceRecognition(sock: any, config?: {
    voiceRecognition?: VoiceRecognitionOptions;
    getMessage?: (key: any) => Promise<any>;
    logger?: any;
}, dependencies?: {
    downloadContentFromMessage?: (...args: any[]) => Promise<any>;
}): () => void;
