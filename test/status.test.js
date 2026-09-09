import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { MusicMessageStyle, STICKER_DEFAULT_AREA, StatusLinkType, channelSticker, linkSticker, locationSticker, messageSticker, musicSticker, normalizeStickers, readStickers, buildMusicMessage, isMusicHostAllowed, MUSIC_ALLOWED_HOSTS, readMusicMessage, stickerArea } from '../lib/Utils/status-stickers.js';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StatusFont, AssociationType, StatusNotificationType } from '../lib/Types/Message.js';
import { generateWAMessage, normalizeMessageContent, getContentType } from '../lib/Utils/messages.js';
import { STATUS_NOTIFICATION_TYPES, makeMessageAssociation, makeStatusAddYoursAssociation, makeStatusMentionMessage, prepareModernMessageContent, STATUS_AUDIENCE_DEFAULT_EMOJI, STATUS_AUDIENCE_DEFAULT_LIST_NAME, makeStatusAudienceMetadata } from '../lib/Utils/modern-messages.js';

test('status-stickers', async () => {
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
            songUri: 'https://mmg.whatsapp.net/v/song.m4a',
            artworkUri: 'https://mmg.whatsapp.net/v/art.jpg'
        });
        assert.equal(content.embeddedMusic.songId, '123');
        assert.equal(content.songUri, 'https://mmg.whatsapp.net/v/song.m4a');
        assert.equal(content.style, MusicMessageStyle.VINYL);
        assert.equal('contextInfo' in content, false, 'empty fields are dropped');

        const decoded = proto.Message.decode(proto.Message.encode(proto.Message.fromObject({ musicMessage: content })).finish());
        const read = readMusicMessage(decoded);
        assert.equal(read.songId, '123');
        assert.equal(read.title, 'Lagu');
        assert.equal(read.author, 'Penyanyi');
        assert.equal(Number(read.durationMs), 30000);
        assert.equal(read.artworkUri, 'https://mmg.whatsapp.net/v/art.jpg');
        assert.equal(read.style, MusicMessageStyle.VINYL);

        assert.equal(readMusicMessage({ message: { conversation: 'halo' } }), null);
        assert.equal(readMusicMessage(undefined), null);
        assert.throws(() => buildMusicMessage({ title: 'Lagu' }), TypeError, 'still needs a songId or mediaId');
    }

    /** sendMessage takes it as music, next to the other content keys. */
    {
        const { generateWAMessageContent } = await import('../lib/Utils/messages.js');
        const content = await generateWAMessageContent(
            { music: { songId: '123', title: 'Lagu', songUri: 'https://mmg.whatsapp.net/v/song.m4a' } },
            { upload: async () => ({}), logger: { debug() {}, warn() {}, info() {} } }
        );
        assert.equal(content.musicMessage.embeddedMusic.songId, '123');
        assert.equal(content.musicMessage.songUri, 'https://mmg.whatsapp.net/v/song.m4a');
    }

    /**
     * ConversationRowMusic checks the host of both uris against a fixed allowlist
     * and logs "song host not allowed" / "artwork host not allowed" before it ever
     * builds the track — the message arrives and simply draws nothing. Refuse at
     * build time instead of shipping something invisible.
     */
    {
        assert.deepEqual([...MUSIC_ALLOWED_HOSTS], [
            '.whatsapp.net', '.whatsapp.com', '.fbcdn.net', '.facebook.com', '.instagram.com', '.cdninstagram.com'
        ]);

        assert.equal(isMusicHostAllowed('https://mmg.whatsapp.net/v/t62.1/abc'), true);
        assert.equal(isMusicHostAllowed('https://scontent.fbcdn.net/v/x.jpg'), true);
        assert.equal(isMusicHostAllowed('https://whatsapp.net/x'), true, 'the bare domain counts too');

        assert.equal(isMusicHostAllowed('https://files.catbox.moe/x.mp3'), false);
        assert.equal(isMusicHostAllowed('https://telegra.ph/file/x.jpg'), false);
        assert.equal(isMusicHostAllowed('https://evil-whatsapp.net.example.com/x'), false, 'suffix, not substring');
        assert.equal(isMusicHostAllowed('not a url'), false);
        assert.equal(isMusicHostAllowed(undefined), false);

        assert.throws(() => buildMusicMessage({ songId: '1', songUri: 'https://files.catbox.moe/a.mp3' }), /songUri must be hosted on/);
        assert.throws(() => buildMusicMessage({ songId: '1', artworkUri: 'https://telegra.ph/x.jpg' }), /artworkUri must be hosted on/);
        assert.doesNotThrow(() => buildMusicMessage({ songId: '1', songUri: 'https://mmg.whatsapp.net/v/a', artworkUri: 'https://mmg.whatsapp.net/v/b' }));
    }

    /**
     * The music bubble is bound to Meta's catalog, so a bot cannot make one render
     * from its own audio: MusicChatsConsumptionRefresher asks the consumption API
     * with musicContentMediaId and overwrites song_uri and artwork_uri from the
     * answer, and MusicChatsPlaybackCoordinator gates on that verdict. What the
     * library can still do is carry a real entry across unchanged.
     */
    {
        const { generateWAMessageContent } = await import('../lib/Utils/messages.js');
        const options = { upload: async () => ({ directPath: '/v/x' }), logger: { debug() {}, warn() {}, info() {} } };

        const relayed = await generateWAMessageContent({
            music: {
                songId: '123456',
                mediaId: '987654321',
                title: 'Judul',
                songUri: 'https://mmg.whatsapp.net/v/song.m4a',
                artworkUri: 'https://mmg.whatsapp.net/v/art.jpg'
            }
        }, options);
        assert.equal(relayed.musicMessage.songUri, 'https://mmg.whatsapp.net/v/song.m4a');
        assert.equal(relayed.musicMessage.embeddedMusic.musicContentMediaId, '987654321');

        await assert.rejects(
            generateWAMessageContent({ music: { songId: '1', songUri: 'https://files.catbox.moe/a.mp3' } }, options),
            /songUri must be hosted on/
        );
    }

    /**
     * The bubble that does render for an arbitrary track: an ordinary audio message
     * with the cover, the title and the artist in externalAdReply. No catalog, no
     * consumption gate.
     */
    {
        const { generateWAMessageContent } = await import('../lib/Utils/messages.js');
        const options = { upload: async () => ({ directPath: '/v/t62.7/abc.enc' }), logger: { debug() {}, warn() {}, info() {} } };
        const artwork = Buffer.from(
            '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/'
            + 'wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
            'base64'
        );

        const content = await generateWAMessageContent({
            song: { audio: Buffer.alloc(4096, 1), artwork, title: 'Judul Lagu', author: 'Penyanyi', url: 'https://example.com/track' }
        }, options);

        assert.ok(content.audioMessage, 'it is an audio message, not a musicMessage');
        const card = content.audioMessage.contextInfo.externalAdReply;
        assert.equal(card.title, 'Judul Lagu');
        assert.equal(card.body, 'Penyanyi');
        assert.equal(card.mediaType, 1, 'IMAGE — VIDEO makes the client wait for a video and draw no thumbnail');
        assert.equal(card.renderLargerThumbnail, true);
        assert.equal(card.showAdAttribution, false);
        assert.equal(card.sourceUrl, 'https://example.com/track');
        assert.ok(card.thumbnail.length > 0 && card.thumbnail.length < artwork.length * 40, 'the cover is downscaled, not passed whole');

        const bare = await generateWAMessageContent({ song: { audio: Buffer.alloc(4096, 1), title: 'Tanpa sampul' } }, options);
        assert.equal(bare.audioMessage.contextInfo.externalAdReply.thumbnail, undefined, 'artwork is optional');
        assert.equal('body' in bare.audioMessage.contextInfo.externalAdReply, false, 'so is the artist');

        const asVideo = await generateWAMessageContent({ song: { audio: Buffer.alloc(4096, 1), artwork, mediaType: 2 } }, options);
        assert.equal(asVideo.audioMessage.contextInfo.externalAdReply.mediaType, 2, 'and it can still be overridden');

        await assert.rejects(generateWAMessageContent({ song: { title: 'x' } }, options), /song needs audio/);

        const asVoiceNote = async song => {
            const warnings = [];
            const content = await generateWAMessageContent({ song }, {
                upload: async () => ({ directPath: '/v/x.enc' }),
                logger: { debug() {}, info() {}, warn: (_, message) => warnings.push(message) }
            });
            return { audio: content.audioMessage, warnings };
        };

        const asMp3 = await asVoiceNote({ audio: Buffer.alloc(4096, 1), artwork, title: 'Judul', ptt: true });
        assert.equal(asMp3.audio.ptt, true, 'ptt falls through to the audio upload');
        assert.ok(asMp3.audio.contextInfo.externalAdReply.thumbnail.length > 0, 'and the card survives');
        assert.ok(asMp3.warnings.some(message => /not opus/.test(message)), 'but mp3 is not what a voice note is made of');

        const asOpus = await asVoiceNote({ audio: Buffer.alloc(4096, 1), ptt: true, mimetype: 'audio/ogg; codecs=opus' });
        assert.equal(asOpus.audio.mimetype, 'audio/ogg; codecs=opus');
        assert.equal(asOpus.warnings.some(message => /not opus/.test(message)), false);

        const plain = await asVoiceNote({ audio: Buffer.alloc(4096, 1) });
        assert.equal(plain.warnings.some(message => /not opus/.test(message)), false, 'nothing to warn about without ptt');
    }
});

