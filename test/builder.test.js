import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { A2UI_BASIC_CATALOG, A2UI_VERSION, BLOKS_A2UI_TYPE, a2uiColumn, a2uiImage, a2uiRow, a2uiSurface, a2uiText, a2uiWidget, decodeBloksWidget, sendA2UI, autoHeight, HTML_APP_BRIDGE, AI_RICH_PRIMITIVES, BLOKS_A2UI_REPLY_ACTION, BLOKS_A2UI_SUPPORTED_ELEMENTS, bloksSection, bloksWidget, decodeAIRich, sendBloksWidget, AI_RICH_INLINE_ENTITIES, AI_RICH_SECTION_TYPENAME, EMBEDDED_SCREEN_PRESENTATION, EMBEDDED_SCREEN_TABBED_TYPENAME, SourceProvider, botSourcesMetadata, embeddedScreen, embeddedTab, embeddedTabbedContent, htmlSection, readEmbeddedSections, readEmbeddedTabs, readRichMessage, HTML_MIME_TYPE, fileLinkSection, fileSection, sendHtmlDocument, FooterActionType, footerActionSection, AI_RICH_HTML_PRIMITIVE, AI_RICH_PRIMITIVES_WEB_RENDERED, lockHeight, sendHtmlApp, AI_RICH_ITEMS, AI_RICH_LAYOUTS } from '../lib/MessageBuilder/extras.js';
import { AIRich, Toolkit, ContentValidationError } from '../lib/MessageBuilder/index.js';
import { checkHtmlApp } from '../lib/Utils/html-app.js';
import { accountLinkingApp, accountLinkingSection, actionListRow, actionListSection, addonActionSection, calendarEvent, calendarWidgetSection, chainOfThoughtSection, chainingSuggestionSection, commentSection, compactEntitySection, contextualSourcesSection, customSection, locationPermissionSection, mapSection, mediaGridSection, mediaItem, multipleResponseSection, placeItem, plannerSnippetSection, plannerStep, productEntityItem, reminderSection, searchAdSection, searchPlannerSection, searchResultV2Section, sideBySideSurveyItem, socialEntityItem, sportsSection, threadSurfingItem, timestampPlaceholderSection, transparencySection, transparencySignal, videoSection, ActionListRowType, CompactEntityType, MapQueryStatus, MultipleResponseLayoutType, SearchPlannerStepStatus, SportsGameStatus, SportsLeague, forwardRichResponse, readSignedRichResponse, verifyRichResponseSignature } from '../lib/MessageBuilder/metaai.js';
import { NATIVE_FLOW_BUTTON_LIMIT, NATIVE_FLOW_NAMES, checkNativeFlowButtons, getNativeFlowNameByButtonName, isWebSupportedButtonName } from '../lib/Utils/native-flow.js';
import { BOT_SIGNATURE_ROOT_CERTIFICATE, constructSignaturePayload, loadBotSignatureRoot, verifyBotSignature } from '../lib/MessageBuilder/bot-signature.js';
import { X509Certificate, sign as cryptoSign, createPrivateKey } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('a2ui', async () => {
    assert.equal(A2UI_VERSION, 'v0.9');
    assert.equal(A2UI_BASIC_CATALOG, 'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json');

    assert.deepEqual(a2uiText('t', 'Halo'), { id: 't', component: 'Text', text: 'Halo', variant: 'body' });
    assert.deepEqual(a2uiText('t', 'Judul', { variant: 'h1' }).variant, 'h1');
    assert.deepEqual(a2uiImage('i', 'https://x/y.jpg'), {
        id: 'i', component: 'Image', url: 'https://x/y.jpg', variant: 'header', fit: 'cover'
    });
    assert.deepEqual(a2uiColumn('root', ['a', 'b']), { id: 'root', component: 'Column', children: ['a', 'b'] });
    assert.equal(a2uiRow('r', []).component, 'Row');

    assert.throws(() => a2uiText('', 'x'), TypeError);
    assert.throws(() => a2uiImage('i', ''), TypeError);
    assert.throws(() => a2uiColumn('root', 'bukan array'), TypeError);

    const components = [
        a2uiColumn('root', ['card_image', 'card_title', 'card_description']),
        a2uiImage('card_image', 'https://pps.whatsapp.net/x.jpg'),
        a2uiText('card_title', 'Welcome!', { variant: 'h1' }),
        a2uiText('card_description', 'Halo!')
    ];

    const surface = a2uiSurface(components, { surfaceId: 'card-1' });
    assert.equal(surface.version, 'v0.9');
    assert.equal(surface.createSurface.surfaceId, 'card-1');
    assert.equal(surface.createSurface.catalogId, A2UI_BASIC_CATALOG);
    assert.equal(surface.createSurface.sendDataModel, false);
    assert.equal(surface.createSurface.components.length, 4);

    assert.throws(() => a2uiSurface([]), TypeError);
    assert.throws(() => a2uiSurface('x'), TypeError);
    assert.throws(() => a2uiSurface([a2uiText('bukan_root', 'x')]), TypeError);

    const widget = a2uiWidget(components, { uuid: 'u-1' });
    assert.equal(widget.type, BLOKS_A2UI_TYPE);
    assert.equal(widget.uuid, 'u-1');
    assert.equal(widget.fallback, '');
    assert.equal(typeof widget.data, 'string');
    assert.equal(JSON.parse(widget.data).createSurface.surfaceId, 'card-u-1');

    const encoded = proto.Message.encode({ interactiveMessage: { bloksWidget: widget } }).finish();
    const back = proto.Message.decode(encoded).interactiveMessage.bloksWidget;
    assert.equal(back.type, BLOKS_A2UI_TYPE);
    assert.deepEqual(JSON.parse(back.data), JSON.parse(widget.data));

    const calls = [];
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message, opts) => { calls.push({ jid, message, opts }); } };

    const button = { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Join', url: 'https://example.com' }) };
    const sent = await sendA2UI(sock, '2@s.whatsapp.net', components, {
        uuid: 'u-2',
        buttons: [button],
        contextInfo: { isForwarded: true, forwardingScore: 1 }
    });

    assert.ok(sent.key.id);
    assert.equal(calls.length, 1);
    const interactive = calls[0].message.interactiveMessage;
    assert.equal(interactive.bloksWidget.type, BLOKS_A2UI_TYPE);
    assert.equal(interactive.bloksWidget.uuid, 'u-2');
    assert.deepEqual(interactive.nativeFlowMessage.buttons, [button]);
    assert.equal(interactive.nativeFlowMessage.messageParamsJson, '{}');
    assert.equal(interactive.nativeFlowMessage.messageVersion, 1);
    assert.equal(interactive.contextInfo.isForwarded, true);
    assert.equal(calls[0].opts.additionalNodes[0].tag, 'biz');

    const decoded = decodeBloksWidget(calls[0].message);
    assert.equal(decoded.type, BLOKS_A2UI_TYPE);
    assert.equal(decoded.params.createSurface.components[2].text, 'Welcome!');

    calls.length = 0;
    await sendA2UI(sock, '2@s.whatsapp.net', components);
    assert.deepEqual(calls[0].message.interactiveMessage.nativeFlowMessage.buttons, []);
    assert.equal(calls[0].message.interactiveMessage.contextInfo, undefined);

    await assert.rejects(() => sendA2UI(null, '2@s.whatsapp.net', components), TypeError);
    await assert.rejects(() => sendA2UI(sock, '', components), TypeError);
    await assert.rejects(() => sendA2UI(sock, '2@s.whatsapp.net', components, { buttons: 'x' }), TypeError);
});

