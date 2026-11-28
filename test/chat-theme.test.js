import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDecipheriv, createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { proto } from '../WAProto/index.js';
import { hkdf } from '../src/Utils/crypto.js';
import {
    CHAT_ANIMATED_WALLPAPER_PRESETS,
    CHAT_BUBBLE_PRESETS,
    CHAT_THEME_COLOR_PRESETS,
    CHAT_THEME_PRESETS,
    getChatThemeExamples,
    prepareChatThemeMessage,
    prepareChatThemeMessages
} from '../src/Utils/chat-theme.js';

const encodeAndDecode = content => proto.Message.decode(proto.Message.encode(content).finish());
const logger = { debug() {}, info() {}, warn() {} };

test('chat theme solid color uses current proto fields', async () => {
    const message = encodeAndDecode(await prepareChatThemeMessage('#ff69b4', { logger }));
    const setting = message.protocolMessage.chatThemeSetting;
    assert.equal(message.protocolMessage.type, proto.Message.ProtocolMessage.Type.CHAT_THEME_SETTING);
    assert.ok(setting.settingTimestampMs);
    assert.equal(setting.solidColor.backgroundLightArgb, 0xffff69b4);
    assert.equal(setting.solidColor.backgroundDarkArgb, 0xffff69b4);
    assert.equal(setting.clearTheme, null);
    assert.equal(setting.customImage, null);
});

test('chat theme presets and reset are accepted', async () => {
    const pink = encodeAndDecode(await prepareChatThemeMessage('pink', { logger }));
    assert.equal(pink.protocolMessage.chatThemeSetting.solidColor.backgroundLightArgb, 0xffff69b4);
    const reset = encodeAndDecode(await prepareChatThemeMessage('reset', { logger }));
    assert.equal(reset.protocolMessage.chatThemeSetting.clearTheme, true);
    assert.equal(CHAT_THEME_COLOR_PRESETS.pink, '#ff69b4');
});

test('chat theme wallpaper encrypts with Chat Wallpaper info and uploads via chat-wallpaper path', async () => {
    const source = Buffer.from('fake jpeg wallpaper');
    let captured;
    const message = await prepareChatThemeMessage({
        wallpaper: source,
        dimLevel: 0.25
    }, {
        logger,
        async upload(filePath, metadata) {
            assert.equal(metadata.mediaType, 'chat-wallpaper');
            const encrypted = await readFile(filePath);
            captured = { encrypted, sha256: metadata.fileEncSha256B64 };
            return { directPath: '/v/t62.15575-24/chat-wallpaper.enc', mediaUrl: 'https://media.example/wallpaper.enc' };
        }
    });
    const decoded = encodeAndDecode(message);
    const custom = decoded.protocolMessage.chatThemeSetting.customImage;
    assert.equal(custom.directPath, '/v/t62.15575-24/chat-wallpaper.enc');
    assert.equal(custom.mediaKey.length, 32);
    assert.equal(custom.fileEncSha256.length, 32);
    assert.equal(custom.fileSha256.length, 32);
    assert.equal(custom.dimLevel, 0.25);
    assert.ok(captured);
    assert.equal(captured.encrypted.length, source.length + 16 - (source.length % 16) + 10);
    const expanded = hkdf(Buffer.from(custom.mediaKey), 112, { info: 'Chat Wallpaper' });
    const decipher = createDecipheriv('aes-256-cbc', expanded.subarray(16, 48), expanded.subarray(0, 16));
    const plain = Buffer.concat([
        decipher.update(captured.encrypted.subarray(0, -10)),
        decipher.final()
    ]);
    assert.deepEqual(plain, source);
});

test('animated wallpaper presets use native IDs without media upload', async () => {
    const expected = {
        gradient: 'gradient',
        iridescent: 'iridescent',
        aurora: 'aurora',
        'lava-lamp': 'lavaLamp'
    };
    assert.deepEqual(CHAT_ANIMATED_WALLPAPER_PRESETS, expected);
    for (const [alias, id] of Object.entries(expected)) {
        const message = await prepareChatThemeMessage({
            animatedWallpaper: alias,
            bubble: 'pink',
            dimLevel: 0.25
        }, {
            logger,
            upload() {
                assert.fail('animated wallpaper must not upload media');
            }
        });
        const setting = encodeAndDecode(message).protocolMessage.chatThemeSetting;
        assert.equal(setting.animatedWallpaper.animatedWallpaperId, id);
        assert.equal(setting.animatedWallpaper.dimLevel, 0.25);
        assert.equal(setting.colorSchemeId, 'Pink');
        assert.equal(setting.customImage, null);
    }
    const direct = encodeAndDecode(await prepareChatThemeMessage('lavaLamp', { logger }));
    assert.equal(direct.protocolMessage.chatThemeSetting.animatedWallpaper.animatedWallpaperId, 'lavaLamp');
    const named = encodeAndDecode(await prepareChatThemeMessage({ theme: 'aurora' }, { logger }));
    assert.equal(named.protocolMessage.chatThemeSetting.animatedWallpaper.animatedWallpaperId, 'aurora');
    await assert.rejects(prepareChatThemeMessage({ animatedWallpaper: 'id-buatan-sendiri' }, { logger }), /animatedWallpaper must be/);
});

