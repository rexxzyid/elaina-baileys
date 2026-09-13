export declare const MapQueryStatus: Readonly<Record<string, string>>;
export declare const MapItemMarkerType: Readonly<Record<string, string>>;
export declare const PlaceDetailsItemType: Readonly<Record<string, string>>;
export declare const PlaceOpeningStatus: Readonly<Record<string, string>>;
export declare const PlacePriceLevel: Readonly<Record<string, string>>;
export declare const ClippyArtifactType: Readonly<{ MINI_APP: 'MINI_APP'; STATIC_HTML: 'STATIC_HTML' }>;
export declare const QuotaUpsellMeterUsageType: Readonly<{ META_AI_THINK_HARD: 'META_AI_THINK_HARD' }>;
export declare const SportsLeague: Readonly<Record<string, string>>;
export declare const SportsGameStatus: Readonly<Record<string, string>>;
export declare const SportsSeasonType: Readonly<Record<string, string>>;
export declare const CompactEntityType: Readonly<Record<string, string>>;
export declare const CompactEntityActionType: Readonly<Record<string, string>>;
export declare const ActionListRowType: Readonly<Record<string, string>>;
export declare const SocialEntityItemType: Readonly<Record<string, string>>;
export declare const SourceApp: Readonly<Record<string, string>>;
export declare const PostType: Readonly<Record<string, string>>;
export declare const PostOrientation: Readonly<Record<string, string>>;
export declare const ProductSourceType: Readonly<Record<string, string>>;
export declare const SearchPlannerStepStatus: Readonly<Record<string, string>>;
export declare const OrchestratorSearchEngine: Readonly<Record<string, string>>;
export declare const ProfessionalConsentStatus: Readonly<Record<string, string>>;
export declare const AccountLinkingIntegration: Readonly<Record<string, string>>;
export declare const AccountLinkingStatus: Readonly<Record<string, string>>;
export declare const CalendarEventOperation: Readonly<Record<string, string>>;
export declare const CalendarEventState: Readonly<Record<string, string>>;
export declare const WidgetCtaKind: Readonly<Record<string, string>>;
export declare const WidgetCtaState: Readonly<Record<string, string>>;
export declare const MultipleResponseLayoutType: Readonly<Record<string, string>>;
export declare const ThreadSurfingEntityType: Readonly<Record<string, string>>;
export declare const ThreadSurfingActionType: Readonly<Record<string, string>>;
export declare const MediaShape: Readonly<Record<string, string>>;
export declare const MediaHorizontalAlignment: Readonly<Record<string, string>>;
export declare const MediaVerticalAlignment: Readonly<Record<string, string>>;
export declare const AddonActionAlignment: Readonly<Record<string, string>>;
export declare const ImageAssetQueryStatus: Readonly<Record<string, string>>;
export declare const CodeBlockType: Readonly<Record<string, string>>;
export declare const FollowUpSuggestionCategory: Readonly<Record<string, string>>;
export declare const InformTreatmentRenderingType: Readonly<Record<string, string>>;
export declare const UnifiedResponseSectionType: Readonly<Record<string, string>>;
export declare const UnifiedResponseMessageGroupKind: Readonly<Record<string, string>>;

export declare function customSection(typename: string, fields?: Record<string, any>, options?: { layout?: string }): any;

export declare function placeItem(options?: {
    id?: string | number;
    name?: string;
    description?: string;
    imageUrl?: string;
    itemType?: string;
    categoryId?: string;
    categoryName?: string;
    priceLevel?: string;
    openingStatus?: string;
    openingHours?: { day?: string; time?: string; open?: string; close?: string }[];
    rating?: number;
    latitude?: number;
    longitude?: number;
    streetAddress?: string;
    street?: string;
    locality?: string;
    region?: string;
    country?: string;
    postalCode?: string;
    timezone?: string;
    marketplace?: { price?: string; salePrice?: string; unavailable?: boolean };
}): any;

export declare function mapSection(options?: {
    items?: any[];
    motivation?: string;
    staticMapUrl?: string;
    staticMapDarkUrl?: string;
    queryStatus?: string;
}): any;

