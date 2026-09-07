import assert from 'node:assert/strict';
import { AIRich } from '../lib/MessageBuilder/index.js';
import {
    AI_RICH_HTML_PRIMITIVE,
    AI_RICH_INLINE_ENTITIES,
    AI_RICH_ITEMS,
    AI_RICH_LAYOUTS,
    AI_RICH_LAYOUTS_ANDROID_ONLY,
    AI_RICH_PRIMITIVES,
    AI_RICH_PRIMITIVES_ANDROID_ONLY,
    FooterActionType
} from '../lib/MessageBuilder/extras.js';
import {
    accountLinkingApp,
    accountLinkingSection,
    actionListRow,
    actionListSection,
    addonActionSection,
    calendarEvent,
    calendarWidgetSection,
    chainOfThoughtSection,
    chainingSuggestionSection,
    commentSection,
    compactEntitySection,
    contextualSourcesSection,
    customSection,
    locationPermissionSection,
    mapSection,
    mediaGridSection,
    mediaItem,
    multipleResponseSection,
    placeItem,
    plannerSnippetSection,
    plannerStep,
    productEntityItem,
    reminderSection,
    searchAdSection,
    searchPlannerSection,
    searchResultV2Section,
    sideBySideSurveyItem,
    socialEntityItem,
    sportsSection,
    threadSurfingItem,
    timestampPlaceholderSection,
    transparencySection,
    transparencySignal,
    videoSection,
    ActionListRowType,
    CompactEntityType,
    MapQueryStatus,
    MultipleResponseLayoutType,
    SearchPlannerStepStatus,
    SportsGameStatus,
    SportsLeague
} from '../lib/MessageBuilder/metaai.js';

const primitive = section => section.view_model.primitive;

/**
 * An AIRichMessage is what Meta AI forwards, so the builder speaks the whole
 * catalog the WhatsApp client parses, not only the subset WA Web renders. The
 * names below come from the client itself; the ones WA Web has no parser for
 * are listed separately so a caller knows what degrades on desktop.
 */
{
    for (const name of AI_RICH_PRIMITIVES_ANDROID_ONLY) {
        if (name === AI_RICH_HTML_PRIMITIVE) {
            continue;
        }
        assert.ok(AI_RICH_PRIMITIVES.includes(name), name + ' must be in the primitive catalog');
    }
    for (const name of AI_RICH_LAYOUTS_ANDROID_ONLY) {
        assert.ok(AI_RICH_LAYOUTS.includes(name), name + ' must be in the layout catalog');
    }
    assert.ok(AI_RICH_ITEMS.includes('GenAIMediaItem'));
    assert.equal(new Set(AI_RICH_PRIMITIVES).size, AI_RICH_PRIMITIVES.length, 'no duplicate primitives');
}

/**
 * Inline entities stay closed at four. The Web parser dispatches them by
 * __typename and throws on anything else, where an unknown primitive only
 * falls through to the unsupported-node renderer.
 */
{
    assert.equal(AI_RICH_INLINE_ENTITIES.length, 4);
    for (const name of AI_RICH_PRIMITIVES) {
        assert.equal(AI_RICH_INLINE_ENTITIES.includes(name), false, name + ' is not an inline entity');
    }
}

/** The three footer actions the bundle gained since the catalog was written. */
{
    assert.equal(FooterActionType.COPY_LINK, 'COPY_LINK');
    assert.equal(FooterActionType.REMIX_MEDIA, 'REMIX_MEDIA');
    assert.equal(FooterActionType.USE_TEMPLATE, 'USE_TEMPLATE');
}

