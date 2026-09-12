import { test } from 'node:test';
import { getImageProcessingLibrary } from '../lib/Utils/messages-media.js';
import assert from 'node:assert/strict';
import { FUTURE_PROOF_MESSAGE_KEYS, generateWAMessageContent, extractMessageContent, generateWAMessage, getContentType, nativeFlowButtonsViolateConstraints, normalizeMessageContent, QUICK_REPLY_BUTTON_LIMIT } from '../lib/Utils/messages.js';
import { promises as fs, readFileSync } from 'node:fs';
import { proto } from '../WAProto/index.js';
import { SocialMediaPostType, buildSocialPreview, readSocialPreview, videoEndCard } from '../lib/Utils/link-preview-metadata.js';
import { MONEY_OFFSET, ReminderFrequency, ReminderStatus, SplitPaymentStatus, buildPaymentReminder, buildSplitPayment, buildSplitPaymentUpdate, money, readMoney, readPaymentReminder, readSplitPayment } from '../lib/Utils/payment-messages.js';
import { aesEncryptGCM, hmacSign } from '../lib/Utils/crypto.js';
import processMessage from '../lib/Utils/process-message.js';
import { generateMessageID, generateMessageIDV2, encodeWAMessage } from '../lib/Utils/generics.js';
import { hasOptionalMedia, loadFfmpeg, loadSharp } from '../lib/Utils/optional-media.js';
import { SCHEDULED_MSG_META_TYPE, SCHEDULED_MSG_REVEAL_KEY_BYTES, SCHEDULED_MSG_REVEAL_KEY_IV_BYTES, SCHEDULED_MSG_WINDOW, buildScheduledMsgMetaNode, buildUnscheduleProtocolMessage, decodeScheduledMessage, encodeScheduledMessage, generateRevealKey, isScheduledTimeValid } from '../lib/Utils/scheduled-message.js';
import { getMessageReportingToken, shouldIncludeReportingToken } from '../lib/Utils/reporting-utils.js';
import { buildSpamListNode } from '../lib/Socket/chats.js';
import { SPAM_FLOWS } from '../lib/Types/index.js';

const JPEG_320x200_BASE64 = '/9j/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCADIAUADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAIF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmAQ2gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/2Q==';

test('external-ad-reply', async () => {
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
});

test('rich-link', async () => {
    const uploads = [];
    const options = {
        logger: { debug() {}, info() {}, warn() {} },
        upload: async (path, meta) => {
            uploads.push({ ...meta, bytes: (await fs.readFile(path)).length });
            return { directPath: '/v/t62.7118-24/link_thumb.enc', url: '' };
        }
    };

    const cover = Buffer.from(JPEG_320x200_BASE64, 'base64');
    let hasImageLibrary = true;
    try {
        await getImageProcessingLibrary();
    }
    catch {
        hasImageLibrary = false;
    }

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
        assert.ok(text.jpegThumbnail.length > 0, 'the inline copy is what shows before the download finishes');

        if (hasImageLibrary) {
            assert.equal(text.thumbnailDirectPath, '/v/t62.7118-24/link_thumb.enc');
            assert.equal(text.mediaKey.length, 32);
            assert.equal(text.thumbnailSha256.length, 32);
            assert.equal(text.thumbnailEncSha256.length, 32);
            assert.equal(uploads.at(-1).mediaType, 'thumbnail-link');
            assert.equal(text.thumbnailWidth, 320, 'a cover narrower than the target is not enlarged to it');
            assert.equal(text.thumbnailHeight, 200, 'and the declared size is what was actually encoded');
        }
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
        assert.equal(uploads.length, 0, 'and pays for no upload it will not use');
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
            richLink: { url: 'https://example.com/c', title: 'Rusak', image: Buffer.alloc(4096, 3) }
        }, options);
        const text = content.extendedTextMessage;

        assert.equal(text.thumbnailDirectPath, undefined,
            'the client hides the large preview unless both dimensions are set, so an unmeasurable image uploads nothing');
        assert.equal(uploads.length, 0);
        assert.ok(text.jpegThumbnail.length > 0, 'it still gets the small card');
    }

    if (hasImageLibrary) {
        uploads.length = 0;
        const content = await generateWAMessageContent({
            text: 'lihat https://example.com/b',
            linkPreview: { 'matched-text': 'https://example.com/b', title: 'Judul', image: cover }
        }, options);
        const text = content.extendedTextMessage;

        assert.equal(text.thumbnailDirectPath, '/v/t62.7118-24/link_thumb.enc', 'linkPreview takes an image too');
        assert.equal(uploads.at(-1).mediaType, 'thumbnail-link');

        uploads.length = 0;
        const compact = await generateWAMessageContent({
            text: 'lihat https://example.com/b',
            linkPreview: { 'matched-text': 'https://example.com/b', title: 'Judul', image: cover, large: false }
        }, options);
        assert.equal(compact.extendedTextMessage.thumbnailDirectPath, undefined, 'and honours the small card there too');
        assert.equal(uploads.length, 0);
    }

    {
        const content = await generateWAMessageContent({
            text: 'tanpa tautan di badan pesan',
            linkPreview: { 'matched-text': 'https://example.com/d', title: 'Judul', description: 'Keterangan' }
        }, options);
        const text = content.extendedTextMessage;

        assert.equal(text.text, 'tanpa tautan di badan pesan', 'the body is left exactly as written');
        assert.ok(!text.text.includes('https://'), 'so no link is pasted into the chat');
        assert.equal(text.matchedText, 'https://example.com/d',
            'while isUrlExtendedTextMessage only needs matchedText, description or title to draw the card');
    }
});

test('social-preview', async () => {
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
});