export declare function locationPermissionSection(placeholder?: string): any;
export declare function timestampPlaceholderSection(placeholder?: string): any;

export declare function sportsSection(options?: {
    gameId: string | number;
    league?: string;
    status?: string;
    statusDetail?: string;
    startTime?: number;
    venue?: { name?: string; city?: string; state?: string; country?: string };
    group?: string;
    groupName?: string;
    homeTeam?: { name?: string; abbreviation?: string; countryCode?: string; icon?: string; iconFallback?: string };
    awayTeam?: { name?: string; abbreviation?: string; countryCode?: string; icon?: string; iconFallback?: string };
    homeScore?: number | string;
    awayScore?: number | string;
    homeRecord?: { wins?: number; losses?: number; ties?: number };
    awayRecord?: { wins?: number; losses?: number; ties?: number };
    seasonType?: string;
    week?: number | string;
    contentTypename?: string;
}): any;

export declare function videoSection(options?: {
    postId?: string | number;
    title?: string;
    url?: string;
    thumbnailUrl?: string;
    creator?: string;
    avatarUrl?: string;
    contentHash?: string;
    likes?: number;
    comments?: number;
    shares?: number;
    isVerified?: boolean;
    sourceApp?: string;
    progressiveUrls?: string[];
    dashManifests?: string[];
}): any;

export declare function reminderSection(options?: {
    reminderId: string | number;
    title?: string;
    triggerType?: string;
    triggerTime?: number | string;
    createTime?: number | string;
    isDeleted?: boolean;
    thumbnailUrl?: string;
    fullSizeUrl?: string;
    mediaKey?: string;
}): any;

export declare function commentSection(options?: {
    text?: string;
    url?: string;
    actorName?: string;
    profileImage?: string;
    subtitle?: string;
    likes?: number;
    replies?: number;
    isVerified?: boolean;
}): any;

export declare function compactEntitySection(options?: {
    title?: string;
    subtitle?: string;
    secondarySubtitle?: string;
    image?: any;
    entityId?: string | number;
    entityUrl?: string;
    entityType?: string;
    actionType?: string;
    isVerified?: boolean;
}): any;

export declare function actionListRow(options?: {
    title?: string;
    subtitle?: string;
    action?: string;
    icon?: string;
    url?: string;
    rowType?: string;
}): any;

export declare function actionListSection(rows?: any[]): any;

export interface PlannerOptions {
    sources?: any[];
    steps?: any[];
    queryUrl?: string;
    queryFavicon?: string;
    searchEngine?: string;
    facepileFavicons?: string[];
    responseId?: string;
}

export declare function plannerStep(options?: { title?: string; instruction?: string; status?: string }): any;
export declare function searchPlannerSection(options?: PlannerOptions): any;
export declare function searchResultV2Section(options?: PlannerOptions): any;
export declare function plannerSnippetSection(options?: {
    header?: string;
    currentStep?: number;
    totalSteps?: number;
    status?: string;
}): any;

export declare function chainOfThoughtSection(options?: {
    header?: string;
    subtitle?: string;
    plannerState?: any;
    imageArtifacts?: any[];
    text?: string;
}): any;

export declare function searchAdSection(options?: {
    storyId?: string | number;
    actorName?: string;
    actorImageUrl?: string;
    imageUrl?: string;
    message?: string;
}): any;

export declare function transparencySignal(options?: {
    id?: string | number;
    signalType?: string;
    value?: string;
    memory?: string;
}): any;

export declare function transparencySection(options?: {
    annotation?: string;
    signals?: any[];
    responseId?: string;
}): any;

export declare function professionalConsentSection(options?: Record<string, any>): any;

export declare function accountLinkingApp(options?: {
    label?: string;
    integrationFbid?: string | number;
    integrationSlug?: string;
    iconUrl?: string;
}): any;

export declare function accountLinkingSection(options?: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    originalPrompt?: string;
    integrationType?: string;
    integrationStatus?: string;
    integrationId?: string | number;
    apps?: any[];
}): any;