/** Every helper produces a section the same shape the existing ones do. */
{
    const sections = [
        mapSection({ staticMapUrl: 'https://map.test/s.png', items: [placeItem({ id: '1', name: 'Warung' })] }),
        sportsSection({ gameId: 'g1', league: SportsLeague.EURO, status: SportsGameStatus.LIVE }),
        videoSection({ postId: '9', progressiveUrls: ['https://v.test/a.mp4'] }),
        reminderSection({ reminderId: 'r1', title: 'Bangun' }),
        commentSection({ text: 'halo', actorName: 'Rexx' }),
        compactEntitySection({ title: 'Rexx', entityId: '5' }),
        actionListSection([actionListRow({ title: 'Buka' })]),
        searchPlannerSection({ steps: [plannerStep({ title: 'cari' })] }),
        searchResultV2Section({ queryUrl: 'https://s.test' }),
        plannerSnippetSection({ header: 'Mencari', currentStep: 1, totalSteps: 3 }),
        chainOfThoughtSection({ header: 'Berpikir', text: 'halo' }),
        searchAdSection({ storyId: '3', message: 'iklan' }),
        transparencySection({ annotation: 'a', signals: [transparencySignal({ id: '1', value: 'x' })] }),
        accountLinkingSection({ title: 'Hubungkan', apps: [accountLinkingApp({ label: 'Gmail' })] }),
        calendarWidgetSection({ title: 'Jadwal', sections: [{ date: '2026-09-07', events: [calendarEvent({ title: 'Rapat' })] }] }),
        chainingSuggestionSection({ promptText: 'lanjut' }),
        locationPermissionSection('izinkan lokasi'),
        timestampPlaceholderSection('baru saja')
    ];
    for (const section of sections) {
        assert.equal(section.__typename, 'GenAIUnifiedResponseSection');
        assert.equal(section.view_model.__typename, 'GenAISingleLayoutViewModel');
        assert.ok(primitive(section).__typename.startsWith('GenAI'), 'primitive carries its own typename');
        assert.ok(AI_RICH_PRIMITIVES.includes(primitive(section).__typename), primitive(section).__typename);
    }
}

/** Field names are the client's wire names, not camelCase. */
{
    const map = primitive(mapSection({ staticMapUrl: 'https://map.test/s.png', motivation: 'dekat kamu' }));
    assert.equal(map.__typename, 'GenAIMapPrimitive');
    assert.equal(map.map_query_status, MapQueryStatus.FETCHED);
    assert.equal(map.static_map.default_url, 'https://map.test/s.png');
    assert.equal(map.static_map.dark_theme_url, 'https://map.test/s.png');
    assert.equal(map.motivation, 'dekat kamu');

    const place = placeItem({ id: 7, name: 'Warung', rating: 4.5, latitude: -6.2, longitude: 106.8, categoryName: 'Makanan' });
    assert.equal(place.__typename, 'GenAIPlaceDetailsItem');
    assert.equal(place.id, '7');
    assert.equal(place.rating.avg_rating, 4.5);
    assert.equal(place.address.latitude, -6.2);
    assert.equal(place.category.display_name, 'Makanan');
    assert.equal('description' in place, false, 'empty fields are dropped, not sent as undefined');

    const game = primitive(sportsSection({
        gameId: 'g1',
        homeTeam: { name: 'A', icon: 'https://i.test/a.png' },
        awayTeam: { name: 'B' },
        homeScore: 2,
        awayScore: 1,
        groupName: 'Grup C'
    }));
    assert.equal(game.game_id, 'g1');
    assert.equal(game.group.group_name, 'Grup C');
    assert.equal(game.content.home_team.icon.image.url, 'https://i.test/a.png');
    assert.equal(game.content.away_team.__typename, 'GenAISportsTeam');
    assert.equal(game.content.home_score, 2);

    const video = primitive(videoSection({ postId: 9, progressiveUrls: ['https://v.test/a.mp4'], dashManifests: ['<xml/>'] }));
    assert.equal(video.post_id, '9');
    assert.equal(video.video_delivery_response.progressive_urls[0].progressive_url, 'https://v.test/a.mp4');
    assert.equal(video.video_delivery_response.dash_manifests[0].manifest_xml, '<xml/>');

    const comment = primitive(commentSection({ text: 'halo', likes: 3, replies: 1 }));
    assert.equal(comment.comment_text, 'halo');
    assert.equal(comment.likes_count, 3);
    assert.equal(comment.replies_count, 1);

    const entity = primitive(compactEntitySection({ title: 'Rexx', entityId: 5 }));
    assert.equal(entity.entity_id, '5');
    assert.equal(entity.entity_type, CompactEntityType.PERSON);

    const list = primitive(actionListSection([actionListRow({ title: 'Buka', url: 'https://x.test' })]));
    assert.equal(list.rows[0].__typename, 'GenAIActionListRow');
    assert.equal(list.rows[0].row_type, ActionListRowType.ACTION);

    const planner = primitive(searchPlannerSection({ steps: [plannerStep({ title: 'cari', instruction: 'buka web' })] }));
    assert.equal(planner.steps[0].status, SearchPlannerStepStatus.PLANNED);
    assert.equal(planner.steps[0].instruction.text, 'buka web');
}

