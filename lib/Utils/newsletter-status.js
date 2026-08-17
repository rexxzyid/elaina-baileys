import { proto } from '../../WAProto/index.js'
import { encodeNewsletterMessage, generateMessageIDV2 } from './generics.js'
import { generateWAMessage, normalizeMessageContent } from './messages.js'
import { prepareModernMessageContent } from './modern-messages.js'
import { WAMessageStatus } from '../Types/Message.js'
import { getBinaryNodeChild, getBinaryNodeChildren, S_WHATSAPP_NET } from '../WABinary/index.js'
import { isJidNewsletter } from '../WABinary/jid-utils.js'

const NEWSLETTER_STATUS_MEDIA_TYPES = new Set(['audio', 'gif', 'image', 'video'])
const NEWSLETTER_STATUS_WEB_MEDIA_TYPES = new Set(['image', 'video'])
const NEWSLETTER_STATUS_INTERACTIONS = new Set(['question', 'question_response', 'question_reshare'])
const NEWSLETTER_STATUS_CONTENT_TYPES = new Set(['text', 'media', 'reaction'])
const NEWSLETTER_STATUS_CALLBACK_EVENTS = ['CB:ack', 'CB:status', 'CB:iq', 'CB:notification', 'CB:message']
const NEWSLETTER_STATUS_EDIT_REACTION_REVOKE = '7'
const NEWSLETTER_STATUS_EDIT_ADMIN_REVOKE = '8'
const NEWSLETTER_STATUS_ACK_CLASS = 'status'
const NEWSLETTER_STATUS_ACK_TIMEOUT_MS = 20000

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

const assertMediaType = mediaType => {
    if (mediaType !== undefined && !NEWSLETTER_STATUS_MEDIA_TYPES.has(mediaType)) {
        throw new TypeError(`Unsupported newsletter status media type: ${mediaType}`)
    }
}

const isPresent = value => value !== undefined && value !== null && value !== ''

const toServerId = (value, label) => {
    const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10)
    if (!Number.isFinite(parsed)) throw new TypeError(`${label} must be an integer server id`)
    return String(parsed)
}

const buildMetaNode = ({ interactionType, parentServerId, responseServerId, aiContent }) => {
    assertInteraction(interactionType)

    const attrs = {}
    if (interactionType) {
        attrs.interaction_type = interactionType
        if (interactionType === 'question_reshare') {
            if (!isPresent(parentServerId)) throw new TypeError('question_reshare requires parentServerId')
            if (!isPresent(responseServerId)) throw new TypeError('question_reshare requires responseServerId')
            attrs.parent_server_id = toServerId(parentServerId, 'parentServerId')
            attrs.response_server_id = String(responseServerId)
        }
        else if (interactionType === 'question_response' && isPresent(responseServerId)) {
            attrs.response_server_id = String(responseServerId)
        }
    }

    if (!interactionType && !aiContent) return undefined

    return {
        tag: 'meta',
        attrs,
        content: aiContent ? [{ tag: 'ai_content', attrs: {}, content: undefined }] : undefined
    }
}

export const withNewsletterStatusAttribution = content => ({
    ...content,
    contextInfo: {
        statusAttributions: [{ type: proto.StatusAttribution.Type.NEWSLETTER_STATUS }],
        featureEligibilities: { canBeReshared: true },
        ...(content?.contextInfo || {})
    }
})

const snapshotCallbackNode = (event, node) => ({
    event,
    tag: node?.tag,
    attrs: node?.attrs || {},
    children: Array.isArray(node?.content)
        ? node.content.map(child => ({ tag: child?.tag, attrs: child?.attrs || {} }))
        : []
})

const collectStatusCallbacks = sock => {
    const frames = []
    const listeners = []

    for (const event of NEWSLETTER_STATUS_CALLBACK_EVENTS) {
        const listener = node => {
            if (frames.length >= 40) return
            frames.push(snapshotCallbackNode(event, node))
        }
        sock.ws.on(event, listener)
        listeners.push([event, listener])
    }

    return {
        frames,
        stop: () => {
            for (const [event, listener] of listeners) {
                sock.ws.off(event, listener)
            }
        }
    }
}

const readIntAttr = (attrs, key) => {
    if (!isPresent(attrs?.[key])) return undefined
    const parsed = Number.parseInt(String(attrs[key]), 10)
    return Number.isFinite(parsed) ? parsed : undefined
}

