export interface HtmlMultiplayerOptions {
    url: string
    room: string
    seat?: string | number | null
    reconnectMs?: number
    maxReconnectMs?: number
}

export declare function htmlMultiplayerPrelude(options: HtmlMultiplayerOptions): string
export declare function withHtmlMultiplayer(html: string, options: HtmlMultiplayerOptions): string
