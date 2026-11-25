/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { Boom } from '@hapi/boom';
import { PassThrough } from 'stream';
import { prepareWAMessageMedia } from './messages.js';
import { getImageProcessingLibrary, getStream, toBuffer } from './messages-media.js';
import { loadFfmpeg } from './optional-media.js';

const AUDIO_MIMETYPES = new Set(['audio/ogg; codecs=opus', 'audio/mp4', 'audio/m4a', 'audio/x-m4a']);
const STICKER_MIMETYPES = new Set(['image/webp', 'application/was']);

const mediaInput = value => typeof value === 'string' || value instanceof URL ? { url: value } : value;

const isWebp = buffer => buffer.length >= 12
    && buffer.toString('ascii', 0, 4) === 'RIFF'
    && buffer.toString('ascii', 8, 12) === 'WEBP';

const isAnimatedWebp = buffer => {
    let offset = 12;
    while (offset + 8 <= buffer.length) {
        const chunk = buffer.toString('ascii', offset, offset + 4);
        const size = buffer.readUInt32LE(offset + 4);
        if (chunk === 'ANIM' || chunk === 'ANMF') {
            return true;
        }
        if (chunk === 'VP8X' && offset + 8 < buffer.length && (buffer[offset + 8] & 0x02)) {
            return true;
        }
        offset += 8 + size + (size % 2);
    }
    return false;
};

const imageToWebp = async (image, options) => {
    const { stream } = await getStream(mediaInput(image), options.options);
    const source = await toBuffer(stream);
    if (isWebp(source)) {
        return { buffer: source, isAnimated: isAnimatedWebp(source), isVideo: false };
    }
    if (source.length >= 12 && source.toString('ascii', 4, 8) === 'ftyp') {
        return { buffer: await videoToWebp(source, options), isAnimated: true, isVideo: true };
    }
    const lib = await getImageProcessingLibrary();
    let buffer;
    if (lib.sharp?.default) {
        buffer = await lib.sharp.default(source, { animated: true })
            .resize(512, 512, { fit: 'inside' })
            .webp({ quality: 80 })
            .toBuffer();
    }
    else if (lib.image?.Transformer) {
        buffer = await new lib.image.Transformer(source)
            .resize(512, 512)
            .webp(80);
    }
    else {
        throw new Boom('image conversion needs sharp or @napi-rs/image', { statusCode: 400 });
    }
    buffer = Buffer.from(buffer);
    return { buffer, isAnimated: isAnimatedWebp(buffer) };
};

const videoToWebp = async (video, options) => {
    const ffmpeg = await loadFfmpeg();
    const { stream } = await getStream(mediaInput(video), options.options);
    const output = new PassThrough();
    const chunks = [];
    output.on('data', chunk => chunks.push(chunk));
    await new Promise((resolve, reject) => {
        output.on('end', resolve);
        output.on('error', reject);
        ffmpeg(stream)
            .outputOptions([
                '-vf', 'format=rgba,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
                '-c:v', 'libwebp_anim',
                '-lossless', '0',
                '-q:v', '75',
                '-loop', '0',
                '-an',
                '-f', 'webp'
            ])
            .on('error', reject)
            .pipe(output, { end: true });
    });
    const buffer = Buffer.concat(chunks);
    if (!buffer.length) {
        throw new Boom('ffmpeg produced an empty animated sticker', { statusCode: 400 });
    }
    return buffer;
};

export const prepareAudioStickerMessage = async (content, options = {}) => {
    const kinds = ['sticker', 'image', 'video'].filter(kind => content?.[kind] != null);
    if (kinds.length !== 1) {
        throw new Boom('sendStAudioMessage needs exactly one of { sticker, image, video }', { statusCode: 400 });
    }
    const audio = content.audio ?? content.audioUrl;
    if (audio == null) {
        throw new Boom('sendStAudioMessage needs { audio } or { audioUrl }', { statusCode: 400 });
    }
    const stickerOptions = { ...content.stickerOptions };
    const audioOptions = { ...content.audioOptions };
    stickerOptions.mimetype ||= 'image/webp';
    audioOptions.mimetype ||= 'audio/ogg; codecs=opus';
    if (!STICKER_MIMETYPES.has(stickerOptions.mimetype.toLowerCase())) {
        throw new Boom('audio sticker media must be image/webp or application/was', { statusCode: 400 });
    }
    if (!AUDIO_MIMETYPES.has(audioOptions.mimetype.toLowerCase())) {
        throw new Boom('audio sticker audio must be ogg/opus, mp4, m4a, or x-m4a', { statusCode: 400 });
    }
    const kind = kinds[0];
    let visual;
    let isAnimated = true;
    if (kind === 'video') {
        visual = await videoToWebp(content[kind], options);
        stickerOptions.mimetype = 'image/webp';
        stickerOptions.width = 512;
        stickerOptions.height = 512;
    }
    else if (kind === 'image') {
        const converted = await imageToWebp(content[kind], options);
        visual = converted.buffer;
        isAnimated = converted.isAnimated;
        stickerOptions.mimetype = 'image/webp';
        if (converted.isVideo) {
            stickerOptions.width = 512;
            stickerOptions.height = 512;
        }
    }
    else {
        visual = mediaInput(content[kind]);
    }
    const [sticker, sound] = await Promise.all([
        prepareWAMessageMedia({
            sticker: visual,
            isAnimated,
            ...stickerOptions
        }, options),
        prepareWAMessageMedia({
            audio: mediaInput(audio),
            ...audioOptions,
            ptt: false
        }, options)
    ]);
    sticker.stickerMessage.stickerSentTs ??= Date.now();
    sticker.stickerMessage.audioMessage = sound.audioMessage;
    return { audioStickerMessage: { message: sticker } };
};