test('airich-map', async () => {
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
    const places = [
        { latitude: -6.2088, longitude: 106.8456, title: 'Warung Sederhana', body: 'Rumah makan padang' },
        { latitude: -6.215, longitude: 106.85, title: 'Bakso Pak Kumis', body: 'Bakso urat' }
    ];

    const richResponse = async rich => (await rich.build('120363@g.us')).message.richResponseMessage;
    const unified = response => JSON.parse(Buffer.from(response.unifiedResponse.data, 'base64').toString());

    /**
     * The client reads a map out of the protobuf submessage, not out of the JSON
     * unified response — AIRichResponseSubMessageType.AI_RICH_RESPONSE_MAP is 7 and
     * carries mapMetadata. A section alone renders nothing, so addMap emits both.
     */
    {
        const rich = new AIRich(sock);
        rich.addMap(places);
        const response = await richResponse(rich);

        const [submessage] = response.submessages;
        assert.equal(submessage.messageType, 7);
        assert.equal(submessage.mapMetadata.annotations.length, 2);
        assert.deepEqual(
            submessage.mapMetadata.annotations.map(annotation => annotation.annotationNumber),
            [1, 2],
            'annotations are numbered from one, the client keys its pins on it'
        );
        assert.equal(submessage.mapMetadata.annotations[0].title, 'Warung Sederhana');
        assert.equal(submessage.mapMetadata.annotations[0].body, 'Rumah makan padang');
        assert.equal(submessage.mapMetadata.showInfoList, true);

        const [section] = unified(response).sections;
        assert.equal(section.view_model.primitive.__typename, 'GenAIMapPrimitive');
        assert.equal(section.view_model.primitive.items.length, 2);
    }

    /** The centre defaults to the middle of the places, and the deltas frame them. */
    {
        const rich = new AIRich(sock);
        rich.addMap(places);
        const { mapMetadata } = (await richResponse(rich)).submessages[0];
        assert.ok(Math.abs(mapMetadata.centerLatitude - -6.2119) < 1e-9);
        assert.ok(Math.abs(mapMetadata.centerLongitude - 106.8478) < 1e-9);
        assert.equal(mapMetadata.latitudeDelta, AIRich.MAP_DELTA);
        assert.equal(mapMetadata.longitudeDelta, AIRich.MAP_DELTA);
    }

    /** An explicit centre wins over the average. */
    {
        const rich = new AIRich(sock);
        rich.addMap(places, { center: { latitude: 0, longitude: 0 }, latitudeDelta: 1, longitudeDelta: 2 });
        const { mapMetadata } = (await richResponse(rich)).submessages[0];
        assert.equal(mapMetadata.centerLatitude, 0);
        assert.equal(mapMetadata.centerLongitude, 0);
        assert.equal(mapMetadata.latitudeDelta, 1);
        assert.equal(mapMetadata.longitudeDelta, 2);
    }

    /** A place without coordinates is refused rather than sent as a pin at 0,0. */
    {
        const rich = new AIRich(sock);
        assert.throws(() => rich.addMap([]), TypeError);
        assert.throws(() => rich.addMap([{ title: 'Warung' }]), TypeError);
        assert.throws(() => rich.addMap([{ latitude: -6.2, longitude: 'x' }]), TypeError);
    }

    /** mapMetadata survives the real encoder, which is where a wrong field would die. */
    {
        const rich = new AIRich(sock);
        rich.addText('*Dekat kamu*');
        rich.addMap(places, { staticMapUrl: 'https://example.com/map.png', motivation: 'tiga terdekat' });
        const built = await rich.build('120363@g.us');
        const decoded = proto.Message.decode(proto.Message.encode(built.message).finish());
        const submessages = decoded.richResponseMessage.submessages;

        assert.equal(submessages.length, 2);
        assert.equal(submessages[0].messageType, 2, 'the text submessage stays first');
        assert.equal(submessages[1].messageType, 7);
        assert.equal(submessages[1].mapMetadata.annotations[1].title, 'Bakso Pak Kumis');
    }
});

test('auto-height', async () => {
    assert.equal(HTML_APP_BRIDGE, 'AndroidBridge');

    assert.throws(() => autoHeight({ min: 0 }), TypeError);
    assert.throws(() => autoHeight({ min: 400, max: 400 }), TypeError);
    assert.throws(() => autoHeight({ settleMs: -1 }), TypeError);
    assert.throws(() => autoHeight({ maxReports: 0 }), TypeError);

    const prelude = autoHeight({ min: 120, max: 640, settleMs: 90, maxReports: 8 });

    assert.match(prelude, /LOW=120,HIGH=640,WAIT=90,CAP=8/);
    assert.match(prelude, /AndroidBridge\.updateSize/);
    assert.match(prelude, /ResizeObserver/);
    assert.match(prelude, /<\/script>$/);
    assert.equal(prelude.split('<script>').length, 2, 'exactly one script tag');

    const page = prelude + '<div>halo</div>';
    const report = checkHtmlApp(page);
    assert.equal(report.ok, true, report.problems.join(' | '));
    assert.deepEqual(report.warnings, [], 'updateSize should settle the height on its own');

    const bare = checkHtmlApp('<div>halo</div>');
    assert.match(bare.warnings.join(' '), /no height settled/);

    const manual = checkHtmlApp('<script>window.AndroidBridge.updateSize(300)</script><div>halo</div>');
    assert.deepEqual(manual.warnings, []);

    /** The prelude must survive being parsed as a real script, not just look right. */
    const body = prelude.replace(/^[\s\S]*?<script>/, '').replace(/<\/script>\s*$/, '');
    new Function(body);

    const calls = [];
    const heights = [300, 300, 420, 300, 420];
    let at = 0;
    const sandbox = {
        AndroidBridge: { updateSize: h => calls.push(h) },
        document: {
            readyState: 'complete',
            documentElement: { get scrollHeight() { return heights[Math.min(at, heights.length - 1)] } },
            body: { get scrollHeight() { return heights[Math.min(at, heights.length - 1)] }, offsetHeight: 0 },
            addEventListener() {}
        },
        addEventListener() {},
        setTimeout: fn => fn(),
        clearTimeout() {},
        ResizeObserver: undefined,
        Math
    };
    sandbox.window = sandbox;

    const run = new Function('window', 'document', 'addEventListener', 'setTimeout', 'clearTimeout', 'ResizeObserver', body);
    run(sandbox, sandbox.document, sandbox.addEventListener, sandbox.setTimeout, sandbox.clearTimeout, undefined);

    assert.deepEqual(calls, [300], 'first measurement reports once');
});

test('bloks-widget', async () => {
    assert.equal(BLOKS_A2UI_TYPE, 'im_a2ui');
    assert.equal(BLOKS_A2UI_REPLY_ACTION, 'a2ui_reply_action');
    assert.deepEqual(BLOKS_A2UI_SUPPORTED_ELEMENTS, ['info_card', 'list_card']);
    assert.equal(AI_RICH_PRIMITIVES.includes('FOABloksPrimitive'), true);

    const section = bloksSection(BLOKS_A2UI_TYPE, { title: 'halo' }, { uuid: 'u-1', versioningId: '123' });
    assert.equal(section.view_model.__typename, 'GenAISingleLayoutViewModel');
    assert.equal(section.view_model.primitive.__typename, 'FOABloksPrimitive');
    assert.equal(section.view_model.primitive.type, BLOKS_A2UI_TYPE);
    assert.equal(section.view_model.primitive.data, '{"title":"halo"}');
    assert.equal(section.view_model.primitive.uuid, 'u-1');
    assert.equal(section.view_model.primitive.initial_response, '');
    assert.equal(section.view_model.primitive.versioning_id, '123');

    assert.equal(bloksSection('t', '{"a":1}').view_model.primitive.data, '{"a":1}');
    assert.equal(bloksSection('t').view_model.primitive.data, '');
    assert.match(bloksSection('t').view_model.primitive.uuid, /^[0-9a-f-]{36}$/);

    assert.throws(() => bloksSection(''), TypeError);
    assert.throws(() => bloksSection(123), TypeError);
    assert.throws(() => bloksSection('t', [1, 2]), TypeError);

    const widget = bloksWidget({ type: BLOKS_A2UI_TYPE, data: { a2ui: 'info_card' }, uuid: 'u-2', fallback: 'buka di aplikasi terbaru' });
    assert.deepEqual(widget, {
        type: BLOKS_A2UI_TYPE,
        data: '{"a2ui":"info_card"}',
        uuid: 'u-2',
        fallback: 'buka di aplikasi terbaru'
    });
    assert.throws(() => bloksWidget({}), TypeError);

    const encoded = proto.Message.encode({ interactiveMessage: { bloksWidget: widget } }).finish();
    const roundTrip = proto.Message.decode(encoded).interactiveMessage.bloksWidget;
    assert.equal(roundTrip.type, widget.type);
    assert.equal(roundTrip.data, widget.data);
    assert.equal(roundTrip.uuid, widget.uuid);
    assert.equal(roundTrip.fallback, widget.fallback);

    const calls = [];
    const sock = {
        user: { id: '1@s.whatsapp.net' },
        relayMessage: async (jid, message, opts) => { calls.push({ jid, message, opts }); }
    };

    const sent = await sendBloksWidget(sock, '2@s.whatsapp.net', {
        type: BLOKS_A2UI_TYPE,
        data: { a2ui_supported_elements: BLOKS_A2UI_SUPPORTED_ELEMENTS.join(', ') },
        fallback: 'Kartu tidak didukung di sini'
    });

    assert.ok(sent.key.id);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].jid, '2@s.whatsapp.net');

    const interactive = calls[0].message.interactiveMessage;
    assert.equal(interactive.bloksWidget.type, BLOKS_A2UI_TYPE);
    assert.equal(interactive.bloksWidget.data, '{"a2ui_supported_elements":"info_card, list_card"}');
    assert.equal(interactive.body.text, 'Kartu tidak didukung di sini');
    assert.equal(interactive.header, undefined);
    assert.equal(interactive.footer, undefined);

    const nodes = calls[0].opts.additionalNodes;
    assert.equal(nodes[0].tag, 'biz');
    assert.equal(nodes[0].content[0].content[0].attrs.name, 'mixed');

    const decoded = decodeBloksWidget(calls[0].message);
    assert.equal(decoded.type, BLOKS_A2UI_TYPE);
    assert.equal(decoded.fallback, 'Kartu tidak didukung di sini');
    assert.deepEqual(decoded.params, { a2ui_supported_elements: 'info_card, list_card' });

    assert.equal(decodeBloksWidget({ message: { conversation: 'halo' } }), null);
    assert.deepEqual(
        decodeBloksWidget({ message: { viewOnceMessage: { message: { interactiveMessage: { bloksWidget: widget } } } } }).params,
        { a2ui: 'info_card' }
    );
    assert.equal(decodeBloksWidget({ message: { interactiveMessage: { bloksWidget: { type: 't', data: 'bukan json' } } } }).params, null);

    calls.length = 0;
    await sendBloksWidget(sock, '2@s.whatsapp.net', { type: 't', body: '' });
    assert.equal(calls[0].message.interactiveMessage.body, undefined);

    calls.length = 0;
    await sendBloksWidget(sock, '2@s.whatsapp.net', { type: 't', fallback: 'f', body: 'beda' });
    assert.equal(calls[0].message.interactiveMessage.body.text, 'beda');

    await assert.rejects(() => sendBloksWidget(null, '2@s.whatsapp.net', { type: 't' }), TypeError);
    await assert.rejects(() => sendBloksWidget(sock, '', { type: 't' }), TypeError);
    await assert.rejects(() => sendBloksWidget(sock, '2@s.whatsapp.net', {}), TypeError);

    const richCalls = [];
    const richSock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => { richCalls.push({ jid, message }); } };
    const { AIRich } = await import('../lib/MessageBuilder/index.js');
    const rich = new AIRich(richSock);
    rich._addContent(bloksSection(BLOKS_A2UI_TYPE, { title: 'kartu' }));
    await rich.send('2@s.whatsapp.net');
    assert.deepEqual(decodeAIRich({ message: richCalls[0].message }).typenames, ['FOABloksPrimitive']);
});