export const parseNewsletterStatusAck = (node, { jid, messageId } = {}) => {
    if (!node || typeof node !== 'object') throw new TypeError('Newsletter status ack node is required')
    if (node.tag !== 'ack') {
        const error = new Error(`Newsletter status expected <ack>, got <${node.tag}>`)
        error.data = node
        throw error
    }

    const attrs = node.attrs || {}
    if (attrs.class !== undefined && attrs.class !== NEWSLETTER_STATUS_ACK_CLASS) {
        const error = new Error(`Newsletter status ack has class "${attrs.class}", expected "${NEWSLETTER_STATUS_ACK_CLASS}"`)
        error.data = node
        throw error
    }
    if (isPresent(messageId) && isPresent(attrs.id) && attrs.id !== messageId) {
        const error = new Error(`Newsletter status ack id mismatch: ${attrs.id} != ${messageId}`)
        error.data = node
        throw error
    }
    if (isPresent(jid) && isPresent(attrs.from) && attrs.from !== jid) {
        const error = new Error(`Newsletter status ack from mismatch: ${attrs.from} != ${jid}`)
        error.data = node
        throw error
    }

    return {
        class: attrs.class,
        from: attrs.from,
        id: attrs.id,
        t: readIntAttr(attrs, 't'),
        serverId: readIntAttr(attrs, 'server_id'),
        edit: attrs.edit,
        error: isPresent(attrs.error) ? String(attrs.error) : undefined,
        applicationError: readIntAttr(attrs, 'application_error'),
        backoff: readIntAttr(attrs, 'backoff'),
        node
    }
}

const assertStatusServerResponse = (response, { jid, messageId, callbacks = [] }) => {
    if (!response) {
        const suffix = callbacks.length
            ? `; callbacks=${JSON.stringify(callbacks)}`
            : '; no ack/status/iq/notification/message callback observed'
        const error = new Error(`Newsletter status server ACK timed out for ${messageId}${suffix}`)
        error.data = { messageId, callbacks }
        throw error
    }

    const ack = parseNewsletterStatusAck(response, { jid, messageId })
    if (ack.error) {
        const details = [
            ack.applicationError !== undefined ? `application_error=${ack.applicationError}` : undefined,
            ack.backoff !== undefined ? `backoff=${ack.backoff}` : undefined
        ].filter(Boolean).join(', ')
        const error = new Error(`Newsletter status rejected by server (${ack.error})${details ? `: ${details}` : ''}`)
        error.data = ack
        throw error
    }

    return ack
}

export const buildNewsletterAdminProfileStatusMessage = message => {
    if (!message || typeof message !== 'object') throw new TypeError('Newsletter status message is required')
    return proto.Message.create({
        newsletterAdminProfileStatusMessage: proto.Message.FutureProofMessage.create({
            message
        })
    })
}

const resolveStatusPayload = ({ message, payload }) => {
    if (payload !== undefined) {
        if (!(payload instanceof Uint8Array)) throw new TypeError('Newsletter status payload must be a Uint8Array')
        return payload
    }
    if (!message || typeof message !== 'object') throw new TypeError('Newsletter status message is required')
    return encodeNewsletterMessage(message)
}

export const buildNewsletterStatusNode = ({
    jid,
    message,
    payload,
    messageId,
    mediaType,
    mediaId,
    mediaHandle,
    parentServerId,
    responseServerId,
    interactionType,
    aiContent
}) => {
    assertNewsletterJid(jid)
    if (!messageId) throw new TypeError('Newsletter status messageId is required')
    assertMediaType(mediaType)
    assertInteraction(interactionType)

    const handle = isPresent(mediaHandle) ? mediaHandle : mediaId
    if (isPresent(handle) && !mediaType) {
        throw new TypeError('mediaId requires a media newsletter status')
    }
    if (mediaType && !isPresent(handle)) {
        throw new TypeError('Native newsletter status media requires the media handle returned by the newsletter upload')
    }
    if (interactionType === 'question_reshare' && !mediaType) {
        throw new TypeError('question_reshare requires media')
    }
    if (interactionType === 'question_response') {
        if (mediaType) throw new TypeError('question_response is published as a text status')
        if (!isPresent(parentServerId)) throw new TypeError('question_response requires parentServerId')
    }

    const attrs = {
        to: jid,
        id: messageId,
        type: mediaType ? 'media' : 'text'
    }
    if (mediaType) attrs.media_id = String(handle)
    if (interactionType === 'question_response') {
        attrs.server_id = toServerId(parentServerId, 'parentServerId')
    }

    const content = [{
        tag: 'plaintext',
        attrs: mediaType ? { mediatype: mediaType } : {},
        content: resolveStatusPayload({ message, payload })
    }]

    const metaNode = buildMetaNode({ interactionType, parentServerId, responseServerId, aiContent })
    if (metaNode) content.push(metaNode)

    return { tag: 'status', attrs, content }
}