test('payment-messages', async () => {
    const options = { logger: { debug() {}, info() {}, warn() {} } };
    const roundTrip = content => proto.Message.decode(proto.Message.encode(proto.Message.fromObject(content)).finish());

    /**
     * Money is an integer scaled by offset, so 50000 at the usual 1000 goes out as
     * 50000000. Handing the scaled number in by mistake overcharges a thousandfold,
     * so the amount taken here is always the human one.
     */
    {
        assert.deepEqual(money(50000, 'IDR'), { value: 50000000, offset: MONEY_OFFSET, currencyCode: 'IDR' });
        assert.deepEqual(money(1.5, 'usd'), { value: 1500, offset: 1000, currencyCode: 'USD' }, 'the code is upper cased');
        assert.deepEqual(readMoney(money(50000, 'IDR')), { amount: 50000, currencyCode: 'IDR' });
        assert.equal(readMoney(undefined), undefined);
        assert.equal(readMoney({ value: 1 }), undefined, 'no offset means no scale to read it by');

        assert.throws(() => money(-1, 'IDR'), /non-negative/);
        assert.throws(() => money(1, 'RUPIAH'), /three letter currency/);
        assert.throws(() => money(1, 'IDR', 0), /positive integer/);
    }

    /** A split needs an id the update can name, and someone to split with. */
    {
        assert.throws(() => buildSplitPayment({ participants: [{ jid: 'a@s.whatsapp.net' }] }), /splitId/);
        assert.throws(() => buildSplitPayment({ splitId: 's1' }), /at least one participant/);
        assert.throws(() => buildSplitPayment({ splitId: 's1', participants: [{}] }), /participant 0 needs a jid/);
        assert.throws(() => buildSplitPaymentUpdate({ splitId: 's1' }), /both splitId and participantJid/);

        const built = buildSplitPayment({
            splitId: 's1',
            total: 150000,
            currency: 'IDR',
            participants: [{ jid: 'a@s.whatsapp.net' }]
        });
        assert.equal(built.participants[0].status, SplitPaymentStatus.PENDING, 'unpaid by default');
        assert.ok(built.createdAtMs > 0, 'stamped unless given');
        assert.equal(buildSplitPayment({ splitId: 's1', createdAt: 5, participants: [{ jid: 'a@x' }] }).createdAtMs, 5);
    }

    /** The whole split survives the encoder and reads back as human amounts. */
    {
        const content = await generateWAMessageContent({
            splitPayment: {
                splitId: 's1',
                total: 150000,
                currency: 'IDR',
                description: 'Makan bareng',
                requesterJid: '628@s.whatsapp.net',
                participants: [
                    { jid: '6281@s.whatsapp.net', amount: 50000 },
                    { jid: '6282@s.whatsapp.net', amount: 100000, status: SplitPaymentStatus.PAID }
                ]
            }
        }, options);

        const read = readSplitPayment(roundTrip(content));
        assert.equal(read.splitId, 's1');
        assert.deepEqual(read.total, { amount: 150000, currencyCode: 'IDR' });
        assert.equal(read.participants.length, 2);
        assert.deepEqual(read.participants[0].amount, { amount: 50000, currencyCode: 'IDR' });
        assert.equal(read.participants[1].status, SplitPaymentStatus.PAID);

        const update = await generateWAMessageContent({
            splitPaymentUpdate: { splitId: 's1', participantJid: '6281@s.whatsapp.net' }
        }, options);
        assert.deepEqual(roundTrip(update).splitPaymentUpdateMessage.toJSON(), {
            splitId: 's1',
            participantJid: '6281@s.whatsapp.net'
        });
    }

    /** The reminder carries its schedule and its amount. */
    {
        assert.throws(() => buildPaymentReminder({}), /reminderId/);

        const content = await generateWAMessageContent({
            paymentReminder: {
                reminderId: 'r1',
                description: 'Sewa',
                amount: 500000,
                currency: 'IDR',
                frequency: ReminderFrequency.MONTHLY
            }
        }, options);

        const read = readPaymentReminder(roundTrip(content));
        assert.equal(read.reminderId, 'r1');
        assert.equal(read.frequency, ReminderFrequency.MONTHLY);
        assert.equal(read.status, ReminderStatus.ACTIVE, 'active unless told otherwise');
        assert.deepEqual(read.amount, { amount: 500000, currencyCode: 'IDR' });
    }

    /** Neither reader claims a message that is not theirs. */
    {
        assert.equal(readSplitPayment({ message: { conversation: 'halo' } }), null);
        assert.equal(readPaymentReminder({ message: { conversation: 'halo' } }), null);
        assert.equal(readSplitPayment(undefined), null);
    }

    /** The status link style sits at the top of the message, beside the text. */
    {
        const content = await generateWAMessageContent(
            { text: 'cek https://x.test', statusLinkPreview: { style: 1 } },
            { ...options, getUrlInfo: async () => ({ 'matched-text': 'https://x.test' }) }
        );
        assert.equal(content.statusLinkPreviewMetadata.style, 1);
        assert.ok(content.extendedTextMessage, 'the text message is still there');
        assert.equal(roundTrip(content).statusLinkPreviewMetadata.style, 1);

        const bare = await generateWAMessageContent({ text: 'halo', statusLinkPreview: 2 }, options);
        assert.equal(bare.statusLinkPreviewMetadata.style, 2, 'a bare number works too');

        await assert.rejects(
            generateWAMessageContent({ text: 'halo', statusLinkPreview: { style: -1 } }, options),
            /non-negative integer/
        );
    }
});

