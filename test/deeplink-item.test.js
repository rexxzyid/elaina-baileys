import assert from 'node:assert/strict';
import { AIRich, Toolkit } from '../lib/MessageBuilder/index.js';
import { AI_RICH_INLINE_ENTITIES } from '../lib/MessageBuilder/extras.js';

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

console.log('deeplink item tests passed');