test('deeplink-item', async () => {
    const entities = text => Toolkit.extractIE(text).inline_entities;
    const typenames = text => entities(text).map(entity => entity.metadata.__typename);

    /**
     * The Web parser dispatches inline entities on __typename and throws
     * "inline entity <name>" on anything it does not know. It knows four; the
     * builder only ever produced three.
     */
    {
        assert.deepEqual([...AI_RICH_INLINE_ENTITIES], [
            'GenAIInlineLinkItem',
            'GenAISearchCitationItem',
            'GenAILatexItem',
            'GenAIDeeplinkItem'
        ]);
    }

    /** A > in front of the target marks a deeplink, the same way ! marks untrusted. */
    {
        const [entity] = entities('buka [Setelan](>whatsapp://settings) sekarang');
        assert.equal(entity.metadata.__typename, 'GenAIDeeplinkItem');
        assert.equal(entity.metadata.deeplink_url, 'whatsapp://settings', 'the marker is stripped from the url');
        assert.equal(entity.metadata.text, 'Setelan');
        assert.equal('url' in entity.metadata, false, 'a deeplink carries deeplink_url, not url');
        assert.equal('is_trusted' in entity.metadata, false);
    }

    /** Without the marker nothing changes — an ordinary link is still an inline link. */
    {
        const [entity] = entities('lihat [situs](https://nixel.dev)');
        assert.equal(entity.metadata.__typename, 'GenAIInlineLinkItem');
        assert.equal(entity.metadata.url, 'https://nixel.dev');
        assert.equal(entity.metadata.display_name, 'situs');
        assert.equal(entity.metadata.is_trusted, true);
    }

    /** The untrusted marker keeps working, and the two do not collide. */
    {
        const [entity] = entities('lihat [situs](!https://nixel.dev)');
        assert.equal(entity.metadata.__typename, 'GenAIInlineLinkItem');
        assert.equal(entity.metadata.is_trusted, false);
        assert.equal(entity.metadata.url, 'https://nixel.dev');
    }

    /** All four kinds survive in one string, in order. */
    {
        assert.deepEqual(
            typenames('[a](https://x.test) [b](>fb://profile) [](https://cite.test) [x^2]<https://img.test>'),
            ['GenAIInlineLinkItem', 'GenAIDeeplinkItem', 'GenAISearchCitationItem', 'GenAILatexItem']
        );
    }

    /** Deeplinks get their own placeholder counter, so keys never clash with links. */
    {
        const { text, inline_entities } = Toolkit.extractIE('[a](>app://one) [b](https://two.test) [c](>app://three)');
        const keys = inline_entities.map(entity => entity.key);
        assert.equal(new Set(keys).size, 3, 'every key is distinct');
        assert.equal(keys.filter(key => key.includes('DEEPLINK')).length, 2);
        assert.equal(keys.filter(key => key.includes('HYPERLINK')).length, 1);
        for (const key of keys) {
            assert.ok(text.includes('{{' + key + '}}'), key + ' has a placeholder in the text');
        }
    }

    /** Each kind can be switched off on its own. */
    {
        assert.deepEqual(typenames('[a](>app://one) [b](https://two.test)'), ['GenAIDeeplinkItem', 'GenAIInlineLinkItem']);
        assert.deepEqual(
            Toolkit.extractIE('[a](>app://one) [b](https://two.test)', { deeplink: false }).inline_entities.map(e => e.metadata.__typename),
            ['GenAIInlineLinkItem'],
            'turning deeplinks off leaves the ordinary link alone'
        );
        assert.deepEqual(
            Toolkit.extractIE('[a](>app://one) [b](https://two.test)', { hyperlink: false }).inline_entities.map(e => e.metadata.__typename),
            ['GenAIDeeplinkItem'],
            'and the reverse'
        );
        assert.deepEqual(Toolkit.extractIE('[a](>app://one)', { extract: false }).inline_entities, []);
    }

    /** addText carries them through to the primitive the client reads. */
    {
        const calls = [];
        const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => calls.push(message) };
        const rich = new AIRich(sock);
        rich.addText('buka [Setelan](>whatsapp://settings)');
        const section = rich.sections[0];
        assert.equal(section.view_model.primitive.__typename, 'GenAIMarkdownTextUXPrimitive');
        assert.equal(section.view_model.primitive.inline_entities[0].metadata.__typename, 'GenAIDeeplinkItem');
        assert.equal(section.view_model.primitive.inline_entities[0].metadata.deeplink_url, 'whatsapp://settings');
    }
});

