import type { proto } from '../../WAProto/index.js';

export declare const StatusLinkType: Readonly<{
    RASTERIZED_LINK_PREVIEW: 1;
    RASTERIZED_LINK_TRUNCATED: 2;
    RASTERIZED_LINK_FULL_URL: 3;
}>;

export interface StickerArea {
    /** Distance from the left edge, as a fraction of the media width. */
    x: number;
    /** Distance from the top edge, as a fraction of the media height. */
    y: number;
    width: number;
    height: number;
}

export declare const STICKER_DEFAULT_AREA: Readonly<StickerArea>;

export declare function stickerArea(area?: StickerArea): proto.IPoint[];

export declare function locationSticker(options: {
    latitude: number;
    longitude: number;
    name?: string;
    area?: StickerArea | proto.IPoint[];
    skipConfirmation?: boolean;
}): proto.IInteractiveAnnotation;

export declare function channelSticker(options: {
    jid: string;
    name?: string;
    serverMessageId?: number;
    accessibilityText?: string;
    area?: StickerArea | proto.IPoint[];
}): proto.IInteractiveAnnotation;

export declare function linkSticker(options: {
    url: string;
    title?: string;
    area?: StickerArea | proto.IPoint[];
    linkType?: number;
}): proto.IInteractiveAnnotation;

export declare function musicSticker(options: {
    songId?: string;
    title?: string;
    author?: string;
    mediaId?: string;
    artworkDirectPath?: string;
    artworkSha256?: Buffer | string;
    artworkEncSha256?: Buffer | string;
    artworkMediaKey?: Buffer | string;
    artistAttribution?: string;
    countryBlocklist?: Buffer | string;
    isExplicit?: boolean;
    startTimeMs?: number;
    derivedStartTimeMs?: number;
    durationMs?: number;
    area?: StickerArea | proto.IPoint[];
}): proto.IInteractiveAnnotation;

export declare function messageSticker(options: {
    stanzaId?: string;
    message: proto.IMessage;
    area?: StickerArea | proto.IPoint[];
}): proto.IInteractiveAnnotation;

export declare function normalizeStickers(
    stickers: proto.IInteractiveAnnotation | proto.IInteractiveAnnotation[]
): proto.InteractiveAnnotation[];

export interface ReadSticker {
    kind: 'location' | 'channel' | 'link' | 'music' | 'message' | 'unknown';
    area?: StickerArea;
    location?: proto.ILocation;
    channel?: proto.ContextInfo.IForwardedNewsletterMessageInfo;
    link?: { url?: string; title?: string; linkType?: number };
    music?: { songId?: string; title?: string; author?: string };
    message?: proto.IEmbeddedMessage;
    annotation: proto.IInteractiveAnnotation;
}

export declare function readStickers(message: any): ReadSticker[];
