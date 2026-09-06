import { proto } from '../../WAProto/index.js'

export declare function makeQuestionMessage(input: {
    text: string
    contextInfo?: proto.IContextInfo
}): proto.IMessage

export declare function makeQuestionResponseMessage(input: {
    key: proto.IMessageKey
    text?: string
}): proto.IMessage

export declare function makeQuestionReplyMessage(input: {
    text: string
    serverQuestionId: number | string
    quotedQuestion?: proto.IMessage
    quotedResponse?: proto.IMessage
    contextInfo?: proto.IContextInfo
}): proto.IMessage

export declare function makeStatusQuestionAnswerMessage(input: {
    key: proto.IMessageKey
    text?: string
}): proto.IMessage

export declare function makeStatusQuotedMessage(input: {
    type?: number | string
    text?: string
    thumbnail?: Uint8Array
    originalStatusId: proto.IMessageKey
}): proto.IMessage

export declare function makeStatusStickerInteractionMessage(input: {
    key: proto.IMessageKey
    stickerKey: string
    type?: number | string
}): proto.IMessage

export declare function makeStatusNotificationMessage(input: {
    responseMessageKey: proto.IMessageKey
    originalMessageKey: proto.IMessageKey
    type?: number | string
}): proto.IMessage

export declare function makeNewsletterAdminInviteMessage(input: {
    newsletterJid: string
    newsletterName?: string
    jpegThumbnail?: Uint8Array
    caption?: string
    inviteExpiration?: number
    contextInfo?: proto.IContextInfo
}): proto.IMessage

export declare function makeNewsletterFollowerInviteMessage(input: {
    newsletterJid: string
    newsletterName?: string
    jpegThumbnail?: Uint8Array
    caption?: string
    contextInfo?: proto.IContextInfo
}): proto.IMessage

export declare function makePollAddOptionMessage(input: {
    pollCreationMessageKey: proto.IMessageKey
    option?: string | proto.Message.PollCreationMessage.IOption
    addOption?: proto.Message.PollCreationMessage.IOption
    metadata?: proto.Message.IPollUpdateMessageMetadata
}): proto.IMessage

export declare function makeCommentMessage(input: {
    message?: proto.IMessage
    content?: Record<string, any>
    targetMessageKey: proto.IMessageKey
}): proto.IMessage

export declare function makeEventInviteMessage(input: {
    eventId: string
    eventTitle?: string
    jpegThumbnail?: Uint8Array
    startTime?: number | Date
    caption?: string
    isCanceled?: boolean
    endTime?: number | Date
    callLink?: string
    contextInfo?: proto.IContextInfo
}): proto.IMessage

export declare function makeScheduledCallCreationMessage(input: {
    scheduledTimestampMs: number | Date
    callType?: number | string
    title?: string
}): proto.IMessage

export declare function makeScheduledCallEditMessage(input: {
    key: proto.IMessageKey
    editType?: number | string
}): proto.IMessage

export declare function makeGroupStatusReactionMessage(input: {
    key: proto.IMessageKey
    text?: string
    groupingKey?: string
    senderTimestampMs?: number
}): proto.IMessage

export declare function makeNewsletterStatusAttribution(input: {
    newsletterJid: string
    messageId: string | number
    duration?: number
    hasMultipleReshares?: boolean
    actionUrl?: string
}): proto.IStatusAttribution

export declare function makeGroupStatusAttribution(input: {
    authorJid: string
    actionUrl?: string
}): proto.IStatusAttribution

export declare const STATUS_AUDIENCE_DEFAULT_LIST_NAME: string
export declare const STATUS_AUDIENCE_DEFAULT_EMOJI: string

export declare function makeStatusAudienceMetadata(input: string | {
    listName?: string
    listEmoji?: string
    audienceType?: number | string
}): proto.ContextInfo.IStatusAudienceMetadata

export declare function prepareModernMessageContent(content: any): any
