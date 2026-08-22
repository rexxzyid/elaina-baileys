import process from 'node:process';
import * as z from 'zod';
import { normalizeJid } from './runtime.js';

const READ_ONLY = /^(1|true|yes)$/i.test(process.env.ELAINA_MCP_READ_ONLY || '');
const ALLOW_DESTRUCTIVE = /^(1|true|yes)$/i.test(process.env.ELAINA_MCP_ALLOW_DESTRUCTIVE || '');

const json = value => {
    const seen = new WeakSet();
    return JSON.stringify(value, (_key, current) => {
        if (typeof current === 'bigint') {
            return current.toString();
        }
        if (Buffer.isBuffer(current)) {
            return current.toString('base64');
        }
        if (current instanceof Uint8Array) {
            return Buffer.from(current).toString('base64');
        }
        if (current && typeof current === 'object') {
            if (typeof current.toNumber === 'function') {
                try {
                    return current.toNumber();
                }
                catch {
                }
            }
            if (seen.has(current)) {
                return '[Circular]';
            }
            seen.add(current);
        }
        return current;
    }, 2);
};

const success = value => ({
    content: [{ type: 'text', text: json(value ?? { ok: true }) }]
});

const failure = error => ({
    isError: true,
    content: [{ type: 'text', text: json({ error: error?.message || String(error) }) }]
});

const assertWritable = () => {
    if (READ_ONLY) {
        throw new Error('MCP server is running in read-only mode');
    }
};

export const assertDestructive = () => {
    assertWritable();
    if (!ALLOW_DESTRUCTIVE) {
        throw new Error('Destructive MCP tools are disabled. Set ELAINA_MCP_ALLOW_DESTRUCTIVE=1 to enable them');
    }
};

const annotationsFor = mode => ({
    readOnlyHint: mode === 'read',
    destructiveHint: mode === 'destructive',
    idempotentHint: mode === 'read',
    openWorldHint: true
});

export const register = (server, name, config, handler, mode = 'read') => {
    server.registerTool(name, {
        ...config,
        annotations: annotationsFor(mode)
    }, async args => {
        try {
            if (mode === 'write') {
                assertWritable();
            }
            if (mode === 'destructive') {
                assertDestructive();
            }
            return success(await handler(args || {}));
        }
        catch (error) {
            return failure(error);
        }
    });
};

export const resource = (server, name, uri, title, handler) => {
    server.registerResource(name, uri, {
        title,
        mimeType: 'application/json'
    }, async resourceUri => {
        try {
            return {
                contents: [{
                    uri: resourceUri.href,
                    mimeType: 'application/json',
                    text: json(await handler())
                }]
            };
        }
        catch (error) {
            return {
                contents: [{
                    uri: resourceUri.href,
                    mimeType: 'application/json',
                    text: json({ error: error?.message || String(error) })
                }]
            };
        }
    });
};

export const keySchema = {
    jid: z.string().min(1),
    messageId: z.string().min(1),
    fromMe: z.boolean().optional(),
    participant: z.string().optional(),
    participantAlt: z.string().optional()
};

export const groupSummary = group => ({
    id: group?.id,
    subject: group?.subject,
    size: group?.size,
    owner: group?.owner,
    desc: group?.desc,
    announce: group?.announce,
    restrict: group?.restrict,
    isCommunity: group?.isCommunity,
    isCommunityAnnounce: group?.isCommunityAnnounce,
    linkedParent: group?.linkedParent,
    addressingMode: group?.addressingMode
});

export const quotedOptions = async (runtime, jid, quotedMessageId) => {
    if (!quotedMessageId) {
        return {};
    }
    const quoted = await runtime.getMessage({ remoteJid: normalizeJid(jid), id: quotedMessageId });
    if (!quoted) {
        throw new Error(`Quoted message not found in store: ${quotedMessageId}`);
    }
    return { quoted };
};
