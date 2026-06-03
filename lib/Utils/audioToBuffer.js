const { Buffer } = require("buffer")
const fs = require("fs/promises")
const { Readable } = require("stream")
const streamToBuffer = require("./streamToBuffer")

/**
 * Mengonversi berbagai input audio (Buffer, URL, path file, atau Readable stream) menjadi Buffer.
 * @param {Buffer|string|Readable} audio Input audio.
 * @returns {Promise<Buffer>} Buffer hasil konversi.
 */
async function audioToBuffer(audio) {
    if (Buffer.isBuffer(audio)) {
        return audio
    }

    if (typeof audio === "string") {
        if (/^https?:\/\//.test(audio)) {
            const res = await fetch(audio) // native fetch bawaan Node 20
            return Buffer.from(await res.arrayBuffer())
        }
        return fs.readFile(audio)
    }

    if (audio instanceof Readable) {
        return streamToBuffer(audio)
    }

    throw new TypeError("Unsupported audio input type")
}