test('message-edit', async () => {
    const ME = '628111111111@s.whatsapp.net';
    const CONTACT = '628222222222@s.whatsapp.net';
    const GROUP = '120363000000000000@g.us';
    const LID = '123456789012345@lid';
    const LID_PN = '628333333333@s.whatsapp.net';
    const SECRET = Buffer.from('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff', 'hex');
    const IV = Buffer.from('0102030405060708090a0b0c', 'hex');
    const ENVELOPE_TIMESTAMP = 1700000123;

    const deriveCiphertext = ({ originalMsgId, originalSenderJid, editorJid, message, timestampMs }) => {
        const sign = Buffer.concat([
            Buffer.from(originalMsgId),
            Buffer.from(originalSenderJid),
            Buffer.from(editorJid),
            Buffer.from('Message Edit'),
            new Uint8Array([1])
        ]);
        const key0 = hmacSign(SECRET, new Uint8Array(32), 'sha256');
        const decKey = hmacSign(sign, key0, 'sha256');
        const protocolMessage = { editedMessage: message };
        if (timestampMs !== undefined) {
            protocolMessage.timestampMs = timestampMs;
        }
        const plaintext = proto.Message.encode({ protocolMessage }).finish();
        return aesEncryptGCM(Buffer.from(plaintext), decKey, IV, Buffer.alloc(0));
    };

    const makeContext = ({ targetKey, targetMessage, mappings = {} }) => {
        const events = [];
        const warnings = [];
        return {
            events,
            warnings,
            context: {
                shouldProcessHistoryMsg: false,
                placeholderResendCache: undefined,
                ev: {
                    emit(name, payload) {
                        events.push({ name, payload });
                    }
                },
                creds: {
                    me: { id: ME },
                    accountSettings: {}
                },
                signalRepository: {
                    lidMapping: {
                        async getPNForLID(jid) {
                            return mappings[jid];
                        }
                    }
                },
                keyStore: {},
                logger: {
                    warn(data, message) {
                        warnings.push({ data, message });
                    }
                },
                options: {},
                async getMessage(key) {
                    if (key?.id === targetKey?.id) {
                        return targetMessage;
                    }
                }
            }
        };
    };

    const makeEnvelope = ({ targetKey, editorKey, ciphertext }) => ({
        key: editorKey,
        messageTimestamp: ENVELOPE_TIMESTAMP,
        message: {
            secretEncryptedMessage: {
                targetMessageKey: targetKey,
                encPayload: ciphertext,
                encIv: IV,
                secretEncType: proto.Message.SecretEncryptedMessage.SecretEncType.MESSAGE_EDIT
            }
        }
    });

    const getUpdate = events => events.find(event => event.name === 'messages.update')?.payload?.[0];

    const runSuccess = async ({ name, targetKey, editorKey, originalSenderJid, editorJid, mappings = {}, timestampMs = 1700000000123, omitTimestamp = false }) => {
        const edited = { conversation: name };
        const ciphertext = deriveCiphertext({
            originalMsgId: targetKey.id,
            originalSenderJid,
            editorJid,
            message: edited,
            timestampMs: omitTimestamp ? undefined : timestampMs
        });
        const state = makeContext({
            targetKey,
            targetMessage: { messageContextInfo: { messageSecret: SECRET } },
            mappings
        });
        await processMessage(makeEnvelope({ targetKey, editorKey, ciphertext }), state.context);
        const update = getUpdate(state.events);
        assert.ok(update, `${name}: messages.update missing`);
        assert.deepEqual(update.key, targetKey, `${name}: target key mismatch`);
        assert.equal(update.update.message.editedMessage.message.conversation, name, `${name}: edited payload mismatch`);
        assert.equal(update.update.messageTimestamp, omitTimestamp ? ENVELOPE_TIMESTAMP : Math.floor(timestampMs / 1000), `${name}: timestamp mismatch`);
    };

    await runSuccess({
        name: 'self-1to1',
        targetKey: { remoteJid: CONTACT, fromMe: true, id: 'SELF-1' },
        editorKey: { remoteJid: CONTACT, fromMe: true, id: 'EDIT-SELF-1' },
        originalSenderJid: ME,
        editorJid: ME
    });

    await runSuccess({
        name: 'contact-1to1',
        targetKey: { remoteJid: CONTACT, fromMe: false, id: 'CONTACT-1' },
        editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-CONTACT-1' },
        originalSenderJid: CONTACT,
        editorJid: CONTACT
    });

    await runSuccess({
        name: 'group-participant',
        targetKey: { remoteJid: GROUP, participant: CONTACT, fromMe: false, id: 'GROUP-1' },
        editorKey: { remoteJid: GROUP, participant: CONTACT, fromMe: false, id: 'EDIT-GROUP-1' },
        originalSenderJid: CONTACT,
        editorJid: CONTACT
    });

    await runSuccess({
        name: 'jid-alternative',
        targetKey: { remoteJid: LID, remoteJidAlt: LID_PN, fromMe: false, id: 'ALT-1' },
        editorKey: { remoteJid: LID, remoteJidAlt: LID_PN, fromMe: false, id: 'EDIT-ALT-1' },
        originalSenderJid: LID_PN,
        editorJid: LID_PN
    });

    await runSuccess({
        name: 'lid-mapping',
        targetKey: { remoteJid: LID, fromMe: false, id: 'LID-1' },
        editorKey: { remoteJid: LID, fromMe: false, id: 'EDIT-LID-1' },
        originalSenderJid: LID_PN,
        editorJid: LID_PN,
        mappings: { [LID]: LID_PN }
    });

    await runSuccess({
        name: 'timestamp-fallback',
        targetKey: { remoteJid: CONTACT, fromMe: false, id: 'FALLBACK-1' },
        editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-FALLBACK-1' },
        originalSenderJid: CONTACT,
        editorJid: CONTACT,
        omitTimestamp: true
    });

    {
        const targetKey = { remoteJid: CONTACT, fromMe: false, id: 'MISSING-TARGET' };
        const state = makeContext({ targetKey, targetMessage: undefined });
        await processMessage(makeEnvelope({
            targetKey,
            editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-MISSING-TARGET' },
            ciphertext: Buffer.alloc(16)
        }), state.context);
        assert.equal(getUpdate(state.events), undefined);
    }

    {
        const targetKey = { remoteJid: CONTACT, fromMe: false, id: 'MISSING-SECRET' };
        const state = makeContext({ targetKey, targetMessage: {} });
        await processMessage(makeEnvelope({
            targetKey,
            editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-MISSING-SECRET' },
            ciphertext: Buffer.alloc(16)
        }), state.context);
        assert.equal(getUpdate(state.events), undefined);
    }

    {
        const targetKey = { remoteJid: CONTACT, fromMe: false, id: 'BAD-PLAINTEXT' };
        const sign = Buffer.concat([
            Buffer.from(targetKey.id),
            Buffer.from(CONTACT),
            Buffer.from(CONTACT),
            Buffer.from('Message Edit'),
            new Uint8Array([1])
        ]);
        const key0 = hmacSign(SECRET, new Uint8Array(32), 'sha256');
        const decKey = hmacSign(sign, key0, 'sha256');
        const plaintext = proto.Message.encode({ conversation: 'not-an-edit' }).finish();
        const ciphertext = aesEncryptGCM(Buffer.from(plaintext), decKey, IV, Buffer.alloc(0));
        const state = makeContext({
            targetKey,
            targetMessage: { messageContextInfo: { messageSecret: SECRET } }
        });
        await processMessage(makeEnvelope({
            targetKey,
            editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-BAD-PLAINTEXT' },
            ciphertext
        }), state.context);
        assert.equal(getUpdate(state.events), undefined);
    }

    {
        const targetKey = { remoteJid: CONTACT, fromMe: false, id: '' };
        const state = makeContext({
            targetKey,
            targetMessage: { messageContextInfo: { messageSecret: SECRET } }
        });
        await processMessage(makeEnvelope({
            targetKey,
            editorKey: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-BAD-TARGET' },
            ciphertext: Buffer.alloc(16)
        }), state.context);
        assert.equal(getUpdate(state.events), undefined);
    }

    {
        const targetKey = { fromMe: false, id: 'MISSING-JID' };
        const state = makeContext({
            targetKey,
            targetMessage: { messageContextInfo: { messageSecret: SECRET } }
        });
        await processMessage({
            key: { remoteJid: CONTACT, fromMe: false, id: 'EDIT-MISSING-JID' },
            messageTimestamp: ENVELOPE_TIMESTAMP,
            message: {
                secretEncryptedMessage: {
                    targetMessageKey: targetKey,
                    encPayload: Buffer.alloc(16),
                    encIv: IV,
                    secretEncType: proto.Message.SecretEncryptedMessage.SecretEncType.MESSAGE_EDIT
                }
            }
        }, state.context);
        assert.equal(getUpdate(state.events), undefined);
    }
});

