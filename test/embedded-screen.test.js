import assert from 'node:assert/strict';
import { AIRich, ContentValidationError } from '../lib/MessageBuilder/index.js';
import { EMBEDDED_SCREEN_PRESENTATION, SourceProvider, botSourcesMetadata, decodeAIRich, embeddedScreen, embeddedTab, htmlSection } from '../lib/MessageBuilder/extras.js';

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

const tabbed = embeddedScreen({ id: 'arcade', tabs: [tab] });
assert.equal(tabbed.tabs.length, 1);
assert.equal('title' in tabbed, false);
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
assert.equal(
    calls[0].message.messageContextInfo.botMetadata.richResponseSourcesMetadata.sources[1].citationNumber,
    7
);

calls.length = 0;
const polos = new AIRich(sock);
polos.addSection(htmlSection('<b>x</b>'));
await polos.send('2@s.whatsapp.net');
const tanpa = decodeAIRich({ message: calls[0].message });
assert.equal('embedded_screens' in tanpa.unified, false);
assert.deepEqual(tanpa.embeddedScreens, []);

assert.throws(() => rich.addEmbeddedScreen('x'), ContentValidationError);
assert.throws(() => rich.addEmbeddedScreen([]), ContentValidationError);

console.log('embedded screen tests passed');
