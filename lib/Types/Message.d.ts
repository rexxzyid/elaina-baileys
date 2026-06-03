import type { Readable } from 'stream';
import type { URL } from 'url';
import { proto } from '../../WAProto/index.js';
import type { MediaType } from '../Defaults/index.js';
import type { BinaryNode } from '../WABinary/index.js';
import type { GroupMetadata } from './GroupMetadata.js';
import type { CacheStore } from './Socket.js';
export { proto as WAProto };
export type WAMessage = proto.IWebMessageInfo & {
    key: WAMessageKey;
    messageStubParameters?: any;
};
export type WAMessageContent = proto.IMessage;
export type WAContactMessage = proto.Message.IContactMessage;
export type WAContactsArrayMessage = proto.Message.IContactsArrayMessage;
export type WAMessageKey = proto.IMessageKey & {
    remoteJidAlt?: string;
    participantAlt?: string;
    server_id?: string;
    addressingMode?: string;
    isViewOnce?: boolean;
};
export type WATextMessage = proto.Message.IExtendedTextMessage;
export type WAContextInfo = proto.IContextInfo;
export type WALocationMessage = proto.Message.ILocationMessage;
export type WAGenericMediaMessage = proto.Message.IVideoMessage | proto.Message.IImageMessage | proto.Message.IAudioMessage | proto.Message.IDocumentMessage | proto.Message.IStickerMessage;
export declare const WAMessageStubType: typeof proto.WebMessageInfo.StubType;
export declare const WAMessageStatus: typeof proto.WebMessageInfo.Status;
import type { ILogger } from '../Utils/logger.js';
export type WAMediaPayloadURL = {
    url: URL | string;
};
export type WAMediaPayloadStream = {
    stream: Readable;
};
export type WAMediaUpload = Buffer | {
    url: URL | string
} | {
    stream: Readable
} | WAMediaPayloadStream | WAMediaPayloadURL
/** Set of message types that are supported by the library */
export type MessageType = keyof proto.Message;
export declare enum WAMessageAddressingMode {
    PN = "pn",
    LID = "lid"
}
export type MessageWithContextInfo = 'imageMessage' | 'contactMessage' | 'locationMessage' | 'extendedTextMessage' | 'documentMessage' | 'audioMessage' | 'videoMessage' | 'call' | 'contactsArrayMessage' | 'liveLocationMessage' | 'templateMessage' | 'stickerMessage' | 'groupInviteMessage' | 'templateButtonReplyMessage' | 'productMessage' | 'listMessage' | 'orderMessage' | 'listResponseMessage' | 'buttonsMessage' | 'buttonsResponseMessage' | 'interactiveMessage' | 'interactiveResponseMessage' | 'pollCreationMessage' | 'requestPhoneNumberMessage' | 'messageHistoryBundle' | 'eventMessage' | 'newsletterAdminInviteMessage' | 'albumMessage' | 'stickerPackMessage' | 'pollResultSnapshotMessage' | 'messageHistoryNotice';
export type DownloadableMessage = {
    mediaKey?: Uint8Array | null;
    directPath?: string | null;
    url?: string | null;
};
export type MessageReceiptType = 'read' | 'read-self' | 'hist_sync' | 'peer_msg' | 'sender' | 'inactive' | 'played' | undefined;
export type MediaConnInfo = {
    auth: string;
    ttl: number;
    hosts: {
        hostname: string;
        maxContentLengthBytes: number;
    }[];
    fetchDate: Date;
};
export interface Carousel {
    image?: WAMediaUpload
    video?: WAMediaUpload
    product?: WASendableProduct
    title?: string
    body?: string
    footer?: string
    buttons?: proto.Message.InteractiveMessage.NativeFlowMessage.NativeFlowButton[]
}

export interface WAUrlInfo {
    'canonical-url': string;
    'matched-text': string;
    title: string;
    description?: string;
    jpegThumbnail?: Buffer;
    highQualityThumbnail?: proto.Message.IImageMessage;
    originalThumbnailUrl?: string;
}
type Mentionable = {
    /** list of jids that are mentioned in the accompanying text */
    mentions?: string[];
};
type Contextable = {
    /** add contextInfo to the message */
    contextInfo?: proto.IContextInfo;
};
type ViewOnce = {
    viewOnce?: boolean;
};
type Buttonable = {
    /** add buttons to the message  */
    buttons?: proto.Message.ButtonsMessage.IButton[]
}