test('status-style', async () => {
    const base = { upload: async () => ({ mediaUrl: 'https://media.test/x', directPath: '/x' }), logger: { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } } };
    const text = (options) => generateWAMessage('status@broadcast', { text: 'Halo' }, { ...base, ...options });
    const argb = value => (value >>> 0).toString(16).padStart(8, '0');

    /** The font enum is the client's own, not the media editor's five-font list. */
    {
        assert.deepEqual({ ...StatusFont }, {
            SYSTEM: 0,
            SYSTEM_TEXT: 1,
            FB_SCRIPT: 2,
            SYSTEM_BOLD: 6,
            MORNINGBREEZE_REGULAR: 7,
            CALISTOGA_REGULAR: 8,
            EXO2_EXTRABOLD: 9,
            COURIERPRIME_BOLD: 10
        });
        assert.equal(StatusFont, proto.Message.ExtendedTextMessage.FontType);
    }

    /** Six-digit hex is opaque, and the leading hash is optional. */
    {
        const { message } = await text({ backgroundColor: '#7C3AED', textColor: '#FFFFFF' });
        assert.equal(argb(message.extendedTextMessage.backgroundArgb), 'ff7c3aed');
        assert.equal(argb(message.extendedTextMessage.textArgb), 'ffffffff');
        const bare = await text({ backgroundColor: '7C3AED' });
        assert.equal(argb(bare.message.extendedTextMessage.backgroundArgb), 'ff7c3aed');
    }

    /** Eight digits keep the alpha the caller asked for. */
    {
        const { message } = await text({ backgroundColor: '807C3AED' });
        assert.equal(argb(message.extendedTextMessage.backgroundArgb), '807c3aed');
    }

    /** A number passes through, and a negative one wraps into the unsigned range. */
    {
        const { message } = await text({ backgroundColor: 0xff000000, textColor: -1 });
        assert.equal(argb(message.extendedTextMessage.backgroundArgb), 'ff000000');
        assert.equal(argb(message.extendedTextMessage.textArgb), 'ffffffff');
    }

    /** Nothing is written when nothing is asked for. */
    {
        const { message } = await text({});
        assert.equal('backgroundArgb' in message.extendedTextMessage, false);
        assert.equal('textArgb' in message.extendedTextMessage, false);
        assert.equal('font' in message.extendedTextMessage, false);
    }

    /** All three survive the wire, which is where FIXED32 could have gone wrong. */
    {
        const { message } = await text({ backgroundColor: '#7C3AED', textColor: '#FFEE58', font: StatusFont.CALISTOGA_REGULAR });
        const decoded = proto.Message.decode(proto.Message.encode(message).finish()).extendedTextMessage;
        assert.equal(argb(decoded.backgroundArgb), 'ff7c3aed');
        assert.equal(argb(decoded.textArgb), 'ffffee58');
        assert.equal(decoded.font, StatusFont.CALISTOGA_REGULAR);
    }

    /**
     * groupStatus wraps the finished message, so the styling is applied first and
     * ends up on the extendedTextMessage inside groupStatusMessageV2, not lost at
     * the wrapper.
     */
    {
        const { message } = await generateWAMessage(
            '120363000000000000@g.us',
            { text: 'halo grup', groupStatus: true },
            { ...base, backgroundColor: '#7C3AED', textColor: '#FFEE58', font: StatusFont.EXO2_EXTRABOLD }
        );
        assert.deepEqual(Object.keys(message).sort(), ['groupStatusMessageV2', 'messageContextInfo']);
        const inner = message.groupStatusMessageV2.message.extendedTextMessage;
        assert.equal(argb(inner.backgroundArgb), 'ff7c3aed');
        assert.equal(argb(inner.textArgb), 'ffffee58');
        assert.equal(inner.font, StatusFont.EXO2_EXTRABOLD);
        assert.equal(inner.contextInfo.isGroupStatus, true);
        assert.equal(getContentType(normalizeMessageContent(message)), 'extendedTextMessage');

        const decoded = proto.Message.decode(proto.Message.encode(message).finish());
        const wire = decoded.groupStatusMessageV2.message.extendedTextMessage;
        assert.equal(argb(wire.backgroundArgb), 'ff7c3aed');
        assert.equal(argb(wire.textArgb), 'ffffee58');
        assert.equal(wire.font, StatusFont.EXO2_EXTRABOLD);
        assert.equal(wire.contextInfo.isGroupStatus, true);
    }

    const dir = mkdtempSync(join(tmpdir(), 'status-style-'));
    try {
        /**
         * The voice note background is a plain colour conversion, but it used to sit
         * in the same try as the duration and waveform passes. Those shell out and
         * fail on a host with no decoder, which silently took the colour with them.
         */
        const audio = join(dir, 'suara.ogg');
        writeFileSync(audio, Buffer.from('T2dnUwACAAAAAAAAAAA=', 'base64'));

        const { message } = await generateWAMessage(
            'status@broadcast',
            { audio: { url: audio }, mimetype: 'audio/ogg; codecs=opus', ptt: true },
            { ...base, backgroundColor: '#7C3AED' }
        );
        assert.equal(message.audioMessage.waveform, null, 'the waveform pass did fail on this fixture');
        assert.equal(argb(message.audioMessage.backgroundArgb), 'ff7c3aed', 'the colour survives it');

        /** A voice note group status keeps both the colour and the wrapper. */
        const group = await generateWAMessage(
            '120363000000000000@g.us',
            { audio: { url: audio }, mimetype: 'audio/ogg; codecs=opus', ptt: true, groupStatus: true },
            { ...base, backgroundColor: '#7C3AED' }
        );
        const inner = group.message.groupStatusMessageV2.message.audioMessage;
        assert.equal(argb(inner.backgroundArgb), 'ff7c3aed');
        assert.equal(inner.contextInfo.isGroupStatus, true);

        /** Without ptt there is no background at all, whatever the caller passed. */
        const plain = await generateWAMessage(
            'status@broadcast',
            { audio: { url: audio }, mimetype: 'audio/ogg' },
            { ...base, backgroundColor: '#7C3AED' }
        );
        assert.equal(plain.message.audioMessage.backgroundArgb, null);
    }
    finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test('status-add-yours', async () => {
    const base = { upload: async () => ({}), logger: { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } } };
    const build = (jid, content) => generateWAMessage(jid, prepareModernMessageContent(content), base);
    const key = { remoteJid: 'status@broadcast', fromMe: false, id: 'ABC123', participant: '628000@s.whatsapp.net' };

    /** An Add Yours reply is an association back to the prompt, not a message type. */
    {
        assert.equal(AssociationType.STATUS_ADD_YOURS, 8);
        assert.equal(AssociationType.STATUS_ADD_YOURS_AI_IMAGINE, 15);
        assert.equal(AssociationType.STATUS_ADD_YOURS_DIWALI, 17);

        const association = makeStatusAddYoursAssociation(key);
        assert.equal(association.associationType, AssociationType.STATUS_ADD_YOURS);
        assert.deepEqual({ ...association.parentMessageKey }, key);
        assert.equal(association.messageIndex, null, 'nothing invented for an index nobody gave');
    }

    /** A key alone or a wrapped key both work, and the variant can be named. */
    {
        assert.equal(makeStatusAddYoursAssociation({ key }).associationType, AssociationType.STATUS_ADD_YOURS);
        assert.equal(
            makeStatusAddYoursAssociation({ key, type: 'STATUS_ADD_YOURS_AI_IMAGINE' }).associationType,
            AssociationType.STATUS_ADD_YOURS_AI_IMAGINE
        );
        assert.equal(makeStatusAddYoursAssociation({ key, type: 17 }).associationType, AssociationType.STATUS_ADD_YOURS_DIWALI);
        assert.throws(() => makeStatusAddYoursAssociation({}), TypeError);
        assert.throws(() => makeStatusAddYoursAssociation({ key: { remoteJid: 'x' } }), TypeError);
    }

    /** The generic maker defaults to UNKNOWN rather than assuming Add Yours. */
    {
        const association = makeMessageAssociation({ parentMessageKey: key, type: 'STATUS_QUESTION', messageIndex: 2 });
        assert.equal(association.associationType, AssociationType.STATUS_QUESTION);
        assert.equal(association.messageIndex, 2);
        assert.equal(makeMessageAssociation({ key }).associationType, AssociationType.UNKNOWN);
    }

    /** addYours lands in messageContextInfo, where the client reads it. */
    {
        const { message } = await build('status@broadcast', { text: 'ikutan', addYours: key });
        const association = message.messageContextInfo.messageAssociation;
        assert.equal(association.associationType, AssociationType.STATUS_ADD_YOURS);
        assert.deepEqual({ ...association.parentMessageKey }, key);
        assert.equal('addYours' in message, false, 'the shorthand is consumed');

        const decoded = proto.Message.decode(proto.Message.encode(message).finish());
        assert.equal(decoded.messageContextInfo.messageAssociation.associationType, AssociationType.STATUS_ADD_YOURS);
        assert.equal(decoded.messageContextInfo.messageAssociation.parentMessageKey.id, 'ABC123');
    }

    /** The raw messageAssociation key takes any association, not just Add Yours. */
    {
        const { message } = await build('status@broadcast', {
            text: 'x',
            messageAssociation: { type: 'STATUS_REACTION', parentMessageKey: key }
        });
        assert.equal(message.messageContextInfo.messageAssociation.associationType, AssociationType.STATUS_REACTION);
    }

    /** A mention notification is a protocolMessage type 25 inside the right wrapper. */
    {
        const direct = makeStatusMentionMessage({ key });
        assert.deepEqual(Object.keys(direct), ['statusMentionMessage']);
        const inner = direct.statusMentionMessage.message.protocolMessage;
        assert.equal(inner.type, proto.Message.ProtocolMessage.Type.STATUS_MENTION_MESSAGE);
        assert.equal(inner.type, 25);
        assert.deepEqual({ ...inner.key }, key);

        const group = makeStatusMentionMessage({ key, group: true });
        assert.deepEqual(Object.keys(group), ['groupStatusMentionMessage']);
        assert.equal(group.groupStatusMentionMessage.message.protocolMessage.type, 25);

        assert.throws(() => makeStatusMentionMessage({}), TypeError);
    }

    /** It is reachable through sendMessage as well, for a mention sent on its own. */
    {
        const { message } = await build('628111@s.whatsapp.net', { statusMention: { key } });
        assert.equal(message.statusMentionMessage.message.protocolMessage.type, 25);
        const { message: grouped } = await build('120363000000000000@g.us', { statusMention: { key, group: true } });
        assert.equal(grouped.groupStatusMentionMessage.message.protocolMessage.type, 25);
    }

    /** An association next to a builder that discards it is refused, not silently lost. */
    {
        assert.throws(
            () => prepareModernMessageContent({ statusMention: { key }, addYours: key }),
            /addYours cannot be combined with statusMention/
        );
        assert.throws(
            () => prepareModernMessageContent({ groupStatusReaction: { key, text: '❤️' }, statusAudience: { listName: 'B' }, addYours: key }),
            /statusAudience and addYours cannot be combined with groupStatusReaction/
        );
    }

    /**
     * The bundle carries a fifth notification type that WAProto's generated enum
     * does not, so the name would have resolved to UNKNOWN and gone out wrong.
     */
    {
        assert.equal(STATUS_NOTIFICATION_TYPES.STATUS_GROUP_STATUS_REPLY, 4);
        assert.equal(StatusNotificationType.STATUS_GROUP_STATUS_REPLY, 4);
        assert.equal(proto.Message.StatusNotificationMessage.StatusNotificationType.STATUS_GROUP_STATUS_REPLY, undefined);

        const { message } = await build('628111@s.whatsapp.net', {
            statusNotification: { responseMessageKey: key, originalMessageKey: key, type: 'STATUS_GROUP_STATUS_REPLY' }
        });
        assert.equal(message.statusNotificationMessage.type, 4);

        const addYours = await build('628111@s.whatsapp.net', {
            statusNotification: { responseMessageKey: key, originalMessageKey: key, type: 'STATUS_ADD_YOURS' }
        });
        assert.equal(addYours.message.statusNotificationMessage.type, STATUS_NOTIFICATION_TYPES.STATUS_ADD_YOURS);
    }

    /**
     * The README tells people to read myStatus.key off what sendMessage returns and
     * to take the prompt key off messages.upsert. Lock the two shapes it describes.
     */
    {
        const withUser = { ...base, userJid: '628999:12@s.whatsapp.net' };
        const own = await generateWAMessage('status@broadcast', { text: 'halo semua' }, withUser);
        assert.equal(own.key.remoteJid, 'status@broadcast');
        assert.equal(own.key.fromMe, true);
        assert.equal(own.key.participant, null, 'your own status names no participant');
        assert.ok(own.message && own.messageTimestamp, 'the whole WebMessageInfo comes back, not just a key');

        const group = await generateWAMessage('120363000000000000@g.us', { text: 'halo grup', groupStatus: true }, withUser);
        assert.equal(group.key.remoteJid, '120363000000000000@g.us');
        assert.equal(group.key.fromMe, true);
    }

    /** A half-built key is refused by name, at build time. */
    {
        assert.throws(() => prepareModernMessageContent({ addYours: {} }), /addYours\.key must be an object/);
        assert.throws(() => prepareModernMessageContent({ addYours: { key: { remoteJid: 'x' } } }), /addYours\.key\.id is required/);
        assert.throws(() => makeStatusMentionMessage({ key: { remoteJid: 'x' } }), /statusMention\.key\.id is required/);
        assert.throws(
            () => prepareModernMessageContent({ messageAssociation: { parentMessageKey: { remoteJid: 'x' } } }),
            /messageAssociation\.parentMessageKey\.id is required/
        );
    }
});

