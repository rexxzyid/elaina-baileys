export declare const AI_RICH_LAYOUTS: readonly string[];
export declare const AI_RICH_PRIMITIVES: readonly string[];

export declare const DividerType: Readonly<{ DOT: 'DOT'; HORIZONTAL_LINE: 'HORIZONTAL_LINE' }>;
export declare const ImagineType: Readonly<{ IMAGINE: 'IMAGINE'; ANIMATE: 'ANIMATE'; MEMU: 'MEMU' }>;
export declare const ImagineStatus: Readonly<{ GENERATING: 'GENERATING'; READY: 'READY'; FAILED: 'FAILED' }>;
export declare const ThinkingIcon: Readonly<{ THINKING: 'THINKING'; WEB_SEARCH: 'WEB_SEARCH'; META_SEARCH: 'META_SEARCH' }>;
export declare const TaskStatus: Readonly<{ PENDING: 'PENDING'; RUNNING: 'RUNNING'; DONE: 'DONE' }>;
export declare const FooterActionType: Readonly<Record<string, string>>;
export declare const AddonActionType: Readonly<Record<string, string>>;

export declare function dividerSection(options?: { dividerType?: string }): any;
export declare function spacerSection(options?: { spacing?: number }): any;
export declare function imageSection(url: string, options?: {
    fallbackUrl?: string;
    previewUrl?: string;
    previewFallbackUrl?: string;
}): any;
export declare function taskSection(options: {
    taskId: string | number;
    title?: string;
    subtitle?: string;
    status?: string;
}): any;
export declare function latexSection(expression: string, options?: {
    image?: string;
    width?: number;
    height?: number;
    fontHeight?: number;
    padding?: number;
}): any;
export declare function thinkingSection(title: string, options?: {
    icon?: string;
    inProgress?: boolean;
    metaSearchApps?: string[];
    targetScreenId?: string;
    targetScreenTabId?: string;
}): any;
export declare function progressSection(title: string, options?: {
    icon?: string;
    inProgress?: boolean;
    metaSearchApps?: string[];
    targetScreenId?: string;
    targetScreenTabId?: string;
}): any;

export declare function decodeAIRich(msg: any): {
    responseId?: string;
    layouts: string[];
    typenames: string[];
    sections: any[];
    submessages: any[];
    unified: any;
} | null;