test('message-id', async () => {
    const WEB_SHA256 = /^3EB0[0-9A-F]{18}$/;
    const WEB_LEGACY = /^3EB0[0-9A-F]{16}$/;

    for (const userId of ['628111@s.whatsapp.net', '628111:12@s.whatsapp.net', undefined]) {
        const id = generateMessageIDV2(userId);
        assert.match(id, WEB_SHA256);
        assert.equal(id.length, 22);
        assert.equal(id.includes('STARFALL'), false);
    }

    for (let i = 0; i < 4; i++) {
        const id = generateMessageID();
        assert.match(id, WEB_LEGACY);
        assert.equal(id.length, 20);
    }

    const banyak = new Set(Array.from({ length: 500 }, () => generateMessageIDV2('628111@s.whatsapp.net')));
    assert.equal(banyak.size, 500);

    const legacy = new Set(Array.from({ length: 500 }, () => generateMessageID()));
    assert.equal(legacy.size, 500);

    for (const id of [...banyak, ...legacy]) {
        assert.equal(id, id.toUpperCase());
    }
});

test('view-once-text', async () => {
    const upload = async () => ({});

    assert.ok('viewOnce' in proto.Message.ExtendedTextMessage.prototype);
    assert.ok('viewOnceMessageV2Extension' in proto.Message.prototype);
    assert.equal(proto.Message.Conversation, undefined);

    const content = await generateWAMessageContent({ text: 'rahasia', viewOnceV2Extension: true }, { upload });
    const inner = content.viewOnceMessageV2Extension.message;
    assert.equal(inner.extendedTextMessage.text, 'rahasia');
    assert.equal(inner.extendedTextMessage.viewOnce, true);
    assert.equal(inner.conversation ?? null, null);
    assert.ok(content.messageContextInfo.messageSecret);

    const encoded = proto.Message.encode(content).finish();
    const decoded = proto.Message.decode(encoded);
    assert.equal(decoded.viewOnceMessageV2Extension.message.extendedTextMessage.text, 'rahasia');
    assert.equal(decoded.viewOnceMessageV2Extension.message.extendedTextMessage.viewOnce, true);

    const unwrapped = extractMessageContent(content);
    assert.equal(unwrapped.extendedTextMessage.text, 'rahasia');
    assert.equal(unwrapped.extendedTextMessage.viewOnce, true);

    const v2 = await generateWAMessageContent({ text: 'halo', viewOnceV2: true }, { upload });
    assert.equal(v2.viewOnceMessageV2.message.extendedTextMessage.viewOnce, true);

    const v1 = await generateWAMessageContent({ text: 'halo', viewOnce: true }, { upload });
    assert.equal(v1.viewOnceMessage.message.extendedTextMessage.viewOnce, true);

    const polos = await generateWAMessageContent({ text: 'biasa' }, { upload });
    assert.equal(polos.viewOnceMessageV2Extension ?? null, null);
    assert.equal(polos.extendedTextMessage.viewOnce ?? null, null);
});

