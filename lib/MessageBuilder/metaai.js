/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { AIRich } from './index.js'
import { generateWAMessageFromContent } from '../Utils/messages.js'
import { BOT_SIGNATURE_USE_CASE_WA_BOT_MSG, verifyBotSignature } from './bot-signature.js'

export const MapQueryStatus = Object.freeze({ FETCHING: 'FETCHING', FETCHED: 'FETCHED', FAILED: 'FAILED' })
export const MapItemMarkerType = Object.freeze({ PIN: 'PIN', RADIUS: 'RADIUS' })
export const PlaceDetailsItemType = Object.freeze({ PLACE: 'PLACE', MARKETPLACE_LISTING: 'MARKETPLACE_LISTING' })
export const PlaceOpeningStatus = Object.freeze({ OPEN: 'OPEN', CLOSED: 'CLOSED' })
export const PlacePriceLevel = Object.freeze({ CHEAP: 'CHEAP', MODERATE: 'MODERATE', EXPENSIVE: 'EXPENSIVE', SPLURGE: 'SPLURGE' })

export const SportsLeague = Object.freeze({ NFL: 'NFL', EURO: 'EURO', WORLD_CUP: 'WORLD_CUP' })
export const SportsGameStatus = Object.freeze({ SCHEDULED: 'SCHEDULED', LIVE: 'LIVE', FINAL: 'FINAL' })
export const SportsSeasonType = Object.freeze({ PRESEASON: 'PRESEASON', REGULAR: 'REGULAR', POSTSEASON: 'POSTSEASON' })

export const CompactEntityType = Object.freeze({
    PERSON: 'PERSON',
    PAGE: 'PAGE',
    GROUP: 'GROUP',
    INSTAGRAM_ACCOUNT: 'INSTAGRAM_ACCOUNT',
    CALENDAR_EVENT: 'CALENDAR_EVENT'
})
export const CompactEntityActionType = Object.freeze({
    FOLLOW: 'FOLLOW',
    UNFOLLOW: 'UNFOLLOW',
    JOIN: 'JOIN',
    LEAVE: 'LEAVE',
    MESSAGE: 'MESSAGE',
    VIEW_DETAILS: 'VIEW_DETAILS'
})

export const ActionListRowType = Object.freeze({ ACTION: 'ACTION', NAVIGATION: 'NAVIGATION' })

export const SocialEntityItemType = Object.freeze({
    FB_PROFILE: 'FB_PROFILE',
    FB_PAGE: 'FB_PAGE',
    FB_GROUP: 'FB_GROUP',
    IG_PROFILE: 'IG_PROFILE',
    THREADS_PROFILE: 'THREADS_PROFILE'
})

export const SourceApp = Object.freeze({ FACEBOOK: 'FACEBOOK', INSTAGRAM: 'INSTAGRAM', THREADS: 'THREADS' })
export const PostType = Object.freeze({ PAGE_POST: 'PAGE_POST', GROUP_POST: 'GROUP_POST' })
export const PostOrientation = Object.freeze({ PORTRAIT: 'PORTRAIT', LANDSCAPE: 'LANDSCAPE' })
export const ProductSourceType = Object.freeze({ CATALOG: 'CATALOG', MARKETPLACE: 'MARKETPLACE' })

export const SearchPlannerStepStatus = Object.freeze({
    PLANNED: 'PLANNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    STOPPED: 'STOPPED'
})
export const OrchestratorSearchEngine = Object.freeze({
    BING: 'BING',
    BRAVE: 'BRAVE',
    GOOGLE: 'GOOGLE',
    HELP_CENTER: 'HELP_CENTER',
    IN_HOUSE: 'IN_HOUSE',
    KSS: 'KSS',
    MASE: 'MASE'
})

export const ProfessionalConsentStatus = Object.freeze({ ALLOWED: 'ALLOWED', NEEDS_CONSENT: 'NEEDS_CONSENT' })