export const buildNewsletterStatusReactionNode = ({ jid, messageId, parentServerId, reaction }) => {
    assertNewsletterJid(jid)
    if (!messageId) throw new TypeError('Newsletter status reaction messageId is required')
    if (!isPresent(parentServerId)) {
        throw new TypeError('Newsletter status reaction requires parentServerId')
    }

    const isRevoke = !isPresent(reaction)
    const attrs = {
        to: jid,
        id: messageId,
        server_id: toServerId(parentServerId, 'parentServerId'),
        type: 'reaction'
    }
    if (isRevoke) attrs.edit = NEWSLETTER_STATUS_EDIT_REACTION_REVOKE

    return {
        tag: 'status',
        attrs,
        content: [{
            tag: 'reaction',
            attrs: isRevoke ? {} : { code: reaction },
            content: undefined
        }]
    }
}

export const buildNewsletterStatusRevokeNode = ({ jid, statusId }) => {
    assertNewsletterJid(jid)
    if (!statusId) throw new TypeError('Newsletter status revoke requires the status id')

    return {
        tag: 'status',
        attrs: {
            to: jid,
            id: statusId,
            type: 'text',
            edit: NEWSLETTER_STATUS_EDIT_ADMIN_REVOKE
        },
        content: [{ tag: 'plaintext', attrs: {}, content: undefined }]
    }
}

const sendStatusNode = async (sock, node, { jid, messageId, timeoutMs }) => {
    const diagnostics = collectStatusCallbacks(sock)
    const responsePromise = sock.waitForMessage(messageId, timeoutMs)

    try {
        await sock.sendNode(node)
        const response = await responsePromise
        return assertStatusServerResponse(response, { jid, messageId, callbacks: diagnostics.frames })
    }
    finally {
        diagnostics.stop()
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
        mediaHandle: requestedMediaHandle,
        parentServerId,
        responseServerId,
        interactionType: requestedInteractionType,
        aiContent,
        statusAttribution = true,
        messageId: requestedMessageId,
        ackTimeoutMs,
        transport,
        ...messageOptions
    } = options

    if (transport !== undefined) {
        config.logger?.warn?.({ transport }, 'newsletter status "transport" option is obsolete, the verified status-publish transport is always used')
    }

    let uploadedMediaHandle
    const upload = async (...args) => {
        const result = await sock.waUploadToServer(...args)
        if (args[1]?.newsletter) {
            uploadedMediaHandle = result?.handle ?? result?.media_id ?? result?.mediaId ?? result?.fbid ?? uploadedMediaHandle
        }
        return result
    }

    const preparedContent = prepareModernMessageContent(content)
    const fullMsg = await generateWAMessage(jid, statusAttribution ? withNewsletterStatusAttribution(preparedContent) : preparedContent, {
        logger: config.logger,
        userJid,
        upload,
        mediaCache: config.mediaCache,
        options: config.options,
        ...messageOptions,
        messageId: requestedMessageId || generateMessageIDV2(userJid)
    })

    const normalized = normalizeMessageContent(fullMsg.message)
    const mediaType = getNewsletterStatusMediaType(fullMsg.message)
    if (!mediaType && (normalized?.documentMessage || normalized?.stickerMessage)) {
        throw new TypeError('Native newsletter status supports text, image, video, gif, and audio')
    }
    if (mediaType && !NEWSLETTER_STATUS_WEB_MEDIA_TYPES.has(mediaType)) {
        config.logger?.warn?.({ mediaType }, 'newsletter status media type is not published by WhatsApp Web itself, the server may reject it')
    }

    const interactionType = requestedInteractionType || (content.question ? 'question' : undefined)
    if (interactionType === 'question' && !mediaType) {
        config.logger?.warn?.('WhatsApp Web only publishes question newsletter statuses on top of media, a text question status may be rejected')
    }

    const node = buildNewsletterStatusNode({
        jid,
        message: fullMsg.message,
        messageId: fullMsg.key.id,
        mediaType,
        mediaHandle: requestedMediaHandle ?? mediaId ?? uploadedMediaHandle,
        parentServerId,
        responseServerId,
        interactionType,
        aiContent
    })

    const ack = await sendStatusNode(sock, node, {
        jid,
        messageId: fullMsg.key.id,
        timeoutMs: ackTimeoutMs ?? NEWSLETTER_STATUS_ACK_TIMEOUT_MS
    })

    fullMsg.status = WAMessageStatus.SERVER_ACK
    fullMsg.newsletterStatusServerId = ack.serverId
    fullMsg.newsletterStatusAck = ack
    fullMsg.newsletterStatusResponse = ack.node
    return fullMsg
}

