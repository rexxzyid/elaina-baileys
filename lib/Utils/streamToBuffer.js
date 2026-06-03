const { Readable } = require("stream");

/**
 * Mengonversi Node.js Readable Stream menjadi Buffer.
 * * @param {Readable} stream Aliran data yang dapat dibaca.
 * @returns {Promise<Buffer>} Promise yang diselesaikan dengan Buffer berisi semua data dari aliran.
 */
async function streamToBuffer(stream) {
    const chunks = [];
    return new Promise((resolve, reject) => {
        stream.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
