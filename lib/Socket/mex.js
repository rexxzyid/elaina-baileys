import { Boom } from '@hapi/boom';
import { getBinaryNodeChild, S_WHATSAPP_NET } from '../WABinary/index.js';

const wMexQuery = (variables, queryId, query, generateMessageTag) => {
    return query({
        tag: 'iq',
        attrs: {
            id: generateMessageTag(),
            type: 'get',
            to: S_WHATSAPP_NET,
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

export const executeWMexQuery = async (variables, queryId, dataPath, query, generateMessageTag) => {
    const result = await wMexQuery(variables, queryId, query, generateMessageTag);

    const child =
        getBinaryNodeChild(result, 'result') ||
        getBinaryNodeChild(result, 'query') ||
        (Array.isArray(result?.content)
            ? result.content.find(item =>
                Buffer.isBuffer(item?.content) || item?.content instanceof Uint8Array
            )
            : undefined);

    if (child?.content) {
        const data = JSON.parse(Buffer.from(child.content).toString());

        if (data.errors && data.errors.length > 0) {
            const errorMessages = data.errors.map((err) => err.message || 'Unknown error').join(', ');
            const firstError = data.errors[0];
            const errorCode = firstError.extensions?.error_code || 400;
            throw new Boom(`GraphQL server error: ${errorMessages}`, {
                statusCode: errorCode,
                data: firstError
            });
        }

        const root = data?.data;

        // normal path
        const response = dataPath ? root?.[dataPath] : root;
        if (typeof response !== 'undefined') {
            return response;
        }

        if (root && typeof root === 'object') {
            const keys = Object.keys(root);
            if (keys.length === 1) {
                return root[keys[0]];
            }
        }

        if (typeof data?.result !== 'undefined') {
            return data.result;
		}

        if (root && typeof root === 'object') {
            return root;
        }
    }

    const action = (dataPath || '').startsWith('xwa2_')
        ? dataPath.substring(5).replace(/_/g, ' ')
        : dataPath?.replace(/_/g, ' ');

    throw new Boom(`Failed to ${action}, unexpected response structure.`, {
        statusCode: 400,
        data: result
    });
};
