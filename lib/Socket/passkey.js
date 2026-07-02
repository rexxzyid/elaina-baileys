"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = {
            enumerable: true,
            get: function() {
                return m[k];
            }
        };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));

var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", {
        enumerable: true,
        value: v
    });
}) : function(o, v) {
    o["default"] = v;
});

var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function(o) {
            var ar = [];
            for (var k in o) {
                if (Object.prototype.hasOwnProperty.call(o, k))
                    ar[ar.length] = k;
            }
            return ar;
        };
        return ownKeys(o);
    };
    return function(mod) {
        if (mod && mod.__esModule)
            return mod;

        var result = {};

        if (mod != null) {
            for (var k of ownKeys(mod)) {
                if (k !== "default")
                    __createBinding(result, mod, k);
            }
        }

        __setModuleDefault(result, mod);
        return result;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.attachPasskeyHandlers = attachPasskeyHandlers;
exports.computePasskeyConfirmationCode = computePasskeyConfirmationCode;

const crypto = __importStar(require("crypto"));

function base32EncodeRFC4648NoPad(buffer) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0;
    let value = 0;
    let output = "";

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;

        while (bits >= 5) {
            const idx = (value >>> (bits - 5)) & 31;
            output += alphabet[idx];
            bits -= 5;
        }
    }

    if (bits > 0) {
        const idx = (value << (5 - bits)) & 31;
        output += alphabet[idx];
    }

    return output;
}

function computePasskeyConfirmationCode({ companionNonce, primaryPublicKey, primaryNonce }) {
    if (!Buffer.isBuffer(companionNonce)
        || !Buffer.isBuffer(primaryPublicKey)
        || !Buffer.isBuffer(primaryNonce)) {
        throw new TypeError("computePasskeyConfirmationCode: all args must be Buffer instances");
    }

    if (primaryNonce.length < 5) {
        throw new Error("primaryNonce must be at least 5 bytes long");
    }

    const digest = crypto
        .createHash("sha256")
        .update(Buffer.concat([
            companionNonce,
            primaryPublicKey
        ]))
        .digest();

    const codeBytes = Buffer.alloc(5);

    for (let i = 0; i < 5; i++) {
        codeBytes[i] = primaryNonce[i] ^ digest[i];
    }

    const encoded = base32EncodeRFC4648NoPad(codeBytes);

    return `${encoded.slice(0, 4)}-${encoded.slice(4)}`;
}

function attachPasskeyHandlers(opts) {
    const {
        sock,
        ev,
        logger,
        sendNode,
        generateMessageTag
    } = opts || {};

    if (!sock) {
        throw new Error("attachPasskeyHandlers: sock is required");
    }

    const sendNodeFn = sendNode || sock.sendNode;

    const genTag = generateMessageTag ||
        (typeof sock.generateMessageTag === "function"
            ? sock.generateMessageTag.bind(sock)
            : () => String(Date.now()));

    if (!sendNodeFn) {
        throw new Error("attachPasskeyHandlers: sendNode function not available on sock");
    }

    sock.sendPasskeyIQ = async function(content) {
        const stanza = {
            tag: "iq",
            attrs: {
                to: "s.whatsapp.net",
                type: "set",
                id: genTag(),
                xmlns: "md"
            },
            content
        };

        return await sendNodeFn(stanza);
    };

    sock.sendPasskeyResponse = async function(contentNodes) {
        return await sock.sendPasskeyIQ(contentNodes);
    };

    sock.sendPasskeyConfirmation = async function(options = {}) {
        const content = [
            {
                tag: "companion_nonce",
                attrs: {},
                content: options.companionNonce || Buffer.alloc(0)
            }
        ];

        return await sock.sendPasskeyIQ(content);
    };

    if (logger && typeof logger.info === "function") {
        logger.info("passkey helpers attached to socket");
    }
}

exports.default = {
    computePasskeyConfirmationCode,
    attachPasskeyHandlers
};
