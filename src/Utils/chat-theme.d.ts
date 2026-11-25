/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export const CHAT_THEME_COLOR_PRESETS: Readonly<Record<string, string>>;

export function prepareChatThemeMessage(content: string | Buffer | Uint8Array | URL | {
    color?: string;
    wallpaper?: any;
    reset?: boolean;
    colorSchemeId?: string;
    dimLevel?: number;
}, options?: any): Promise<any>;
