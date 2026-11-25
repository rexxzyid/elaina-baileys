/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { Boom } from '@hapi/boom';
import { promises as fs } from 'fs';
import { proto } from '../../WAProto/index.js';
import { encryptedStream } from './messages-media.js';

export const CHAT_THEME_COLOR_PRESETS = Object.freeze({
    pink: '#ff69b4',
    biru: '#1e90ff',
    ungu: '#9b59b6',
    hitam: '#121212',
    hijau: '#2ecc71',
    merah: '#e74c3c',
    kuning: '#f1c40f',
    oren: '#e67e22',
    putih: '#f5f6fa'
});

const RESET_WORDS = new Set(['reset', 'clear', 'hapus', 'default']);
const WALLPAPER_HKDF_INFO = 'Chat Wallpaper';
const ARGB_ALPHA = 0xff000000;

const parseColor = value => {
    if (typeof value !== 'string') {
        throw new Boom('chat theme color must be a hex string', { statusCode: 400 });
    }
    const input = value.trim().toLowerCase();
    const resolved = CHAT_THEME_COLOR_PRESETS[input] || input;
    const hex = resolved.startsWith('#') ? resolved.slice(1) : resolved;
    if (!/^[0-9a-f]{6}$/.test(hex)) {
        throw new Boom('chat theme color must be #RRGGBB or a known preset', { statusCode: 400 });
    }
    return (ARGB_ALPHA | parseInt(hex, 16)) >>> 0;
};

const normalizeContent = content => {
    if (content == null) {
        throw new Boom('setThemGroup needs a color, wallpaper, or reset', { statusCode: 400 });
    }
    if (typeof content === 'string') {
        const value = content.trim();
        if (RESET_WORDS.has(value.toLowerCase())) {
            return { reset: true };
        }
        if (value.startsWith('#') || CHAT_THEME_COLOR_PRESETS[value.toLowerCase()] || /^[0-9a-f]{6}$/i.test(value)) {
            return { color: value };
        }
        return { wallpaper: content };
    }
    if (Buffer.isBuffer(content) || content instanceof Uint8Array || content instanceof URL) {
        return { wallpaper: content };
    }
    if (typeof content !== 'object') {
        throw new Boom('setThemGroup content is invalid', { statusCode: 400 });
    }
    return content;
};

const uploadWallpaper = async (wallpaper, options) => {
    if (typeof options.upload !== 'function') {
        throw new Boom('setThemGroup wallpaper needs an uploaded media backend', { statusCode: 500 });
    }
    const encrypted = await encryptedStream(wallpaper, 'chat-wallpaper', {
        logger: options.logger,
        opts: options.options
    }, WALLPAPER_HKDF_INFO);
    try {
        const { directPath } = await options.upload(encrypted.encFilePath, {
            fileEncSha256B64: encrypted.fileEncSha256.toString('base64'),
            mediaType: 'chat-wallpaper',
            timeoutMs: options.mediaUploadTimeoutMs
        });
        if (!directPath) {
            throw new Boom('chat wallpaper upload returned no direct path', { statusCode: 500 });
        }
        return {
            directPath,
            mediaKey: encrypted.mediaKey,
            fileEncSha256: encrypted.fileEncSha256,
            fileSha256: encrypted.fileSha256
        };
    }
    finally {
        await fs.unlink(encrypted.encFilePath).catch(() => {});
    }
};

export const prepareChatThemeMessage = async (content, options = {}) => {
    const input = normalizeContent(content);
    const modes = [input.reset === true, input.color != null, input.wallpaper != null].filter(Boolean);
    if (modes.length !== 1) {
        throw new Boom('setThemGroup needs exactly one of { color, wallpaper, reset }', { statusCode: 400 });
    }
    if (input.colorSchemeId != null && typeof input.colorSchemeId !== 'string') {
        throw new Boom('chatThemeSetting.colorSchemeId must be a string', { statusCode: 400 });
    }
    let wallpaper;
    if (input.wallpaper != null) {
        wallpaper = await uploadWallpaper(input.wallpaper, options);
        if (input.dimLevel != null) {
            wallpaper.dimLevel = Number(input.dimLevel);
        }
    }
    const color = input.color != null ? parseColor(input.color) : undefined;
    const chatThemeSetting = proto.Message.ChatThemeSetting.fromObject({
        settingTimestampMs: Date.now(),
        ...(input.reset === true ? { clearTheme: true } : {}),
        ...(input.colorSchemeId ? { colorSchemeId: input.colorSchemeId } : {}),
        ...(color != null ? { solidColor: { backgroundLightArgb: color, backgroundDarkArgb: color } } : {}),
        ...(wallpaper ? { customImage: wallpaper } : {})
    });
    return proto.Message.fromObject({
        protocolMessage: {
            type: proto.Message.ProtocolMessage.Type.CHAT_THEME_SETTING,
            chatThemeSetting
        }
    });
};