/** A few layouts carry their own fields next to the primitives, not on the section. */
{
    const many = multipleResponseSection([{ __typename: 'GenAIMarkdownTextUXPrimitive', text: 'a' }]);
    assert.equal(many.view_model.__typename, 'GenAIMultipleResponseLayoutViewModel');
    assert.equal(many.view_model.responses.length, 1);
    assert.equal(many.view_model.layout_type, MultipleResponseLayoutType.IN_THREAD);
    assert.equal('layout_type' in many, false, 'layout fields sit on the view model');

    const addon = addonActionSection([], { actionType: 'SEND_TO_CHAT' });
    assert.equal(addon.view_model.addon_action_type, 'SEND_TO_CHAT');
    assert.equal(addon.view_model.addon_action_alignment, 'END');
    assert.deepEqual(addon.view_model.primitives, []);
}

/** Items are plain nodes a layout carries; they are not sections themselves. */
{
    const media = mediaItem({ previewUrl: 'https://i.test/p.jpg', fullUrl: 'https://i.test/f.jpg', followUpPills: ['lagi'] });
    assert.equal(media.__typename, 'GenAIMediaItem');
    assert.equal(media.preview_image.url, 'https://i.test/p.jpg');
    assert.equal(media.full_image.url_fallback, 'https://i.test/f.jpg');
    assert.equal(media.follow_up_pills[0].prompt_text, 'lagi');
    assert.equal('dark_mode_full_image' in media, false);

    const grid = mediaGridSection([media]);
    assert.equal(grid.view_model.__typename, 'GenAIGridLayoutViewModel');
    assert.equal(grid.view_model.primitives[0].__typename, 'GenAIMediaItem');

    assert.equal(socialEntityItem({ entityId: 1, name: 'Rexx' }).entity_name, 'Rexx');
    assert.equal(productEntityItem({ productId: 2, imageUrl: 'https://i.test/x.jpg' }).image.url, 'https://i.test/x.jpg');
    assert.equal(threadSurfingItem({ entity: 'Bali', prompts: ['apa itu'] }).prompts[0].prompt_id, '0');
    assert.equal(sideBySideSurveyItem({ surveyId: 4 }).survey_id, '4');
    assert.equal(contextualSourcesSection([{ url: 'https://s.test', title: 'S' }])
        .view_model.primitive.contextual_sources[0].display_name, 'S');
}

/** Anything not modelled yet still goes out, because the client dispatches on __typename alone. */
{
    const section = customSection('GenAISourcedItem', { sourced_item_type: 'THREADS_POST' });
    assert.equal(section.view_model.primitive.__typename, 'GenAISourcedItem');
    assert.equal(section.view_model.primitive.sourced_item_type, 'THREADS_POST');
    assert.equal(section.view_model.__typename, 'GenAISingleLayoutViewModel');

    const gridded = customSection('GenAITopicLinkItem', { title: 'x' }, { layout: 'HScroll' });
    assert.equal(gridded.view_model.__typename, 'GenAIHScrollLayoutViewModel');

    assert.throws(() => customSection(''), TypeError);
}

/** The builder accepts them the same way it accepts the sections it already had. */
{
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => {} };
    const rich = new AIRich(sock);
    rich.addSection(mapSection({ staticMapUrl: 'https://map.test/s.png' }));
    rich.addSection(sportsSection({ gameId: 'g1' }));
    assert.equal(rich.sections.length, 2);
    assert.equal(rich.sections[0].view_model.primitive.__typename, 'GenAIMapPrimitive');
}

console.log('meta ai section tests passed');