test('status-audience', async () => {
    const AudienceType = proto.ContextInfo.StatusAudienceMetadata.AudienceType;
    const opts = { upload: async () => ({}), logger: { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } } };
    const build = (jid, content) => generateWAMessage(jid, prepareModernMessageContent(content), opts);

    /** The client falls back to a star and "Close friends" when the poster named neither. */
    {
        assert.equal(STATUS_AUDIENCE_DEFAULT_EMOJI, '⭐');
        assert.equal(STATUS_AUDIENCE_DEFAULT_LIST_NAME, 'Close friends');
        const meta = makeStatusAudienceMetadata({});
        assert.equal(meta.listName, STATUS_AUDIENCE_DEFAULT_LIST_NAME);
        assert.equal(meta.listEmoji, STATUS_AUDIENCE_DEFAULT_EMOJI);
        assert.equal(meta.audienceType, AudienceType.CLOSE_FRIENDS, 'a named audience is a close friends list');
    }

    /** A bare string is the list name, since that is the only part with no sane default. */
    {
        const meta = makeStatusAudienceMetadata('Besties');
        assert.equal(meta.listName, 'Besties');
        assert.equal(meta.listEmoji, STATUS_AUDIENCE_DEFAULT_EMOJI);
    }

    /** The enum takes a name as readily as a number. */
    {
        assert.equal(makeStatusAudienceMetadata({ audienceType: 'UNKNOWN' }).audienceType, AudienceType.UNKNOWN);
        assert.equal(makeStatusAudienceMetadata({ audienceType: 0 }).audienceType, AudienceType.UNKNOWN);
        assert.equal(makeStatusAudienceMetadata({ audienceType: 'bukan enum' }).audienceType, AudienceType.CLOSE_FRIENDS);
        assert.throws(() => makeStatusAudienceMetadata(42), TypeError);
    }

    /** statusAudience is a shorthand for the contextInfo field, and lands on the message. */
    {
        const { message } = await build('status@broadcast', {
            text: 'Halo besties',
            statusAudience: { listName: 'Besties', listEmoji: '💜' }
        });
        const meta = message.extendedTextMessage.contextInfo.statusAudienceMetadata;
        assert.equal(meta.listName, 'Besties');
        assert.equal(meta.listEmoji, '💜');
        assert.equal(meta.audienceType, AudienceType.CLOSE_FRIENDS);
        assert.equal('statusAudience' in message, false, 'the shorthand is consumed, not forwarded');
    }

    /** Writing contextInfo yourself works too, and the shorthand does not stomp on it. */
    {
        const { message } = await build('status@broadcast', {
            text: 'Halo',
            statusAudience: { listName: 'Besties' },
            contextInfo: { isForwarded: true }
        });
        assert.equal(message.extendedTextMessage.contextInfo.isForwarded, true);
        assert.equal(message.extendedTextMessage.contextInfo.statusAudienceMetadata.listName, 'Besties');
    }

    /** It survives the wire, which is the only proof that matters. */
    {
        const { message } = await build('status@broadcast', {
            text: 'Halo besties',
            statusAudience: { listName: 'Besties', listEmoji: '💜' }
        });
        const decoded = proto.Message.decode(proto.Message.encode(message).finish());
        const meta = decoded.extendedTextMessage.contextInfo.statusAudienceMetadata;
        assert.equal(meta.listName, 'Besties');
        assert.equal(meta.listEmoji, '💜');
        assert.equal(meta.audienceType, AudienceType.CLOSE_FRIENDS);
    }

    /**
     * A group status and a custom audience are two different fields and can ride
     * together: groupStatus wraps the whole thing in groupStatusMessageV2 and sets
     * isGroupStatus, the audience metadata sits beside it in the same contextInfo.
     */
    {
        const { message } = await build('120363000000000000@g.us', {
            text: 'halo grup',
            groupStatus: true,
            statusAudience: { listName: 'Besties', listEmoji: '💜' }
        });
        assert.deepEqual(Object.keys(message).sort(), ['groupStatusMessageV2', 'messageContextInfo']);
        const inner = message.groupStatusMessageV2.message.extendedTextMessage;
        assert.equal(inner.contextInfo.isGroupStatus, true);
        assert.equal(inner.contextInfo.statusAudienceMetadata.listName, 'Besties');
        assert.equal(normalizeMessageContent(message).extendedTextMessage.text, 'halo grup');
    }

    /** A status attribution and an audience are independent, and both land. */
    {
        const { message } = await build('status@broadcast', {
            text: 'reshare',
            statusAudience: 'Besties',
            newsletterStatus: { newsletterJid: '123@newsletter', messageId: 4 }
        });
        const contextInfo = message.extendedTextMessage.contextInfo;
        assert.equal(contextInfo.statusAudienceMetadata.listName, 'Besties');
        assert.equal(contextInfo.statusAttributions.length, 1);
    }

    /**
     * The modern builders replace the whole content and none of them has a
     * contextInfo slot, so an audience passed alongside one would vanish without a
     * trace. Say so instead.
     */
    {
        assert.throws(
            () => prepareModernMessageContent({
                groupStatusReaction: { key: { id: 'X', remoteJid: 'a@g.us' }, text: '❤️' },
                statusAudience: { listName: 'Besties' }
            }),
            /statusAudience cannot be combined with groupStatusReaction/
        );
        const ok = prepareModernMessageContent({ groupStatusReaction: { key: { id: 'X', remoteJid: 'a@g.us' }, text: '❤️' } });
        assert.equal(ok.raw, true, 'the builder path still works on its own');
    }
});
