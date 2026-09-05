/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { proto } from '../../WAProto/index.js';
import { initAuthCreds } from './auth-utils.js';
import { BufferJSON } from './generics.js';
export const CREDS_KEY = 'creds';
export const encodeAuthValue = (value) => JSON.stringify(value, BufferJSON.replacer);
export const decodeAuthValue = (type, raw) => {
    if (raw === null || raw === undefined) {
        return null;
    }
    const value = typeof raw === 'string' ? JSON.parse(raw, BufferJSON.reviver) : raw;
    if (type === 'app-state-sync-key' && value) {
        return proto.Message.AppStateSyncKeyData.fromObject(value);
    }
    return value;
};
export const loadOptionalModule = async (name, usedBy) => {
    try {
        const mod = await import(name);
        return mod.default ?? mod;
    }
    catch (err) {
        const helpful = new Error(`\`${name}\` is required for \`${usedBy}\`. Install it as a peer dependency: \`npm install ${name}\`.`);
        helpful.cause = err;
        throw helpful;
    }
};
export const makeAuthStateFromStore = async (store) => {
    const stored = await store.read(CREDS_KEY, CREDS_KEY);
    const creds = decodeAuthValue(CREDS_KEY, stored) ?? initAuthCreds();
    const state = {
        creds,
        keys: {
            get: async (type, ids) => {
                const data = {};
                const rows = await store.readMany(type, ids);
                for (const id of ids) {
                    const value = decodeAuthValue(type, rows[id]);
                    if (value) {
                        data[id] = value;
                    }
                }
                return data;
            },
            set: async (data) => {
                const writes = [];
                const removals = [];
                for (const type in data) {
                    for (const id in data[type]) {
                        const value = data[type][id];
                        if (value) {
                            writes.push({ type, id, value: encodeAuthValue(value) });
                        }
                        else {
                            removals.push({ type, id });
                        }
                    }
                }
                if (writes.length || removals.length) {
                    await store.apply(writes, removals);
                }
            }
        }
    };
    return {
        state,
        saveCreds: async () => {
            await store.write(CREDS_KEY, CREDS_KEY, encodeAuthValue(creds));
        },
        clearAuth: async () => {
            await store.clear();
        },
        close: async () => {
            await store.close?.();
        }
    };
};
