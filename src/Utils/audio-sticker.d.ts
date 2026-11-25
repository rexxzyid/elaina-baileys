/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export function prepareAudioStickerMessage(content: {
    sticker?: any;
    image?: any;
    video?: any;
    audio?: any;
    audioUrl?: any;
    stickerOptions?: Record<string, any>;
    audioOptions?: Record<string, any>;
}, options?: any): Promise<{
    audioStickerMessage: {
        message: any;
    };
}>;