test('quoted-guard', async () => {
    const makeLogger = () => {
        const warnings = [];
        const logger = {
            warnings,
            info() {}, debug() {}, error() {}, trace() {},
            warn(...args) { warnings.push(args) },
            child() { return this }
        };
        return logger;
    };

    const send = (quoted) => {
        const logger = makeLogger();
        return generateWAMessage('120363000000000000@g.us', { text: 'halo' }, {
            upload: async () => ({}),
            logger,
            userJid: '628999:12@s.whatsapp.net',
            quoted
        }).then(message => ({ message, logger }));
    };

    const key = id => ({ remoteJid: '120363000000000000@g.us', id, participant: '628000@s.whatsapp.net' });

    /**
     * A quote with nothing readable inside used to reach quotedMsg[msgType] with
     * both sides undefined and throw "Cannot read properties of undefined (reading
     * 'undefined')". Every send in that chat died with it, so a bot quoting an
     * undecrypted message went completely silent there while other chats carried on.
     */
    {
        const cases = {
            'no message at all': { key: key('A') },
            'a null message': { key: key('B'), message: null },
            'an empty message': { key: key('C'), message: {} },
            'a ciphertext stub': { key: key('D'), messageStubType: 2, message: undefined }
        };

        for (const [name, quoted] of Object.entries(cases)) {
            const { message, logger } = await send(quoted);
            assert.equal(message.message.extendedTextMessage.text, 'halo', `${name}: the message still goes out`);
            assert.equal(message.message.extendedTextMessage.contextInfo?.stanzaId, undefined, `${name}: without a quote`);
            assert.equal(logger.warnings.length, 1, `${name}: and says so once`);
            assert.match(logger.warnings[0][1], /nothing quotable/);
            assert.equal(logger.warnings[0][0].quotedId, quoted.key.id, `${name}: naming the message it dropped`);
        }
    }

    /** A real quote is untouched — same participant, stanza id and quoted body. */
    {
        const quoted = { key: key('F'), message: { conversation: 'asli' } };
        const { message, logger } = await send(quoted);
        const contextInfo = message.message.extendedTextMessage.contextInfo;
        assert.equal(contextInfo.stanzaId, 'F');
        assert.equal(contextInfo.participant, '628000@s.whatsapp.net');
        assert.equal(contextInfo.quotedMessage.conversation, 'asli');
        assert.equal(logger.warnings.length, 0, 'and nothing is logged about it');
    }

    /** A wrapped quote is normalised first, so the inner content is what gets quoted. */
    {
        const quoted = { key: key('G'), message: { viewOnceMessageV2: { message: { conversation: 'dalam' } } } };
        const { message } = await send(quoted);
        assert.equal(message.message.extendedTextMessage.contextInfo.quotedMessage.conversation, 'dalam');
    }

    /** A protocolMessage is a real content type, so quoting one keeps working. */
    {
        const quoted = { key: key('H'), message: { protocolMessage: { key: { id: 'X' }, type: 25 } } };
        const { message, logger } = await send(quoted);
        assert.equal(message.message.extendedTextMessage.contextInfo.stanzaId, 'H');
        assert.equal(logger.warnings.length, 0);
    }

    /** No logger is not a crash either — the guard must not depend on one. */
    {
        const message = await generateWAMessage('120363000000000000@g.us', { text: 'halo' }, {
            upload: async () => ({}),
            logger: { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } },
            userJid: '628999:12@s.whatsapp.net',
            quoted: { key: key('I') }
        });
        assert.equal(message.message.extendedTextMessage.text, 'halo');
    }
});

test('optional-media', async () => {
    const sharp = await loadSharp();
    assert.equal(typeof sharp, 'function');

    const again = await loadSharp();
    assert.equal(again, sharp);

    const ffmpeg = await loadFfmpeg();
    assert.equal(typeof ffmpeg, 'function');

    assert.equal(await hasOptionalMedia('sharp'), true);
    assert.equal(await hasOptionalMedia('fluent-ffmpeg'), true);
    assert.equal(await hasOptionalMedia('a-package-that-does-not-exist'), false);

    const builder = await import('../lib/MessageBuilder/index.js');
    const pixels = await sharp({
        create: { width: 8, height: 8, channels: 4, background: { r: 1, g: 2, b: 3, alpha: 1 } }
    }).png().toBuffer();
    const resized = await builder.Toolkit.resize(pixels, 4, 4);
    assert.ok(resized.length > 0);
});

test('scheduled-message', async () => {
    const key = generateRevealKey();
    assert.equal(key.length, SCHEDULED_MSG_REVEAL_KEY_BYTES);

    const original = { conversation: 'pesan terjadwal' };
    const encoded = encodeScheduledMessage(original, key);

    assert.equal(encoded.encIv.length, SCHEDULED_MSG_REVEAL_KEY_IV_BYTES);
    assert.equal(
        encoded.message.conditionalRevealMessage.conditionalRevealMessageType,
        proto.Message.ConditionalRevealMessage.ConditionalRevealMessageType.SCHEDULED_MESSAGE
    );
    assert.ok(encoded.revealKeyId.length > 0);

    const decoded = decodeScheduledMessage(encoded.message, key);
    assert.equal(decoded.conversation, original.conversation);

    assert.throws(() => decodeScheduledMessage(encoded.message, generateRevealKey()));

    const scheduleNode = buildScheduledMsgMetaNode({
        scheduledTimestampS: 1800000000,
        revealKeyId: encoded.revealKeyId,
        revealKey: key
    });
    assert.equal(scheduleNode.tag, 'meta');
    assert.equal(scheduleNode.attrs.type, SCHEDULED_MSG_META_TYPE);
    assert.equal(scheduleNode.attrs.st, '1800000000');
    assert.equal(scheduleNode.content[0].tag, 'key');
    assert.equal(scheduleNode.content[0].attrs.rkid, encoded.revealKeyId);
    assert.equal(scheduleNode.content[0].content.length, SCHEDULED_MSG_REVEAL_KEY_BYTES);

    const revealNode = buildScheduledMsgMetaNode({ kind: 'reveal', revealKeyId: encoded.revealKeyId });
    assert.equal(revealNode.attrs.st, undefined);
    assert.equal(revealNode.content[0].content, undefined);

    assert.throws(() => buildScheduledMsgMetaNode({ revealKeyId: 'x' }));
    assert.throws(() => buildScheduledMsgMetaNode({ scheduledTimestampS: 1, revealKey: key }));

    const unschedule = buildUnscheduleProtocolMessage({ id: 'ABC', remoteJid: '628@s.whatsapp.net', fromMe: true });
    assert.equal(unschedule.protocolMessage.type, proto.Message.ProtocolMessage.Type.MESSAGE_UNSCHEDULE);

    const now = 1800000000;
    assert.equal(isScheduledTimeValid(now + 600, now), true);
    assert.equal(isScheduledTimeValid(now + 599, now), false);
    assert.equal(isScheduledTimeValid(now + SCHEDULED_MSG_WINDOW.chat.maxSeconds, now), true);
    assert.equal(isScheduledTimeValid(now + SCHEDULED_MSG_WINDOW.chat.maxSeconds + 1, now), false);
    assert.equal(isScheduledTimeValid(now + 2592000, now, SCHEDULED_MSG_WINDOW.newsletter), true);
});

