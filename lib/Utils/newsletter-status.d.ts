import { proto } from '../../WAProto/index.js'

export type NewsletterStatusMediaType = 'audio' | 'gif' | 'image' | 'video'
export type NewsletterStatusInteractionType = 'question' | 'question_response' | 'question_reshare'
export type NewsletterStatusContentType = 'text' | 'media' | 'reaction'

export interface NewsletterStatusSendOptions {
    messageId?: string
    mediaHandle?: string | number
    mediaId?: string | number
    parentServerId?: string | number
    responseServerId?: string | number
    interactionType?: NewsletterStatusInteractionType
    aiContent?: boolean
    statusAttribution?: boolean
    ackTimeoutMs?: number
    transport?: string
    [key: string]: any
}

export interface NewsletterStatusNodeInput {
    jid: string
    message?: proto.IMessage
    payload?: Uint8Array
    messageId: string
    mediaType?: NewsletterStatusMediaType
    mediaHandle?: string | number
    mediaId?: string | number
    parentServerId?: string | number
    responseServerId?: string | number
    interactionType?: NewsletterStatusInteractionType
    aiContent?: boolean
}

export interface NewsletterStatusReactionNodeInput {
    jid: string
    messageId: string
    parentServerId: string | number
    reaction: string
}

export interface NewsletterStatusRevokeNodeInput {
    jid: string
    statusId: string
}

export interface NewsletterStatusAck {
    class?: string
    from?: string
    id?: string
    t?: number
    serverId?: number
    edit?: string
    error?: string
    applicationError?: number
    backoff?: number
    node: any
}

export interface NewsletterStatusFetchOptions {
    count?: number
    before?: string | number
    after?: string | number
    viewRole?: string
}

export interface NewsletterStatusEntry {
    id?: string
    serverId?: number
    t?: number
    isSender: boolean
    type?: string
    edit?: string
    mediaType?: NewsletterStatusMediaType
    interactionType?: NewsletterStatusInteractionType
    reaction?: string
    message?: proto.Message
    node: any
}

export interface NewsletterStatusList {
    jid?: string
    t?: number
    statuses: NewsletterStatusEntry[]
}

export type NewsletterStatusSendResult = proto.WebMessageInfo & {
    newsletterStatusServerId?: number
    newsletterStatusAck?: NewsletterStatusAck
    newsletterStatusResponse?: any
}

export interface NewsletterStatusStanzaResult {
    key: {
        remoteJid: string
        fromMe: true
        id: string
    }
    status: number
    newsletterStatusServerId?: number
    newsletterStatusAck?: NewsletterStatusAck
    newsletterStatusResponse?: any
}

export function getNewsletterStatusMediaType(message: proto.IMessage): NewsletterStatusMediaType | undefined
export function withNewsletterStatusAttribution<T extends Record<string, any>>(content: T): T
export function parseNewsletterStatusAck(node: any, reference?: { jid?: string, messageId?: string }): NewsletterStatusAck
export function buildNewsletterAdminProfileStatusMessage(message: proto.IMessage): proto.Message
export function buildNewsletterStatusNode(input: NewsletterStatusNodeInput): any
export function buildNewsletterStatusReactionNode(input: NewsletterStatusReactionNodeInput): any
export function buildNewsletterStatusRevokeNode(input: NewsletterStatusRevokeNodeInput): any
export function makeNewsletterStatusSender(sock: any, config: any): (jid: string, content: any, options?: NewsletterStatusSendOptions) => Promise<NewsletterStatusSendResult>
export function makeNewsletterStatusReactionSender(sock: any): (jid: string, parentServerId: string | number, reaction: string, options?: Pick<NewsletterStatusSendOptions, 'messageId' | 'ackTimeoutMs'>) => Promise<NewsletterStatusStanzaResult>
export function makeNewsletterStatusRevokeSender(sock: any): (jid: string, statusId: string, options?: Pick<NewsletterStatusSendOptions, 'ackTimeoutMs'>) => Promise<NewsletterStatusStanzaResult>
export function makeNewsletterStatusFetcher(sock: any): (jid: string, options?: NewsletterStatusFetchOptions) => Promise<NewsletterStatusList>
export function parseNewsletterStatusesResponse(node: any): NewsletterStatusList

export const NEWSLETTER_STATUS_CONTENT_TYPES: Set<NewsletterStatusContentType>
export const NEWSLETTER_STATUS_MEDIA_TYPES: Set<NewsletterStatusMediaType>
export const NEWSLETTER_STATUS_WEB_MEDIA_TYPES: Set<NewsletterStatusMediaType>
