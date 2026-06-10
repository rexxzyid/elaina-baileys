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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();

Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSenderKey = generateSenderKey;
exports.generateSenderKeyId = generateSenderKeyId;
exports.generateSenderSigningKey = generateSenderSigningKey;

const nodeCrypto = __importStar(require("crypto"));
const curve_1 = require("libsignal/src/curve");

const senderKeyByteLength = 32;
const senderKeyIdLimit = 2147483647;

function makeSenderKeyBuffer() {
    return nodeCrypto.randomBytes(senderKeyByteLength);
}

function makeSenderKeyIdentifier() {
    return nodeCrypto.randomInt(senderKeyIdLimit);
}

function getOrCreateSigningKey(key) {
    if (key) {
        return key;
    }

    return (0, curve_1.generateKeyPair)();
}

function convertSigningKeyPair(key) {
    return {
        public: Buffer.from(key.pubKey),
        private: Buffer.from(key.privKey)
    };
}

function generateSenderKey() {
    return makeSenderKeyBuffer();
}

function generateSenderKeyId() {
    return makeSenderKeyIdentifier();
}

function generateSenderSigningKey(key) {
    const signingKey = getOrCreateSigningKey(key);
    return convertSigningKeyPair(signingKey);
}
