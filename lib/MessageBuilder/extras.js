/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { randomUUID } from 'crypto'
import { AIRich } from './index.js'
import { extractMessageContent, generateWAMessageFromContent, prepareWAMessageMedia } from '../Utils/messages.js'
import { checkHtmlApp } from '../Utils/html-app.js'

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
export const AI_RICH_HTML_PRIMITIVE_ANDROID_CLASS = 'FOAHtmlPrimitive'

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

const trimEmpty = (object) => {
    for (const key of Object.keys(object)) {
        if (object[key] === undefined) {
            delete object[key]
        }
    }
    return object
}

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

const statusSection = (typename) => (title, { icon = ThinkingIcon.THINKING, inProgress = true, metaSearchApps = [], thoughtDurationSec } = {}) =>
    AIRich.newLayout('Single', trimEmpty({
        title,
        icon,
        is_in_progress: inProgress,
        meta_search_apps: metaSearchApps,
        thought_duration_sec: thoughtDurationSec === undefined ? undefined : Number(thoughtDurationSec),
        __typename: typename
    }))

export const thinkingSection = statusSection('GenAIBotThinkingStatusPrimitive')
export const progressSection = statusSection('GenAIBotProgressStatusPrimitive')

export const lockHeight = (height) => {
    const px = Number(height)
    if (!Number.isFinite(px) || px <= 0) {
        throw new TypeError('height must be a positive number of pixels')
    }
    return '<style>html,body{margin:0;padding:0;height:' + px + 'px;max-height:' + px + 'px;overflow:hidden}'
        + '#__wrap{height:' + px + 'px;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y}</style>'
        + '<script>document.addEventListener("DOMContentLoaded",function(){'
        + 'var w=document.createElement("div");w.id="__wrap";'
        + 'while(document.body.firstChild)w.appendChild(document.body.firstChild);'
        + 'document.body.appendChild(w)});<' + '/script>'
}

export const HTML_APP_BRIDGE = 'AndroidBridge'

export const dataUri = (bytes, mimetype) => {
    if (typeof mimetype !== 'string' || !mimetype.includes('/')) {
        throw new TypeError('dataUri needs a mimetype like video/mp4')
    }
    const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
    if (!buffer.length) {
        throw new TypeError('dataUri needs a non-empty buffer')
    }
    return 'data:' + mimetype + ';base64,' + buffer.toString('base64')
}

const MEDIA_TAGS = new Set(['video', 'audio', 'img'])

export const htmlMedia = (bytes, { mimetype, tag = 'video', label = 'Tap untuk memuat media', poster, id = 'm' + randomUUID().slice(0, 8), attributes = '' } = {}) => {
    if (!MEDIA_TAGS.has(tag)) {
        throw new TypeError('htmlMedia tag must be one of ' + [...MEDIA_TAGS].join(', '))
    }
    if (typeof id !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(id)) {
        throw new TypeError('htmlMedia id must start with a letter and stay alphanumeric')
    }

    const uri = dataUri(bytes, mimetype)
    const controls = tag === 'img' ? '' : ' controls preload="none" playsinline'
    const cover = poster && tag === 'video' ? ' poster="' + String(poster).replace(/"/g, '&quot;') + '"' : ''
    const json = JSON.stringify(uri).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

    return '<' + tag + ' id="' + id + '"' + controls + cover + (attributes ? ' ' + attributes : '') + '></' + tag + '>'
        + '<button id="' + id + '_go" type="button">' + String(label).replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c]) + '</button>'
        + '<script>(function(){'
        + 'var src=' + json + ',el=document.getElementById(' + JSON.stringify(id) + '),go=document.getElementById(' + JSON.stringify(id + '_go') + ');'
        + 'go.addEventListener("click",function(){'
        + 'if(el.src)return;el.src=src;go.disabled=true;go.textContent="\\u2713";'
        + 'if(el.play)el.play().catch(function(){})});'
        + '})();<' + '/script>'
}

