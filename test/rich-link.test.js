import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import { generateWAMessageContent } from '../lib/Utils/messages.js';

const uploads = [];
const options = {
    logger: { debug() {}, info() {}, warn() {} },
    upload: async (path, meta) => {
        uploads.push({ ...meta, bytes: (await fs.readFile(path)).length });
        return { directPath: '/v/t62.7118-24/link_thumb.enc', url: '' };
    }
};

const cover = Buffer.alloc(4096, 3);

{
    const content = await generateWAMessageContent({
        richLink: {
            text: 'dengerin ini',
            url: 'https://example.com/track',
            title: 'Judul Lagu',
            description: 'Penyanyi',
            image: cover
        }
    }, options);
    const text = content.extendedTextMessage;

    assert.equal(text.matchedText, 'https://example.com/track');
    assert.equal(text.title, 'Judul Lagu');
    assert.equal(text.description, 'Penyanyi');
    assert.ok(text.text.includes('https://example.com/track'), 'the link has to be in the body or nothing renders');
    assert.ok(text.text.startsWith('dengerin ini'), 'and the caller keeps their own words');
    assert.equal(text.contextInfo?.externalAdReply, undefined, 'nothing here goes through the suppressed field');

    assert.equal(text.thumbnailDirectPath, '/v/t62.7118-24/link_thumb.enc');
    assert.equal(text.mediaKey.length, 32);
    assert.equal(text.thumbnailSha256.length, 32);
    assert.equal(text.thumbnailEncSha256.length, 32);
    assert.ok(text.jpegThumbnail.length > 0, 'the inline copy is what shows before the download finishes');
    assert.equal(uploads.at(-1).mediaType, 'thumbnail-link');
}

{
    uploads.length = 0;
    const content = await generateWAMessageContent({
        richLink: { url: 'https://example.com/a', title: 'Kecil', image: cover, large: false }
    }, options);
    const text = content.extendedTextMessage;

    assert.equal(text.text, 'https://example.com/a', 'with no text of their own the link is the body');
    assert.ok(text.jpegThumbnail.length > 0);
    assert.equal(text.thumbnailDirectPath, undefined, 'a small card carries no encrypted thumbnail');
    assert.equal(text.mediaKey, undefined);
}

{
    await assert.rejects(
        generateWAMessageContent({ richLink: { title: 'tanpa link' } }, options),
        /richLink needs a url/
    );
}

{
    uploads.length = 0;
    const content = await generateWAMessageContent({
        text: 'lihat https://example.com/b',
        linkPreview: { 'matched-text': 'https://example.com/b', title: 'Judul', image: cover }
    }, options);
    const text = content.extendedTextMessage;

    assert.equal(text.thumbnailDirectPath, '/v/t62.7118-24/link_thumb.enc', 'linkPreview takes an image too');
    assert.equal(uploads.at(-1).mediaType, 'thumbnail-link');
}

console.log('rich link tests passed');