test('stock wallpaper IDs are available through theme without media upload', async () => {
    const catalog = getChatThemeExamples();
    const ids = Object.values(catalog.themes).filter(id => /^wallpaper(?:-|_)/.test(id));
    assert.equal(ids.length, 86);
    assert.equal(new Set(ids).size, 86);
    for (const id of ids) {
        const message = await prepareChatThemeMessage({
            theme: id,
            bubble: 'pink',
            dimLevel: 0.25
        }, {
            logger,
            upload() {
                assert.fail('stock wallpaper must not upload media');
            }
        });
        const setting = encodeAndDecode(message).protocolMessage.chatThemeSetting;
        assert.equal(setting.stockImage.stockImageId, id);
        assert.equal(setting.stockImage.dimLevel, 0.25);
        assert.equal(setting.colorSchemeId, 'Pink');
        assert.equal(setting.customImage, null);
        assert.equal(setting.animatedWallpaper, null);
    }
    const direct = encodeAndDecode(await prepareChatThemeMessage('wallpaper_dusk_001', { logger }));
    assert.equal(direct.protocolMessage.chatThemeSetting.stockImage.stockImageId, 'wallpaper_dusk_001');
});

test('chat theme rejects ambiguous or invalid input', async () => {
    await assert.rejects(prepareChatThemeMessage({}, { logger }), /exactly one/);
    await assert.rejects(prepareChatThemeMessage({ color: '#ff69b4', reset: true }, { logger }), /exactly one/);
    await assert.rejects(prepareChatThemeMessage('#xyz', { logger }), /#RRGGBB/);
    await assert.rejects(prepareChatThemeMessage({ bubble: 'warna-sembarangan' }, { logger }), /bubble is unknown/);
    await assert.rejects(prepareChatThemeMessage({ color: '#ff69b4' }, { logger, upload: undefined }).then(async () => {
        await prepareChatThemeMessage({ wallpaper: Buffer.from('x') }, { logger });
    }), /uploaded media backend/);
});

test('theme and bubble catalogs contain every WA Web scheme', () => {
    const catalog = getChatThemeExamples();
    assert.equal(Object.keys(CHAT_THEME_PRESETS).length, 49);
    assert.equal(Object.keys(catalog.themes).length, 135);
    assert.equal(CHAT_BUBBLE_PRESETS, CHAT_THEME_PRESETS);
    assert.equal(catalog.themes.pink, 'Pink');
    assert.equal(catalog.themes.wallpaper_bloom_001, 'wallpaper_bloom_001');
    assert.equal(catalog.themes.wallpaper_lion_HP_001, 'wallpaper_lion_HP_001');
    assert.equal(catalog.bubbles['royal-blue-tonal'], 'Royal-Blue@Tonal');
    assert.equal(catalog.bubbles['default-blue-minimal'], 'Default-Blue@Minimal');
    assert.equal(catalog.bubbles['sunset-orange'], 'Sunset-Orange');
    assert.deepEqual(catalog.animatedWallpapers, CHAT_ANIMATED_WALLPAPER_PRESETS);
    assert.equal(catalog.animatedWallpapers['lava-lamp'], 'lavaLamp');
    assert.ok(catalog.usage.some(example => example.includes("theme: 'pink', bubble: 'royal-blue'")));
});

test('named theme and bubble overrides use the available colorSchemeId field in order', async () => {
    const themed = await prepareChatThemeMessages({ theme: 'pink' }, { logger });
    assert.equal(themed.length, 1);
    assert.equal(themed[0].protocolMessage.chatThemeSetting.colorSchemeId, 'Pink');
    assert.ok(themed[0].protocolMessage.chatThemeSetting.defaultWallpaper);

    const combined = await prepareChatThemeMessages({ theme: 'pink', bubble: 'royal-blue' }, { logger });
    assert.equal(combined.length, 2);
    assert.equal(combined[0].protocolMessage.chatThemeSetting.colorSchemeId, 'Pink');
    assert.ok(combined[0].protocolMessage.chatThemeSetting.defaultWallpaper);
    assert.equal(combined[1].protocolMessage.chatThemeSetting.colorSchemeId, 'Royal-Blue');
    assert.equal(combined[1].protocolMessage.chatThemeSetting.defaultWallpaper, null);

    const bubbleOnly = encodeAndDecode((await prepareChatThemeMessages({ bubble: 'royal-blue-tonal' }, { logger }))[0]);
    assert.equal(bubbleOnly.protocolMessage.chatThemeSetting.colorSchemeId, 'Royal-Blue@Tonal');
    assert.equal(bubbleOnly.protocolMessage.chatThemeSetting.defaultWallpaper, null);
    await assert.rejects(prepareChatThemeMessage({ theme: 'pink', bubble: 'royal-blue' }, { logger }), /prepareChatThemeMessages/);
});

test('wallpaper path string is normalized and can include a bubble', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'elaina-chat-theme-'));
    const filePath = join(directory, 'wallpaper.jpg');
    const source = Buffer.from('wallpaper from a local path');
    await writeFile(filePath, source);
    try {
        const messages = await prepareChatThemeMessages({ theme: filePath, bubble: 'pink' }, {
            logger,
            async upload(encryptedPath) {
                assert.equal((await readFile(encryptedPath)).length > source.length, true);
                return { directPath: '/v/t62.15575-24/local-wallpaper.enc' };
            }
        });
        assert.equal(messages.length, 1);
        const setting = encodeAndDecode(messages[0]).protocolMessage.chatThemeSetting;
        assert.equal(setting.colorSchemeId, 'Pink');
        assert.equal(setting.customImage.directPath, '/v/t62.15575-24/local-wallpaper.enc');
        assert.equal(setting.customImage.fileSha256.length, 32);
    }
    finally {
        await rm(directory, { recursive: true, force: true });
    }
});

