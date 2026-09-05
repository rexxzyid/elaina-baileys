/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { loadOptionalModule, makeAuthStateFromStore } from './auth-store.js';
const resolveCommand = (client, names) => {
    for (const name of names) {
        if (typeof client[name] === 'function') {
            return name;
        }
    }
    throw new Error(`redis client exposes none of: ${names.join(', ')}`);
};
export async function useRedisAuthState(opts = {}) {
    const session = opts.session ?? 'default';
    const prefix = opts.prefix ?? 'baileys_auth';
    let client = opts.client;
    let owned = false;
    if (!client) {
        if (!opts.uri) {
            throw new Error('useRedisAuthState needs a client or a uri');
        }
        const Redis = await loadOptionalModule('ioredis', 'useRedisAuthState');
        client = new Redis(opts.uri, opts.config);
        owned = true;
    }
    if (typeof client.connect === 'function' && client.isOpen === false) {
        await client.connect();
    }
    const commands = {
        hget: resolveCommand(client, ['hGet', 'hget']),
        hmget: resolveCommand(client, ['hmGet', 'hmget']),
        hset: resolveCommand(client, ['hSet', 'hset']),
        hdel: resolveCommand(client, ['hDel', 'hdel']),
        del: resolveCommand(client, ['del', 'DEL']),
        keys: resolveCommand(client, ['keys', 'KEYS'])
    };
    const hashKey = (type) => `${prefix}:${session}:${type}`;
    const store = {
        read: async (type, id) => {
            const value = await client[commands.hget](hashKey(type), id);
            return value ?? null;
        },
        readMany: async (type, ids) => {
            if (!ids.length) {
                return {};
            }
            const values = await client[commands.hmget](hashKey(type), ids);
            const rows = {};
            ids.forEach((id, index) => {
                const value = values?.[index];
                if (value !== null && value !== undefined) {
                    rows[id] = value;
                }
            });
            return rows;
        },
        write: async (type, id, value) => {
            await client[commands.hset](hashKey(type), id, value);
        },
        apply: async (writes, removals) => {
            const chain = typeof client.multi === 'function' ? client.multi() : null;
            if (chain) {
                for (const entry of writes) {
                    chain[commands.hset](hashKey(entry.type), entry.id, entry.value);
                }
                for (const entry of removals) {
                    chain[commands.hdel](hashKey(entry.type), entry.id);
                }
                await chain.exec();
                return;
            }
            for (const entry of writes) {
                await client[commands.hset](hashKey(entry.type), entry.id, entry.value);
            }
            for (const entry of removals) {
                await client[commands.hdel](hashKey(entry.type), entry.id);
            }
        },
        clear: async () => {
            const found = await client[commands.keys](`${prefix}:${session}:*`);
            if (found?.length) {
                await client[commands.del](found);
            }
        },
        close: async () => {
            if (owned) {
                await (client.quit?.() ?? client.disconnect?.());
            }
        }
    };
    return makeAuthStateFromStore(store);
}
