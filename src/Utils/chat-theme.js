/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { Boom } from '@hapi/boom';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { proto } from '../../WAProto/index.js';
import { encryptedStream, extractVideoThumb, getStream, toBuffer } from './messages-media.js';

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

const THEME_FAMILIES = {
    default: 'Default',
    'whatsapp-green': 'WhatsApp-Green',
    'pearl-indigo': 'Pearl-Indigo',
    'tyrian-purple': 'Tyrian-Purple',
    'sunset-orange': 'Sunset-Orange',
    'merino-teal': 'Merino-Teal',
    'royal-blue': 'Royal-Blue',
    'dark-cerulean': 'Dark-Cerulean',
    'charcoal-green': 'Charcoal-Green',
    'persian-plum': 'Persian-Plum',
    'dune-mono': 'Dune-Mono',
    'default-blue': 'Default-Blue',
    'default-mono': 'Default-Mono',
    'sky-blue': 'Sky-Blue',
    brown: 'Brown',
    cream: 'Cream',
    emerald: 'Emerald',
    lemon: 'Lemon',
    lime: 'Lime',
    pink: 'Pink',
    red: 'Red',
    'sunrise-orange': 'Sunrise-Orange',
    'warm-yellow': 'Warm-Yellow'
};

const MINIMAL_THEMES = new Set(['default-blue', 'default-mono', 'sky-blue', 'pearl-indigo']);
const schemes = { ...THEME_FAMILIES };
for (const [alias, id] of Object.entries(THEME_FAMILIES)) {
    if (alias !== 'default') {
        schemes[`${alias}-tonal`] = `${id}@Tonal`;
    }
    if (MINIMAL_THEMES.has(alias)) {
        schemes[`${alias}-minimal`] = `${id}@Minimal`;
    }
}

export const CHAT_THEME_PRESETS = Object.freeze(schemes);
export const CHAT_BUBBLE_PRESETS = CHAT_THEME_PRESETS;
export const CHAT_ANIMATED_WALLPAPER_PRESETS = Object.freeze({
    gradient: 'gradient',
    iridescent: 'iridescent',
    aurora: 'aurora',
    'lava-lamp': 'lavaLamp'
});
const CHAT_STOCK_WALLPAPER_IDS = Object.freeze([
    'wallpaper_copper_blue_001',
    'wallpaper_neon_dusk_001',
    'wallpaper_fresh_rose_001',
    'wallpaper_orange_001',
    'wallpaper_morning_001',
    'wallpaper_peach_001',
    'wallpaper_bloom_001',
    'wallpaper_dusk_001',
    'wallpaper_laser_001',
    'wallpaper_violet_001',
    'wallpaper_leak_001',
    'wallpaper_lilac_001',
    'wallpaper_night_001',
    'wallpaper_space_001',
    'wallpaper_sunset_001',
    'wallpaper_blue_gray_001',
    'wallpaper_muk_001',
    'wallpaper_late_night_001',
    'wallpaper_agave_cactus_orange_stucco_wall_001',
    'wallpaper_joshua_tree_moon_001',
    'wallpaper_airplane_palm_tree_001',
    'wallpaper_black_sand_beach_hawaii_001',
    'wallpaper_looking_up_palm_trees_001',
    'wallpaper_beach_top_view_bileffahi_001',
    'wallpaper_fall_grand_teton_mountains_wyoming_001',
    'wallpaper_buttes_in_monument_valley_arizona_001',
    'wallpaper_beach_palm_trees_001',
    'wallpaper_sunset_icebergs_greenland_001',
    'wallpaper_kauai_shore_hawaii_001',
    'wallpaper_migrating_bird_sun_001',
    'wallpaper_sunrise_yosemite_national_park_001',
    'wallpaper_winding_road_utah_001',
    'wallpaper_green_meadow_on_hill_001',
    'wallpaper_rock_joshua_tree_national_park_001',
    'wallpaper_icebergs_floating_over_sea_greenland_001',
    'wallpaper_vermilion_cliffs_national_monument_001',
    'wallpaper_moon_maple_tree_001',
    'wallpaper_mesa_arch_utah_001',
    'wallpaper_sunset_snowy_mountain_ridge_alaska_001',
    'wallpaper_daytime_snow_covered_desert_001',
    'wallpaper-00012',
    'wallpaper-00028',
    'wallpaper-00029',
    'wallpaper-00030',
    'wallpaper-00027',
    'wallpaper-00008',
    'wallpaper-00021',
    'wallpaper-00019',
    'wallpaper-00011',
    'wallpaper-00022',
    'wallpaper-00018',
    'wallpaper-00001',
    'wallpaper-00025',
    'wallpaper_burger_hotdog_floaties_001',
    'wallpaper_dark_iridescent_liquid_001',
    'wallpaper_prism_cake_001',
    'wallpaper-00006',
    'wallpaper_heart_necklace_001',
    'wallpaper_chrome_metal_001',
    'wallpaper-00002',
    'wallpaper_rhinestone_stickers_001',
    'wallpaper-00010',
    'wallpaper-00003',
    'wallpaper-00009',
    'wallpaper_soft_lemon_001',
    'wallpaper_star_shape_balloons_001',
    'wallpaper-00016',
    'wallpaper_glossy_heart_001',
    'wallpaper-00020',
    'wallpaper_glossy_star_001',
    'wallpaper_heart_and_bubble_001',
    'wallpaper-00013',
    'wallpaper-00023',
    'wallpaper_soft_grape_001',
    'wallpaper_clear_resin_sculpture_001',
    'wallpaper_chrome_cherry_001',
    'wallpaper_disco_tomato_001',
    'wallpaper_charcoal_heart_001',
    'wallpaper_clear_organic_resin_in_dark_001',
    'wallpaper_hexagon_mercedes_001',
    'wallpaper_blue_stars_karol_g_001',
    'wallpaper_pink_ribbons_loveshackfancy_001',
    'wallpaper_lion_HP_001',
    'wallpaper_badger_HP_001',
    'wallpaper_bird_HP_001',
    'wallpaper_snake_HP_001'
]);
const CHAT_SCHEME_IDS = new Set(Object.values(CHAT_THEME_PRESETS));
const CHAT_ANIMATED_WALLPAPER_IDS = new Set(Object.values(CHAT_ANIMATED_WALLPAPER_PRESETS));
const CHAT_STOCK_WALLPAPER_ID_SET = new Set(CHAT_STOCK_WALLPAPER_IDS);
const CHAT_STOCK_WALLPAPER_PRESETS = Object.freeze(Object.fromEntries(
    CHAT_STOCK_WALLPAPER_IDS.map(id => [id.endsWith('_001') ? id.slice(0, -4) : id, id])
));

