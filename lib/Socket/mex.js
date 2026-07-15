"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeWMexQuery = exports.wMexQuery = void 0;
const boom_1 = require("@hapi/boom");
const WABinary_1 = require("../WABinary");
/**
 * Kirim satu query MEX mentah.
 * @param {object} variables  variabel GraphQL
 * @param {string} queryId    query_id (lihat QueryIds)
 * @param {function} query    fungsi query dari socket
 * @param {function} generateMessageTag  dari socket
 */
const wMexQuery = (variables, queryId, query, generateMessageTag) => {
    return query({
        tag: 'iq',
        attrs: {
            id: generateMessageTag(),
            type: 'get',
            to: WABinary_1.S_WHATSAPP_NET,
            xmlns: 'w:mex'
        },
        content: [
            {
                tag: 'query',
                attrs: { query_id: queryId },
                content: Buffer.from(JSON.stringify({ variables }), 'utf-8')
            }
        ]
    });
};
exports.wMexQuery = wMexQuery;
/**
 * Jalankan query MEX dan ambil data-nya, dengan penanganan error GraphQL.
 * @param {object} variables
 * @param {string} queryId
 * @param {string} dataPath  nama field di data (mis. 'xwa2_newsletter')
 * @param {function} query
 * @param {function} generateMessageTag
 */
const executeWMexQuery = async (variables, queryId, dataPath, query, generateMessageTag) => {
    const result = await (0, exports.wMexQuery)(variables, queryId, query, generateMessageTag);
    const child = (0, WABinary_1.getBinaryNodeChild)(result, 'result');
    if (child === null || child === void 0 ? void 0 : child.content) {
        const data = JSON.parse(child.content.toString());
        // error dari server GraphQL -> lempar Boom dgn kode aslinya
        if (data.errors && data.errors.length > 0) {
            const errorMessages = data.errors.map((err) => err.message || 'Unknown error').join(', ');
            const firstError = data.errors[0];
            const errorCode = (firstError.extensions && firstError.extensions.error_code) || 400;
            throw new boom_1.Boom(`GraphQL server error: ${errorMessages}`, { statusCode: errorCode, data: firstError });
        }
        const response = dataPath ? (data && data.data ? data.data[dataPath] : undefined) : (data && data.data);
        if (typeof response !== 'undefined') {
            return response;
        }
    }
    const action = (dataPath || '').startsWith('xwa2_')
        ? dataPath.substring(5).replace(/_/g, ' ')
        : (dataPath || '').replace(/_/g, ' ');
    throw new boom_1.Boom(`Failed to ${action}, unexpected response structure.`, { statusCode: 400, data: result });
};
exports.executeWMexQuery = executeWMexQuery;