export const AccountLinkingIntegration = Object.freeze({
    APPLE_HEALTH: 'APPLE_HEALTH',
    GMAIL: 'GMAIL',
    GOOGLE_CALENDAR: 'GOOGLE_CALENDAR',
    GOOGLE_CONTACTS: 'GOOGLE_CONTACTS',
    GOOGLE_DRIVE: 'GOOGLE_DRIVE',
    GOOGLE_HEALTH_CONNECT: 'GOOGLE_HEALTH_CONNECT',
    OUTLOOK_CALENDAR: 'OUTLOOK_CALENDAR',
    OUTLOOK_CONTACTS: 'OUTLOOK_CONTACTS',
    OUTLOOK_MAIL: 'OUTLOOK_MAIL'
})
export const AccountLinkingStatus = Object.freeze({ INITIATED: 'INITIATED', LINKED: 'LINKED', UNLINKED: 'UNLINKED' })

export const CalendarEventOperation = Object.freeze({ CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' })
export const CalendarEventState = Object.freeze({ PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED' })
export const WidgetCtaKind = Object.freeze({ CONFIRM: 'CONFIRM', CANCEL: 'CANCEL', OTHER: 'OTHER' })
export const WidgetCtaState = Object.freeze({ PENDING: 'PENDING', CONFIRMED: 'CONFIRMED', CANCELLED: 'CANCELLED' })

export const MultipleResponseLayoutType = Object.freeze({ IN_THREAD: 'IN_THREAD', BOTTOM_SHEET: 'BOTTOM_SHEET' })

export const ThreadSurfingEntityType = Object.freeze({
    CELEBRITY: 'CELEBRITY',
    INFO_TERM: 'INFO_TERM',
    MOVIE: 'MOVIE',
    RESTAURANT: 'RESTAURANT',
    SPORTS_TEAM: 'SPORTS_TEAM',
    TV_SHOWS: 'TV_SHOWS'
})
export const ThreadSurfingActionType = Object.freeze({ AI_LOOKUP: 'AI_LOOKUP', CONTEXTUAL_MENU: 'CONTEXTUAL_MENU' })

export const MediaShape = Object.freeze({ CIRCLE: 'CIRCLE', SQUARE: 'SQUARE', VERTICAL: 'VERTICAL' })
export const MediaHorizontalAlignment = Object.freeze({ START: 'START', END: 'END' })
export const MediaVerticalAlignment = Object.freeze({ TOP: 'TOP', CENTER: 'CENTER' })
export const AddonActionAlignment = Object.freeze({ START: 'START', END: 'END' })
export const ImageAssetQueryStatus = Object.freeze({ FETCHING: 'FETCHING', FETCHED: 'FETCHED', FAILED: 'FAILED' })

export const CodeBlockType = Object.freeze({
    DEFAULT: 'DEFAULT',
    COMMENT: 'COMMENT',
    KEYWORD: 'KEYWORD',
    METHOD: 'METHOD',
    NUMBER: 'NUMBER',
    STR: 'STR'
})

export const FollowUpSuggestionCategory = Object.freeze({
    ADD: 'ADD',
    ANIMATE: 'ANIMATE',
    FRAME: 'FRAME',
    LIGHT: 'LIGHT',
    OTHER: 'OTHER',
    RETOUCH: 'RETOUCH',
    SCENE: 'SCENE',
    STYLE: 'STYLE'
})

export const InformTreatmentRenderingType = Object.freeze({
    GEOBLOCK: 'GEOBLOCK',
    MEDIA_LABEL: 'MEDIA_LABEL',
    POST_COVER: 'POST_COVER',
    POST_LABEL: 'POST_LABEL',
    WARNING_SCREENS: 'WARNING_SCREENS'
})

export const UnifiedResponseSectionType = Object.freeze({ REASONING: 'REASONING', RESPONDING: 'RESPONDING' })
export const UnifiedResponseMessageGroupKind = Object.freeze({ COMMENTARY: 'COMMENTARY', PRIMARY_RESPONSE: 'PRIMARY_RESPONSE' })

const trimEmpty = (object) => {
    for (const key of Object.keys(object)) {
        if (object[key] === undefined) {
            delete object[key]
        }
    }
    return object
}

const typed = (typename, fields) => trimEmpty({ ...fields, __typename: typename })

const layoutSection = (name, data, viewModelFields = {}) => {
    const section = AIRich.newLayout(name, data)
    Object.assign(section.view_model, trimEmpty({ ...viewModelFields }))
    return section
}

const url = (value, fallback) => (value === undefined ? undefined : { url: value, url_fallback: fallback ?? value })

export const customSection = (typename, fields = {}, { layout = 'Single' } = {}) => {
    if (typeof typename !== 'string' || !typename) {
        throw new TypeError('customSection needs a __typename, that is the only thing the client dispatches on')
    }
    return AIRich.newLayout(layout, typed(typename, fields))
}

export const placeItem = ({
    id,
    name,
    description,
    imageUrl,
    itemType = PlaceDetailsItemType.PLACE,
    categoryId,
    categoryName,
    priceLevel,
    openingStatus,
    openingHours,
    rating,
    latitude,
    longitude,
    streetAddress,
    street,
    locality,
    region,
    country,
    postalCode,
    timezone,
    marketplace
} = {}) => typed('GenAIPlaceDetailsItem', {
    id: id === undefined ? undefined : String(id),
    name,
    description,
    image_url: imageUrl,
    item_type: itemType,
    category: categoryId === undefined && categoryName === undefined
        ? undefined
        : typed('GenAIPlaceDetailsItemCategory', { category_id: categoryId, display_name: categoryName }),
    price_level: priceLevel,
    opening_status: openingStatus,
    opening_hours: openingHours?.map(hours => typed('GenAIPlaceDetailsItemOpeningHours', {
        day: hours.day,
        time: hours.time,
        open: hours.open === undefined ? undefined : typed('GenAIPlaceDetailsItemOpeningHoursTime', { time: hours.open }),
        close: hours.close === undefined ? undefined : typed('GenAIPlaceDetailsItemOpeningHoursTime', { time: hours.close })
    })),
    rating: rating === undefined ? undefined : typed('GenAIPlaceDetailsItemRating', { avg_rating: Number(rating) }),
    address: trimEmpty({
        latitude,
        longitude,
        street_address: streetAddress,
        street,
        locality,
        region,
        country,
        postal_code: postalCode,
        timezone
    }),
    marketplace_metadata: marketplace === undefined
        ? undefined
        : typed('GenAIMarketplaceMetadata', {
            price: marketplace.price,
            sale_price: marketplace.salePrice,
            is_unavailable: marketplace.unavailable
        })
})

export const mapSection = ({ items = [], motivation, staticMapUrl, staticMapDarkUrl, queryStatus = MapQueryStatus.FETCHED } = {}) =>
    AIRich.newLayout('Single', typed('GenAIMapPrimitive', {
        map_query_status: queryStatus,
        static_map: staticMapUrl === undefined
            ? undefined
            : typed('GenAIMapItemStaticMap', { default_url: staticMapUrl, dark_theme_url: staticMapDarkUrl ?? staticMapUrl }),
        items,
        motivation
    }))

export const locationPermissionSection = (placeholder = '') =>
    AIRich.newLayout('Single', typed('GenAILocationPermissionPrimitive', { placeholder }))

export const timestampPlaceholderSection = (placeholder = '') =>
    AIRich.newLayout('Single', typed('GenAITimestampPlaceholderPrimitive', { placeholder }))

const sportsTeam = (team = {}) => typed('GenAISportsTeam', {
    name: team.name,
    abbreviation: team.abbreviation,
    country_code: team.countryCode,
    icon: team.icon === undefined ? undefined : typed('GenAISportsTeamIcon', { image: url(team.icon, team.iconFallback) })
})

const sportsRecord = (record) => (record === undefined
    ? undefined
    : typed('GenAISportsTeamRecord', { wins: record.wins, losses: record.losses, ties: record.ties }))

export const sportsSection = ({
    gameId,
    league = SportsLeague.NFL,
    status = SportsGameStatus.SCHEDULED,
    statusDetail,
    startTime,
    venue,
    group,
    groupName,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    homeRecord,
    awayRecord,
    seasonType,
    week,
    contentTypename = 'GenAIAmericanFootballGameContent'
} = {}) => {
    if (!gameId) {
        throw new TypeError('sportsSection requires gameId, the widget is keyed on it')
    }
    return AIRich.newLayout('Single', typed('GenAISportsWidgetPrimitive', {
        game_id: String(gameId),
        league,
        status,
        status_detail: statusDetail,
        start_time_utc_seconds: startTime === undefined ? undefined : Number(startTime),
        venue: venue === undefined
            ? undefined
            : typed('GenAISportsVenue', { name: venue.name, city: venue.city, state: venue.state, country: venue.country }),
        group: group === undefined && groupName === undefined
            ? undefined
            : typed('GenAISportsGroup', { group_name: groupName ?? group }),
        content: typed(contentTypename, {
            home_team: homeTeam === undefined ? undefined : sportsTeam(homeTeam),
            away_team: awayTeam === undefined ? undefined : sportsTeam(awayTeam),
            home_score: homeScore,
            away_score: awayScore,
            home_record: sportsRecord(homeRecord),
            away_record: sportsRecord(awayRecord),
            season_type: seasonType,
            week
        })
    }))
}

export const videoSection = ({
    postId,
    title,
    url: reelsUrl,
    thumbnailUrl,
    creator,
    avatarUrl,
    contentHash,
    likes,
    comments,
    shares,
    isVerified,
    sourceApp,
    progressiveUrls = [],
    dashManifests = []
} = {}) => AIRich.newLayout('Single', typed('GenAIVideoPrimitive', {
    post_id: postId === undefined ? undefined : String(postId),
    reels_title: title,
    reels_url: reelsUrl,
    thumbnail_url: thumbnailUrl,
    creator,
    avatar_url: avatarUrl,
    content_hash: contentHash,
    likes_count: likes,
    comments_count: comments,
    shares_count: shares,
    is_verified: isVerified,
    source_app: sourceApp,
    video_delivery_response: typed('GenAIVideoDeliveryResponse', {
        progressive_urls: progressiveUrls.map(value => typed('GenAIProgressiveUrlResponse', { progressive_url: value })),
        dash_manifests: dashManifests.map(value => typed('GenAIDashManifestResponse', { manifest_xml: value }))
    })
}))

export const reminderSection = ({
    reminderId,
    title,
    triggerType,
    triggerTime,
    createTime,
    isDeleted,
    thumbnailUrl,
    fullSizeUrl,
    mediaKey
} = {}) => {
    if (!reminderId) {
        throw new TypeError('reminderSection requires reminderId')
    }
    return AIRich.newLayout('Single', typed('GenAIReminderPrimitive', {
        reminder_id: String(reminderId),
        title,
        trigger_type: triggerType,
        trigger_time: triggerTime,
        create_time: createTime,
        is_deleted: isDeleted,
        thumbnail_url: thumbnailUrl,
        full_size_url: fullSizeUrl,
        reminder_media_key: mediaKey
    }))
}

export const commentSection = ({
    text,
    url: commentUrl,
    actorName,
    profileImage,
    subtitle,
    likes,
    replies,
    isVerified
} = {}) => AIRich.newLayout('Single', typed('GenAICommentPrimitive', {
    comment_text: text,
    comment_url: commentUrl,
    actor_name: actorName,
    profile_image: profileImage,
    subtitle,
    likes_count: likes,
    replies_count: replies,
    is_verified: isVerified
}))

export const compactEntitySection = ({
    title,
    subtitle,
    secondarySubtitle,
    image,
    entityId,
    entityUrl,
    entityType = CompactEntityType.PERSON,
    actionType,
    isVerified
} = {}) => AIRich.newLayout('Single', typed('GenAICompactEntityPrimitive', {
    title,
    subtitle,
    secondary_subtitle: secondarySubtitle,
    image,
    entity_id: entityId === undefined ? undefined : String(entityId),
    entity_url: entityUrl,
    entity_type: entityType,
    action_type: actionType,
    is_verified: isVerified
}))

export const actionListRow = ({ title, subtitle, action, icon, url: rowUrl, rowType = ActionListRowType.ACTION } = {}) =>
    typed('GenAIActionListRow', {
        title,
        subtitle,
        action,
        icon,
        url: rowUrl,
        row_type: rowType
    })

export const actionListSection = (rows = []) =>
    AIRich.newLayout('Single', typed('GenAIActionListPrimitive', { rows }))

const plannerFields = ({ sources = [], steps = [], queryUrl, queryFavicon, searchEngine, facepileFavicons = [], responseId } = {}) => ({
    response_id: responseId,
    sources,
    steps,
    query_url: queryUrl,
    query_favicon: queryFavicon,
    search_engine: searchEngine,
    facepile_favicons: facepileFavicons
})

export const plannerStep = ({ title, instruction, status = SearchPlannerStepStatus.PLANNED } = {}) =>
    typed('GenAISearchPlannerStep', {
        title,
        status,
        instruction: instruction === undefined
            ? undefined
            : typed('GenAISearchPlannerInstruction', { text: instruction })
    })

export const searchPlannerSection = (options = {}) =>
    AIRich.newLayout('Single', typed('GenAISearchPlannerStepsPrimitive', plannerFields(options)))

export const searchResultV2Section = (options = {}) =>
    AIRich.newLayout('Single', typed('GenAISearchResultV2Primitive', plannerFields(options)))

export const plannerSnippetSection = ({ header, currentStep, totalSteps, status = SearchPlannerStepStatus.IN_PROGRESS } = {}) =>
    AIRich.newLayout('Single', typed('GenAISearchPlannerStepSnippetPrimitive', {
        header,
        current_step: currentStep,
        total_steps: totalSteps,
        status
    }))

export const chainOfThoughtSection = ({ header, subtitle, plannerState, imageArtifacts, text } = {}) =>
    AIRich.newLayout('Single', typed('GenAIChainOfThoughtStepPrimitive', {
        header,
        subtitle,
        planner_state: plannerState,
        image_artifacts: imageArtifacts,
        markdown_text: text === undefined ? undefined : typed('GenAIChainOfThoughtStepMarkdownText', { text })
    }))

export const searchAdSection = ({ storyId, actorName, actorImageUrl, imageUrl, message } = {}) =>
    AIRich.newLayout('Single', typed('GenAISearchAdPrimitive', {
        story_id: storyId === undefined ? undefined : String(storyId),
        actor_name: actorName,
        actor_image_url: actorImageUrl,
        image_url: imageUrl,
        message
    }))

export const transparencySignal = ({ id, signalType, value, memory } = {}) =>
    typed('GenAIP13nUiSignalValue', {
        id: id === undefined ? undefined : String(id),
        signal_type: signalType,
        value,
        memory
    })

export const transparencySection = ({ annotation, signals = [], responseId } = {}) =>
    AIRich.newLayout('Single', typed('GenAIP13NTransparencyPrimitive', {
        annotation,
        signals: typed('GenAIP13nUiSignals', { signals }),
        response_id: responseId
    }))

export const professionalConsentSection = ({
    title,
    body,
    status = ProfessionalConsentStatus.NEEDS_CONSENT,
    providerLabel,
    providerIconUrl,
    ctaLabel,
    allowedLabel,
    allowedCtaLabel,
    allowedProviderLabel,
    allowedDescription,
    description,
    primaryLabel,
    secondaryLabel,
    subtitle,
    originalPrompt,
    learnMoreLabel,
    learnMoreUrl
} = {}) => AIRich.newLayout('Single', typed('GenAIProfessionalConsentPrimitive', {
    title,
    body,
    subtitle,
    description,
    status,
    provider_label: providerLabel,
    provider_icon_url: providerIconUrl,
    cta_label: ctaLabel,
    allowed_label: allowedLabel,
    allowed_cta_label: allowedCtaLabel,
    allowed_provider_label: allowedProviderLabel,
    allowed_description: allowedDescription,
    primary_label: primaryLabel,
    secondary_label: secondaryLabel,
    original_prompt: originalPrompt,
    learn_more_label: learnMoreLabel,
    learn_more_url: learnMoreUrl
}))

export const accountLinkingApp = ({ label, integrationFbid, integrationSlug, iconUrl } = {}) =>
    typed('GenAI3PAccountLinkingBottomsheetAppItem', {
        label,
        integration_fbid: integrationFbid === undefined ? undefined : String(integrationFbid),
        integration_slug: integrationSlug,
        icon_url: iconUrl
    })

export const accountLinkingSection = ({
    title,
    subtitle,
    imageUrl,
    ctaLabel,
    ctaUrl,
    originalPrompt,
    integrationType = AccountLinkingIntegration.GOOGLE_CALENDAR,
    integrationStatus = AccountLinkingStatus.UNLINKED,
    integrationId,
    apps
} = {}) => AIRich.newLayout('Single', typed('GenAI3PAccountLinkingUpsellPrimitive', {
    title,
    subtitle,
    image_url: imageUrl,
    cta_label: ctaLabel,
    cta_url: ctaUrl,
    original_prompt: originalPrompt,
    integration_type: integrationType,
    integration_status: integrationStatus,
    integration_id: integrationId === undefined ? undefined : String(integrationId),
    bottomsheet: apps === undefined ? undefined : typed('GenAI3PAccountLinkingBottomsheet', { apps })
}))

export const calendarEvent = ({
    title,
    startTime,
    endTime,
    location,
    description,
    recurrenceText,
    deeplink,
    attendees = []
} = {}) => typed('GenAI3PExtCalendarEventItem', {
    title,
    start_time: startTime,
    end_time: endTime,
    location,
    description,
    recurrence_text: recurrenceText,
    deeplink,
    attendees: attendees.map(attendee => typed('GenAI3PExtCalendarAttendee', {
        email: attendee.email,
        display_name: attendee.displayName ?? attendee.name
    }))
})

export const calendarWidgetSection = ({ title, iconUrls = [], sections = [], ctas = [], toast } = {}) =>
    AIRich.newLayout('Single', typed('GenAI3PExtWidgetPrimitive', {
        header: typed('GenAI3PExtWidgetStandardHeader', { title, leading_items: iconUrls }),
        sections: sections.map(section => typed('GenAI3PExtCalendarDateSection', {
            date: section.date,
            events: typed('GenAI3PExtCalendarEventList', { events: section.events ?? [] })
        })),
        ctas: ctas.map(cta => typed('GenAI3PExtWidgetCTA', {
            label: cta.label,
            kind: cta.kind ?? WidgetCtaKind.CONFIRM,
            state: cta.state ?? WidgetCtaState.PENDING,
            tool_call_id: cta.toolCallId,
            tool_name: cta.toolName,
            analytics_action: cta.analyticsAction
        })),
        toast: toast === undefined ? undefined : typed('GenAI3PExtWidgetToast', { label: toast })
    }))

export const chainingSuggestionSection = ({ promptText, title, imageUri, externalConversationId, topic, cardId } = {}) =>
    AIRich.newLayout('Single', typed('GenAIChainingSuggestionPrimitive', {
        prompt_text: promptText,
        title,
        image_uri: imageUri,
        external_conversation_id: externalConversationId,
        topic,
        card_id: cardId
    }))

export const mediaItem = ({
    previewUrl,
    fullUrl,
    darkPreviewUrl,
    darkFullUrl,
    source,
    contentHash,
    assetQueryStatus = ImageAssetQueryStatus.FETCHED,
    followUpPills = []
} = {}) => typed('GenAIMediaItem', {
    preview_image: url(previewUrl),
    full_image: url(fullUrl),
    dark_mode_preview_image: url(darkPreviewUrl),
    dark_mode_full_image: url(darkFullUrl),
    source,
    content_hash: contentHash,
    asset_query_status: assetQueryStatus,
    follow_up_pills: followUpPills.map(pill => typed('GenAIFollowUpSuggestionPillPrimitive', {
        prompt_text: typeof pill === 'string' ? pill : pill.promptText,
        category: typeof pill === 'string' ? FollowUpSuggestionCategory.OTHER : pill.category ?? FollowUpSuggestionCategory.OTHER
    }))
})

export const mediaGridSection = (items = []) => AIRich.newLayout('Grid', items)

export const contextualSourcesSection = (sources = []) =>
    AIRich.newLayout('Single', typed('GenAIContextualSourcesViewModel', {
        contextual_sources: sources.map(source => trimEmpty({
            uri: source.uri ?? source.url,
            display_name: source.displayName ?? source.title,
            favicon_uri: source.favicon
        }))
    }))

export const threadSurfingItem = ({ entity, entityType = ThreadSurfingEntityType.INFO_TERM, prompts = [] } = {}) =>
    typed('GenAIThreadSurfingItem', {
        entity,
        entity_type: entityType,
        prompts: prompts.map((prompt, index) => typed('GenAIThreadSurfingPrompt', {
            prompt: typeof prompt === 'string' ? prompt : prompt.prompt,
            prompt_id: typeof prompt === 'string' ? String(index) : String(prompt.promptId ?? index)
        }))
    })

export const socialEntityItem = ({ entityId, name, fullName, pictureUrl, entityUrl, entityType, isVerified } = {}) =>
    typed('GenAISocialEntityItem', {
        entity_id: entityId === undefined ? undefined : String(entityId),
        entity_name: name,
        entity_full_name: fullName,
        entity_picture_url: pictureUrl,
        entity_url: entityUrl,
        entity_type: entityType,
        is_verified: isVerified
    })

export const placeEntityItem = ({ placeId, name, imageUrl, motivation } = {}) =>
    typed('GenAIPlaceEntityItem', {
        place_id: placeId === undefined ? undefined : String(placeId),
        name,
        image_url: imageUrl,
        motivation
    })

export const productEntityItem = ({
    productId,
    title,
    productUrl,
    imageUrl,
    additionalImages = [],
    price,
    salePrice,
    brand,
    sourceType = ProductSourceType.CATALOG,
    isUnavailable,
    adTrackingCode
} = {}) => typed('GenAIProductEntityItem', {
    product_id: productId === undefined ? undefined : String(productId),
    title,
    product_url: productUrl,
    image: url(imageUrl),
    additional_images: additionalImages.map(value => url(value)),
    price,
    sale_price: salePrice,
    brand,
    source_type: sourceType,
    is_unavailable: isUnavailable,
    ad_tracking_code: adTrackingCode
})

export const sideBySideSurveyItem = ({
    surveyId,
    threadId,
    botId,
    responseOtid,
    responseTimestampMs,
    simonSessionFbid,
    tessaSessionFbid,
    testArmName
} = {}) => typed('GenAISideBySideSurveyItem', {
    survey_id: surveyId === undefined ? undefined : String(surveyId),
    thread_id: threadId === undefined ? undefined : String(threadId),
    bot_id: botId === undefined ? undefined : String(botId),
    response_otid: responseOtid,
    response_timestamp_ms: responseTimestampMs,
    simon_session_fbid: simonSessionFbid,
    tessa_session_fbid: tessaSessionFbid,
    test_arm_name: testArmName
})

export const multipleResponseSection = (responses = [], { layoutType = MultipleResponseLayoutType.IN_THREAD, survey } = {}) =>
    layoutSection('MultipleResponse', responses, { layout_type: layoutType, survey_metadata: survey })

export const bloomCardSection = (primitives = []) => AIRich.newLayout('IGSuggestedBloomCard', primitives)

export const addonActionSection = (primitives = [], { actionType, alignment = AddonActionAlignment.END } = {}) =>
    layoutSection('AddonAction', primitives, { addon_action_type: actionType, addon_action_alignment: alignment })

const toBytes = (value) => {
    if (value === undefined || value === null) {
        return undefined
    }
    if (Buffer.isBuffer(value)) {
        return Buffer.from(value)
    }
    if (value instanceof Uint8Array) {
        return Buffer.from(value)
    }
    return Buffer.from(String(value), 'base64')
}

const richResponseOf = (msg) => {
    const message = msg?.message ?? msg
    if (!message) {
        return { message: undefined, richResponseMessage: undefined }
    }
    const inner = message.botForwardedMessage?.message ?? message.botForwardedMessage ?? message
    return { message, richResponseMessage: inner?.richResponseMessage }
}

export const readSignedRichResponse = (msg) => {
    const { message, richResponseMessage } = richResponseOf(msg)
    if (!richResponseMessage) {
        return null
    }
    const botMetadata = message.messageContextInfo?.botMetadata
    const proofs = botMetadata?.verificationMetadata?.proofs ?? []
    const proof = proofs.find(item => Number(item?.useCase) === BOT_SIGNATURE_USE_CASE_WA_BOT_MSG)
    const data = toBytes(richResponseMessage.unifiedResponse?.data)
    return {
        richResponseMessage,
        botMetadata,
        botJid: richResponseMessage.contextInfo?.forwardedAiBotMessageInfo?.botJid,
        unifiedResponseBytes: data,
        proof,
        hasProof: !!(proof?.signature?.length && proof?.certificateChain?.length && data?.length)
    }
}

export const verifyRichResponseSignature = (msg, { at } = {}) => {
    const signed = readSignedRichResponse(msg)
    if (!signed) {
        return { status: 'failed', reason: 'not a rich response' }
    }
    return verifyBotSignature({
        botJid: signed.botJid,
        unifiedResponseBytes: signed.unifiedResponseBytes,
        proof: signed.proof,
        at
    })
}

export const forwardRichResponse = async (sock, jid, msg, { quoted, contextInfo, messageId, additionalNodes = [], forwardWrapper = false, ...options } = {}) => {
    const signed = readSignedRichResponse(msg)
    if (!signed) {
        throw new TypeError('forwardRichResponse needs a message carrying a richResponseMessage')
    }
    const { richResponseMessage, botMetadata } = signed
    const relayed = {
        ...structuredClone(richResponseMessage),
        unifiedResponse: signed.unifiedResponseBytes === undefined
            ? richResponseMessage.unifiedResponse
            : { data: signed.unifiedResponseBytes },
        contextInfo: {
            ...structuredClone(richResponseMessage.contextInfo ?? {}),
            ...(contextInfo ?? {}),
            ...(quoted
                ? {
                    stanzaId: quoted.key?.id ?? quoted.id,
                    participant: quoted.key?.participant ?? quoted.participant ?? quoted.key?.remoteJid,
                    quotedMessage: quoted.message ?? quoted
                }
                : {})
        }
    }
    const content = {
        ...(botMetadata ? { messageContextInfo: structuredClone(msg?.message?.messageContextInfo ?? msg?.messageContextInfo ?? {}) } : {}),
        ...AIRich.wrapRichResponse(relayed, forwardWrapper)
    }
    const built = generateWAMessageFromContent(jid, content, { messageId, ...options })
    await sock.relayMessage(jid, built.message, { messageId: built.key.id, additionalNodes })
    return built
}