export declare function calendarEvent(options?: {
    title?: string;
    startTime?: string | number;
    endTime?: string | number;
    location?: string;
    description?: string;
    recurrenceText?: string;
    deeplink?: string;
    attendees?: { email?: string; displayName?: string; name?: string }[];
}): any;

export declare function calendarWidgetSection(options?: {
    title?: string;
    iconUrls?: string[];
    sections?: { date?: string; events?: any[] }[];
    ctas?: { label?: string; kind?: string; state?: string; toolCallId?: string; toolName?: string; analyticsAction?: string }[];
    toast?: string;
}): any;

export declare function chainingSuggestionSection(options?: {
    promptText?: string;
    title?: string;
    imageUri?: string;
    externalConversationId?: string;
    topic?: string;
    cardId?: string;
}): any;

export declare function mediaItem(options?: {
    previewUrl?: string;
    fullUrl?: string;
    darkPreviewUrl?: string;
    darkFullUrl?: string;
    source?: string;
    contentHash?: string;
    assetQueryStatus?: string;
    followUpPills?: (string | { promptText?: string; category?: string })[];
}): any;

export declare function mediaGridSection(items?: any[]): any;

export declare function contextualSourcesSection(sources?: {
    uri?: string;
    url?: string;
    displayName?: string;
    title?: string;
    favicon?: string;
}[]): any;

export declare function threadSurfingItem(options?: {
    entity?: string;
    entityType?: string;
    prompts?: (string | { prompt?: string; promptId?: string | number })[];
}): any;

export declare function socialEntityItem(options?: {
    entityId?: string | number;
    name?: string;
    fullName?: string;
    pictureUrl?: string;
    entityUrl?: string;
    entityType?: string;
    isVerified?: boolean;
}): any;

export declare function placeEntityItem(options?: {
    placeId?: string | number;
    name?: string;
    imageUrl?: string;
    motivation?: string;
}): any;

export declare function productEntityItem(options?: {
    productId?: string | number;
    title?: string;
    productUrl?: string;
    imageUrl?: string;
    additionalImages?: string[];
    price?: string;
    salePrice?: string;
    brand?: string;
    sourceType?: string;
    isUnavailable?: boolean;
    adTrackingCode?: string;
}): any;

export declare function sideBySideSurveyItem(options?: {
    surveyId?: string | number;
    threadId?: string | number;
    botId?: string | number;
    responseOtid?: string;
    responseTimestampMs?: number;
    simonSessionFbid?: string;
    tessaSessionFbid?: string;
    testArmName?: string;
}): any;

export declare function multipleResponseSection(responses?: any[], options?: {
    layoutType?: string;
    survey?: any;
}): any;

export declare function bloomCardSection(primitives?: any[]): any;

export declare function addonActionSection(primitives?: any[], options?: {
    actionType?: string;
    alignment?: string;
}): any;

export declare function quotaUpsellButton(button?: {
    label?: string;
    action?: string;
    deeplink?: string;
}): any;

export declare function quotaUpsellSection(options?: {
    title?: string;
    body?: string;
    bodyLine1?: string;
    bodyLine2?: string;
    meterUsageType?: string;
    benefitType?: string;
    buttons?: any[];
}): any;

export interface SignedRichResponse {
    richResponseMessage: any;
    botMetadata?: any;
    botJid?: string;
    unifiedResponseBytes?: Buffer;
    proof?: any;
    /** The proof fields are populated. Says nothing about whether it verifies. */
    hasProof: boolean;
}

export declare function readSignedRichResponse(msg: any): SignedRichResponse | null;

export declare function verifyRichResponseSignature(
    msg: any,
    options?: { at?: number }
): { status: 'passed' | 'failed'; reason?: string };

export declare function forwardRichResponse(sock: any, jid: string, msg: any, options?: {
    quoted?: any;
    contextInfo?: any;
    messageId?: string;
    additionalNodes?: any[];
    [key: string]: any;
}): Promise<any>;
