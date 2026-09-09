import assert from 'node:assert/strict';
import { generateWAMessageContent } from '../lib/Utils/messages.js';

const collect = () => {
    const warnings = [];
    return { warnings, options: { logger: { debug() {}, info() {}, warn: message => warnings.push(message) } } };
};
const cardOf = content => content.extendedTextMessage.contextInfo.externalAdReply;

/**
 * The page url is not a picture. It used to be copied into thumbnailUrl with a
 * cache buster and into mediaUrl, so a caller who passed only a link handed the
 * client an html document to load as the card image.
 */
{
    const { options } = collect();
    const card = cardOf(await generateWAMessageContent({
        text: 'halo',
        externalAdReply: { title: 'Judul', body: 'Isi', url: 'https://example.com/artikel', thumbnail: Buffer.alloc(64, 7) }
    }, options));

    assert.equal(card.sourceUrl, 'https://example.com/artikel', 'the link is still where the card points');
    assert.equal('thumbnailUrl' in card, false, 'and no longer pretends to be an image');
    assert.equal('mediaUrl' in card, false);
    assert.equal(card.thumbnail.length, 64, 'the inline picture is what draws it');
}

/** A real image url is kept, since that is what these fields are for. */
{
    const { options } = collect();
    const card = cardOf(await generateWAMessageContent({
        text: 'halo',
        externalAdReply: {
            title: 'Judul',
            url: 'https://example.com/artikel',
            thumbnailUrl: 'https://cdn.example.com/pic.jpg',
            mediaUrl: 'https://cdn.example.com/pic.jpg'
        }
    }, options));

    assert.equal(card.thumbnailUrl, 'https://cdn.example.com/pic.jpg');
    assert.equal(card.mediaUrl, 'https://cdn.example.com/pic.jpg');
    assert.equal(card.sourceUrl, 'https://example.com/artikel', 'still separate from where it points');
}

/** With no picture at all the card is flat, which is worth saying out loud. */
{
    const { warnings, options } = collect();
    await generateWAMessageContent({ text: 'halo', externalAdReply: { title: 'Judul' } }, options);
    assert.ok(warnings.some(message => /no thumbnail and no thumbnailUrl/.test(message)));

    const quiet = collect();
    await generateWAMessageContent({
        text: 'halo',
        externalAdReply: { title: 'Judul', thumbnail: Buffer.alloc(8, 1) }
    }, quiet.options);
    assert.equal(quiet.warnings.some(message => /no thumbnail/.test(message)), false);
}

/** A thumbnail that is not bytes is refused, as before. */
{
    const { options } = collect();
    await assert.rejects(
        generateWAMessageContent({ text: 'halo', externalAdReply: { thumbnail: 'https://cdn.example.com/pic.jpg' } }, options),
        /Thumbnail must in buffer type/
    );
}

console.log('external ad reply tests passed');