export const makeNewsletterStatusReactionSender = sock => async (jid, parentServerId, reaction, options = {}) => {
    assertNewsletterJid(jid)
    const userJid = sock.authState?.creds?.me?.id
    if (!userJid) throw new TypeError('Not authenticated')

    const messageId = options.messageId || generateMessageIDV2(userJid)
    const node = buildNewsletterStatusReactionNode({ jid, messageId, parentServerId, reaction })
    const ack = await sendStatusNode(sock, node, {
        jid,
        messageId,
        timeoutMs: options.ackTimeoutMs ?? NEWSLETTER_STATUS_ACK_TIMEOUT_MS
    })

    return {
        key: {
            remoteJid: jid,
            fromMe: true,
            id: messageId
        },
        status: WAMessageStatus.SERVER_ACK,
        newsletterStatusServerId: ack.serverId,
        newsletterStatusAck: ack,
        newsletterStatusResponse: ack.node
    }
}

export const makeNewsletterStatusRevokeSender = sock => async (jid, statusId, options = {}) => {
    assertNewsletterJid(jid)
    const userJid = sock.authState?.creds?.me?.id
    if (!userJid) throw new TypeError('Not authenticated')

    const node = buildNewsletterStatusRevokeNode({ jid, statusId })
    const ack = await sendStatusNode(sock, node, {
        jid,
        messageId: statusId,
        timeoutMs: options.ackTimeoutMs ?? NEWSLETTER_STATUS_ACK_TIMEOUT_MS
    })

    return {
        key: {
            remoteJid: jid,
            fromMe: true,
            id: statusId
        },
        status: WAMessageStatus.SERVER_ACK,
        newsletterStatusAck: ack,
        newsletterStatusResponse: ack.node
    }
}

const decodeStatusPayload = plaintext => {
    const bytes = plaintext?.content
    if (!bytes || Array.isArray(bytes)) return undefined
    return proto.Message.decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
}

export const parseNewsletterStatusesResponse = node => {
    const statuses = getBinaryNodeChild(node, 'statuses')
    if (!statuses) {
        const children = Array.isArray(node?.content) ? node.content.map(child => child?.tag) : []
        const error = new Error(`Newsletter statuses response has no <statuses> child, got [${children.join(', ')}]`)
        error.data = node
        throw error
    }

    return {
        jid: statuses.attrs?.jid,
        t: readIntAttr(statuses.attrs, 't'),
        statuses: getBinaryNodeChildren(statuses, 'status').map(status => {
            const plaintext = getBinaryNodeChild(status, 'plaintext')
            const reaction = getBinaryNodeChild(status, 'reaction')
            const meta = getBinaryNodeChild(status, 'meta')
            return {
                id: status.attrs?.id,
                serverId: readIntAttr(status.attrs, 'server_id'),
                t: readIntAttr(status.attrs, 't'),
                isSender: status.attrs?.is_sender === 'true',
                type: status.attrs?.type,
                edit: status.attrs?.edit,
                mediaType: plaintext?.attrs?.mediatype,
                interactionType: meta?.attrs?.interaction_type,
                reaction: reaction ? reaction.attrs?.code ?? '' : undefined,
                message: decodeStatusPayload(plaintext),
                node: status
            }
        })
    }
}

export const makeNewsletterStatusFetcher = sock => async (jid, options = {}) => {
    assertNewsletterJid(jid)

    const { count = 20, before, after, viewRole } = options
    const attrs = { type: 'jid', jid }
    if (isPresent(viewRole)) attrs.view_role = String(viewRole).toLowerCase()
    attrs.count = String(count)
    if (isPresent(before)) attrs.before = toServerId(before, 'before')
    else if (isPresent(after)) attrs.after = toServerId(after, 'after')

    const result = await sock.query({
        tag: 'iq',
        attrs: {
            to: S_WHATSAPP_NET,
            xmlns: 'newsletter',
            type: 'get'
        },
        content: [{ tag: 'statuses', attrs, content: undefined }]
    })

    return parseNewsletterStatusesResponse(result)
}

export { NEWSLETTER_STATUS_CONTENT_TYPES, NEWSLETTER_STATUS_MEDIA_TYPES, NEWSLETTER_STATUS_WEB_MEDIA_TYPES }
