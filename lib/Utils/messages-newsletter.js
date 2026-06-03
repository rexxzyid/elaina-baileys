"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));

var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};

Object.defineProperty(exports, "__esModule", { value: true });
exports.makeNewsletterUtils = void 0;

const crypto_1 = __importStar(require("crypto"));
const WAProto_1 = require("../../WAProto");

function makeNewsletterUtils(sock) {
    async function sendNewsletterMessage(type, newsletterId, buffer, options = {}) {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error("buffer must be Buffer");
        }

        const jid = newsletterId.endsWith("@newsletter")
            ? newsletterId
            : `${newsletterId}@newsletter`;

        const map = {
            PTV: "video",
            VIDEO: "video",
            IMAGE: "image",
            AUDIO: "audio",
            SWCH: null
        };

        const mediaType = map[type];
        if (!mediaType) {
            throw new Error(`Unsupported newsletter type: ${type}`);
        }

        const mediaKey = crypto_1.randomBytes(32);
        const enc = await sock.encryptMedia(buffer, mediaType, mediaKey);

        const fileSha256 = crypto_1.createHash("sha256").update(buffer).digest();
        const fileEncSha256 = crypto_1.createHash("sha256").update(enc).digest();

        const upload = await sock.waUploadToServer(enc, {
            mediaType,
            fileEncSha256B64: fileEncSha256.toString("base64"),
            newsletter: true
        });

        let message;

        if (type === "PTV") {
            message = {
                ptvMessage: WAProto_1.proto.Message.VideoMessage.fromObject({
                    url: upload.url,
                    directPath: upload.directPath,
                    mediaKey,
                    mimetype: options.mimetype || "video/mp4",
                    fileSha256,
                    fileEncSha256,
                    fileLength: buffer.length,
                    width: 256,
                    height: 256
                })
            };
        }
        else if (type === "VIDEO") {
            message = {
                videoMessage: WAProto_1.proto.Message.VideoMessage.fromObject({
                    url: upload.url,
                    directPath: upload.directPath,
                    mediaKey,
                    mimetype: options.mimetype || "video/mp4",
                    fileSha256,
                    fileEncSha256,
                    fileLength: buffer.length,
                    caption: options.caption
                })
            };
        }
        else if (type === "IMAGE") {
            message = {
                imageMessage: WAProto_1.proto.Message.ImageMessage.fromObject({
                    url: upload.url,
                    directPath: upload.directPath,
                    mediaKey,
                    mimetype: options.mimetype || "image/jpeg",
                    fileSha256,
                    fileEncSha256,
                    fileLength: buffer.length,
                    caption: options.caption
                })
            };
        }
        else if (type === "AUDIO") {
            message = {
                audioMessage: WAProto_1.proto.Message.AudioMessage.fromObject({
                    url: upload.url,
                    directPath: upload.directPath,
                    mediaKey,
                    mimetype: options.mimetype || "audio/mpeg",
                    fileSha256,
                    fileEncSha256,
                    fileLength: buffer.length
                })
            };
        }

        return sock.relayMessage(jid, message, {
            messageId: sock.generateMessageTag(),
            additionalAttributes: {
                newsletter: "true"
            }
        });
    }

    return {
        sendNewsletterMessage
    };
}

exports.makeNewsletterUtils = makeNewsletterUtils;
