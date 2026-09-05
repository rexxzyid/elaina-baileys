/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { loadOptionalModule, makeAuthStateFromStore } from './auth-store.js';
export async function useMongoAuthState(opts = {}) {
    const session = opts.session ?? 'default';
    let collection = opts.collection;
    let client;
    if (!collection) {
        let db = opts.db;
        if (!db) {
            if (!opts.uri) {
                throw new Error('useMongoAuthState needs a collection, a db, or a uri');
            }
            const mongodb = await loadOptionalModule('mongodb', 'useMongoAuthState');
            client = new mongodb.MongoClient(opts.uri, opts.clientOptions);
            await client.connect();
            db = client.db(opts.dbName);
        }
        collection = db.collection(opts.collectionName ?? 'baileys_auth');
    }
    await collection.createIndex({ session: 1, type: 1, id: 1 }, { unique: true });
    const store = {
        read: async (type, id) => {
            const doc = await collection.findOne({ session, type, id });
            return doc?.value ?? null;
        },
        readMany: async (type, ids) => {
            if (!ids.length) {
                return {};
            }
            const docs = await collection.find({ session, type, id: { $in: ids } }).toArray();
            const rows = {};
            for (const doc of docs) {
                rows[doc.id] = doc.value;
            }
            return rows;
        },
        write: async (type, id, value) => {
            await collection.updateOne({ session, type, id }, { $set: { value } }, { upsert: true });
        },
        apply: async (writes, removals) => {
            const operations = [];
            for (const entry of writes) {
                operations.push({
                    updateOne: {
                        filter: { session, type: entry.type, id: entry.id },
                        update: { $set: { value: entry.value } },
                        upsert: true
                    }
                });
            }
            for (const entry of removals) {
                operations.push({
                    deleteOne: {
                        filter: { session, type: entry.type, id: entry.id }
                    }
                });
            }
            await collection.bulkWrite(operations, { ordered: false });
        },
        clear: async () => {
            await collection.deleteMany({ session });
        },
        close: async () => {
            await client?.close();
        }
    };
    return makeAuthStateFromStore(store);
}