const RESET_WORDS = new Set(['reset', 'clear', 'hapus', 'default']);
const EXAMPLE_WORDS = new Set(['example', 'examples', 'contoh', 'list']);
const WALLPAPER_HKDF_INFO = 'Chat Wallpaper';
const ARGB_ALPHA = 0xff000000;

export const isChatThemeExample = content => typeof content === 'string' && EXAMPLE_WORDS.has(content.trim().toLowerCase());

export const getChatThemeExamples = () => ({
    themes: {
        ...CHAT_THEME_PRESETS,
        ...CHAT_STOCK_WALLPAPER_PRESETS
    },
    bubbles: CHAT_BUBBLE_PRESETS,
    animatedWallpapers: CHAT_ANIMATED_WALLPAPER_PRESETS,
    usage: [
        "conn.setThemeGroup(m.chat, { theme: 'pink' })",
        "conn.setThemeGroup(m.chat, { bubble: 'royal-blue' })",
        "conn.setThemeGroup(m.chat, { theme: 'pink', bubble: 'royal-blue' })",
        "conn.setThemeGroup(m.chat, { theme: './wallpaper.jpg', bubble: 'pink-tonal' })",
        "conn.setThemeGroup(m.chat, { theme: 'wallpaper_bloom', dimLevel: 0.2 })",
        "conn.setThemeGroup(m.chat, { animatedWallpaper: 'aurora', dimLevel: 0.2 })",
        "conn.setThemeGroup(m.chat, { reset: true })"
    ]
});

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

const findScheme = value => {
    const input = value.trim();
    if (CHAT_SCHEME_IDS.has(input)) {
        return input;
    }
    const alias = input.toLowerCase().replace(/[\s_@]+/g, '-');
    return CHAT_THEME_PRESETS[alias] || null;
};