export const autoHeight = ({ min = 60, max = 900, settleMs = 120, maxReports = 24 } = {}) => {
    const low = Number(min)
    const high = Number(max)
    const wait = Number(settleMs)
    const cap = Number(maxReports)
    if (!Number.isFinite(low) || low <= 0) {
        throw new TypeError('autoHeight min must be a positive number of pixels')
    }
    if (!Number.isFinite(high) || high <= low) {
        throw new TypeError('autoHeight max must be greater than min')
    }
    if (!Number.isFinite(wait) || wait < 0) {
        throw new TypeError('autoHeight settleMs must not be negative')
    }
    if (!Number.isFinite(cap) || cap < 1) {
        throw new TypeError('autoHeight maxReports must be at least 1')
    }
    return '<style>html,body{margin:0;padding:0}</style>'
        + '<script>(function(){'
        + 'var LOW=' + low + ',HIGH=' + high + ',WAIT=' + wait + ',CAP=' + cap + ';'
        + 'var sent=[],timer=null,stopped=false;'
        + 'function measure(){var d=document.documentElement,b=document.body;'
        + 'var h=Math.max(d?d.scrollHeight:0,b?b.scrollHeight:0,b?b.offsetHeight:0);'
        + 'return Math.min(HIGH,Math.max(LOW,Math.ceil(h)))}'
        + 'function report(){if(stopped)return;var h=measure();'
        + 'if(sent.length&&sent[sent.length-1]===h)return;'
        + 'if(sent.length>=2&&sent[sent.length-2]===h){stopped=true;return}'
        + 'sent.push(h);if(sent.length>=CAP)stopped=true;'
        + 'try{window.AndroidBridge.updateSize(h)}catch(e){stopped=true}}'
        + 'function schedule(){if(stopped)return;'
        + 'if(timer!==null)clearTimeout(timer);timer=setTimeout(function(){timer=null;report()},WAIT)}'
        + 'function start(){report();'
        + 'if(typeof ResizeObserver==="function"&&document.body){'
        + 'try{new ResizeObserver(schedule).observe(document.body)}catch(e){}}'
        + 'addEventListener("load",schedule)}'
        + 'if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();'
        + '})();<' + '/script>'
}

export const htmlSection = (html, { trustedSources = [], height, typename = AI_RICH_HTML_PRIMITIVE } = {}) => {
    if (typeof html !== 'string' || html.trim() === '') {
        throw new TypeError('htmlSection requires a non-empty HTML string')
    }
    if (!Array.isArray(trustedSources)) {
        throw new TypeError('htmlSection trustedSources must be an array of strings')
    }
    if (typeof typename !== 'string' || typename.trim() === '') {
        throw new TypeError('htmlSection typename must be a non-empty string')
    }
    return AIRich.newLayout('Single', {
        payload: height === undefined ? html : lockHeight(height) + html,
        trusted_sources: trustedSources.map(String),
        __typename: typename
    })
}

export const sendHtmlApp = async (sock, jid, html, { title = '', label, trustedSources, height, autoHeight: auto, typename, id, bypassDownload = false, guard = 'warn', ...options } = {}) => {
    if (!sock) {
        throw new TypeError('sendHtmlApp requires a socket as the first argument')
    }
    if (!jid) {
        throw new TypeError('sendHtmlApp requires a target jid')
    }
    if (auto && height !== undefined) {
        throw new TypeError('sendHtmlApp takes either height or autoHeight, not both')
    }

    if (auto) {
        html = autoHeight(auto === true ? undefined : auto) + html
    }

    if (guard !== false) {
        const report = checkHtmlApp(html, { height })
        if (!report.ok && guard === true) {
            throw new TypeError('this html app will not behave in the WebView:\n  ' + report.problems.join('\n  '))
        }
        if (guard === 'warn') {
            for (const problem of report.problems) {
                sock.logger?.warn({ jid }, 'html app: ' + problem)
            }
            for (const warning of report.warnings) {
                sock.logger?.warn({ jid }, 'html app: ' + warning)
            }
        }
    }

    const rich = new AIRich(sock)

    if (title) {
        rich.setTitle(title)
    }

    rich._addContent(
        htmlSection(html, { trustedSources, height, ...(typename ? { typename } : {}) }),
        label ? { messageType: 2, messageText: String(label) } : undefined,
        id ? { id } : {}
    )

    return rich.send(jid, { bypassDownload, ...options })
}

export const HTML_MIME_TYPE = 'text/html'