test('reporting-token', async () => {
    const buat = async (isi) => generateWAMessage('2@s.whatsapp.net', isi, { userJid: '1:5@s.whatsapp.net' });
    const kunci = (msg) => ({ id: msg.key.id, fromMe: true, remoteJid: '2@s.whatsapp.net' });

    const contoh = await buat({ text: 'halo' });
    assert.ok(contoh.message.messageContextInfo?.messageSecret, 'teks polos harus punya messageSecret');
    assert.equal(shouldIncludeReportingToken(contoh.message), true);

    let terbentuk = 0;
    for (let i = 0; i < 120; i++) {
        const msg = await buat({ text: i % 2 ? 'halo' : 'halo dunia' });
        const node = await getMessageReportingToken(proto.Message.encode(msg.message).finish(), msg.message, kunci(msg));
        if (node) {
            terbentuk++;
            assert.equal(node.tag, 'reporting');
            assert.equal(node.content[0].tag, 'reporting_token');
            assert.equal(node.content[0].attrs.v, '2');
            assert.equal(node.content[0].content.length, 16);
        }
    }
    assert.equal(terbentuk, 120, 'protobuf tanpa padding harus selalu menghasilkan token');

    let denganPadding = 0;
    for (let i = 0; i < 120; i++) {
        const msg = await buat({ text: 'halo' });
        if (await getMessageReportingToken(encodeWAMessage(msg.message), msg.message, kunci(msg))) denganPadding++;
    }
    assert.ok(denganPadding < 120, 'padding acak merusak ekstraksi, itu sebab bug-nya');
});

test('inline-skdm', async () => {
    const src = readFileSync(new URL('../lib/Socket/messages-send.js', import.meta.url), 'utf8');
    const awal = src.indexOf('let toEncode = patched;');
    const akhir = src.indexOf('const bytes = encodeWAMessage(toEncode);');
    assert.ok(awal > 0 && akhir > awal, 'blok inline SKDM harus ada');
    const blok = src.slice(awal, akhir);

    assert.ok(blok.includes("config.inlineSenderKeyDistribution !== false"), 'aktif secara default, bisa dimatikan');
    assert.ok(blok.includes('isGroup'), 'hanya untuk grup');
    assert.ok(blok.includes('!patched.senderKeyDistributionMessage'), 'jangan timpa SKDM dari pemanggil');
    assert.ok(blok.includes('hasSenderKey'), 'hanya kalau sender key sudah ada');
    assert.ok(blok.includes('getSenderKeyDistributionMessage'), 'ambil lewat signalRepository');
    assert.ok(blok.includes('catch'), 'kegagalan tidak menjatuhkan pengiriman');

    assert.ok(src.includes('reportingMessage = toEncode;'), 'token laporan atas pesan yang benar-benar dikirim');
    assert.ok(!src.includes('const bytes = encodeWAMessage(patched);'), 'jalur lama tidak tersisa');

    const dengan = {
        senderKeyDistributionMessage: { groupId: '1@g.us', axolotlSenderKeyDistributionMessage: Buffer.alloc(4) },
        extendedTextMessage: { text: 'halo' }
    };
    assert.equal(getContentType(dengan), 'extendedTextMessage', 'SKDM sebaris tidak boleh dikira tipe konten');
    assert.equal(getContentType({ conversation: 'halo', senderKeyDistributionMessage: {} }), 'conversation');

    const decode = readFileSync(new URL('../lib/Utils/decode-wa-message.js', import.meta.url), 'utf8');
    assert.ok(decode.includes('if (msg.senderKeyDistributionMessage)'), 'penerima memproses SKDM sebaris');
    assert.ok(decode.includes('processSenderKeyDistributionMessage'), 'lalu meneruskan kontennya');
});

