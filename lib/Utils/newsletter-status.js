import { encodeNewsletterMessage, generateMessageIDV2 } from './generics.js'
import { generateWAMessage, normalizeMessageContent } from './messages.js'
import { prepareModernMessageContent } from './modern-messages.js'
import { isJidNewsletter } from '../WABinary/jid-utils.js'

const NEWSLETTER_STATUS_MEDIA_TYPES = new Set(['audio', 'gif', 'image', 'video'])
const NEWSLETTER_STATUS_INTERACTIONS = new Set(['question', 'question_response', 'question_reshare'])

export const getNewsletterStatusMediaType = message => {
    const content = normalizeMessageContent(message)
    if (content?.imageMessage) return 'image'
    if (content?.videoMessage) return content.videoMessage.gifPlayback ? 'gif' : 'video'
    if (content?.audioMessage) return 'audio'
    return undefined
}

const assertNewsletterJid = jid => {
    if (!isJidNewsletter(jid)) throw new TypeError('Newsletter status target must be a @newsletter JID')
}

const assertInteraction = interactionType => {
    if (interactionType !== undefined && !NEWSLETTER_STATUS_INTERACTIONS.has(interactionType)) {
        throw new TypeError(`Unsupported newsletter status interaction: ${interactionType}`)
    }
}

const buildMetaNode = ({ interactionType, parentServerId, responseServerId, aiContent }) => {
    assertInteraction(interactionType)
    if (aiContent && interactionType) {
        throw new TypeError('aiContent cannot be combined with interactionType until that transport shape is confirmed')
    }
    if (interactionType === 'question_response' && (parentServerId === undefined || parentServerId === null)) {
        throw new TypeError('question_response requires parentServerId')
    }
    if (interactionType === 'question_reshare' && (parentServerId === undefined || parentServerId === null)) {
        throw new TypeError('question_reshare requires parentServerId')
    }

    if (aiContent) {
        return {
            tag: 'meta',
            attrs: {},
            content: [{ tag: 'ai_content', attrs: {}, content: undefined }]
        }
    }
    if (!interactionType) return undefined

    const attrs = { interaction_type: interactionType }
    if (interactionType === 'question_reshare') {
        attrs.parent_server_id = String(parentServerId)
        if (responseServerId !== undefined && responseServerId !== null) {
            attrs.response_server_id = String(responseServerId)
        }
    }

    return {
        tag: 'meta',
        attrs,
        content: undefined
    }
}

const buildEncodedPayloadNode = message => ({
    tag: 'plaintext',
    attrs: {},
    content: encodeNewsletterMessage(message)
})

const buildContentStatusNode = ({ message, mediaType }) => ({
    tag: 'status',
    attrs: {},
    content: [
        {
            tag: 'plaintext',
            attrs: mediaType ? { mediatype: mediaType } : {},
            content: [buildEncodedPayloadNode(message)]
        },
        {
            tag: 'status',
            attrs: { type: mediaType ? 'media' : 'text' },
            content: undefined
        }
    ]
})

export const buildNewsletterStatusNode = ({
    jid,
    message,
    messageId,
    mediaType,
    mediaId,
    parentServerId,
    responseServerId,
    interactionType,
    aiContent
}) => {
    assertNewsletterJid(jid)
    if (!message || typeof message !== 'object') throw new TypeError('Newsletter status message is required')
    if (!messageId) throw new TypeError('Newsletter status messageId is required')
    if (mediaType !== undefined && !NEWSLETTER_STATUS_MEDIA_TYPES.has(mediaType)) {
        throw new TypeError(`Unsupported newsletter status media type: ${mediaType}`)
    }
    if (mediaId !== undefined && mediaId !== null && !mediaType) {
        throw new TypeError('mediaId requires a media newsletter status')
    }
    if (interactionType === 'question_reshare' && !mediaType) {
        throw new TypeError('question_reshare requires media')
    }

    let transportContent = buildContentStatusNode({ message, mediaType })
    if (mediaType) {
        transportContent = {
            tag: 'status',
            attrs: { media_id: String(mediaId ?? messageId) },
            content: [transportContent]
        }
    }

    const statusAttrs = { id: messageId }
    if (parentServerId !== undefined && parentServerId !== null && interactionType !== 'question_reshare') {
        statusAttrs.server_id = String(parentServerId)
    }

    const statusContent = [transportContent]
    const metaNode = buildMetaNode({ interactionType, parentServerId, responseServerId, aiContent })
    if (metaNode) statusContent.push(metaNode)

    return {
        tag: 'status',
        attrs: { to: jid },
        content: [{
            tag: 'status',
            attrs: statusAttrs,
            content: statusContent
        }]
    }
}

export const buildNewsletterStatusReactionNode = ({ jid, messageId, parentServerId, reaction }) => {
    assertNewsletterJid(jid)
    if (!messageId) throw new TypeError('Newsletter status reaction messageId is required')
    if (parentServerId === undefined || parentServerId === null) {
        throw new TypeError('Newsletter status reaction requires parentServerId')
    }

    return {
        tag: 'status',
        attrs: { to: jid },
        content: [{
            tag: 'status',
            attrs: {
                id: messageId,
                server_id: String(parentServerId)
            },
            content: [{
                tag: 'reaction',
                attrs: reaction ? { code: reaction } : {},
                content: undefined
            }]
        }]
    }
}

export const makeNewsletterStatusSender = (sock, config) => async (jid, content, options = {}) => {
    assertNewsletterJid(jid)
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
        throw new TypeError('Newsletter status content must be an object')
    }

    const userJid = sock.authState?.creds?.me?.id
    if (!userJid) throw new TypeError('Not authenticated')

    const {
        mediaId,
        parentServerId,
        responseServerId,
        interactionType: requestedInteractionType,
        aiContent,
        messageId: requestedMessageId,
        ...messageOptions
    } = options
    const preparedContent = prepareModernMessageContent(content)
    const messageId = requestedMessageId || generateMessageIDV2(userJid)
    const fullMsg = await generateWAMessage(jid, preparedContent, {
        logger: config.logger,
        userJid,
        upload: sock.waUploadToServer,
        mediaCache: config.mediaCache,
        options: config.options,
        ...messageOptions,
        messageId
    })
    const normalized = normalizeMessageContent(fullMsg.message)
    const mediaType = getNewsletterStatusMediaType(fullMsg.message)
    if (!mediaType && (normalized?.documentMessage || normalized?.stickerMessage)) {
        throw new TypeError('Native newsletter status supports text, image, video, gif, and audio')
    }

    const interactionType = requestedInteractionType || (content.question ? 'question' : undefined)
    const node = buildNewsletterStatusNode({
        jid,
        message: fullMsg.message,
        messageId: fullMsg.key.id,
        mediaType,
        mediaId,
        parentServerId,
        responseServerId,
        interactionType,
        aiContent
    })

    await sock.sendNode(node)
    return fullMsg
}

export const makeNewsletterStatusReactionSender = sock => async (jid, parentServerId, reaction, options = {}) => {
    assertNewsletterJid(jid)
    const userJid = sock.authState?.creds?.me?.id
    if (!userJid) throw new TypeError('Not authenticated')
    const messageId = options.messageId || generateMessageIDV2(userJid)
    const node = buildNewsletterStatusReactionNode({ jid, messageId, parentServerId, reaction })
    await sock.sendNode(node)
    return {
        key: {
            remoteJid: jid,
            fromMe: true,
            id: messageId
        }
    }
}
