export declare const NATIVE_FLOW_NAMES: readonly string[]
export declare const WEB_SUPPORTED_INTERACTIVE_FLOWS: readonly string[]
export declare const NATIVE_FLOW_BUTTON_LIMIT: Readonly<{ quickReply: number; other: number }>
export declare function getNativeFlowNameByButtonName(name: string): string | undefined
export declare function isWebSupportedButtonName(name: string): boolean
export declare function checkNativeFlowButtons(buttons: ({ name?: string } | string)[]): {
    ok: boolean
    limit: number
    problems: string[]
    unsupported: string[]
}