const resolveScheme = (value, label) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Boom(`${label} must be a theme ID from setThemeGroup(jid, 'example')`, { statusCode: 400 });
    }
    const scheme = findScheme(value);
    if (!scheme) {
        throw new Boom(`${label} is unknown; use setThemeGroup(jid, 'example')`, { statusCode: 400 });
    }
    return scheme;
};

const findAnimatedWallpaper = value => {
    if (typeof value !== 'string') {
        return null;
    }
    const input = value.trim();
    if (CHAT_ANIMATED_WALLPAPER_IDS.has(input)) {
        return input;
    }
    const alias = input.toLowerCase().replace(/[\s_@]+/g, '-');
    return CHAT_ANIMATED_WALLPAPER_PRESETS[alias] || null;
};

const resolveAnimatedWallpaper = value => {
    const id = findAnimatedWallpaper(value);
    if (!id) {
        throw new Boom('animatedWallpaper must be gradient, iridescent, aurora, or lava-lamp', { statusCode: 400 });
    }
    return id;
};

const findStockWallpaper = value => {
    if (typeof value !== 'string') {
        return null;
    }
    const input = value.trim();
    if (CHAT_STOCK_WALLPAPER_ID_SET.has(input)) {
        return input;
    }
    return CHAT_STOCK_WALLPAPER_PRESETS[input] || null;
};

const resolveStockWallpaper = value => {
    const id = findStockWallpaper(value);
    if (!id) {
        throw new Boom('stockWallpaper must be an ID from setThemeGroup(jid, \'example\')', { statusCode: 400 });
    }
    return id;
};

const normalizeContent = content => {
    if (content == null) {
        throw new Boom('setThemeGroup needs a theme, bubble, wallpaper, animatedWallpaper, color, or reset', { statusCode: 400 });
    }
    if (typeof content === 'string') {
        const value = content.trim();
        if (RESET_WORDS.has(value.toLowerCase())) {
            return { reset: true };
        }
        if (findAnimatedWallpaper(value)) {
            return { animatedWallpaper: value };
        }
        if (findStockWallpaper(value)) {
            return { stockWallpaper: value };
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
        throw new Boom('setThemeGroup content is invalid', { statusCode: 400 });
    }
    return { ...content };
};

const normalizeWallpaper = wallpaper => {
    if (typeof wallpaper === 'string' || wallpaper instanceof URL) {
        return { url: wallpaper };
    }
    if (!Buffer.isBuffer(wallpaper) && wallpaper instanceof Uint8Array) {
        return Buffer.from(wallpaper);
    }
    return wallpaper;
};

const isGif = buffer => buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6));
const isVideo = buffer => buffer.length >= 12 && (
    buffer.toString('ascii', 4, 8) === 'ftyp'
    || (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3)
    || (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'AVI ')
);

const prepareWallpaper = async (wallpaper, options) => {
    const { stream } = await getStream(normalizeWallpaper(wallpaper), options.options);
    const source = await toBuffer(stream);
    if (!source.length) {
        throw new Boom('chat wallpaper is empty', { statusCode: 400 });
    }
    if (!isGif(source) && !isVideo(source)) {
        return source;
    }
    const directory = await fs.mkdtemp(join(tmpdir(), 'elaina-chat-wallpaper-'));
    try {
        const sourcePath = join(directory, 'source');
        await fs.writeFile(sourcePath, source);
        const converted = await extractVideoThumb(sourcePath, '00:00:00', { width: 1080, height: 1080 });
        if (!converted.length) {
            throw new Boom('ffmpeg produced an empty wallpaper frame', { statusCode: 400 });
        }
        return converted;
    }
    catch (error) {
        throw new Boom(`failed to convert GIF/video wallpaper to JPEG: ${error.message}`, { statusCode: 400 });
    }
    finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
};

