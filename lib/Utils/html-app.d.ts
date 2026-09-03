export declare const HTML_APP_BYTE_LIMIT: number

export interface HtmlAppReport {
    ok: boolean
    bytes: number
    embeddedBytes: number
    problems: string[]
    warnings: string[]
}

export declare function checkHtmlApp(html: string, options?: {
    height?: number
    maxBytes?: number
}): HtmlAppReport