test('embedded-screen', async () => {
    const meta = botSourcesMetadata([
        { url: 'https://a.test', title: 'A', favicon: 'https://a.test/f.ico' },
        { url: 'https://b.test', title: 'B', provider: SourceProvider.GOOGLE, citation: 7, query: 'cari', thumbnail: 'https://b.test/t.jpg' }
    ]);
    assert.equal(meta.sources.length, 2);
    assert.equal(meta.sources[0].sourceProviderUrl, 'https://a.test');
    assert.equal(meta.sources[0].sourceTitle, 'A');
    assert.equal(meta.sources[0].faviconCdnUrl, 'https://a.test/f.ico');
    assert.equal(meta.sources[0].provider, SourceProvider.OTHER);
    assert.equal(meta.sources[0].citationNumber, 1);
    assert.equal('thumbnailCdnUrl' in meta.sources[0], false);
    assert.equal(meta.sources[1].provider, SourceProvider.GOOGLE);
    assert.equal(meta.sources[1].citationNumber, 7);
    assert.equal(meta.sources[1].sourceQuery, 'cari');
    assert.equal(meta.sources[1].thumbnailCdnUrl, 'https://b.test/t.jpg');

    assert.throws(() => botSourcesMetadata([]), TypeError);
    assert.throws(() => botSourcesMetadata('x'), TypeError);
    assert.throws(() => botSourcesMetadata([{ title: 'tanpa url' }]), TypeError);
    assert.throws(() => botSourcesMetadata([['a']]), TypeError);

    const screen = embeddedScreen({ id: 's-1', content: [htmlSection('<b>x</b>')] });
    assert.equal(screen.id, 's-1');
    assert.equal('title' in screen, false, 'no title unless one is given');
    assert.equal(screen.content.length, 1);
    assert.equal('tabs' in screen, false);
    assert.match(embeddedScreen({}).id, /^[0-9a-f-]{36}$/);
    assert.equal(embeddedScreen({}).content, undefined);

    /** UnifiedResponseRepository reads title, so it belongs on the screen after all. */
    assert.equal(embeddedScreen({ title: 'Rincian' }).title, 'Rincian');
    assert.equal('title' in embeddedScreen({}), false, 'omitted rather than sent empty');

    assert.equal(EMBEDDED_SCREEN_PRESENTATION.HALF_HEIGHT, 'HALF_HEIGHT');
    assert.equal(EMBEDDED_SCREEN_PRESENTATION.FULL_HEIGHT, 'FULL_HEIGHT');

    const tab = embeddedTab({ id: 'slots', tabHeader: 'Slots', sections: [htmlSection('<b>slot</b>')] });
    assert.equal(tab.tab_header, 'Slots', 'the model names it tabHeader, the wire names it tab_header');
    assert.equal(tab.id, 'slots');
    assert.equal(tab.sections.length, 1);
    assert.equal('content' in tab, false, 'a tab carries sections, not content');
    assert.match(embeddedTab({}).id, /^[0-9a-f-]{36}$/);
    assert.throws(() => embeddedTab({ sections: 'x' }), TypeError);

    /** A tab is untyped on the wire unless the caller names one. */
    assert.equal('__typename' in tab, false);
    assert.equal(embeddedTab({ typename: 'FOAUnifiedResponseTab' }).__typename, 'FOAUnifiedResponseTab');
    assert.throws(() => embeddedTab({ typename: '  ' }), TypeError);

    /** Every section carries the section typename the client parses against. */
    assert.equal(tab.sections[0].__typename, AI_RICH_SECTION_TYPENAME);
    assert.equal(AI_RICH_SECTION_TYPENAME, 'GenAIUnifiedResponseSection');
    assert.equal(tab.sections[0].view_model.__typename, 'GenAISingleLayoutViewModel');

    /**
     * Tabs ride inside a typed content entry, not as a sibling of content. That is
     * the shape the native client walks: screen -> content[] -> tabs[] -> sections[].
     */
    const tabbed = embeddedScreen({ id: 'arcade', tabs: [tab] });
    assert.equal('tabs' in tabbed, false, 'tabs are nested, never left at screen level');
    assert.equal(tabbed.content.length, 1);
    assert.equal(tabbed.content[0].__typename, EMBEDDED_SCREEN_TABBED_TYPENAME);
    assert.equal(EMBEDDED_SCREEN_TABBED_TYPENAME, 'FOAEmbeddedScreenContentTabbed');
    assert.deepEqual(tabbed.content[0].tabs, [tab]);
    assert.equal('title' in tabbed, false);
    assert.equal('__typename' in tabbed, false, 'the screen itself stays untyped unless asked');
    assert.equal(embeddedScreen({ typename: 'FOAUnifiedResponseEmbeddedScreen' }).__typename, 'FOAUnifiedResponseEmbeddedScreen');

    /** A build that expects a different container name can say so. */
    assert.equal(embeddedScreen({ tabs: [tab], tabsTypename: 'FOAIDButtonSheets' }).content[0].__typename, 'FOAIDButtonSheets');
    assert.deepEqual(embeddedTabbedContent([tab]), { __typename: EMBEDDED_SCREEN_TABBED_TYPENAME, tabs: [tab] });
    assert.throws(() => embeddedTabbedContent('x'), TypeError);

    /** Sections and tabs come back out of either shape. */
    assert.deepEqual(readEmbeddedTabs(tabbed), [tab]);
    assert.deepEqual(readEmbeddedSections(tabbed), tab.sections);
    assert.deepEqual(readEmbeddedTabs({ tabs: [tab] }), [tab], 'a hand-built screen with top level tabs still reads');
    assert.deepEqual(readEmbeddedSections({ content: [htmlSection('<b>flat</b>')] }).length, 1);

    /** Content and tabs can coexist: the tab container is appended after the plain sections. */
    const mixed = embeddedScreen({ content: [htmlSection('<b>intro</b>')], tabs: [tab] });
    assert.equal(mixed.content.length, 2);
    assert.equal(mixed.content[0].__typename, AI_RICH_SECTION_TYPENAME);
    assert.equal(mixed.content[1].__typename, EMBEDDED_SCREEN_TABBED_TYPENAME);

    assert.throws(() => embeddedScreen({ content: 'x' }), TypeError);
    assert.throws(() => embeddedScreen({ tabs: 'x' }), TypeError);

    const calls = [];
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => { calls.push({ jid, message }); } };

    const rich = new AIRich(sock);
    rich.addSection(htmlSection('<b>utama</b>'));
    rich.addEmbeddedScreen(embeddedScreen({ id: 'layar', content: [htmlSection('<b>dalam</b>')] }));
    rich.setBotMetadata({ richResponseSourcesMetadata: meta });
    await rich.send('2@s.whatsapp.net');

    const decoded = decodeAIRich({ message: calls[0].message });
    assert.equal(decoded.embeddedScreens.length, 1);
    assert.equal(decoded.unified.embedded_screens[0].id, 'layar');
    assert.equal(decoded.unified.embedded_screens[0].content[0].view_model.primitive.payload, '<b>dalam</b>');
    assert.equal(decoded.unified.sections[0].__typename, AI_RICH_SECTION_TYPENAME, 'the typename survives the base64 round trip');
    assert.equal(decoded.unified.embedded_screens[0].content[0].__typename, AI_RICH_SECTION_TYPENAME);
    assert.equal(decoded.embeddedSections.length, 1);
    assert.deepEqual(decoded.embeddedTabs, []);
    assert.equal(
        calls[0].message.messageContextInfo.botMetadata.richResponseSourcesMetadata.sources[1].citationNumber,
        7
    );

    calls.length = 0;
    const arcade = new AIRich(sock);
    arcade.addSection(htmlSection('<b>utama</b>'));
    arcade.addEmbeddedScreen(embeddedScreen({ title: 'Preview', tabs: [embeddedTab({ id: 'tab_0', tabHeader: 'Dino Runner', sections: [htmlSection('<b>dino</b>')] })] }));
    await arcade.send('2@s.whatsapp.net');

    const nested = decodeAIRich({ message: calls[0].message });
    const screenWire = nested.unified.embedded_screens[0];
    assert.equal(screenWire.title, 'Preview');
    assert.equal(screenWire.content[0].__typename, EMBEDDED_SCREEN_TABBED_TYPENAME);
    assert.equal(screenWire.content[0].tabs[0].tab_header, 'Dino Runner');
    assert.equal(screenWire.content[0].tabs[0].sections[0].__typename, AI_RICH_SECTION_TYPENAME);
    assert.equal(screenWire.content[0].tabs[0].sections[0].view_model.__typename, 'GenAISingleLayoutViewModel');
    assert.equal(nested.embeddedTabs.length, 1);
    assert.equal(nested.embeddedSections.length, 1);
    assert.equal(readRichMessage({ message: calls[0].message }).html.includes('<b>dino</b>'), true, 'html inside a tab is still readable');

    calls.length = 0;
    const polos = new AIRich(sock);
    polos.addSection(htmlSection('<b>x</b>'));
    await polos.send('2@s.whatsapp.net');
    const tanpa = decodeAIRich({ message: calls[0].message });
    assert.equal('embedded_screens' in tanpa.unified, false);
    assert.deepEqual(tanpa.embeddedScreens, []);

    assert.throws(() => rich.addEmbeddedScreen('x'), ContentValidationError);
    assert.throws(() => rich.addEmbeddedScreen([]), ContentValidationError);
});

