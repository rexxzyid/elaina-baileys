"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAsyncIterable = void 0;

/**
 * Helper by @rexxhayanasi to convert various media inputs into an Async Iterable
 * Compatible with Baileys buffer/stream handling
 */
function toAsyncIterable(input) {
    if (!input) {
        throw new Error("Invalid media stream (undefined/null)");
    }

    if (input[Symbol.asyncIterator]) {
        return input;
    }


    if (Buffer.isBuffer(input)) {
        return (async function* () {
            yield input;
        })();
    }

    if (typeof input === "string") {
        const fs = require("fs");
        return fs.createReadStream(input);
    }

    if (typeof input.on === "function") {
        return (async function* () {
            for await (const chunk of input) {
                yield chunk;
            }
        })();
    }

    throw new Error("Unsupported media stream type");
}

exports.toAsyncIterable = toAsyncIterable;