test('spam-report', async () => {
    /**
     * WASmaxOutSpamBaseReportMixin builds smax("spam_list", { spam_flow }) and the
     * per-entity request builders add jid: WAWap.JID for a contact and
     * WAWap.GROUP_JID for a group, so the tag and both attribute names are fixed.
     */
    const contact = buildSpamListNode('62811111111@s.whatsapp.net');
    assert.equal(contact.tag, 'spam_list');
    assert.equal(contact.attrs.jid, '62811111111@s.whatsapp.net');
    assert.equal(contact.attrs.spam_flow, SPAM_FLOWS.OverflowMenuReport);

    /** A device suffix never rides along on the reported jid. */
    assert.equal(buildSpamListNode('62811111111:12@s.whatsapp.net').attrs.jid, '62811111111@s.whatsapp.net');

    /** WASmaxOutSpamGroupReportRequest keeps the group jid whole and carries source. */
    const group = buildSpamListNode('12345-67890@g.us', {
        flow: SPAM_FLOWS.GroupInfoReport,
        source: '62811111111:3@s.whatsapp.net'
    });
    assert.equal(group.attrs.jid, '12345-67890@g.us');
    assert.equal(group.attrs.spam_flow, 'group_info_report');
    assert.equal(group.attrs.source, '62811111111@s.whatsapp.net');

    /**
     * subject comes from WASmaxOutSpamEntitySubjectMixin and is_known_chat from
     * WASmaxOutSpamIsKnownChatMixin; both are optional and neither may appear as an
     * empty attribute when the caller said nothing.
     */
    assert.equal('subject' in contact.attrs, false);
    assert.equal('is_known_chat' in contact.attrs, false);
    assert.equal('source' in contact.attrs, false);
    assert.equal(buildSpamListNode('62811111111@s.whatsapp.net', { subject: 'Toko' }).attrs.subject, 'Toko');
    assert.equal(buildSpamListNode('62811111111@s.whatsapp.net', { isKnownChat: true }).attrs.is_known_chat, 'true');
    assert.equal(buildSpamListNode('62811111111@s.whatsapp.net', { isKnownChat: false }).attrs.is_known_chat, 'false');

    /** Every attribute goes on the wire as a string, never a boolean. */
    for (const value of Object.values(buildSpamListNode('62811111111@s.whatsapp.net', { isKnownChat: true, subject: 'Toko' }).attrs)) {
        assert.equal(typeof value, 'string');
    }

    /** A missing or malformed jid is refused here, not answered by the server. */
    for (const bad of [undefined, null, '', 'bukan-jid', 62811111111, {}]) {
        assert.throws(() => buildSpamListNode(bad), err => {
            assert.equal(err.output.statusCode, 400);
            return true;
        }, 'rejects ' + JSON.stringify(bad));
    }

    /** An empty flow would send spam_flow="" and the report would mean nothing. */
    assert.throws(() => buildSpamListNode('62811111111@s.whatsapp.net', { flow: '' }), err => {
        assert.match(err.message, /SPAM_FLOWS/);
        return true;
    });

    /** The flows are the ones WAWebSpamConstants freezes, spelled the same way. */
    assert.equal(SPAM_FLOWS.Block, 'block_dialog');
    assert.equal(SPAM_FLOWS.OneToOneChatSpamBannerReport, '1_1_spam_banner_report');
    assert.equal(SPAM_FLOWS.NewsletterInfoReport, 'newsletter_info_report');
    assert.throws(() => { SPAM_FLOWS.Block = 'x'; }, TypeError, 'the table is frozen');
});

test('event-time', async () => {
    const options = { logger: { debug() {}, info() {}, warn() {} } };

    const dates = await generateWAMessageContent({
        event: { name: 'rapat', startDate: new Date(1700000000123), endDate: new Date(1700003600456) }
    }, options);
    assert.equal(dates.eventMessage.startTime, 1700000000);
    assert.equal(dates.eventMessage.endTime, 1700003600, 'endTime used to keep its milliseconds while startTime was floored');

    const numbers = await generateWAMessageContent({
        event: { name: 'rapat', startDate: 1700000000123, endDate: 1700003600 }
    }, options);
    assert.equal(numbers.eventMessage.startTime, 1700000000, 'epoch milliseconds are accepted');
    assert.equal(numbers.eventMessage.endTime, 1700003600, 'and so are seconds');

    const open = await generateWAMessageContent({ event: { name: 'rapat', startDate: new Date(1700000000000) } }, options);
    assert.equal(open.eventMessage.endTime, undefined, 'an event without an end stays open');

    await assert.rejects(
        generateWAMessageContent({ event: { name: 'rapat' } }, options),
        /event startDate must be a Date or a unix timestamp/
    );
});

test('interactive-mixing', async () => {
    const options = { upload: async () => ({}) };
    const teks = 'menu';

    const content = await generateWAMessageContent({
        text: teks,
        footer: 'Elaina',
        nativeFlow: [{ text: 'Menu', id: '.menu' }, { text: 'Situs', url: 'https://nixel.dev' }],
        bloksWidget: { type: 'im_a2ui', uuid: 'u-1', fallback: teks, data: '{"type":"info_card"}' }
    }, options);

    const im = content.interactiveMessage;
    const nf = im.nativeFlowMessage;

    assert.equal(nf.messageVersion, 1, 'isSupportedInteractiveMessageVersion rejects a missing messageVersion outright');
    assert.equal(nf.name, 'mixed');
    assert.equal(nf.buttons[0].name, 'quick_reply', 'buttons[0].name is the flow name the client actually reads');
    assert.equal(im.bloksWidget.type, 'im_a2ui', 'the widget rides alongside nativeFlowMessage instead of competing with it');
    assert.equal(im.bloksWidget.fallback, im.body.text, 'the bubble text is hidden only when it equals the fallback');

    const named = await generateWAMessageContent({
        text: teks,
        nativeFlow: [{ text: 'Menu', id: '.menu' }],
        flowName: 'menu_options'
    }, options);
    assert.equal(named.interactiveMessage.nativeFlowMessage.name, 'menu_options');
    assert.equal(named.interactiveMessage.bloksWidget, undefined, 'no widget key means no widget');

    const both = proto.Message.fromObject({
        richResponseMessage: { messageType: 1 },
        interactiveMessage: { body: { text: 'x' } }
    });
    const back = proto.Message.toObject(proto.Message.decode(proto.Message.encode(both).finish()), { defaults: false });
    assert.deepEqual(Object.keys(back), ['interactiveMessage', 'richResponseMessage'], 'both survive the wire');
    assert.equal(getContentType(back), 'interactiveMessage', 'but the lower field number wins and the rich response is ignored');
});

