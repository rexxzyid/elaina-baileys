/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */

export const SocialMediaPostType = Object.freeze({
    NONE: 0,
    REEL: 1,
    LIVE_VIDEO: 2,
    LONG_VIDEO: 3,
    SINGLE_IMAGE: 4,
    CAROUSEL: 5
})

const drop = (object) => {
    for (const key of Object.keys(object)) {
        if (object[key] === undefined || object[key] === null) {
            delete object[key]
        }
    }
    return object
}

export const videoEndCard = ({ username, caption, thumbnailUrl, profilePictureUrl } = {}) =>
    drop({
        username,
        caption,
        thumbnailImageUrl: thumbnailUrl,
        profilePictureUrl
    })

/**
 * The same video url and music node exist twice, once nested in
 * LinkPreviewMetadata and once directly on ExtendedTextMessage. Which one the
 * client reads is not visible from the client, so both carry the same value.
 */
export const buildSocialPreview = ({
    postType,
    videoUrl,
    videoCaption,
    muted,
    durationSeconds,
    experimentId,
    music,
    endCards
} = {}) => {
    if (postType !== undefined && !Object.values(SocialMediaPostType).includes(postType)) {
        throw new TypeError(`postType ${postType} is not one of ${Object.keys(SocialMediaPostType).join(', ')}`)
    }
    if (durationSeconds !== undefined && (!Number.isFinite(Number(durationSeconds)) || Number(durationSeconds) < 0)) {
        throw new TypeError('durationSeconds must be a non-negative number of seconds, not milliseconds')
    }

    const metadata = drop({
        socialMediaPostType: postType,
        linkMediaDuration: durationSeconds === undefined ? undefined : Math.round(Number(durationSeconds)),
        linkInlineVideoMuted: muted === undefined ? undefined : !!muted,
        videoContentUrl: videoUrl,
        videoContentCaption: videoCaption,
        musicMetadata: music,
        fbExperimentId: experimentId
    })

    return drop({
        linkPreviewMetadata: Object.keys(metadata).length ? metadata : undefined,
        videoContentUrl: videoUrl,
        musicMetadata: music,
        endCardTiles: endCards?.length ? endCards : undefined
    })
}

export const readSocialPreview = (msg) => {
    const message = msg?.message ?? msg
    const text = message?.extendedTextMessage
    if (!text) {
        return null
    }
    const metadata = text.linkPreviewMetadata
    if (!metadata && !text.endCardTiles?.length && !text.videoContentUrl) {
        return null
    }
    return drop({
        postType: metadata?.socialMediaPostType,
        durationSeconds: metadata?.linkMediaDuration,
        muted: metadata?.linkInlineVideoMuted,
        videoUrl: metadata?.videoContentUrl ?? text.videoContentUrl,
        videoCaption: metadata?.videoContentCaption,
        music: metadata?.musicMetadata ?? text.musicMetadata,
        experimentId: metadata?.fbExperimentId,
        endCards: text.endCardTiles?.length ? text.endCardTiles : undefined
    })
}
