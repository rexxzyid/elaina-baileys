import type { proto } from '../../WAProto/index.js';

export declare const SocialMediaPostType: Readonly<{
    NONE: 0;
    REEL: 1;
    LIVE_VIDEO: 2;
    LONG_VIDEO: 3;
    SINGLE_IMAGE: 4;
    CAROUSEL: 5;
}>;

export declare function videoEndCard(options?: {
    username?: string;
    caption?: string;
    thumbnailUrl?: string;
    profilePictureUrl?: string;
}): proto.Message.IVideoEndCard;

export interface SocialPreviewOptions {
    postType?: number;
    videoUrl?: string;
    videoCaption?: string;
    muted?: boolean;
    /** Seconds, not milliseconds — the client stores link_media_duration_seconds. */
    durationSeconds?: number;
    experimentId?: number;
    music?: proto.IEmbeddedMusic;
    endCards?: proto.Message.IVideoEndCard[];
}

export declare function buildSocialPreview(options?: SocialPreviewOptions): {
    linkPreviewMetadata?: proto.Message.ILinkPreviewMetadata;
    videoContentUrl?: string;
    musicMetadata?: proto.IEmbeddedMusic;
    endCardTiles?: proto.Message.IVideoEndCard[];
};

export declare function readSocialPreview(msg: any): {
    postType?: number;
    durationSeconds?: number;
    muted?: boolean;
    videoUrl?: string;
    videoCaption?: string;
    music?: proto.IEmbeddedMusic;
    experimentId?: number;
    endCards?: proto.Message.IVideoEndCard[];
} | null;