export const sendHtmlDocument = async (sock, jid, html, { fileName = 'app.html', caption, ...options } = {}) => {
    if (!sock) {
        throw new TypeError('sendHtmlDocument requires a socket as the first argument')
    }
    if (!jid) {
        throw new TypeError('sendHtmlDocument requires a target jid')
    }
    if (typeof html !== 'string' || html.trim() === '') {
        throw new TypeError('sendHtmlDocument requires a non-empty HTML string')
    }
    const name = String(fileName)
    if (!/\.html?$/i.test(name)) {
        throw new TypeError('sendHtmlDocument fileName must end with .html or .htm')
    }
    return sock.sendMessage(jid, {
        document: Buffer.from(html, 'utf-8'),
        mimetype: HTML_MIME_TYPE,
        fileName: name,
        ...(caption ? { caption: String(caption) } : {}),
        ...options
    })
}

const fileArtifact = (typename) => (url, { title = '', fileExtension = 'html', fileLength = 0, pageCount, previewImage } = {}) => {
    if (typeof url !== 'string' || url.trim() === '') {
        throw new TypeError('a file section requires a non-empty url')
    }
    return AIRich.newLayout('Single', trimEmpty({
        title: String(title),
        url,
        file_extension: String(fileExtension).replace(/^\./, ''),
        file_length: Number(fileLength) || 0,
        page_count: pageCount === undefined ? undefined : Number(pageCount) || 0,
        preview_image: previewImage,
        __typename: typename
    }))
}

export const fileSection = fileArtifact('GenAIFilePrimitive')
export const fileLinkSection = fileArtifact('GenAIFileLinkPrimitive')

const b64 = (value) => (value === undefined || value === null ? undefined : Buffer.isBuffer(value) || value instanceof Uint8Array ? Buffer.from(value).toString('base64') : String(value))

export const botMediaMetadata = (documentMessage) => {
    if (!documentMessage) {
        throw new TypeError('botMediaMetadata requires a prepared document message')
    }
    return trimEmpty({
        fileSha256: b64(documentMessage.fileSha256),
        mediaKey: b64(documentMessage.mediaKey),
        fileEncSha256: b64(documentMessage.fileEncSha256),
        directPath: documentMessage.directPath,
        mediaKeyTimestamp: documentMessage.mediaKeyTimestamp ? Number(documentMessage.mediaKeyTimestamp) : undefined,
        mimetype: documentMessage.mimetype
    })
}

export const prepareFileArtifact = async (sock, content, { mimetype = HTML_MIME_TYPE, fileName = 'app.html', title, id } = {}) => {
    if (!sock) {
        throw new TypeError('prepareFileArtifact requires a socket as the first argument')
    }
    const body = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content
    if (!Buffer.isBuffer(body) && !(body instanceof Uint8Array)) {
        throw new TypeError('prepareFileArtifact content must be a string or a buffer')
    }

    const prepared = await prepareWAMessageMedia(
        { document: Buffer.from(body), mimetype, fileName },
        { upload: sock.waUploadToServer }
    )
    const documentMessage = prepared.documentMessage
    const media = botMediaMetadata(documentMessage)
    const mediaId = id ?? randomUUID()

    return {
        mediaId,
        media,
        documentMessage,
        section: AIRich.newLayout('Single', {
            title: String(title || fileName),
            url: documentMessage.url ?? '',
            file_extension: fileName.includes('.') ? fileName.split('.').pop() : '',
            file_length: Number(documentMessage.fileLength) || 0,
            preview_image: {
                media_id: mediaId,
                mime_type: mimetype,
                url: documentMessage.url ?? '',
                url_fallback: ''
            },
            __typename: 'GenAIFilePrimitive'
        }),
        mediaDetails: { id: mediaId, previewMedia: media, highResMedia: media }
    }
}

export const sendHtmlArtifact = async (sock, jid, html, { fileName = 'app.html', title, label, id, bypassDownload = false, ...options } = {}) => {
    if (!jid) {
        throw new TypeError('sendHtmlArtifact requires a target jid')
    }

    const artifact = await prepareFileArtifact(sock, html, { mimetype: HTML_MIME_TYPE, fileName, title, id })
    const rich = new AIRich(sock)

    if (title) {
        rich.setTitle(title)
    }
    rich.setBotMetadata({ unifiedResponseMutation: { mediaDetailsMetadataList: [artifact.mediaDetails] } })
    rich._addContent(
        artifact.section,
        label ? { messageType: 2, messageText: String(label) } : undefined,
        {}
    )

    const message = await rich.send(jid, { bypassDownload, ...options })
    return { message, mediaId: artifact.mediaId }
}