type Templatable = {
    /** add buttons to the message (conflicts with normal buttons)*/
    templateButtons?: proto.IHydratedTemplateButton[]
    footer?: string
}

type Interactiveable = {
   /** add buttons to the message (conflicts with normal buttons)*/
   interactiveButtons?: proto.Message.InteractiveMessage.NativeFlowMessage.INativeFlowButton[]
   title?: string
   subtitle?: string
   footer?: string
   hasMediaAttachment?: boolean
}

type Shopable = {
   shop?: proto.Message.InteractiveMessage.ShopMessage
   title?: string
   subtitle?: string
   footer?: string
   hasMediaAttachment?: boolean
}

type Collectionable = {
   collection?: proto.Message.InteractiveMessage.CollectionMessage
   title?: string
   subtitle?: string
   footer?: string
   hasMediaAttachment?: boolean
}

type Listable = {
    /** Sections of the List */
    sections?: proto.Message.ListMessage.ISection[]
    /** Title of a List Message only */
    title?: string
    /** Text of the button on the list (required) */
    buttonText?: string
    /** ListType of a List Message only */
    listType?: proto.Message.ListMessage.ListType
}

type Cardsable = {
    cards?: Carousel[]
    title?: string
    subtitle?: string
    footer?: string
}

type Editable = {
    edit?: WAMessageKey;
};
type WithDimensions = {
    width?: number;
    height?: number;
};
export type PollMessageOptions = {
    name: string;
    selectableCount?: number;
    values: string[];
    /** 32 byte message secret to encrypt poll selections */
    messageSecret?: Uint8Array;
    toAnnouncementGroup?: boolean;
};
export type EventMessageOptions = {
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    location?: WALocationMessage;
    call?: 'audio' | 'video';
    isCancelled?: boolean;
    isScheduleCall?: boolean;
    extraGuestsAllowed?: boolean;
    messageSecret?: Uint8Array<ArrayBufferLike>;
};
type SharePhoneNumber = {
    sharePhoneNumber: boolean;
};
type RequestPhoneNumber = {
    requestPhoneNumber: boolean;
};
export type AnyMediaMessageContent = (({
    image: WAMediaUpload
    caption?: string
    jpegThumbnail?: string
} & Mentionable & Contextable & Buttonable & Templatable & Interactiveable & WithDimensions) | ({
    video: WAMediaUpload
    caption?: string
    gifPlayback?: boolean
    jpegThumbnail?: string
} & Mentionable & Contextable & Buttonable & Templatable & Interactiveable & WithDimensions) | {
    audio: WAMediaUpload
    /** if set to true, will send as a `voice note` */
    ptt?: boolean
    /** optionally tell the duration of the audio */
    seconds?: number
} | ({
    sticker: WAMediaUpload
    isAnimated?: boolean
} & WithDimensions) | ({
    document: WAMediaUpload
    mimetype: string
    fileName?: string
    caption?: string
} & Contextable & Buttonable & Templatable & Interactiveable )) & {
    mimetype?: string
} & Editable

