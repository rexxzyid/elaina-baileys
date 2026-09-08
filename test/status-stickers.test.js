import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import {
    MusicMessageStyle,
    STICKER_DEFAULT_AREA,
    StatusLinkType,
    channelSticker,
    linkSticker,
    locationSticker,
    messageSticker,
    musicSticker,
    normalizeStickers,
    readStickers,
    buildMusicMessage,
    readMusicMessage,
    stickerArea
} from '../lib/Utils/status-stickers.js';

/**
 * The client positions a sticker from corner 0 and corner 2 of the polygon and
 * multiplies each coordinate by the rendered width and height, so the vertices
 * are fractions of the media, not pixels. Four corners, clockwise from top left.
 */
{
    const area = stickerArea({ x: 0.1, y: 0.2, width: 0.5, height: 0.25 });
    assert.equal(area.length, 4);
    assert.deepEqual(area[0], { x: 0.1, y: 0.2 }, 'top left');
    assert.deepEqual(area[1], { x: 0.6, y: 0.2 }, 'top right');
    assert.deepEqual(area[2], { x: 0.6, y: 0.45 }, 'bottom right');
    assert.deepEqual(area[3], { x: 0.1, y: 0.45 }, 'bottom left');

    assert.notEqual(area[0].x, area[1].x, 'the renderer re-picks corners when two share an edge coordinate');
    assert.notEqual(area[1].y, area[2].y);
}

/** Pixels, percentages and areas running off the media are refused. */
{
    assert.throws(() => stickerArea({ x: 40, y: 100, width: 200, height: 80 }), TypeError);
    assert.throws(() => stickerArea({ x: 0.8, y: 0.1, width: 0.5, height: 0.1 }), TypeError, 'x + width past the edge');
    assert.throws(() => stickerArea({ x: 0.1, y: 0.9, width: 0.1, height: 0.5 }), TypeError);
    assert.throws(() => stickerArea({ x: 0.1, y: 0.1, width: 0, height: 0.2 }), TypeError);
    assert.throws(() => stickerArea({ x: -0.1, y: 0.1, width: 0.2, height: 0.2 }), TypeError);
}

/** Each builder fills exactly one action; the client reads only one per sticker. */
{
    const location = locationSticker({ latitude: -6.2088, longitude: 106.8456, name: 'Jakarta' });
    assert.equal(location.location.degreesLatitude, -6.2088);
    assert.equal(location.location.name, 'Jakarta');
    assert.deepEqual(location.polygonVertices[0], { x: STICKER_DEFAULT_AREA.x, y: STICKER_DEFAULT_AREA.y });

    const channel = channelSticker({ jid: '120363000000000000@newsletter', name: 'Elaina' });
    assert.equal(channel.newsletter.newsletterJid, '120363000000000000@newsletter');
    assert.equal(channel.newsletter.newsletterName, 'Elaina');
    assert.equal(channel.newsletter.serverMessageId, 0);

    const link = linkSticker({ url: 'https://example.com', title: 'Baca' });
    assert.equal(link.tapAction.tapUrl, 'https://example.com');
    assert.equal(link.tapAction.title, 'Baca');
    assert.equal(link.statusLinkType, StatusLinkType.RASTERIZED_LINK_PREVIEW);

    for (const sticker of [location, channel, link]) {
        const actions = ['location', 'newsletter', 'embeddedAction', 'tapAction'].filter(name => sticker[name] !== undefined);
        assert.equal(actions.length, 1, JSON.stringify(actions));
    }
}

