"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });

const PHONENUMBER_MCC = require("./phonenumber_mcc.json");
exports.PHONENUMBER_MCC = PHONENUMBER_MCC;

exports.DEFAULT_CACHE_TTLS = exports.MIN_UPLOAD_INTERVAL = exports.UPLOAD_TIMEOUT = exports.INITIAL_PREKEY_COUNT = exports.MIN_PREKEY_COUNT = exports.MEDIA_KEYS = exports.MEDIA_HKDF_KEY_MAPPING = exports.MEDIA_PATH_MAP = exports.DEFAULT_CONNECTION_CONFIG = exports.PROCESSABLE_HISTORY_TYPES = exports.WA_CERT_DETAILS = exports.URL_REGEX = exports.NOISE_WA_HEADER = exports.KEY_BUNDLE_TYPE = exports.DICT_VERSION = exports.NOISE_MODE = exports.WA_DEFAULT_EPHEMERAL = exports.WA_ADV_HOSTED_DEVICE_SIG_PREFIX = exports.WA_ADV_HOSTED_ACCOUNT_SIG_PREFIX = exports.WA_ADV_DEVICE_SIG_PREFIX = exports.WA_ADV_ACCOUNT_SIG_PREFIX = exports.UNAUTHORIZED_CODES = exports.version = void 0;
const WAProto_1 = require("../../WAProto");
const libsignal_1 = require("../Signal/libsignal");
const browser_utils_1 = require("../Utils/browser-utils");
const logger_1 = __importDefault(require("../Utils/logger"));
exports.version = [2, 3000, 1027934701];
exports.UNAUTHORIZED_CODES = [401, 403, 419];
exports.DEFAULT_ORIGIN = 'https://web.whatsapp.com';
exports.CALL_VIDEO_PREFIX = 'https://call.whatsapp.com/video/';
exports.CALL_AUDIO_PREFIX = 'https://call.whatsapp.com/voice/';
exports.DEF_CALLBACK_PREFIX = 'CB:';
exports.DEF_TAG_PREFIX = 'TAG:';
exports.PHONE_CONNECTION_CB = 'CB:Pong';
exports.WA_ADV_ACCOUNT_SIG_PREFIX = Buffer.from([6, 0]);
exports.WA_ADV_DEVICE_SIG_PREFIX = Buffer.from([6, 1]);
exports.WA_ADV_HOSTED_ACCOUNT_SIG_PREFIX = Buffer.from([6, 5]);
exports.WA_ADV_HOSTED_DEVICE_SIG_PREFIX = Buffer.from([6, 6]);
exports.WA_DEFAULT_EPHEMERAL = 7 * 24 * 60 * 60;
exports.NOISE_MODE = 'Noise_XX_25519_AESGCM_SHA256\0\0\0\0';
exports.DICT_VERSION = 3;
exports.KEY_BUNDLE_TYPE = Buffer.from([5]);
exports.NOISE_WA_HEADER = Buffer.from([87, 65, 6, exports.DICT_VERSION]);
exports.URL_REGEX = /https:\/\/(?![^:@\/\s]+:[^:@\/\s]+@)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?/g;
exports.WA_CERT_DETAILS = {
    SERIAL: 0
};
exports.PROCESSABLE_HISTORY_TYPES = [
    WAProto_1.proto.HistorySync.HistorySyncType.INITIAL_BOOTSTRAP,
    WAProto_1.proto.HistorySync.HistorySyncType.PUSH_NAME,
    WAProto_1.proto.HistorySync.HistorySyncType.RECENT,
    WAProto_1.proto.HistorySync.HistorySyncType.FULL,
    WAProto_1.proto.HistorySync.HistorySyncType.ON_DEMAND,
    WAProto_1.proto.HistorySync.HistorySyncType.NON_BLOCKING_DATA,
    WAProto_1.proto.HistorySync.HistorySyncType.INITIAL_STATUS_V3,
];
exports.DEFAULT_CONNECTION_CONFIG = {
    version: exports.version,
    browser: (0, browser_utils_1.Browsers)('Chrome'),
    waWebSocketUrl: 'wss://web.whatsapp.com/ws/chat',
    connectTimeoutMs: 20_000,
    keepAliveIntervalMs: 30_000,
    logger: logger_1.default.child({ class: 'baileys' }),
    emitOwnEvents: true,
    defaultQueryTimeoutMs: 60_000,
    customUploadHosts: [],
    retryRequestDelayMs: 250,
    maxMsgRetryCount: 5,
    fireInitQueries: true,
    auth: undefined,
    markOnlineOnConnect: true,
    syncFullHistory: true,
    patchMessageBeforeSending: msg => msg,
    shouldSyncHistoryMessage: () => true,
    shouldIgnoreJid: () => false,
    linkPreviewImageThumbnailWidth: 192,
    transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
    generateHighQualityLinkPreview: false,
    enableAutoSessionRecreation: true,
    enableRecentMessageCache: true,
    options: {},
    appStateMacVerification: {
        patch: false,
        snapshot: false
    },
    countryCode: 'US',
    getMessage: async () => undefined,
    cachedGroupMetadata: async () => undefined,
    makeSignalRepository: libsignal_1.makeLibSignalRepository
};
exports.MEDIA_PATH_MAP = {
    image: '/mms/image',
    video: '/mms/video',
    document: '/mms/document',
    audio: '/mms/audio',
    sticker: '/mms/image',
    'sticker-pack': '/mms/sticker-pack',
    'thumbnail-sticker-pack': '/mms/thumbnail-sticker-pack',
    'thumbnail-link': '/mms/image',
    'product-catalog-image': '/product/image',
    'md-app-state': '',
    'md-msg-hist': '/mms/md-app-state',
    'biz-cover-photo': '/pps/biz-cover-photo'
};
exports.MEDIA_HKDF_KEY_MAPPING = {
    audio: 'Audio',
    document: 'Document',
    gif: 'Video',
    image: 'Image',
    ppic: '',
    product: 'Image',
    ptt: 'Audio',
    video: 'Video',
    sticker: 'Image',
    'sticker-pack': 'Sticker Pack',
    'thumbnail-sticker-pack': 'Sticker Pack Thumbnail',
    'thumbnail-document': 'Document Thumbnail',
    'thumbnail-image': 'Image Thumbnail',
    'thumbnail-video': 'Video Thumbnail',
    'thumbnail-link': 'Link Thumbnail',
    'md-msg-hist': 'History',
    'md-app-state': 'App State',
    'product-catalog-image': '',
    'payment-bg-image': 'Payment Background',
    ptv: 'Video',
    'biz-cover-photo': 'Image'
};
exports.MEDIA_KEYS = Object.keys(exports.MEDIA_PATH_MAP);
exports.MIN_PREKEY_COUNT = 5;
exports.INITIAL_PREKEY_COUNT = 812;
exports.UPLOAD_TIMEOUT = 30000;
exports.MIN_UPLOAD_INTERVAL = 5000;
exports.DEFAULT_CACHE_TTLS = {
    SIGNAL_STORE: 5 * 60,
    MSG_RETRY: 60 * 60,
    CALL_OFFER: 5 * 60,
    USER_DEVICES: 5 * 60
};