export const SourceProvider = Object.freeze({ UNKNOWN: 0, BING: 1, GOOGLE: 2, SUPPORT: 3, OTHER: 4 })

export const botSourcesMetadata = (sources) => {
    if (!Array.isArray(sources) || sources.length === 0) {
        throw new TypeError('botSourcesMetadata requires a non-empty array of sources')
    }
    return {
        sources: sources.map((source, index) => {
            if (!source || typeof source !== 'object' || Array.isArray(source)) {
                throw new TypeError('each source must be a plain object')
            }
            if (!source.url) {
                throw new TypeError('each source requires a url')
            }
            return trimEmpty({
                provider: source.provider ?? SourceProvider.OTHER,
                sourceProviderUrl: String(source.url),
                sourceTitle: source.title === undefined ? undefined : String(source.title),
                sourceQuery: source.query === undefined ? undefined : String(source.query),
                faviconCdnUrl: source.favicon === undefined ? undefined : String(source.favicon),
                thumbnailCdnUrl: source.thumbnail === undefined ? undefined : String(source.thumbnail),
                citationNumber: source.citation === undefined ? index + 1 : Number(source.citation)
            })
        })
    }
}

export const EMBEDDED_SCREEN_PRESENTATION = Object.freeze({
    HALF_HEIGHT: 'HALF_HEIGHT',
    FULL_HEIGHT: 'FULL_HEIGHT'
})

export const embeddedTab = ({ id, header, sections = [] } = {}) => {
    if (!Array.isArray(sections)) {
        throw new TypeError('embeddedTab sections must be an array of sections')
    }
    return trimEmpty({ id: id ?? randomUUID(), header, sections })
}

export const embeddedScreen = ({ id, content, tabs, header, body, title } = {}) => {
    if (title !== undefined) {
        throw new TypeError('embeddedScreen has no title — the client reads header, and title was never a key it parses')
    }
    if (content !== undefined && !Array.isArray(content)) {
        throw new TypeError('embeddedScreen content must be an array of sections')
    }
    if (tabs !== undefined && !Array.isArray(tabs)) {
        throw new TypeError('embeddedScreen tabs must be an array of tabs')
    }
    return trimEmpty({
        id: id ?? randomUUID(),
        content,
        tabs,
        header,
        body
    })
}

export const footerActionSection = (actionType, { buttonText = '', actionId } = {}) => {
    if (!Object.values(FooterActionType).includes(actionType)) {
        throw new TypeError('footerActionSection actionType must be one of ' + Object.values(FooterActionType).join(', '))
    }
    return AIRich.newLayout('Single', {
        action_type: actionType,
        action_id: actionId ?? randomUUID(),
        button_text: String(buttonText),
        __typename: 'GenAIFooterActionPrimitive'
    })
}

export const BLOKS_A2UI_TYPE = 'im_a2ui'
export const BLOKS_A2UI_REPLY_ACTION = 'a2ui_reply_action'
export const BLOKS_A2UI_SUPPORTED_ELEMENTS = Object.freeze(['info_card', 'list_card'])

const bloksPayloadData = (data) => {
    if (data === undefined || data === null) {
        return ''
    }
    if (typeof data === 'string') {
        return data
    }
    if (typeof data !== 'object' || Array.isArray(data)) {
        throw new TypeError('bloks data must be a JSON string or a plain object')
    }
    return JSON.stringify(data)
}

const bloksType = (type, caller) => {
    if (typeof type !== 'string' || type.trim() === '') {
        throw new TypeError(caller + ' requires a non-empty bloks type')
    }
    return type
}

export const bloksSection = (type, data, { uuid, initialResponse = '', versioningId = '' } = {}) =>
    AIRich.newLayout('Single', {
        type: bloksType(type, 'bloksSection'),
        data: bloksPayloadData(data),
        uuid: uuid ?? randomUUID(),
        initial_response: String(initialResponse),
        versioning_id: String(versioningId),
        __typename: 'FOABloksPrimitive'
    })

export const bloksWidget = ({ type, data, uuid, fallback = '' } = {}) => ({
    type: bloksType(type, 'bloksWidget'),
    data: bloksPayloadData(data),
    uuid: uuid ?? randomUUID(),
    fallback: String(fallback)
})

export const A2UI_VERSION = 'v0.9'
export const A2UI_BASIC_CATALOG = 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json'
export const A2UI_ROOT_ID = 'root'