test('file-section', async () => {
    assert.equal(HTML_MIME_TYPE, 'text/html');

    const section = fileSection('https://example.com/app.html', {
        title: 'Mini App',
        fileExtension: '.html',
        fileLength: 4096,
        pageCount: 1,
        previewImage: { url: 'https://example.com/t.jpg' }
    });
    const primitive = section.view_model.primitive;
    assert.equal(section.view_model.__typename, 'GenAISingleLayoutViewModel');
    assert.equal(primitive.__typename, 'GenAIFilePrimitive');
    assert.equal(primitive.url, 'https://example.com/app.html');
    assert.equal(primitive.title, 'Mini App');
    assert.equal(primitive.file_extension, 'html');
    assert.equal(primitive.file_length, 4096);
    assert.equal(primitive.page_count, 1);
    assert.deepEqual(primitive.preview_image, { url: 'https://example.com/t.jpg' });

    const bare = fileSection('https://example.com/x').view_model.primitive;
    assert.equal(bare.file_extension, 'html');
    assert.equal(bare.file_length, 0);
    assert.equal(bare.title, '');
    assert.equal('page_count' in bare, false);
    assert.equal('preview_image' in bare, false);
    assert.equal('mime_type' in bare, false);
    assert.equal('uuid' in bare, false);

    assert.equal(fileSection('https://x/y', { fileLength: 'besar' }).view_model.primitive.file_length, 0);
    assert.equal(fileSection('https://x/y.pdf', { fileExtension: 'pdf' }).view_model.primitive.file_extension, 'pdf');
    assert.equal(fileLinkSection('https://x/y').view_model.primitive.__typename, 'GenAIFileLinkPrimitive');

    assert.throws(() => fileSection(''), TypeError);
    assert.throws(() => fileSection('   '), TypeError);
    assert.throws(() => fileSection(), TypeError);
    assert.throws(() => fileLinkSection(42), TypeError);

    const calls = [];
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => { calls.push({ jid, message }); } };

    const rich = new AIRich(sock);
    rich.addSection(fileSection('https://example.com/app.html'));
    rich.addSection(fileLinkSection('https://example.com/doc.pdf', { fileExtension: 'pdf' }));
    await rich.send('2@s.whatsapp.net');

    const decoded = decodeAIRich({ message: calls[0].message });
    assert.deepEqual(decoded.typenames, ['GenAIFilePrimitive', 'GenAIFileLinkPrimitive']);
    assert.equal(decoded.sections[0].view_model.primitive.url, 'https://example.com/app.html');
    assert.equal(decoded.sections[1].view_model.primitive.file_extension, 'pdf');

    console.log('file section tests passed');

    const dokumen = [];
    const docSock = { sendMessage: async (jid, content) => { dokumen.push({ jid, content }); return { key: { id: 'X' } }; } };

    const hasil = await sendHtmlDocument(docSock, '2@s.whatsapp.net', '<h1>halo</h1>', { fileName: 'main.html', caption: 'buka ini' });
    assert.equal(hasil.key.id, 'X');
    assert.equal(dokumen[0].jid, '2@s.whatsapp.net');
    assert.equal(dokumen[0].content.mimetype, 'text/html');
    assert.equal(dokumen[0].content.fileName, 'main.html');
    assert.equal(dokumen[0].content.caption, 'buka ini');
    assert.equal(dokumen[0].content.document.toString('utf-8'), '<h1>halo</h1>');

    dokumen.length = 0;
    await sendHtmlDocument(docSock, '2@s.whatsapp.net', '<b>x</b>');
    assert.equal(dokumen[0].content.fileName, 'app.html');
    assert.equal('caption' in dokumen[0].content, false);

    await sendHtmlDocument(docSock, '2@s.whatsapp.net', '<b>x</b>', { fileName: 'a.HTM' });
    assert.equal(dokumen[1].content.fileName, 'a.HTM');

    await assert.rejects(() => sendHtmlDocument(docSock, '2@s.whatsapp.net', '<b>x</b>', { fileName: 'a.pdf' }), TypeError);
    await assert.rejects(() => sendHtmlDocument(docSock, '2@s.whatsapp.net', ''), TypeError);
    await assert.rejects(() => sendHtmlDocument(docSock, '', '<b>x</b>'), TypeError);
    await assert.rejects(() => sendHtmlDocument(null, '2@s.whatsapp.net', '<b>x</b>'), TypeError);
});

test('footer-action', async () => {
    const section = footerActionSection(FooterActionType.OPEN_FULL_VIEW, { buttonText: 'Buka penuh', actionId: 'a-1' });
    assert.equal(section.view_model.__typename, 'GenAISingleLayoutViewModel');
    assert.equal(section.view_model.primitive.__typename, 'GenAIFooterActionPrimitive');
    assert.equal(section.view_model.primitive.action_type, 'OPEN_FULL_VIEW');
    assert.equal(section.view_model.primitive.action_id, 'a-1');
    assert.equal(section.view_model.primitive.button_text, 'Buka penuh');

    assert.match(footerActionSection(FooterActionType.DOWNLOAD_MEDIA).view_model.primitive.action_id, /^[0-9a-f-]{36}$/);
    assert.equal(footerActionSection(FooterActionType.DOWNLOAD_MEDIA).view_model.primitive.button_text, '');

    assert.throws(() => footerActionSection('OPEN_WINDOW'), TypeError);
    assert.throws(() => footerActionSection(), TypeError);

    const calls = [];
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => { calls.push({ jid, message }); } };

    const rich = new AIRich(sock);
    rich.addSection(htmlSection('<b>isi</b>'));
    rich.addFooterSection(footerActionSection(FooterActionType.OPEN_FULL_VIEW, { buttonText: 'Buka' }));
    await rich.send('2@s.whatsapp.net');

    const decoded = decodeAIRich({ message: calls[0].message });
    assert.deepEqual(decoded.typenames, ['GenAIaeacdsnwHtmlPrimitive']);
    assert.deepEqual(decoded.footerTypenames, ['GenAIFooterActionPrimitive']);
    assert.equal(decoded.footerSections.length, 1);
    assert.equal(decoded.unified.footer_sections[0].view_model.primitive.action_type, 'OPEN_FULL_VIEW');

    calls.length = 0;
    const polos = new AIRich(sock);
    polos.addSection(htmlSection('<b>isi</b>'));
    await polos.send('2@s.whatsapp.net');
    const tanpaFooter = decodeAIRich({ message: calls[0].message });
    assert.equal('footer_sections' in tanpaFooter.unified, false);
    assert.deepEqual(tanpaFooter.footerSections, []);
    assert.deepEqual(tanpaFooter.footerTypenames, []);

    assert.throws(() => rich.addFooterSection('bukan objek'), ContentValidationError);
    assert.throws(() => rich.addFooterSection([]), ContentValidationError);
    assert.equal(rich.clearFooterSections()._footerSections.length, 0);
});

