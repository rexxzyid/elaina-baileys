import type { proto } from '../../WAProto/index.js'

export declare const SCHEDULED_MSG_META_TYPE: 'scheduled_message'
export declare const SCHEDULED_MSG_MAX_PER_CHAT: number
export declare const SCHEDULED_MSG_MAX_MEDIA: number
export declare const SCHEDULED_MSG_RESOURCE_LIMIT_NACK_CODE: number
export declare const SCHEDULED_MSG_REVEAL_KEY_BYTES: number
export declare const SCHEDULED_MSG_REVEAL_KEY_IV_BYTES: number
export declare const SCHEDULED_MSG_REVEAL_KEY_RETENTION_DAYS: number
export declare const SCHEDULED_MSG_TAG_BYTES: number

export interface ScheduledMessageWindow {
    minSeconds: number
    maxSeconds: number
}

export declare const SCHEDULED_MSG_WINDOW: Readonly<{
    chat: ScheduledMessageWindow
    newsletter: ScheduledMessageWindow
}>

export declare function generateRevealKey(): Buffer
export declare function generateRevealKeyId(): string
export declare function encryptWithRevealKey(plaintext: Uint8Array, revealKey: Uint8Array): {
    encIv: Buffer
    encPayload: Buffer
}
export declare function decryptWithRevealKey(encPayload: Uint8Array, encIv: Uint8Array, revealKey: Uint8Array): Buffer
export declare function buildConditionalRevealMessage(input: {
    encPayload: Uint8Array
    encIv: Uint8Array
    revealKeyId: string
}): { conditionalRevealMessage: proto.Message.IConditionalRevealMessage }
export declare function encodeScheduledMessage(message: proto.IMessage, revealKey?: Uint8Array): {
    revealKey: Uint8Array
    revealKeyId: string
    encIv: Buffer
    encPayload: Buffer
    message: { conditionalRevealMessage: proto.Message.IConditionalRevealMessage }
}
export declare function decodeScheduledMessage(conditionalRevealMessage: any, revealKey: Uint8Array): proto.Message
export declare function buildScheduledMsgMetaNode(input: {
    kind?: 'schedule' | 'reveal'
    scheduledTimestampS?: number
    revealKeyId: string
    revealKey?: Uint8Array
}): any
export declare function buildUnscheduleProtocolMessage(key: proto.IMessageKey): {
    protocolMessage: proto.Message.IProtocolMessage
}
export declare function isScheduledTimeValid(scheduledTimestampS: number, nowSeconds?: number, window?: ScheduledMessageWindow): boolean