test('native-flow-button-constraints', async () => {
    const name = n => ({ name: n });
    const quick = n => Array.from({ length: n }, () => name('quick_reply'));

    assert.equal(nativeFlowButtonsViolateConstraints([]), false);
    assert.equal(nativeFlowButtonsViolateConstraints(quick(QUICK_REPLY_BUTTON_LIMIT)), false, 'ten quick replies is the limit');
    assert.equal(nativeFlowButtonsViolateConstraints(quick(QUICK_REPLY_BUTTON_LIMIT + 1)), true);
    assert.equal(nativeFlowButtonsViolateConstraints([name('cta_url'), name('cta_url'), name('cta_url')]), false, 'three is the limit when the first is not a quick reply');
    assert.equal(nativeFlowButtonsViolateConstraints([name('cta_url'), name('cta_url'), name('cta_url'), name('cta_url')]), true);
    assert.equal(nativeFlowButtonsViolateConstraints([name('quick_reply'), name('cta_url')]), true, 'every button has to match the first one kind');
    assert.equal(nativeFlowButtonsViolateConstraints([name('cta_url'), name('quick_reply')]), true);
    assert.equal(nativeFlowButtonsViolateConstraints([name('single_select')]), false, 'a lone unknown name is fine');

    const warnings = [];
    const options = { upload: async () => ({}), logger: { warn: (meta) => warnings.push(meta) } };

    await generateWAMessageContent({ text: 'x', nativeFlow: Array.from({ length: 10 }, (_, i) => ({ text: 'b', id: '.b' + i })) }, options);
    assert.equal(warnings.length, 0, 'a list inside the limits stays quiet');

    await generateWAMessageContent({ text: 'x', nativeFlow: Array.from({ length: 30 }, (_, i) => ({ text: 'b', id: '.b' + i })) }, options);
    assert.deepEqual(warnings.at(-1), { buttons: 30, limit: 10, kinds: ['quick_reply'] });

    await generateWAMessageContent({ text: 'x', nativeFlow: [{ text: 'a', id: '.a' }, { text: 'b', url: 'https://x.test' }] }, options);
    assert.deepEqual(warnings.at(-1), { buttons: 2, limit: 10, kinds: ['quick_reply', 'cta_url'] });
});

test('group-status-font', async () => {
    const options = { upload: async () => ({}) };
    const FONTS = proto.Message.ExtendedTextMessage.FontType;

    for (const [name, value] of Object.entries(FONTS)) {
        const content = await generateWAMessageContent({ text: 'halo grup', groupStatus: true },
            { ...options, backgroundColor: '#7C3AED', textColor: '#FFEE58', font: value });
        const inner = content.groupStatusMessageV2.message.extendedTextMessage;
        assert.equal(inner.font, value, `${name} has to survive the groupStatusMessageV2 wrap`);
        assert.equal(inner.contextInfo.isGroupStatus, true);
        assert.equal(inner.backgroundArgb >>> 0, 0xFF7C3AED);
        const back = proto.Message.decode(proto.Message.encode(proto.Message.fromObject(content)).finish());
        assert.equal(back.groupStatusMessageV2.message.extendedTextMessage.font, value, `${name} has to survive the wire`);
    }

    assert.equal(Object.values(FONTS).sort((a, b) => a - b).join(','), '0,1,2,6,7,8,9,10', 'the accepted set is these eight, 3 to 5 do not exist');

    const zero = await generateWAMessageContent({ text: 'x', groupStatus: true },
        { ...options, backgroundColor: 0, textColor: 0, font: 0 });
    const inner = zero.groupStatusMessageV2.message.extendedTextMessage;
    assert.equal(inner.font, 0, 'SYSTEM used to be dropped as a falsy value');
    assert.equal(inner.backgroundArgb, 0);
    assert.equal(inner.textArgb, 0);

    const image = await generateWAMessageContent({ image: Buffer.from(JPEG_320x200_BASE64, 'base64'), caption: 'halo', groupStatus: true },
        { ...options, backgroundColor: '#7C3AED', font: FONTS.EXO2_EXTRABOLD });
    assert.equal(image.groupStatusMessageV2.message.imageMessage.font, undefined, 'a media caption is not an extendedTextMessage, so it carries no font');
});

test('future-proof-unwrap', async () => {
    const inner = { conversation: 'halo' };

    for (const key of FUTURE_PROOF_MESSAGE_KEYS) {
        assert.deepEqual(normalizeMessageContent({ [key]: { message: inner } }), inner, `${key} has to unwrap`);
    }

    assert.equal(FUTURE_PROOF_MESSAGE_KEYS.includes('audioStickerMessage'), true, 'field 134, added in revision 1047376727');
    assert.equal(FUTURE_PROOF_MESSAGE_KEYS.includes('acp2SettingMessage'), true, 'field 133, a wrapper that used to be left wrapped');

    const wrapped = { audioStickerMessage: { message: { stickerMessage: { url: 'https://x/y.webp' } } } };
    assert.equal(getContentType(wrapped), 'audioStickerMessage');
    assert.equal(getContentType(normalizeMessageContent(wrapped)), 'stickerMessage');

    const nested = { ephemeralMessage: { message: { viewOnceMessageV2: { message: inner } } } };
    assert.deepEqual(normalizeMessageContent(nested), inner, 'nested wrappers still peel');

    assert.equal(normalizeMessageContent(undefined), undefined);
    assert.deepEqual(normalizeMessageContent(inner), inner, 'a plain message is returned untouched');

    const sticker = proto.Message.StickerMessage.fromObject({
        url: 'https://x/y.webp',
        audioMessage: { url: 'https://x/y.enc', seconds: 3 }
    });
    const back = proto.Message.StickerMessage.decode(proto.Message.StickerMessage.encode(sticker).finish());
    assert.equal(back.audioMessage.seconds, 3, 'StickerMessage.audioMessage is field 26, added in the same revision');
});