/** Music and an embedded message ride in embeddedContent, outside that oneof. */
{
    const music = musicSticker({
        songId: '123',
        title: 'Lagu',
        author: 'Penyanyi',
        startTimeMs: 15000,
        durationMs: 30000,
        artworkSha256: Buffer.alloc(32, 1)
    });
    assert.equal(music.embeddedContent.embeddedMusic.songId, '123');
    assert.equal(music.embeddedContent.embeddedMusic.musicSongStartTimeInMs, 15000);
    assert.equal(music.embeddedContent.embeddedMusic.overlapDurationInMs, 30000);
    assert.equal(music.embeddedContent.embeddedMusic.artworkSha256.length, 32);
    assert.equal(music.location, undefined, 'music is not an action');

    const embedded = messageSticker({ stanzaId: 'ABC', message: { conversation: 'halo' } });
    assert.equal(embedded.embeddedContent.embeddedMessage.stanzaId, 'ABC');
    assert.equal(embedded.embeddedContent.embeddedMessage.message.conversation, 'halo');
}

/** Missing or ambiguous input fails at build time, not on the wire. */
{
    assert.throws(() => locationSticker({ latitude: -6.2 }), TypeError);
    assert.throws(() => channelSticker({ jid: '628123@s.whatsapp.net' }), TypeError);
    assert.throws(() => linkSticker({}), TypeError);
    assert.throws(() => musicSticker({ title: 'Lagu' }), TypeError);
    assert.throws(() => messageSticker({ stanzaId: 'A' }), TypeError);

    assert.throws(() => normalizeStickers([{ polygonVertices: [{ x: 0, y: 0 }], location: {} }]), TypeError, 'needs four corners');
    assert.throws(
        () => normalizeStickers([{ ...locationSticker({ latitude: 1, longitude: 2 }), tapAction: { tapUrl: 'https://x.test' } }]),
        TypeError,
        'two actions on one sticker'
    );
}

/** They survive the real encoder, which is where a wrong field number would die. */
{
    const stickers = normalizeStickers([
        locationSticker({ latitude: -6.2088, longitude: 106.8456, name: 'Jakarta', area: { x: 0.1, y: 0.1, width: 0.4, height: 0.15 } }),
        linkSticker({ url: 'https://example.com', title: 'Baca', linkType: StatusLinkType.RASTERIZED_LINK_FULL_URL }),
        musicSticker({ songId: '123', title: 'Lagu', author: 'Penyanyi', durationMs: 30000 })
    ]);
    const message = proto.Message.fromObject({
        imageMessage: { url: 'https://mmg.whatsapp.net/x', mimetype: 'image/jpeg', interactiveAnnotations: stickers }
    });
    const decoded = proto.Message.decode(proto.Message.encode(message).finish());
    const back = decoded.imageMessage.interactiveAnnotations;

    assert.equal(back.length, 3);
    assert.equal(back[0].location.name, 'Jakarta');
    assert.equal(back[0].polygonVertices.length, 4);
    assert.ok(Math.abs(back[0].polygonVertices[2].x - 0.5) < 1e-9);
    assert.equal(back[1].tapAction.tapUrl, 'https://example.com');
    assert.equal(back[1].statusLinkType, StatusLinkType.RASTERIZED_LINK_FULL_URL);
    assert.equal(back[2].embeddedContent.embeddedMusic.title, 'Lagu');
    assert.equal(Number(back[2].embeddedContent.embeddedMusic.overlapDurationInMs), 30000);
}

/** readStickers turns a received message back into something a bot can branch on. */
{
    const stickers = normalizeStickers([
        locationSticker({ latitude: -6.2088, longitude: 106.8456, area: { x: 0.2, y: 0.3, width: 0.4, height: 0.2 } }),
        channelSticker({ jid: '120363000000000000@newsletter', name: 'Elaina' }),
        musicSticker({ songId: '123', title: 'Lagu' })
    ]);
    const read = readStickers({ imageMessage: { interactiveAnnotations: stickers } });

    assert.deepEqual(read.map(sticker => sticker.kind), ['location', 'channel', 'music']);
    assert.equal(read[0].location.degreesLatitude, -6.2088);
    assert.ok(Math.abs(read[0].area.width - 0.4) < 1e-9);
    assert.ok(Math.abs(read[0].area.height - 0.2) < 1e-9);
    assert.equal(read[1].channel.newsletterName, 'Elaina');
    assert.equal(read[2].music.title, 'Lagu');

    assert.deepEqual(readStickers({ imageMessage: {} }), []);
    assert.deepEqual(readStickers(undefined), []);
    assert.deepEqual(readStickers({ conversation: 'halo' }), []);
}