const a2uiNode = (component) => (id, extra = {}) => {
    if (typeof id !== 'string' || id.trim() === '') {
        throw new TypeError('every a2ui component needs a non-empty id')
    }
    return trimEmpty({ id, component, ...extra })
}

export const a2uiText = (id, text, { variant = 'body' } = {}) =>
    a2uiNode('Text')(id, { text: String(text), variant })

export const a2uiImage = (id, url, { variant = 'header', fit = 'cover' } = {}) => {
    if (typeof url !== 'string' || url.trim() === '') {
        throw new TypeError('a2uiImage requires a url')
    }
    return a2uiNode('Image')(id, { url, variant, fit })
}

const a2uiContainer = (component) => (id, children = []) => {
    if (!Array.isArray(children)) {
        throw new TypeError('a2ui container children must be an array of component ids')
    }
    return a2uiNode(component)(id, { children: children.map(String) })
}

export const a2uiColumn = a2uiContainer('Column')
export const a2uiRow = a2uiContainer('Row')

export const a2uiSurface = (components, { surfaceId, catalogId = A2UI_BASIC_CATALOG, sendDataModel = false, version = A2UI_VERSION } = {}) => {
    if (!Array.isArray(components) || components.length === 0) {
        throw new TypeError('a2uiSurface requires at least one component')
    }
    if (!components.some(component => component?.id === A2UI_ROOT_ID)) {
        throw new TypeError('a2ui components must include one with id "' + A2UI_ROOT_ID + '"')
    }
    return {
        version,
        createSurface: {
            surfaceId: surfaceId ?? 'card-' + randomUUID(),
            catalogId,
            sendDataModel: !!sendDataModel,
            components
        }
    }
}

export const a2uiWidget = (components, { uuid, surfaceId, catalogId, sendDataModel, version, fallback = '' } = {}) => {
    const id = uuid ?? randomUUID()
    return bloksWidget({
        type: BLOKS_A2UI_TYPE,
        uuid: id,
        fallback,
        data: a2uiSurface(components, { surfaceId: surfaceId ?? 'card-' + id, catalogId, sendDataModel, version })
    })
}

export const sendA2UI = async (sock, jid, components, { buttons = [], contextInfo, messageId, additionalNodes = [], ...options } = {}) => {
    if (!sock) {
        throw new TypeError('sendA2UI requires a socket as the first argument')
    }
    if (!jid) {
        throw new TypeError('sendA2UI requires a target jid')
    }
    if (!Array.isArray(buttons)) {
        throw new TypeError('sendA2UI buttons must be an array of native flow buttons')
    }

    const widget = a2uiWidget(components, options)

    const msg = generateWAMessageFromContent(
        jid,
        {
            interactiveMessage: trimEmpty({
                nativeFlowMessage: { buttons, messageParamsJson: JSON.stringify({}), messageVersion: 1 },
                bloksWidget: widget,
                contextInfo
            })
        },
        { messageId, ...options }
    )

    await sock.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id,
        additionalNodes: [
            {
                tag: 'biz',
                attrs: {},
                content: [{ tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }] }]
            },
            ...additionalNodes
        ],
        ...options
    })

    return msg
}

export const sendBloksWidget = async (sock, jid, { type, data, uuid, fallback = '', body, contextInfo, messageId, additionalNodes = [], ...options } = {}) => {
    if (!sock) {
        throw new TypeError('sendBloksWidget requires a socket as the first argument')
    }
    if (!jid) {
        throw new TypeError('sendBloksWidget requires a target jid')
    }

    const widget = bloksWidget({ type, data, uuid, fallback })
    const text = body === undefined ? widget.fallback : String(body)

    const msg = generateWAMessageFromContent(
        jid,
        {
            interactiveMessage: {
                bloksWidget: widget,
                ...(text ? { body: { text } } : {}),
                ...(contextInfo ? { contextInfo } : {})
            }
        },
        { messageId, ...options }
    )

    await sock.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id,
        additionalNodes: [
            {
                tag: 'biz',
                attrs: {},
                content: [{ tag: 'interactive', attrs: { type: 'native_flow', v: '1' }, content: [{ tag: 'native_flow', attrs: { v: '9', name: 'mixed' } }] }]
            },
            ...additionalNodes
        ],
        ...options
    })

    return msg
}

