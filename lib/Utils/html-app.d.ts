export declare const HTML_APP_MESSAGE_CEILING: number
export declare const HTML_APP_BYTE_BUDGET: number
export declare const HTML_APP_BYTE_LIMIT: number

export declare function wireBytes(html: string): number

export interface HtmlAppReport {
    ok: boolean
    bytes: number
    wireBytes: number
    embeddedBytes: number
    problems: string[]
    warnings: string[]
}

export declare function checkHtmlApp(html: string, options?: {
    height?: number
    maxBytes?: number
}): HtmlAppReport
