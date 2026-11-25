/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export const CHAT_THEME_COLOR_PRESETS: Readonly<Record<string, string>>;
export const CHAT_THEME_PRESETS: Readonly<Record<string, string>>;
export const CHAT_BUBBLE_PRESETS: Readonly<Record<string, string>>;

export type ChatThemeMedia = string | Buffer | Uint8Array | URL | {
    url: string | URL;
} | {
    stream: any;
};

export type ChatThemeContent = string | Buffer | Uint8Array | URL | {
    theme?: string | ChatThemeMedia;
    bubble?: string;
    color?: string;
    wallpaper?: ChatThemeMedia;
    reset?: boolean;
    colorSchemeId?: string;
    dimLevel?: number;
};

export interface ChatThemeCatalog {
    themes: Readonly<Record<string, string>>;
    bubbles: Readonly<Record<string, string>>;
    usage: string[];
}

export function isChatThemeExample(content: any): boolean;
export function getChatThemeExamples(): ChatThemeCatalog;
export function prepareChatThemeMessages(content: ChatThemeContent, options?: any): Promise<any[]>;
export function prepareChatThemeMessage(content: ChatThemeContent, options?: any): Promise<any>;