test('html-section', async () => {
    const section = htmlSection('<body>halo</body>', { trustedSources: ['nixel.dev'] });
    assert.equal(section.view_model.__typename, 'GenAISingleLayoutViewModel');
    assert.equal(section.view_model.primitive.__typename, AI_RICH_HTML_PRIMITIVE);
    assert.equal(section.view_model.primitive.payload, '<body>halo</body>');
    assert.deepEqual(section.view_model.primitive.trusted_sources, ['nixel.dev']);

    assert.deepEqual(htmlSection('<b>x</b>').view_model.primitive.trusted_sources, []);

    assert.equal(htmlSection('<b>x</b>').view_model.primitive.payload, '<b>x</b>');

    const locked = htmlSection('<b>x</b>', { height: 300 }).view_model.primitive.payload;
    assert.ok(locked.endsWith('<b>x</b>'));
    assert.ok(locked.includes('height:300px'));
    assert.ok(locked.includes('max-height:300px'));
    assert.ok(locked.includes('__wrap'));
    assert.ok(locked.includes('<' + '/script>'));
    assert.equal(lockHeight(300) + '<b>x</b>', locked);

    assert.throws(() => htmlSection('<b>x</b>', { height: 0 }), TypeError);
    assert.throws(() => htmlSection('<b>x</b>', { height: -5 }), TypeError);
    assert.throws(() => htmlSection('<b>x</b>', { height: 'tall' }), TypeError);

    assert.throws(() => htmlSection(''), TypeError);
    assert.throws(() => htmlSection('   '), TypeError);
    assert.throws(() => htmlSection(123), TypeError);
    assert.throws(() => htmlSection('<b>x</b>', { trustedSources: 'nixel.dev' }), TypeError);

    assert.equal(AI_RICH_PRIMITIVES.includes(AI_RICH_HTML_PRIMITIVE), true);
    assert.equal(AI_RICH_PRIMITIVES_WEB_RENDERED.includes(AI_RICH_HTML_PRIMITIVE), false);

    const calls = [];
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => { calls.push({ jid, message }); } };

    const html = '<body><canvas id="game"></canvas><script>let a=1</script></body>';
    const sent = await sendHtmlApp(sock, '2@s.whatsapp.net', html, {
        title: 'NIXEL DINO',
        label: 'Fiora Sylvie',
        trustedSources: ['nixel.dev']
    });

    assert.ok(sent.key.id);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].jid, '2@s.whatsapp.net');

    const rich = calls[0].message.richResponseMessage;
    assert.equal(rich.messageType, 1);
    assert.deepEqual(rich.submessages, [{ messageType: 2, messageText: 'Fiora Sylvie' }]);
    assert.equal(rich.contextInfo.isForwarded, true);
    assert.equal(rich.contextInfo.forwardOrigin, 4);
    assert.equal(rich.contextInfo.forwardedAiBotMessageInfo.botJid, '867051314767696@bot');

    const meta = calls[0].message.messageContextInfo.botMetadata;
    assert.equal(meta.messageDisclaimerText, 'NIXEL DINO');
    assert.ok(meta.botResponseId);
    assert.ok(meta.verificationMetadata);

    const decoded = decodeAIRich({ message: calls[0].message });
    assert.deepEqual(decoded.typenames, [AI_RICH_HTML_PRIMITIVE]);
    assert.deepEqual(decoded.layouts, ['Single']);
    assert.equal(decoded.sections[0].view_model.primitive.payload, html);

    calls.length = 0;
    await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>ringkas</b>');
    const bare = calls[0].message.richResponseMessage;
    assert.deepEqual(bare.submessages, []);
    assert.ok(bare.unifiedResponse.data);

    calls.length = 0;
    await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>x</b>', { bypassDownload: true });
    assert.equal(calls.length, 2);
    assert.equal(calls[1].message.protocolMessage.type, 14);

    calls.length = 0;
    await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>x</b>', { bypassDownload: false });
    assert.equal(calls.length, 1);

    calls.length = 0;
    await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>x</b>', { includesUnifiedResponse: false });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].message.richResponseMessage.unifiedResponse.data, '');

    calls.length = 0;
    await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>tinggi</b>', { height: 300 });
    const dikunci = decodeAIRich({ message: calls[0].message }).sections[0].view_model.primitive.payload;
    assert.ok(dikunci.includes('height:300px'));
    assert.ok(dikunci.endsWith('<b>tinggi</b>'));

    await assert.rejects(() => sendHtmlApp(null, '2@s.whatsapp.net', '<b>a</b>'), TypeError);
    await assert.rejects(() => sendHtmlApp(sock, '', '<b>a</b>'), TypeError);

    console.log('html section tests passed');

    const kustom = htmlSection('<b>x</b>', { typename: 'FOAHtmlPrimitive' });
    assert.equal(kustom.view_model.primitive.__typename, 'FOAHtmlPrimitive');
    assert.equal(htmlSection('<b>x</b>').view_model.primitive.__typename, AI_RICH_HTML_PRIMITIVE);
    assert.throws(() => htmlSection('<b>x</b>', { typename: '' }), TypeError);
    assert.throws(() => htmlSection('<b>x</b>', { typename: 7 }), TypeError);

    calls.length = 0;
    await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>x</b>', { typename: 'FOAHtmlPrimitive' });
    assert.deepEqual(decodeAIRich({ message: calls[0].message }).typenames, ['FOAHtmlPrimitive']);
});