export const decodeBloksWidget = (msg) => {
    const message = msg?.message ?? msg
    const interactive =
        message?.interactiveMessage ??
        message?.viewOnceMessage?.message?.interactiveMessage ??
        message?.viewOnceMessageV2?.message?.interactiveMessage

    const widget = interactive?.bloksWidget
    if (!widget) {
        return null
    }

    let params = null
    try {
        params = widget.data ? JSON.parse(widget.data) : null
    }
    catch {
        params = null
    }

    return {
        type: widget.type ?? '',
        uuid: widget.uuid ?? '',
        fallback: widget.fallback ?? '',
        data: widget.data ?? '',
        params
    }
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
    const footerSections = Array.isArray(unified?.footer_sections) ? unified.footer_sections : []
    const embeddedScreens = Array.isArray(unified?.embedded_screens) ? unified.embedded_screens : []

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
        footerTypenames: [...new Set(footerSections.flatMap(section => readPrimitives(section).map(primitive => primitive?.__typename).filter(Boolean)))],
        sections,
        footerSections,
        embeddedScreens,
        submessages: rich.submessages ?? [],
        unified
    }
}

const A2UI_TEXT_KEYS = Object.freeze(['text', 'label', 'title'])

const readPrimitiveText = (primitive) => {
    if (!primitive || typeof primitive !== 'object') {
        return ''
    }
    if (typeof primitive.text === 'string') {
        return primitive.text
    }
    if (typeof primitive.title === 'string') {
        return primitive.title
    }
    return ''
}

const readA2UIText = (components) => components
    .filter(component => component?.component === 'Text' || component?.component === 'Heading')
    .map(component => A2UI_TEXT_KEYS.map(key => component[key]).find(value => typeof value === 'string') ?? '')
    .filter(Boolean)

export const readRichMessage = (msg) => {
    const raw = msg?.message ?? msg
    if (!raw || typeof raw !== 'object') {
        return null
    }

    const content = extractMessageContent(raw) ?? raw
    const rich = decodeAIRich(raw)
    const widget = decodeBloksWidget(raw)
    const interactive =
        content?.interactiveMessage ??
        raw?.interactiveMessage ??
        raw?.viewOnceMessage?.message?.interactiveMessage ??
        raw?.viewOnceMessageV2?.message?.interactiveMessage

    if (!rich && !widget && !interactive) {
        return null
    }

    const buttons = (interactive?.nativeFlowMessage?.buttons ?? []).map(button => {
        let params = null
        try {
            params = button?.buttonParamsJson ? JSON.parse(button.buttonParamsJson) : null
        }
        catch {
            params = null
        }
        return { name: button?.name ?? '', params }
    })

    const a2uiComponents = widget?.type === BLOKS_A2UI_TYPE && Array.isArray(widget.params?.createSurface?.components)
        ? widget.params.createSurface.components
        : []

    const primitives = (rich?.sections ?? []).flatMap(section => {
        const view = section?.view_model
        if (Array.isArray(view?.primitives)) return view.primitives
        return view?.primitive ? [view.primitive] : []
    })

    const lines = [
        ...primitives.map(readPrimitiveText),
        ...readA2UIText(a2uiComponents),
        interactive?.body?.text ?? '',
        interactive?.footer?.text ?? ''
    ].filter(Boolean)

    const kind = a2uiComponents.length ? 'a2ui' : widget ? 'bloks' : rich ? 'airich' : 'interactive'

    return trimEmpty({
        kind,
        text: lines.join('\n'),
        title: raw?.messageContextInfo?.botMetadata?.messageDisclaimerText || interactive?.header?.title || '',
        buttons,
        html: primitives.filter(p => typeof p?.payload === 'string').map(p => p.payload),
        typenames: rich?.typenames ?? [],
        sections: rich?.sections ?? [],
        footerSections: rich?.footerSections ?? [],
        embeddedScreens: rich?.embeddedScreens ?? [],
        submessages: rich?.submessages ?? [],
        responseId: rich?.responseId,
        a2ui: a2uiComponents.length
            ? {
                surfaceId: widget.params.createSurface.surfaceId,
                catalogId: widget.params.createSurface.catalogId,
                version: widget.params.version,
                components: a2uiComponents
            }
            : undefined,
        bloks: widget ? { type: widget.type, uuid: widget.uuid, fallback: widget.fallback, params: widget.params } : undefined
    })
}
