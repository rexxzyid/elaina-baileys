"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeBase32 = exports.hkdfSHA256 = exports.PasskeyHandler = void 0;

const crypto_1 = require("crypto");
const tweetnacl_1 = require("tweetnacl");

const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function encodeBase32(buffer) {
    let bits = 0;
    let value = 0;
    let output = "";

    for (let i = 0; i < buffer.length; i++) {
        value = (value << 8) | buffer[i];
        bits += 8;

        while (bits >= 5) {
            output += base32Alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += base32Alphabet[(value << (5 - bits)) & 31];
    }

    return output;
}
exports.encodeBase32 = encodeBase32;

function hkdfSHA256(ikm, salt, info, length) {
    const hmac1 = (0, crypto_1.createHmac)("sha256", salt || Buffer.alloc(32));
    hmac1.update(ikm);

    const prk = hmac1.digest();

    const hmac2 = (0, crypto_1.createHmac)("sha256", prk);
    hmac2.update(Buffer.concat([
        Buffer.alloc(0),
        Buffer.from(info),
        Buffer.from([1])
    ]));

    const okm = hmac2.digest();

    return okm.slice(0, length);
}
exports.hkdfSHA256 = hkdfSHA256;

class PasskeyHandler {
    constructor() {
        this.cache = null;
        this.handoffKey = null;
    }

    initiate(companionRef, companionKeyPair, companionNonce, deviceType) {
        this.cache = {
            keyPair: companionKeyPair,
            companionNonce,
            pairingRef: companionRef,
            deviceType,
            encryptionKey: null
        };
    }

    handleContinuation(primaryEphemeralIdentity) {
        if (!this.cache) {
            throw new Error("No passkey cache available");
        }

        const publicKeyArray = new Uint8Array(primaryEphemeralIdentity.publicKey);
        const privKeyArray = new Uint8Array(this.cache.keyPair.priv);

        const sharedSecret = (0, tweetnacl_1.X25519)(privKeyArray, publicKeyArray);

        const salt = `Companion Pairing ${this.cache.deviceType} with ref ${this.cache.pairingRef}`;
        const info = "Pairing Information Encryption Key";

        this.cache.encryptionKey = hkdfSHA256(
            Buffer.from(sharedSecret),
            Buffer.from(salt),
            info,
            32
        );

        const digest = (0, crypto_1.createHash)("sha256")
            .update(Buffer.concat([
                this.cache.companionNonce,
                primaryEphemeralIdentity.publicKey
            ]))
            .digest();

        const codeBytes = Buffer.alloc(5);

        for (let i = 0; i < 5; i++) {
            codeBytes[i] = primaryEphemeralIdentity.nonce[i] ^ digest[i];
        }

        const encodedCode = encodeBase32(codeBytes);

        return `${encodedCode.slice(0, 4)}-${encodedCode.slice(4)}`;
    }

    getEncryptionKey() {
        if (!this.cache || !this.cache.encryptionKey) {
            throw new Error("Encryption key not available");
        }

        return this.cache.encryptionKey;
    }

    getCompanionNonce() {
        if (!this.cache) {
            throw new Error("No passkey cache available");
        }

        return this.cache.companionNonce;
    }

    clear() {
        this.cache = null;
        this.handoffKey = null;
    }
}

exports.PasskeyHandler = PasskeyHandler;
exports.default = {
    PasskeyHandler,
    hkdfSHA256,
    encodeBase32
};
