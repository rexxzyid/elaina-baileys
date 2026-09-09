import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { SocialMediaPostType, buildSocialPreview, readSocialPreview, videoEndCard } from '../lib/Utils/link-preview-metadata.js';
import { generateWAMessageContent } from '../lib/Utils/messages.js';

const logger = { debug() {}, info() {}, warn() {} };
const withLink = {
    logger,
    getUrlInfo: async () => ({ 'matched-text': 'https://instagram.com/reel/x', title: 'Reel', description: 'd' })
};

/** The enum the client stores as social_media_post_type. */
{
    assert.deepEqual(SocialMediaPostType, {
        NONE: 0, REEL: 1, LIVE_VIDEO: 2, LONG_VIDEO: 3, SINGLE_IMAGE: 4, CAROUSEL: 5
    });
    assert.throws(() => buildSocialPreview({ postType: 9 }), /not one of/);
}

/**
 * The video url and the music node exist both nested in LinkPreviewMetadata and
 * directly on ExtendedTextMessage, and the client does not say which it reads,
 * so both get the same value.
 */
{
    const built = buildSocialPreview({
        postType: SocialMediaPostType.REEL,
        videoUrl: 'https://cdn.test/v.mp4',
        videoCaption: 'Caption',
        muted: true,
        durationSeconds: 30
    });

    assert.equal(built.linkPreviewMetadata.socialMediaPostType, SocialMediaPostType.REEL);
    assert.equal(built.linkPreviewMetadata.videoContentUrl, 'https://cdn.test/v.mp4');
    assert.equal(built.videoContentUrl, 'https://cdn.test/v.mp4', 'and again at the top level');
    assert.equal(built.linkPreviewMetadata.linkMediaDuration, 30);
    assert.equal(built.linkPreviewMetadata.linkInlineVideoMuted, true);
}

/** The duration column is seconds, so milliseconds would be wrong by a thousand. */
{
    assert.equal(buildSocialPreview({ durationSeconds: 30.4 }).linkPreviewMetadata.linkMediaDuration, 30, 'rounded');
    assert.throws(() => buildSocialPreview({ durationSeconds: -1 }), /non-negative/);
    assert.throws(() => buildSocialPreview({ durationSeconds: 'lama' }), /non-negative/);
}

/** Nothing set produces nothing, rather than an empty node. */
{
    assert.deepEqual(buildSocialPreview(), {});
    assert.deepEqual(buildSocialPreview({ endCards: [] }), {});
}

/** End cards are the tiles after the video. */
{
    const card = videoEndCard({ username: 'rexx', caption: 'Next', thumbnailUrl: 'https://t/1.jpg', profilePictureUrl: 'https://t/p.jpg' });
    assert.deepEqual(card, {
        username: 'rexx',
        caption: 'Next',
        thumbnailImageUrl: 'https://t/1.jpg',
        profilePictureUrl: 'https://t/p.jpg'
    });
    assert.deepEqual(videoEndCard({ username: 'rexx' }), { username: 'rexx' }, 'the rest is optional');
}

/** It all survives the encoder and reads back. */
{
    const content = await generateWAMessageContent({
        text: 'lihat ini https://instagram.com/reel/x',
        socialPreview: {
            postType: SocialMediaPostType.REEL,
            videoUrl: 'https://cdn.test/v.mp4',
            videoCaption: 'Caption',
            muted: true,
            durationSeconds: 30,
            endCards: [videoEndCard({ username: 'rexx', caption: 'Next' })]
        }
    }, withLink);

    assert.equal(content.extendedTextMessage.matchedText, 'https://instagram.com/reel/x', 'the link preview is still built');

    const decoded = proto.Message.decode(proto.Message.encode(proto.Message.fromObject(content)).finish());
    const text = decoded.extendedTextMessage;
    assert.equal(text.linkPreviewMetadata.socialMediaPostType, SocialMediaPostType.REEL);
    assert.equal(text.endCardTiles.length, 1);
    assert.equal(text.endCardTiles[0].username, 'rexx');

    assert.deepEqual(readSocialPreview(decoded), {
        postType: SocialMediaPostType.REEL,
        durationSeconds: 30,
        muted: true,
        videoUrl: 'https://cdn.test/v.mp4',
        videoCaption: 'Caption',
        endCards: text.endCardTiles
    });
}

/** A message that carries none of it reads back as null. */
{
    assert.equal(readSocialPreview({ message: { conversation: 'halo' } }), null);
    assert.equal(readSocialPreview({ message: { extendedTextMessage: { text: 'halo' } } }), null);
    assert.equal(readSocialPreview(undefined), null);
}

/** It rides on a link preview, so a message without a link is worth a word. */
{
    const warnings = [];
    await generateWAMessageContent(
        { text: 'tanpa tautan', socialPreview: { postType: SocialMediaPostType.REEL } },
        { logger: { debug() {}, info() {}, warn: message => warnings.push(message) }, getUrlInfo: async () => undefined }
    );
    assert.ok(warnings.some(message => /no matched link/.test(message)));
}

console.log('social preview tests passed');
