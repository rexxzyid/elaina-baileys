/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { proto } from '../../WAProto/index.js'

export const StatusLinkType = Object.freeze({
    RASTERIZED_LINK_PREVIEW: 1,
    RASTERIZED_LINK_TRUNCATED: 2,
    RASTERIZED_LINK_FULL_URL: 3
})

export const STICKER_DEFAULT_AREA = Object.freeze({ x: 0.25, y: 0.4, width: 0.5, height: 0.2 })

const fraction = (value, name) => {
    const number = Number(value)
    if (!Number.isFinite(number) || number < 0 || number > 1) {
        throw new TypeError(`${name} must be between 0 and 1, the client reads these as a fraction of the media`)
    }
    return number
}

export const stickerArea = ({ x, y, width, height } = STICKER_DEFAULT_AREA) => {
    const left = fraction(x, 'x')
    const top = fraction(y, 'y')
    const right = fraction(left + Number(width), 'x + width')
    const bottom = fraction(top + Number(height), 'y + height')
    if (right <= left || bottom <= top) {
        throw new TypeError('a sticker area needs a positive width and height')
    }
    return [
        { x: left, y: top },
        { x: right, y: top },
        { x: right, y: bottom },
        { x: left, y: bottom }
    ]
}

const annotation = (area, fields) => ({
    polygonVertices: Array.isArray(area) ? area : stickerArea(area),
    ...fields
})

export const locationSticker = ({ latitude, longitude, name, area, skipConfirmation } = {}) => {
    const degreesLatitude = Number(latitude)
    const degreesLongitude = Number(longitude)
    if (!Number.isFinite(degreesLatitude) || !Number.isFinite(degreesLongitude)) {
        throw new TypeError('locationSticker needs a numeric latitude and longitude')
    }
    return annotation(area, {
        location: { degreesLatitude, degreesLongitude, ...(name ? { name } : {}) },
        ...(skipConfirmation === undefined ? {} : { shouldSkipConfirmation: !!skipConfirmation })
    })
}

export const channelSticker = ({ jid, name, serverMessageId = 0, accessibilityText, area } = {}) => {
    if (typeof jid !== 'string' || !jid.endsWith('@newsletter')) {
        throw new TypeError('channelSticker needs the channel jid, the one ending in @newsletter')
    }
    return annotation(area, {
        newsletter: {
            newsletterJid: jid,
            serverMessageId: Number(serverMessageId),
            ...(name ? { newsletterName: name } : {}),
            ...(accessibilityText ? { accessibilityText } : {})
        }
    })
}

export const linkSticker = ({ url, title, area, linkType = StatusLinkType.RASTERIZED_LINK_PREVIEW } = {}) => {
    if (typeof url !== 'string' || !url) {
        throw new TypeError('linkSticker needs a url')
    }
    return annotation(area, {
        tapAction: { tapUrl: url, ...(title ? { title } : {}) },
        statusLinkType: linkType
    })
}

export const musicSticker = ({
    songId,
    title,
    author,
    mediaId,
    artworkDirectPath,
    artworkSha256,
    artworkEncSha256,
    artworkMediaKey,
    artistAttribution,
    countryBlocklist,
    isExplicit,
    startTimeMs = 0,
    derivedStartTimeMs,
    durationMs,
    area
} = {}) => {
    if (!songId && !mediaId) {
        throw new TypeError('musicSticker needs at least a songId or a musicContentMediaId')
    }
    const bytes = value => (value === undefined ? undefined : Buffer.isBuffer(value) ? value : Buffer.from(value, 'base64'))
    const embeddedMusic = {
        ...(songId ? { songId: String(songId) } : {}),
        ...(mediaId ? { musicContentMediaId: String(mediaId) } : {}),
        ...(title ? { title } : {}),
        ...(author ? { author } : {}),
        ...(artistAttribution ? { artistAttribution } : {}),
        ...(artworkDirectPath ? { artworkDirectPath } : {}),
        ...(isExplicit === undefined ? {} : { isExplicit: !!isExplicit }),
        musicSongStartTimeInMs: Number(startTimeMs),
        ...(derivedStartTimeMs === undefined ? {} : { derivedContentStartTimeInMs: Number(derivedStartTimeMs) }),
        ...(durationMs === undefined ? {} : { overlapDurationInMs: Number(durationMs) })
    }
    for (const [key, value] of [
        ['artworkSha256', artworkSha256],
        ['artworkEncSha256', artworkEncSha256],
        ['artworkMediaKey', artworkMediaKey],
        ['countryBlocklist', countryBlocklist]
    ]) {
        const buffer = bytes(value)
        if (buffer) {
            embeddedMusic[key] = buffer
        }
    }
    return annotation(area, { embeddedContent: { embeddedMusic } })
}

export const messageSticker = ({ stanzaId, message, area } = {}) => {
    if (!message) {
        throw new TypeError('messageSticker needs the message it embeds')
    }
    return annotation(area, {
        embeddedContent: { embeddedMessage: { ...(stanzaId ? { stanzaId } : {}), message } }
    })
}

const ACTIONS = ['location', 'newsletter', 'embeddedAction', 'tapAction']

export const normalizeStickers = (stickers) => {
    const list = Array.isArray(stickers) ? stickers : [stickers]
    return list.filter(Boolean).map((sticker, index) => {
        const vertices = sticker.polygonVertices
        if (!Array.isArray(vertices) || vertices.length !== 4) {
            throw new TypeError(`sticker ${index} needs four polygonVertices, the client reads corner 0 and corner 2`)
        }
        const actions = ACTIONS.filter(name => sticker[name] !== undefined && sticker[name] !== null)
        if (actions.length > 1) {
            throw new TypeError(`sticker ${index} sets ${actions.join(' and ')}, but the client reads only one action per sticker`)
        }
        return proto.InteractiveAnnotation.fromObject(sticker)
    })
}

export const readStickers = (message) => {
    const media = message?.imageMessage ?? message?.videoMessage ?? message
    const annotations = media?.interactiveAnnotations
    if (!Array.isArray(annotations) || !annotations.length) {
        return []
    }
    return annotations.map(item => {
        const [topLeft, , bottomRight] = item.polygonVertices ?? []
        const music = item.embeddedContent?.embeddedMusic
        return {
            kind: item.location
                ? 'location'
                : item.newsletter
                    ? 'channel'
                    : item.tapAction
                        ? 'link'
                        : music
                            ? 'music'
                            : item.embeddedContent?.embeddedMessage
                                ? 'message'
                                : 'unknown',
            area: topLeft && bottomRight
                ? { x: topLeft.x, y: topLeft.y, width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y }
                : undefined,
            location: item.location ?? undefined,
            channel: item.newsletter ?? undefined,
            link: item.tapAction ? { url: item.tapAction.tapUrl, title: item.tapAction.title, linkType: item.statusLinkType } : undefined,
            music: music ? { songId: music.songId, title: music.title, author: music.author } : undefined,
            message: item.embeddedContent?.embeddedMessage ?? undefined,
            annotation: item
        }
    })
}