export type ButtonReplyInfo = {
    displayText: string
    id: string
    index: number
}
export type GroupInviteInfo = {
    inviteCode: string;
    inviteExpiration: number;
    text: string;
    jid: string;
    subject: string;
};
export type WASendableProduct = Omit<proto.Message.ProductMessage.IProductSnapshot, 'productImage'> & {
    productImage: WAMediaUpload;
};
export type AnyRegularMessageContent = (({
    text: string
    linkPreview?: WAUrlInfo | null
} & Mentionable & Contextable & Buttonable & Templatable & Interactiveable & Shopable & Collectionable & Cardsable & Listable & Editable & WithDimensions) | AnyMediaMessageContent | ({
    poll: PollMessageOptions
} & Mentionable & Contextable & Buttonable & Templatable & Interactiveable & Shopable & Collectionable & Cardsable & Listable & Editable & WithDimensions) | {
    contacts: {
        displayName?: string
        contacts: proto.Message.IContactMessage[]
    }
} | {
    location: WALocationMessage
} | {
    react: proto.Message.IReactionMessage
} | {
    buttonReply: ButtonReplyInfo
    type: 'template' | 'plain' | 'list' | 'interactive'
} | {
     groupInvite: GroupInviteInfo
} | {
     pin: PinInfo
} | {
     keep: KeepInfo
} | {
     call: CallCreationInfo
} | {
     event: WAEventMessage
} | {
     adminInvite: AdminInviteInfo
} | {
     payment: PaymentInfo
} | {
    paymentInvite: {
       type: number 
       expiry: number
    }
} | {
    pollResult: PollResultOptions
} | {
    order: WAOrderMessage
} | {
    product: WASendableProduct
    businessOwnerJid?: string
    body?: string
    footer?: string
} | {
    stickerPack: StickerPack
} | SharePhoneNumber | RequestPhoneNumber) & ViewOnce & ViewOnceExt
export type AnyMessageContent = AnyRegularMessageContent | {
    forward: WAMessage;
    force?: boolean;
} | {
    /** Delete your message or anyone's message in a group (admin required) */
    delete: WAMessageKey;
} | {
    disappearingMessagesInChat: boolean | number;
} | {
    limitSharing: boolean;
};
export type GroupMetadataParticipants = Pick<GroupMetadata, 'participants'>;
type MinimalRelayOptions = {
    /** override the message ID with a custom provided string */
    messageId?: string;
    /** should we use group metadata cache, or fetch afresh from the server; default assumed to be "true" */
    useCachedGroupMetadata?: boolean;
};
export type MessageRelayOptions = MinimalRelayOptions & {
    /** only send to a specific participant; used when a message decryption fails for a single user */
    participant?: {
        jid: string;
        count: number;
    };
    /** additional attributes to add to the WA binary node */
    additionalAttributes?: {
        [_: string]: string;
    };
    additionalNodes?: BinaryNode[];
    /** should we use the devices cache, or fetch afresh from the server; default assumed to be "true" */
    useUserDevicesCache?: boolean;
    /** jid list of participants for status@broadcast */
    statusJidList?: string[];
};
export type MiscMessageGenerationOptions = MinimalRelayOptions & {
    /** optional, if you want to manually set the timestamp of the message */
    timestamp?: Date;
    /** the message you want to quote */
    quoted?: WAMessage;
    /** disappearing messages settings */
    ephemeralExpiration?: number | string;
    /** timeout for media upload to WA server */
    mediaUploadTimeoutMs?: number;
    /** jid list of participants for status@broadcast */
    statusJidList?: string[];
    /** backgroundcolor for status */
    backgroundColor?: string;
    /** font type for status */
    font?: number;
    /** if it is broadcast */
    broadcast?: boolean;
};
export type MessageGenerationOptionsFromContent = MiscMessageGenerationOptions & {
    userJid: string;
};
export type WAMediaUploadFunction = (encFilePath: string, opts: {
    fileEncSha256B64: string;
    mediaType: MediaType;
    timeoutMs?: number;
}) => Promise<{
    mediaUrl: string;
    directPath: string;
    meta_hmac?: string;
    ts?: number;
    fbid?: number;
}>;
export type MediaGenerationOptions = {
    logger?: ILogger;
    mediaTypeOverride?: MediaType;
    upload: WAMediaUploadFunction;
    /** cache media so it does not have to be uploaded again */
    mediaCache?: CacheStore;
    mediaUploadTimeoutMs?: number;
    options?: RequestInit;
    backgroundColor?: string;
    font?: number;
};
export type MessageContentGenerationOptions = MediaGenerationOptions & {
    getUrlInfo?: (text: string) => Promise<WAUrlInfo | undefined>;
    getProfilePicUrl?: (jid: string, type: 'image' | 'preview') => Promise<string | undefined>;
    getCallLink?: (type: 'audio' | 'video', event?: {
        startTime: number;
    }) => Promise<string | undefined>;
    jid?: string;
};
export type MessageGenerationOptions = MessageContentGenerationOptions & MessageGenerationOptionsFromContent;
/**
 * Type of message upsert
 * 1. notify => notify the user, this message was just received
 * 2. append => append the message to the chat history, no notification required
 */
export type MessageUpsertType = 'append' | 'notify';
export type MessageUserReceipt = proto.IUserReceipt;
export type WAMessageUpdate = {
    update: Partial<WAMessage>;
    key: WAMessageKey;
};
export type WAMessageCursor = {
    before: WAMessageKey | undefined;
} | {
    after: WAMessageKey | undefined;
};
export type MessageUserReceiptUpdate = {
    key: WAMessageKey;
    receipt: MessageUserReceipt;
};
export type MediaDecryptionKeyInfo = {
    iv: Buffer;
    cipherKey: Buffer;
    macKey?: Buffer;
};
export type MinimalMessage = Pick<WAMessage, 'key' | 'messageTimestamp'>;
//# sourceMappingURL=Message.d.ts.map