test('metaai-sections', async () => {
    const primitive = section => section.view_model.primitive;

    /**
     * An AIRichMessage is what Meta AI forwards, so the builder speaks the whole
     * catalog the WhatsApp client parses rather than only the subset WA Web has
     * renderers for. Every name below comes from the client itself.
     */
    {
        assert.ok(AI_RICH_LAYOUTS.includes('MultipleResponse'));
        assert.ok(AI_RICH_LAYOUTS.includes('IGSuggestedBloomCard'));
        assert.ok(AI_RICH_ITEMS.includes('GenAIMediaItem'));
        assert.equal(new Set(AI_RICH_PRIMITIVES).size, AI_RICH_PRIMITIVES.length, 'no duplicate primitives');
        assert.equal(new Set(AI_RICH_LAYOUTS).size, AI_RICH_LAYOUTS.length, 'no duplicate layouts');
        assert.equal(AI_RICH_PRIMITIVES.includes(AI_RICH_HTML_PRIMITIVE), true, 'the html primitive is part of the catalog');
        assert.equal(new Set(AI_RICH_PRIMITIVES_WEB_RENDERED).size, 18, 'the web-rendered subset is eighteen');
        for (const name of AI_RICH_PRIMITIVES_WEB_RENDERED) {
            assert.ok(AI_RICH_PRIMITIVES.includes(name), `${name} has to be in the full catalog too`);
        }
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
});

test('read-rich', async () => {
    const calls = [];
    const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => { calls.push(message); } };
    const last = () => calls[calls.length - 1];

    assert.equal(readRichMessage(null), null);
    assert.equal(readRichMessage({ message: { conversation: 'halo' } }), null);
    assert.equal(readRichMessage({ message: { imageMessage: { url: 'x' } } }), null);

    calls.length = 0;
    await sendA2UI(sock, '2@s.whatsapp.net', [
        a2uiColumn('root', ['t', 'd']),
        a2uiText('t', 'Welcome!', { variant: 'h1' }),
        a2uiText('d', 'Halo dunia')
    ], { uuid: 'u-1', buttons: [{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Join', url: 'https://x' }) }] });

    const a2ui = readRichMessage(last());
    assert.equal(a2ui.kind, 'a2ui');
    assert.equal(a2ui.text, 'Welcome!\nHalo dunia');
    assert.equal(a2ui.a2ui.surfaceId, 'card-u-1');
    assert.equal(a2ui.a2ui.version, 'v0.9');
    assert.equal(a2ui.a2ui.components.length, 3);
    assert.equal(a2ui.bloks.type, 'im_a2ui');
    assert.deepEqual(a2ui.buttons, [{ name: 'cta_url', params: { display_text: 'Join', url: 'https://x' } }]);

    calls.length = 0;
    await sendHtmlApp(sock, '2@s.whatsapp.net', '<b>halo</b>', { title: 'MINI APP', label: 'buka' });
    const html = readRichMessage(last());
    assert.equal(html.kind, 'airich');
    assert.equal(html.title, 'MINI APP');
    assert.deepEqual(html.html, ['<b>halo</b>']);
    assert.deepEqual(html.typenames, ['GenAIaeacdsnwHtmlPrimitive']);
    assert.deepEqual(html.submessages, [{ messageType: 2, messageText: 'buka' }]);
    assert.ok(html.responseId);

    calls.length = 0;
    const rich = new AIRich(sock);
    rich.setTitle('JUDUL');
    rich.addText('baris pertama');
    rich.addText('baris kedua');
    rich.addSection(htmlSection('<i>x</i>'));
    await rich.send('2@s.whatsapp.net');
    assert.ok(calls.length >= 1);
    const teks = readRichMessage(calls[0]);
    assert.equal(teks.kind, 'airich');
    assert.ok(teks.text.includes('baris pertama'));
    assert.ok(teks.text.includes('baris kedua'));
    assert.deepEqual(teks.html, ['<i>x</i>']);

    calls.length = 0;
    await sendBloksWidget(sock, '2@s.whatsapp.net', { type: 'im_lain', data: { a: 1 }, fallback: 'tidak didukung' });
    const bloks = readRichMessage(last());
    assert.equal(bloks.kind, 'bloks');
    assert.equal(bloks.bloks.type, 'im_lain');
    assert.deepEqual(bloks.bloks.params, { a: 1 });
    assert.equal(bloks.a2ui, undefined);
    assert.equal(bloks.text, 'tidak didukung');

    const dibungkus = { message: { viewOnceMessageV2: { message: last().interactiveMessage ? { interactiveMessage: last().interactiveMessage } : {} } } };
    assert.equal(readRichMessage(dibungkus).kind, 'bloks');

    const polos = readRichMessage({
        message: { interactiveMessage: { body: { text: 'badan' }, footer: { text: 'kaki' }, nativeFlowMessage: { buttons: [{ name: 'x', buttonParamsJson: 'bukan json' }] } } }
    });
    assert.equal(polos.kind, 'interactive');
    assert.equal(polos.text, 'badan\nkaki');
    assert.deepEqual(polos.buttons, [{ name: 'x', params: null }]);

    const kedua = calls.map(readRichMessage).filter(Boolean);
    assert.equal(kedua.length, 1);
});

test('native-flow', async () => {
    assert.equal(NATIVE_FLOW_NAMES.includes('single_select'), false);
    assert.equal(NATIVE_FLOW_NAMES.includes('send_location'), false);
    assert.equal(NATIVE_FLOW_NAMES.includes('quick_reply'), true);

    assert.equal(getNativeFlowNameByButtonName('single_select'), undefined);
    assert.equal(getNativeFlowNameByButtonName('review_and_pay'), 'order_details');
    assert.equal(getNativeFlowNameByButtonName('open_webview'), 'message_with_link');

    assert.equal(isWebSupportedButtonName('quick_reply'), true);
    assert.equal(isWebSupportedButtonName('cta_url'), true);
    assert.equal(isWebSupportedButtonName('single_select'), false);
    assert.equal(isWebSupportedButtonName('review_and_pay'), false);

    const selection = checkNativeFlowButtons([{ name: 'single_select' }]);
    assert.equal(selection.ok, false);
    assert.deepEqual(selection.unsupported, ['single_select']);

    const tooManyReplies = checkNativeFlowButtons(new Array(NATIVE_FLOW_BUTTON_LIMIT.quickReply + 1).fill({ name: 'quick_reply' }));
    assert.equal(tooManyReplies.ok, false);
    assert.equal(tooManyReplies.limit, NATIVE_FLOW_BUTTON_LIMIT.quickReply);

    const atLimit = checkNativeFlowButtons(new Array(NATIVE_FLOW_BUTTON_LIMIT.quickReply).fill({ name: 'quick_reply' }));
    assert.equal(atLimit.ok, true);

    const tooManyCtas = checkNativeFlowButtons(new Array(NATIVE_FLOW_BUTTON_LIMIT.other + 1).fill({ name: 'cta_url' }));
    assert.equal(tooManyCtas.ok, false);
    assert.equal(tooManyCtas.limit, NATIVE_FLOW_BUTTON_LIMIT.other);

    const mixed = checkNativeFlowButtons([{ name: 'quick_reply' }, { name: 'cta_url' }]);
    assert.equal(mixed.ok, false);

    assert.equal(checkNativeFlowButtons([{ name: 'cta_url' }, { name: 'cta_call' }]).ok, true);
    assert.equal(checkNativeFlowButtons([]).ok, true);
    assert.equal(checkNativeFlowButtons(['cta_copy']).ok, true);
});

test('forward-rich-response', async () => {
    /** A real, parsable certificate stands in for the chain; it will not verify. */
    const realDer = Buffer.from(new X509Certificate(BOT_SIGNATURE_ROOT_CERTIFICATE).raw);

    const unifiedBytes = Buffer.from(JSON.stringify({
        response_id: 'r-1',
        sections: [{ __typename: 'GenAIUnifiedResponseSection', view_model: { primitive: { text: 'halo', __typename: 'GenAIMarkdownTextUXPrimitive' }, __typename: 'GenAISingleLayoutViewModel' } }]
    }));

    /** A message shaped the way one really arrives from the Meta AI bot. */
    const source = {
        messageContextInfo: {
            botMetadata: {
                botResponseId: 'b-1',
                messageDisclaimerText: 'Meta AI',
                verificationMetadata: {
                    proofs: [{
                        version: 1,
                        useCase: 1,
                        signature: Buffer.alloc(64, 9),
                        certificateChain: [realDer, realDer]
                    }]
                }
            }
        },
        botForwardedMessage: {
            message: {
                richResponseMessage: {
                    messageType: 1,
                    unifiedResponse: { data: unifiedBytes },
                    submessages: [{ messageType: 2, messageText: 'halo' }],
                    contextInfo: {
                        isForwarded: true,
                        forwardingScore: 1,
                        forwardedAiBotMessageInfo: { botJid: '867051314767696@bot', botName: 'Meta AI' }
                    }
                }
            }
        }
    };

    const incoming = () => proto.Message.decode(proto.Message.encode(proto.Message.fromObject(source)).finish());

    /**
     * The signed payload is version || botFbid || unified response bytes. Nothing
     * about the sender, the message id or the timestamp goes into it, so relaying
     * those three unchanged keeps the proof valid — that is what makes forwarding
     * a Meta AI answer work at all.
     */
    {
        const signed = readSignedRichResponse({ message: incoming() });
        assert.equal(signed.hasProof, true);
        assert.equal(signed.botJid, '867051314767696@bot');
        assert.equal(signed.proof.useCase, 1);
        assert.deepEqual(Buffer.from(signed.unifiedResponseBytes), unifiedBytes);
    }

    /** Relaying keeps the bytes, the proof and the bot jid identical. */
    {
        const calls = [];
        const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => calls.push(message) };
        await forwardRichResponse(sock, '120363@g.us', { message: incoming() });

        const [relayed] = calls;
        const encoded = proto.Message.decode(proto.Message.encode(proto.Message.fromObject(relayed)).finish());
        const rich = encoded.richResponseMessage;

        assert.deepEqual(Buffer.from(rich.unifiedResponse.data), unifiedBytes, 'the signed bytes are untouched');
        assert.equal(rich.contextInfo.forwardedAiBotMessageInfo.botJid, '867051314767696@bot');

        const proof = encoded.messageContextInfo.botMetadata.verificationMetadata.proofs[0];
        assert.equal(proof.useCase, 1);
        assert.deepEqual(Buffer.from(proof.signature), Buffer.alloc(64, 9), 'the proof travels verbatim');
        assert.equal(proof.certificateChain.length, 2);
        assert.deepEqual(Buffer.from(proof.certificateChain[0]), realDer);
        assert.equal(rich.submessages[0].messageText, 'halo');
    }

    /** Quoting and extra contextInfo are safe: contextInfo is not part of the payload. */
    {
        const calls = [];
        const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async (jid, message) => calls.push(message) };
        await forwardRichResponse(sock, '120363@g.us', { message: incoming() }, {
            quoted: { key: { id: 'Q1', participant: '628@s.whatsapp.net' }, message: { conversation: 'tanya' } },
            contextInfo: { mentionedJid: ['628@s.whatsapp.net'] }
        });

        const rich = calls[0].richResponseMessage;
        assert.equal(rich.contextInfo.stanzaId, 'Q1');
        assert.deepEqual(rich.contextInfo.mentionedJid, ['628@s.whatsapp.net']);
        assert.equal(rich.contextInfo.forwardedAiBotMessageInfo.botJid, '867051314767696@bot', 'the signed bot jid stays');
        assert.deepEqual(Buffer.from(rich.unifiedResponse.data), unifiedBytes);
    }

    /**
     * hasProof only says the fields are populated. Whether the client accepts it is
     * a separate question, and the placeholder MessageBuilder attaches never does.
     */
    {
        const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
        const rich = new AIRich(sock);
        rich.addText('halo');
        const built = await rich.build('120363@g.us');

        const signed = readSignedRichResponse(built);
        assert.equal(signed.hasProof, true, 'the fields are filled in');

        const verdict = verifyRichResponseSignature(built);
        assert.equal(verdict.status, 'failed', 'but it is not a signature Meta issued');
        assert.notDeepEqual(Buffer.from(signed.unifiedResponseBytes), unifiedBytes);
    }

    /** The fixture proof here is filler too, so the relayed copy fails the same way. */
    {
        const verdict = verifyRichResponseSignature({ message: incoming() });
        assert.equal(verdict.status, 'failed');
        assert.match(verdict.reason, /chain broken|validity window|does not match/);
    }

    /** Anything that is not a rich response is refused rather than half-relayed. */
    {
        const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => {} };
        assert.equal(readSignedRichResponse({ message: { conversation: 'halo' } }), null);
        await assert.rejects(forwardRichResponse(sock, '120363@g.us', { message: { conversation: 'halo' } }), TypeError);
    }

    /**
     * Loading and rebuilding used to re-serialise the JSON and swap in placeholder
     * metadata, so a copy could never verify even when nothing was touched. As long
     * as nothing is edited the original bytes and the original proof go back out.
     */
    {
        const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
        const rich = new AIRich(sock);
        rich.loadFrom({ message: incoming() });
        assert.equal(rich.isSignaturePreserved, true);

        const built = await rich.build('120363@g.us');
        const out = built.message.richResponseMessage;
        assert.deepEqual(Buffer.from(out.unifiedResponse.data), unifiedBytes, 'byte for byte, not re-serialised');
        assert.deepEqual(
            Buffer.from(built.message.messageContextInfo.botMetadata.verificationMetadata.proofs[0].signature),
            Buffer.alloc(64, 9),
            'the real proof, not the placeholder'
        );
    }

    /** Every mutation drops it, because the bytes it covers no longer match. */
    {
        const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
        const mutations = [
            rich => rich.addText('tambahan'),
            rich => rich.addSection({ __typename: 'GenAIUnifiedResponseSection', view_model: { primitive: { text: 'x', __typename: 'GenAIMarkdownTextUXPrimitive' }, __typename: 'GenAISingleLayoutViewModel' } }),
            rich => { rich.assignId(0, 'n0'); rich.delete('n0'); },
            rich => rich.addFooterSection({ __typename: 'GenAIUnifiedResponseSection' }),
            rich => rich.clearFooterSections(),
            rich => rich.addEmbeddedScreen({ id: 's1' }),
            rich => rich.setResponseId('r-2'),
            rich => rich.refreshResponseId(),
            rich => rich.setResponseMeta({ surface: 'x' })
        ];
        for (const mutate of mutations) {
            const rich = new AIRich(sock);
            rich.loadFrom({ message: incoming() });
            mutate(rich);
            assert.equal(rich.isSignaturePreserved, false, mutate.toString());
        }

        const edited = new AIRich(sock);
        edited.loadFrom({ message: incoming() });
        edited.addText('tambahan');
        const built = await edited.build('120363@g.us');
        const data = built.message.richResponseMessage.unifiedResponse.data;
        assert.notDeepEqual(Buffer.from(String(data), 'base64'), unifiedBytes);
    }

    /** A message that never carried a proof has nothing to preserve. */
    {
        const sock = { user: { id: '1@s.whatsapp.net' }, relayMessage: async () => ({ key: { id: 'x' } }) };
        const plain = new AIRich(sock);
        plain.addText('halo');
        const built = await plain.build('120363@g.us');

        const reloaded = new AIRich(sock);
        reloaded.loadFrom(built);
        assert.equal(reloaded.isSignaturePreserved, false, 'placeholder metadata is not a proof to carry over');
    }
});

test('bot-signature', async () => {
    /**
     * The root the client ships is the anchor every proof has to chain to. If Meta
     * rotates it this assertion is the first thing that fails.
     */
    {
        const root = loadBotSignatureRoot();
        assert.match(root.subject, /Meta WA Feature Root CA/);
        assert.equal(root.ca, true);
        assert.equal(root.verify(root.publicKey), true, 'the root is self-signed');
        assert.equal(root.publicKey.asymmetricKeyType, 'ec');
        assert.equal(loadBotSignatureRoot(), root, 'parsed once and cached');
        assert.ok(BOT_SIGNATURE_ROOT_CERTIFICATE.includes('BEGIN CERTIFICATE'));
    }

    /** version || botFbid || unified response bytes, concatenated, nothing else. */
    {
        const payload = constructSignaturePayload({ botFbid: '867051314767696', messageDigest: Buffer.from('halo') });
        assert.deepEqual(payload, Buffer.concat([Buffer.from('1'), Buffer.from('867051314767696'), Buffer.from('halo')]));
    }

    let openssl = true;
    try {
        execFileSync('openssl', ['version'], { stdio: 'ignore' });
    }
    catch {
        openssl = false;
    }

    if (!openssl) {
        console.log('bot signature tests passed (openssl absent, chain tests skipped)');
    }
    else {
        const dir = mkdtempSync(join(tmpdir(), 'botsig-'));
        const path = name => join(dir, name);
        const run = args => execFileSync('openssl', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });

        try {
            run(['ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', path('ca.key')]);
            run(['req', '-x509', '-new', '-key', path('ca.key'), '-sha256', '-days', '3650',
                '-subj', '/CN=Test Root', '-out', path('ca.pem')]);

            run(['genpkey', '-algorithm', 'ed25519', '-out', path('leaf.key')]);
            run(['req', '-new', '-key', path('leaf.key'), '-subj', '/CN=Test Bot Leaf', '-out', path('leaf.csr')]);
            writeFileSync(path('ext.cnf'), 'basicConstraints=CA:FALSE\nkeyUsage=digitalSignature\n');
            run(['x509', '-req', '-in', path('leaf.csr'), '-CA', path('ca.pem'), '-CAkey', path('ca.key'),
                '-CAcreateserial', '-days', '3650', '-extfile', path('ext.cnf'), '-out', path('leaf.pem')]);

            const root = new X509Certificate(readFileSync(path('ca.pem')));
            const leaf = new X509Certificate(readFileSync(path('leaf.pem')));
            const leafKey = createPrivateKey(readFileSync(path('leaf.key')));

            const botJid = '867051314767696@bot';
            const unifiedResponseBytes = Buffer.from(JSON.stringify({ response_id: 'r-1', sections: [] }));
            const signature = cryptoSign(null, constructSignaturePayload({
                botFbid: '867051314767696',
                messageDigest: unifiedResponseBytes
            }), leafKey);

            const proof = { version: 1, useCase: 1, signature, certificateChain: [leaf.raw] };

            /** A proof that chains to the root and covers these exact bytes passes. */
            {
                const result = verifyBotSignature({ botJid, unifiedResponseBytes, proof, root });
                assert.deepEqual(result, { status: 'passed' }, result.reason);
            }

            /** Change one byte of the payload and it stops matching. */
            {
                const tampered = Buffer.from(unifiedResponseBytes);
                tampered[tampered.length - 2] ^= 1;
                const result = verifyBotSignature({ botJid, unifiedResponseBytes: tampered, proof, root });
                assert.equal(result.status, 'failed');
                assert.match(result.reason, /does not match/);
            }

            /** The bot fbid is inside the payload, so relaying under another bot fails. */
            {
                const result = verifyBotSignature({ botJid: '123456@bot', unifiedResponseBytes, proof, root });
                assert.equal(result.status, 'failed');
                assert.match(result.reason, /does not match/);
            }

            /** A leaf that chains to some other CA is refused. */
            {
                const result = verifyBotSignature({ botJid, unifiedResponseBytes, proof, root: loadBotSignatureRoot() });
                assert.equal(result.status, 'failed');
                assert.match(result.reason, /chain broken|threw/);
            }

            /** Filler bytes in place of a real proof never pass. */
            {
                const placeholder = { version: 1, useCase: 1, signature: Buffer.alloc(64, 9), certificateChain: [Buffer.alloc(48, 3)] };
                const result = verifyBotSignature({ botJid, unifiedResponseBytes, proof: placeholder, root });
                assert.equal(result.status, 'failed');
                assert.match(result.reason, /did not parse/);
            }

            /** Every missing piece names itself rather than failing vaguely. */
            {
                const cases = [
                    [{ botJid, unifiedResponseBytes, proof: undefined }, /no WA_BOT_MSG proof/],
                    [{ botJid, unifiedResponseBytes, proof: { ...proof, version: 2 } }, /unsupported signature version/],
                    [{ botJid, unifiedResponseBytes, proof: { ...proof, signature: undefined } }, /no signature/],
                    [{ botJid, unifiedResponseBytes, proof: { ...proof, certificateChain: [] } }, /empty certificate chain/],
                    [{ botJid, unifiedResponseBytes: Buffer.alloc(0), proof }, /no unified response bytes/],
                    [{ botJid: '', unifiedResponseBytes, proof }, /no bot jid/]
                ];
                for (const [input, pattern] of cases) {
                    const result = verifyBotSignature({ ...input, root });
                    assert.equal(result.status, 'failed', JSON.stringify(input));
                    assert.match(result.reason, pattern);
                }
            }

            /** An expired leaf is caught before the signature is even checked. */
            {
                const future = Date.parse(leaf.validTo) + 86400000;
                const result = verifyBotSignature({ botJid, unifiedResponseBytes, proof, root, at: future });
                assert.equal(result.status, 'failed');
                assert.match(result.reason, /validity window/);
            }

            console.log('bot signature tests passed');
        }
        finally {
            rmSync(dir, { recursive: true, force: true });
        }
    }
});