test('wallpaper URL string is fetched instead of passed as a raw string to getStream', async () => {
    const source = Buffer.from('wallpaper from a remote URL');
    const server = createServer((request, response) => {
        response.writeHead(200, { 'content-type': 'image/jpeg' });
        response.end(source);
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });
    try {
        const address = server.address();
        const url = `http://127.0.0.1:${address.port}/wallpaper.jpg`;
        const messages = await prepareChatThemeMessages({ wallpaper: url, bubble: 'royal-blue' }, {
            logger,
            async upload(encryptedPath) {
                assert.equal((await readFile(encryptedPath)).length > source.length, true);
                return { directPath: '/v/t62.15575-24/remote-wallpaper.enc' };
            }
        });
        const setting = encodeAndDecode(messages[0]).protocolMessage.chatThemeSetting;
        assert.equal(setting.colorSchemeId, 'Royal-Blue');
        assert.equal(setting.customImage.directPath, '/v/t62.15575-24/remote-wallpaper.enc');
        assert.equal(setting.customImage.fileSha256.length, 32);
    }
    finally {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});

test('GIF and MP4 wallpapers are converted to a JPEG frame before encryption', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'elaina-wallpaper-ffmpeg-'));
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0xff, 0xd9]);
    const ffmpegPath = join(directory, 'ffmpeg');
    await writeFile(ffmpegPath, `#!${process.execPath}\nprocess.stdout.write(Buffer.from(${JSON.stringify([...jpeg])}));\n`);
    await chmod(ffmpegPath, 0o755);
    const previousPath = process.env.PATH;
    process.env.PATH = `${directory}:${previousPath}`;
    const mp4 = Buffer.alloc(16);
    mp4.write('ftyp', 4, 'ascii');
    try {
        for (const [name, source] of [['gif', Buffer.from('GIF89a animated wallpaper')], ['mp4', mp4]]) {
            const messages = await prepareChatThemeMessages({ wallpaper: source }, {
                logger,
                async upload() {
                    return { directPath: `/v/t62.15575-24/${name}-wallpaper.enc` };
                }
            });
            const custom = encodeAndDecode(messages[0]).protocolMessage.chatThemeSetting.customImage;
            assert.equal(custom.directPath, `/v/t62.15575-24/${name}-wallpaper.enc`);
            assert.deepEqual(Buffer.from(custom.fileSha256), createHash('sha256').update(jpeg).digest());
        }
    }
    finally {
        process.env.PATH = previousPath;
        await rm(directory, { recursive: true, force: true });
    }
});

test('GIF conversion reports a clean error when ffmpeg is unavailable', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'elaina-empty-path-'));
    const previousPath = process.env.PATH;
    process.env.PATH = directory;
    try {
        await assert.rejects(prepareChatThemeMessages({ wallpaper: Buffer.from('GIF87a animated') }, {
            logger,
            async upload() {
                return { directPath: '/unused' };
            }
        }), /failed to convert GIF\/video wallpaper to JPEG/);
    }
    finally {
        process.env.PATH = previousPath;
        await rm(directory, { recursive: true, force: true });
    }
});