const uploadWallpaper = async (wallpaper, options) => {
    if (typeof options.upload !== 'function') {
        throw new Boom('setThemeGroup wallpaper needs an uploaded media backend', { statusCode: 500 });
    }
    const media = await prepareWallpaper(wallpaper, options);
    const encrypted = await encryptedStream(media, 'chat-wallpaper', {
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

const buildMessage = ({ bubble, color, wallpaper, stockImage, animatedWallpaper, reset, defaultWallpaper }) => {
    const chatThemeSetting = proto.Message.ChatThemeSetting.fromObject({
        settingTimestampMs: Date.now(),
        ...(reset ? { clearTheme: true } : {}),
        ...(bubble ? { colorSchemeId: bubble } : {}),
        ...(defaultWallpaper ? { defaultWallpaper: {} } : {}),
        ...(color != null ? { solidColor: { backgroundLightArgb: color, backgroundDarkArgb: color } } : {}),
        ...(stockImage ? { stockImage } : {}),
        ...(wallpaper ? { customImage: wallpaper } : {}),
        ...(animatedWallpaper ? { animatedWallpaper } : {})
    });
    return proto.Message.fromObject({
        protocolMessage: {
            type: proto.Message.ProtocolMessage.Type.CHAT_THEME_SETTING,
            chatThemeSetting
        }
    });
};

export const prepareChatThemeMessages = async (content, options = {}) => {
    const input = normalizeContent(content);
    if (input.theme != null) {
        if (input.color != null || input.wallpaper != null || input.animatedWallpaper != null || input.reset === true) {
            throw new Boom('theme cannot be combined with color, wallpaper, animatedWallpaper, or reset', { statusCode: 400 });
        }
        if (typeof input.theme === 'string') {
            const value = input.theme.trim();
            if (!value) {
                throw new Boom('theme must not be empty', { statusCode: 400 });
            }
            const scheme = findScheme(value);
            if (scheme) {
                input.themeScheme = scheme;
            }
            else if (findAnimatedWallpaper(value)) {
                input.animatedWallpaper = value;
            }
            else if (findStockWallpaper(value)) {
                input.stockWallpaper = value;
            }
            else if (value.startsWith('#') || CHAT_THEME_COLOR_PRESETS[value.toLowerCase()] || /^[0-9a-f]{6}$/i.test(value)) {
                input.color = value;
            }
            else {
                input.wallpaper = input.theme;
            }
        }
        else {
            input.wallpaper = input.theme;
        }
    }
    if (input.bubble != null && input.colorSchemeId != null) {
        throw new Boom('use only one of bubble or colorSchemeId', { statusCode: 400 });
    }
    const bubble = input.bubble != null ? resolveScheme(input.bubble, 'bubble') : input.colorSchemeId;
    if (bubble != null && (typeof bubble !== 'string' || !bubble.trim())) {
        throw new Boom('chatThemeSetting.colorSchemeId must be a non-empty string', { statusCode: 400 });
    }
    const reset = input.reset === true;
    const sources = [reset, input.color != null, input.wallpaper != null, input.stockWallpaper != null, input.animatedWallpaper != null, input.themeScheme != null].filter(Boolean).length;
    if (sources > 1 || (sources === 0 && bubble == null) || (reset && bubble != null)) {
        throw new Boom('setThemeGroup needs exactly one theme source, optionally one bubble, or reset', { statusCode: 400 });
    }
    if (reset) {
        return [buildMessage({ reset })];
    }
    const color = input.color != null ? parseColor(input.color) : undefined;
    let wallpaper;
    if (input.wallpaper != null) {
        wallpaper = await uploadWallpaper(input.wallpaper, options);
        if (input.dimLevel != null) {
            wallpaper.dimLevel = Number(input.dimLevel);
        }
    }
    let stockImage;
    if (input.stockWallpaper != null) {
        stockImage = { stockImageId: resolveStockWallpaper(input.stockWallpaper) };
        if (input.dimLevel != null) {
            stockImage.dimLevel = Number(input.dimLevel);
        }
    }
    let animatedWallpaper;
    if (input.animatedWallpaper != null) {
        animatedWallpaper = { animatedWallpaperId: resolveAnimatedWallpaper(input.animatedWallpaper) };
        if (input.dimLevel != null) {
            animatedWallpaper.dimLevel = Number(input.dimLevel);
        }
    }
    if (input.themeScheme) {
        const themeMessage = buildMessage({ bubble: input.themeScheme, defaultWallpaper: true });
        if (bubble && bubble !== input.themeScheme) {
            return [themeMessage, buildMessage({ bubble })];
        }
        return [themeMessage];
    }
    return [buildMessage({ bubble, color, wallpaper, stockImage, animatedWallpaper })];
};

export const prepareChatThemeMessage = async (content, options = {}) => {
    const messages = await prepareChatThemeMessages(content, options);
    if (messages.length !== 1) {
        throw new Boom('named theme and bubble overrides require prepareChatThemeMessages', { statusCode: 400 });
    }
    return messages[0];
};