test('airich-wrapper', async () => {
    const build = (options) => new AIRich({}).addText('halo').build('628@s.whatsapp.net', options);

    const plain = await build();
    assert.ok(plain.message.richResponseMessage,
        'the default is unwrapped, because botForwardedMessage is only unwrapped when ai_rich_response_forward_receiving_enabled is on and that prop defaults to false');
    assert.equal(plain.message.botForwardedMessage, null);

    const wrapped = await build({ forwardWrapper: true });
    assert.ok(wrapped.message.botForwardedMessage?.message?.richResponseMessage, 'the old shape is still reachable on request');
    assert.equal(wrapped.message.richResponseMessage, null);

    for (const [name, msg] of [['plain', plain], ['wrapped', wrapped]]) {
        assert.equal(decodeAIRich(msg.message)?.sections?.length, 1, `${name} still decodes`);
    }

    const rich = new AIRich({}).addText('halo');
    const built = await rich.build('628@s.whatsapp.net');

    const edit = await rich.buildEdit('628@s.whatsapp.net', built.key.id, { msg: built.message });
    assert.equal(edit.message.protocolMessage.type, 14, 'the edit follows the same shape');
    assert.equal(edit.message.botForwardedMessage, null);

    const editWrapped = await rich.buildEdit('628@s.whatsapp.net', built.key.id, { msg: built.message, forwardWrapper: true });
    assert.equal(editWrapped.message.botForwardedMessage.message.protocolMessage.type, 14);
});
