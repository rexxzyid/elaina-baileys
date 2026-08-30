/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { AIRich } from './index.js'

export const AI_RICH_LAYOUTS = Object.freeze([
    'Single',
    'HScroll',
    'ActionRow',
    'VStack',
    'Grid',
    'FlexibleCountGrid',
    'RichListItem',
    'AddonAction'
])

export const AI_RICH_PRIMITIVES = Object.freeze([
    'GenAIMarkdownTextUXPrimitive',
    'GenAICodeUXPrimitive',
    'GenATableUXPrimitive',
    'GenAIMetadataTextPrimitive',
    'GenAISearchResultPrimitive',
    'GenAIReelPrimitive',
    'GenAIPostPrimitive',
    'GenAIProductItemCardPrimitive',
    'GenAIImaginePrimitive',
    'GenAIFollowUpSuggestionPillPrimitive',
    'FOATextPrimitive',
    'FOABloksPrimitive',
    'GenAIImagePrimitive',
    'GenAIDividerPrimitive',
    'GenAISpacerPrimitive',
    'GenAITaskPrimitive',
    'GenAILatexUXPrimitive',
    'GenAIBotThinkingStatusPrimitive',
    'GenAIBotProgressStatusPrimitive',
    'GenAIMetaSubsQuotaUpsellPrimitive'
])

export const AI_RICH_HTML_PRIMITIVE = 'GenAIaeacdsnwHtmlPrimitive'

export const AI_RICH_PRIMITIVES_ANDROID_ONLY = Object.freeze([
    AI_RICH_HTML_PRIMITIVE
])

export const DividerType = Object.freeze({ DOT: 'DOT', HORIZONTAL_LINE: 'HORIZONTAL_LINE' })
export const ImagineType = Object.freeze({ IMAGINE: 'IMAGINE', ANIMATE: 'ANIMATE', MEMU: 'MEMU' })
export const ImagineStatus = Object.freeze({ GENERATING: 'GENERATING', READY: 'READY', FAILED: 'FAILED' })
export const ThinkingIcon = Object.freeze({ THINKING: 'THINKING', WEB_SEARCH: 'WEB_SEARCH', META_SEARCH: 'META_SEARCH' })
export const TaskStatus = Object.freeze({ PENDING: 'PENDING', RUNNING: 'RUNNING', DONE: 'DONE' })
export const FooterActionType = Object.freeze({
    OPEN_FULL_VIEW: 'OPEN_FULL_VIEW',
    DOWNLOAD_MEDIA: 'DOWNLOAD_MEDIA',
    GENERATE_IMAGE: 'GENERATE_IMAGE',
    CANCEL_REASONING: 'CANCEL_REASONING',
    UPGRADE_TO_SUBS: 'UPGRADE_TO_SUBS'
})
export const AddonActionType = Object.freeze({
    COPY_TO_CLIPBOARD: 'COPY_TO_CLIPBOARD',
    SEND_TO_CHAT: 'SEND_TO_CHAT',
    FOLLOW_UP_PROMPT: 'FOLLOW_UP_PROMPT'
})

export const dividerSection = ({ dividerType = DividerType.HORIZONTAL_LINE } = {}) =>
    AIRich.newLayout('Single', {
        divider_type: dividerType,
        __typename: 'GenAIDividerPrimitive'
    })

export const spacerSection = ({ spacing = 1 } = {}) =>
    AIRich.newLayout('Single', {
        spacing,
        __typename: 'GenAISpacerPrimitive'
    })

export const imageSection = (url, { fallbackUrl, previewUrl, previewFallbackUrl } = {}) =>
    AIRich.newLayout('Single', {
        full_image: { url, url_fallback: fallbackUrl ?? '' },
        preview_image: { url: previewUrl ?? url, url_fallback: previewFallbackUrl ?? fallbackUrl ?? '' },
        __typename: 'GenAIImagePrimitive'
    })

export const taskSection = ({ taskId, title = '', subtitle = '', status = TaskStatus.PENDING }) => {
    if (!taskId) {
        throw new TypeError('taskSection requires taskId, an empty id makes WhatsApp drop the item')
    }
    return AIRich.newLayout('Single', {
        task_id: String(taskId),
        title,
        subtitle,
        status,
        __typename: 'GenAITaskPrimitive'
    })
}

export const latexSection = (expression, { image, width = 100, height = 100, fontHeight = 83.333333333333, padding = 15 } = {}) =>
    AIRich.newLayout('Single', {
        latex_expression: expression,
        ...(image
            ? {
                latex_image: { url: image, width, height },
                font_height: fontHeight,
                padding
            }
            : {}),
        __typename: 'GenAILatexUXPrimitive'
    })

const statusSection = (typename) => (title, { icon = ThinkingIcon.THINKING, inProgress = true, metaSearchApps = [], targetScreenId, targetScreenTabId } = {}) =>
    AIRich.newLayout('Single', {
        title,
        icon,
        is_in_progress: inProgress,
        meta_search_apps: metaSearchApps,
        target_secondary_screen_id: targetScreenId,
        target_secondary_screen_tab_id: targetScreenTabId,
        __typename: typename
    })

export const thinkingSection = statusSection('GenAIBotThinkingStatusPrimitive')
export const progressSection = statusSection('GenAIBotProgressStatusPrimitive')

export const htmlSection = (html, { trustedSources = [] } = {}) => {
    if (typeof html !== 'string' || html.trim() === '') {
        throw new TypeError('htmlSection requires a non-empty HTML string')
    }
    if (!Array.isArray(trustedSources)) {
        throw new TypeError('htmlSection trustedSources must be an array of strings')
    }
    return AIRich.newLayout('Single', {
        payload: html,
        trusted_sources: trustedSources.map(String),
        __typename: AI_RICH_HTML_PRIMITIVE
    })
}

export const sendHtmlApp = async (sock, jid, html, { title = '', label, trustedSources, id, ...options } = {}) => {
    if (!sock) {
        throw new TypeError('sendHtmlApp requires a socket as the first argument')
    }
    if (!jid) {
        throw new TypeError('sendHtmlApp requires a target jid')
    }

    const rich = new AIRich(sock)

    if (title) {
        rich.setTitle(title)
    }

    rich._addContent(
        htmlSection(html, { trustedSources }),
        label ? { messageType: 2, messageText: String(label) } : undefined,
        id ? { id } : {}
    )

    return rich.send(jid, options)
}

export const decodeAIRich = (msg) => {
    const message = msg?.message ?? msg
    const rich =
        message?.botForwardedMessage?.message?.richResponseMessage ??
        message?.botForwardedMessage?.richResponseMessage ??
        message?.richResponseMessage

    if (!rich) {
        return null
    }

    let unified = null
    const data = rich.unifiedResponse?.data
    if (data) {
        try {
            unified = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
        }
        catch {
            unified = null
        }
    }

    const sections = Array.isArray(unified?.sections) ? unified.sections : []

    const readPrimitives = (section) => {
        const view = section?.view_model
        if (Array.isArray(view?.primitives)) return view.primitives
        if (view?.primitive) return [view.primitive]
        return []
    }

    return {
        responseId: unified?.response_id,
        layouts: sections.map(section => String(section?.view_model?.__typename ?? '').replace(/^GenAI(.*)LayoutViewModel$/, '$1')),
        typenames: [...new Set(sections.flatMap(section => readPrimitives(section).map(primitive => primitive?.__typename).filter(Boolean)))],
        sections,
        submessages: rich.submessages ?? [],
        unified
    }
}