/**
 * sendMessage takes them as statusStickers next to the image or video.
 * "stickers" is already the sticker-pack content, so the name had to differ.
 */
{
    const { generateWAMessageContent } = await import('../lib/Utils/messages.js');
    const media = Buffer.alloc(1024, 7);
    const options = {
        upload: async () => ({ mediaUrl: 'https://mmg.whatsapp.net/x', directPath: '/x' }),
        logger: { debug() {}, warn() {}, info() {} }
    };

    const image = await generateWAMessageContent({
        image: media,
        caption: 'halo',
        statusStickers: [locationSticker({ latitude: -6.2088, longitude: 106.8456 }), linkSticker({ url: 'https://example.com' })]
    }, options);
    assert.equal(image.imageMessage.interactiveAnnotations.length, 2);
    assert.equal(image.imageMessage.caption, 'halo');
    assert.equal('statusStickers' in image.imageMessage, false, 'the option is consumed, not forwarded');

    const video = await generateWAMessageContent({
        video: media,
        statusStickers: musicSticker({ songId: '1', title: 'Lagu' })
    }, options);
    assert.equal(video.videoMessage.interactiveAnnotations.length, 1, 'a single sticker needs no array');

    await assert.rejects(
        generateWAMessageContent({ document: media, mimetype: 'application/pdf', fileName: 'a.pdf', statusStickers: [linkSticker({ url: 'https://x.test' })] }, options),
        /image or a video/
    );

    await assert.rejects(
        generateWAMessageContent({ stickers: [] }, options),
        error => !/image or a video/.test(error.message),
        'the sticker pack keeps the stickers key, status stickers must not intercept it'
    );
}

/**
 * A standalone musicMessage is the other place EmbeddedMusic travels. WA Web
 * parses it only as a futureproof placeholder ("Music can only be played on
 * your phone"), so this is a phone surface, but the shape is the same.
 */
{
    const content = buildMusicMessage({
        songId: '123',
        title: 'Lagu',
        author: 'Penyanyi',
        durationMs: 30000,
        songUri: 'https://cdn.test/song.m4a',
        artworkUri: 'https://cdn.test/art.jpg'
    });
    assert.equal(content.embeddedMusic.songId, '123');
    assert.equal(content.songUri, 'https://cdn.test/song.m4a');
    assert.equal(content.style, MusicMessageStyle.VINYL);
    assert.equal('contextInfo' in content, false, 'empty fields are dropped');

    const decoded = proto.Message.decode(proto.Message.encode(proto.Message.fromObject({ musicMessage: content })).finish());
    const read = readMusicMessage(decoded);
    assert.equal(read.songId, '123');
    assert.equal(read.title, 'Lagu');
    assert.equal(read.author, 'Penyanyi');
    assert.equal(Number(read.durationMs), 30000);
    assert.equal(read.artworkUri, 'https://cdn.test/art.jpg');
    assert.equal(read.style, MusicMessageStyle.VINYL);

    assert.equal(readMusicMessage({ message: { conversation: 'halo' } }), null);
    assert.equal(readMusicMessage(undefined), null);
    assert.throws(() => buildMusicMessage({ title: 'Lagu' }), TypeError, 'still needs a songId or mediaId');
}

/** sendMessage takes it as music, next to the other content keys. */
{
    const { generateWAMessageContent } = await import('../lib/Utils/messages.js');
    const content = await generateWAMessageContent(
        { music: { songId: '123', title: 'Lagu', songUri: 'https://cdn.test/song.m4a' } },
        { upload: async () => ({}), logger: { debug() {}, warn() {}, info() {} } }
    );
    assert.equal(content.musicMessage.embeddedMusic.songId, '123');
    assert.equal(content.musicMessage.songUri, 'https://cdn.test/song.m4a');
}

console.log('status sticker tests passed');
