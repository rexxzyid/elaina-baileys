"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNekoDBAuth = void 0;
const WAProto_1 = require("../../WAProto");
const auth_utils_1 = require("./auth-utils");
const generics_1 = require("./generics");
/**
 * @param {object} db  instance NekoDB (@nekodb/client) yang sudah terkoneksi
 * @param {string} collectionName  nama koleksi per-sesi (default 'baileys_auth')
 */
const useNekoDBAuth = async (db, collectionName = 'baileys_auth') => {
    if (!db || typeof db.collection !== 'function') {
        throw new Error('useNekoDBAuth: argumen pertama harus instance NekoDB yang terkoneksi');
    }
    const col = db.collection(collectionName).helper();
    // dokumen: { k: '<key>', v: '<json BufferJSON>' }
    const writeData = async (data, key) => {
        const v = JSON.stringify(data, generics_1.BufferJSON.replacer);
        await col.upsert({ k: key }, { k: key, v });
    };
    const readData = async (key) => {
        try {
            const doc = await col.findOne({ k: key });
            if (!doc || doc.v == null) {
                return null;
            }
            return JSON.parse(doc.v, generics_1.BufferJSON.reviver);
        }
        catch (_a) {
            return null;
        }
    };
    const removeData = async (key) => {
        try {
            await col.deleteWhere({ k: key });
        }
        catch (_a) {
        }
    };
    const creds = (await readData('creds')) || (0, auth_utils_1.initAuthCreds)();
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = WAProto_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(value, key) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => {
            await writeData(creds, 'creds');
        },
        clearAuth: async () => {
            try {
                await db.deleteCollection(collectionName);
            }
            catch (_a) { }
        }
    };
};
exports.useNekoDBAuth = useNekoDBAuth;
