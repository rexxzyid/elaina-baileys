export declare const AI_RICH_LAYOUTS: readonly string[];
export declare const AI_RICH_PRIMITIVES: readonly string[];
export declare const AI_RICH_PRIMITIVES_ANDROID_ONLY: readonly string[];
export declare const AI_RICH_HTML_PRIMITIVE: 'GenAIaeacdsnwHtmlPrimitive';

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
    thoughtDurationSec?: number;
}): any;
export declare function progressSection(title: string, options?: {
    icon?: string;
    inProgress?: boolean;
    metaSearchApps?: string[];
    thoughtDurationSec?: number;
}): any;

export declare function lockHeight(height: number): string;

export declare const AI_RICH_HTML_PRIMITIVE_ANDROID_CLASS: 'FOAHtmlPrimitive';

export declare function htmlSection(html: string, options?: {
    trustedSources?: string[];
    height?: number;
    typename?: string;
}): any;

export declare function sendHtmlApp(sock: any, jid: string, html: string, options?: {
    title?: string;
    label?: string;
    trustedSources?: string[];
    height?: number;
    typename?: string;
    id?: string;
    bypassDownload?: boolean;
    guard?: boolean | 'warn';
    [key: string]: any;
}): Promise<any>;

export declare const HTML_MIME_TYPE: 'text/html';

export declare function sendHtmlDocument(sock: any, jid: string, html: string, options?: {
    fileName?: string;
    caption?: string;
    [key: string]: any;
}): Promise<any>;

export interface FileSectionOptions {
    title?: string;
    fileExtension?: string;
    fileLength?: number;
    pageCount?: number;
    previewImage?: any;
}

export declare function fileSection(url: string, options?: FileSectionOptions): any;
export declare function fileLinkSection(url: string, options?: FileSectionOptions): any;

export interface BotMediaMetadata {
    fileSha256?: string;
    mediaKey?: string;
    fileEncSha256?: string;
    directPath?: string;
    mediaKeyTimestamp?: number;
    mimetype?: string;
}

export declare function botMediaMetadata(documentMessage: any): BotMediaMetadata;

export declare function prepareFileArtifact(sock: any, content: string | Uint8Array, options?: {
    mimetype?: string;
    fileName?: string;
    title?: string;
    id?: string;
}): Promise<{
    mediaId: string;
    media: BotMediaMetadata;
    documentMessage: any;
    section: any;
    mediaDetails: { id: string; previewMedia: BotMediaMetadata; highResMedia: BotMediaMetadata };
}>;

export declare function sendHtmlArtifact(sock: any, jid: string, html: string, options?: {
    fileName?: string;
    title?: string;
    label?: string;
    id?: string;
    bypassDownload?: boolean;
    [key: string]: any;
}): Promise<{ message: any; mediaId: string }>;

export declare const SourceProvider: Readonly<{ UNKNOWN: 0; BING: 1; GOOGLE: 2; SUPPORT: 3; OTHER: 4 }>;

export interface SourceInput {
    url: string;
    title?: string;
    query?: string;
    favicon?: string;
    thumbnail?: string;
    citation?: number;
    provider?: number;
}

export declare function botSourcesMetadata(sources: SourceInput[]): { sources: any[] };

export declare function embeddedScreen(options?: {
    id?: string;
    title?: string;
    content?: any[];
    tabs?: any[];
    header?: any;
    body?: any;
}): any;

export declare function footerActionSection(actionType: string, options?: {
    buttonText?: string;
    actionId?: string;
}): any;

export declare const A2UI_VERSION: 'v0.9';
export declare const A2UI_BASIC_CATALOG: string;
export declare const A2UI_ROOT_ID: 'root';

export interface A2UIComponent {
    id: string;
    component: string;
    [key: string]: any;
}

export declare function a2uiText(id: string, text: string, options?: { variant?: string }): A2UIComponent;
export declare function a2uiImage(id: string, url: string, options?: { variant?: string; fit?: string }): A2UIComponent;
export declare function a2uiColumn(id: string, children?: string[]): A2UIComponent;
export declare function a2uiRow(id: string, children?: string[]): A2UIComponent;

export declare function a2uiSurface(components: A2UIComponent[], options?: {
    surfaceId?: string;
    catalogId?: string;
    sendDataModel?: boolean;
    version?: string;
}): any;

export declare function a2uiWidget(components: A2UIComponent[], options?: {
    uuid?: string;
    surfaceId?: string;
    catalogId?: string;
    sendDataModel?: boolean;
    version?: string;
    fallback?: string;
}): BloksWidget;

export declare function sendA2UI(sock: any, jid: string, components: A2UIComponent[], options?: {
    buttons?: any[];
    contextInfo?: any;
    uuid?: string;
    surfaceId?: string;
    catalogId?: string;
    sendDataModel?: boolean;
    fallback?: string;
    messageId?: string;
    additionalNodes?: any[];
    [key: string]: any;
}): Promise<any>;

export declare const BLOKS_A2UI_TYPE: 'im_a2ui';
export declare const BLOKS_A2UI_REPLY_ACTION: 'a2ui_reply_action';
export declare const BLOKS_A2UI_SUPPORTED_ELEMENTS: readonly string[];

export interface BloksWidget {
    type: string;
    data: string;
    uuid: string;
    fallback: string;
}

export declare function bloksSection(type: string, data?: string | Record<string, any>, options?: {
    uuid?: string;
    initialResponse?: string;
    versioningId?: string;
}): any;

export declare function bloksWidget(options: {
    type: string;
    data?: string | Record<string, any>;
    uuid?: string;
    fallback?: string;
}): BloksWidget;

export declare function sendBloksWidget(sock: any, jid: string, options: {
    type: string;
    data?: string | Record<string, any>;
    uuid?: string;
    fallback?: string;
    body?: string;
    contextInfo?: any;
    messageId?: string;
    additionalNodes?: any[];
    [key: string]: any;
}): Promise<any>;

export declare function decodeBloksWidget(msg: any): (BloksWidget & { params: any }) | null;

export interface RichMessageRead {
    kind: 'airich' | 'a2ui' | 'bloks' | 'interactive';
    text: string;
    title: string;
    buttons: { name: string; params: any }[];
    html: string[];
    typenames: string[];
    sections: any[];
    footerSections: any[];
    embeddedScreens: any[];
    submessages: any[];
    responseId?: string;
    a2ui?: { surfaceId: string; catalogId: string; version: string; components: A2UIComponent[] };
    bloks?: { type: string; uuid: string; fallback: string; params: any };
}

export declare function readRichMessage(msg: any): RichMessageRead | null;

export declare function decodeAIRich(msg: any): {
    responseId?: string;
    layouts: string[];
    typenames: string[];
    footerTypenames: string[];
    sections: any[];
    footerSections: any[];
    embeddedScreens: any[];
    submessages: any[];
    unified: any;
} | null;
