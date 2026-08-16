import { proto } from '../../WAProto/index.js'

export type NewsletterStatusMediaType = 'audio' | 'gif' | 'image' | 'video'
export type NewsletterStatusInteractionType = 'question' | 'question_response' | 'question_reshare'

export interface NewsletterStatusSendOptions {
    messageId?: string
    mediaId?: string | number
    parentServerId?: string | number
    responseServerId?: string | number
    interactionType?: NewsletterStatusInteractionType
    aiContent?: boolean
    [key: string]: any
}

export interface NewsletterStatusNodeInput {
    jid: string
    message: proto.IMessage
    messageId: string
    mediaType?: NewsletterStatusMediaType
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

export function getNewsletterStatusMediaType(message: proto.IMessage): NewsletterStatusMediaType | undefined
export function buildNewsletterStatusNode(input: NewsletterStatusNodeInput): any
export function buildNewsletterStatusReactionNode(input: NewsletterStatusReactionNodeInput): any
export function makeNewsletterStatusSender(sock: any, config: any): (jid: string, content: any, options?: NewsletterStatusSendOptions) => Promise<proto.WebMessageInfo>
export function makeNewsletterStatusReactionSender(sock: any): (jid: string, parentServerId: string | number, reaction: string, options?: Pick<NewsletterStatusSendOptions, 'messageId'>) => Promise<{
    key: {
        remoteJid: string
        fromMe: true
        id: string
    }
}>
