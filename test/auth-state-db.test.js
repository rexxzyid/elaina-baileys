import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { useMongoAuthState } from '../lib/Utils/use-mongo-auth-state.js';
import { useMySQLAuthState } from '../lib/Utils/use-mysql-auth-state.js';
import { usePostgresAuthState } from '../lib/Utils/use-postgres-auth-state.js';
import { useRedisAuthState } from '../lib/Utils/use-redis-auth-state.js';

const preKey = { public: Buffer.from([1, 2, 3]), private: Buffer.from([4, 5, 6]) };
const syncKey = { keyData: Buffer.from([7, 8]), fingerprint: { rawId: 1, currentIndex: 2, deviceIndexes: [] }, timestamp: 3 };

const fakePostgres = () => {
    const rows = new Map();
    const log = [];
    const run = (text, params = []) => {
        log.push({ text: text.replace(/\s+/g, ' ').trim(), params });
        if (text.startsWith('SELECT value')) {
            const value = rows.get(params.join('|'));
            return { rows: value === undefined ? [] : [{ value }] };
        }
        if (text.startsWith('SELECT id, value')) {
            const [session, type, ids] = params;
            return { rows: ids.filter(id => rows.has([session, type, id].join('|'))).map(id => ({ id, value: rows.get([session, type, id].join('|')) })) };
        }
        if (text.startsWith('INSERT INTO')) {
            const [session, type, id, value] = params;
            rows.set([session, type, id].join('|'), value);
            return { rows: [] };
        }
        if (text.startsWith('DELETE FROM')) {
            const key = params.join('|');
            for (const existing of [...rows.keys()]) {
                if (existing === key || (params.length === 1 && existing.startsWith(params[0] + '|'))) {
                    rows.delete(existing);
                }
            }
            return { rows: [] };
        }
        return { rows: [] };
    };
    const client = { query: async (text, params) => run(text, params), release: () => { log.push({ text: 'RELEASE', params: [] }); } };
    return { rows, log, pool: { query: async (text, params) => run(text, params), connect: async () => client } };
};

const fakeMysql = () => {
    const rows = new Map();
    const log = [];
    const run = (text, params = []) => {
        log.push({ text: text.replace(/\s+/g, ' ').trim(), params });
        if (text.startsWith('SELECT value')) {
            const value = rows.get(params.join('|'));
            return [value === undefined ? [] : [{ value }]];
        }
        if (text.startsWith('SELECT id, value')) {
            const [session, type, ids] = params;
            return [ids.filter(id => rows.has([session, type, id].join('|'))).map(id => ({ id, value: rows.get([session, type, id].join('|')) }))];
        }
        if (text.startsWith('INSERT INTO')) {
            const [session, type, id, value] = params;
            rows.set([session, type, id].join('|'), value);
            return [{}];
        }
        if (text.startsWith('DELETE FROM')) {
            const key = params.join('|');
            for (const existing of [...rows.keys()]) {
                if (existing === key || (params.length === 1 && existing.startsWith(params[0] + '|'))) {
                    rows.delete(existing);
                }
            }
            return [{}];
        }
        return [[]];
    };
    const connection = {
        query: async (text, params) => run(text, params),
        beginTransaction: async () => log.push({ text: 'BEGIN', params: [] }),
        commit: async () => log.push({ text: 'COMMIT', params: [] }),
        rollback: async () => log.push({ text: 'ROLLBACK', params: [] }),
        release: () => log.push({ text: 'RELEASE', params: [] })
    };
    return { rows, log, pool: { query: async (text, params) => run(text, params), getConnection: async () => connection } };
};

const fakeMongo = () => {
    const docs = [];
    const log = [];
    const match = (filter, doc) => Object.entries(filter).every(([field, want]) => want && want.$in ? want.$in.includes(doc[field]) : doc[field] === want);
    const collection = {
        createIndex: async (spec, options) => log.push({ op: 'createIndex', spec, options }),
        findOne: async filter => docs.find(doc => match(filter, doc)) ?? null,
        find: filter => ({ toArray: async () => docs.filter(doc => match(filter, doc)) }),
        updateOne: async (filter, update, options) => {
            const found = docs.find(doc => match(filter, doc));
            if (found) {
                Object.assign(found, update.$set);
            }
            else if (options?.upsert) {
                docs.push({ ...filter, ...update.$set });
            }
        },
        bulkWrite: async (operations, options) => {
            log.push({ op: 'bulkWrite', count: operations.length, ordered: options?.ordered });
            for (const operation of operations) {
                if (operation.updateOne) {
                    await collection.updateOne(operation.updateOne.filter, operation.updateOne.update, { upsert: operation.updateOne.upsert });
                }
                else {
                    const at = docs.findIndex(doc => match(operation.deleteOne.filter, doc));
                    if (at !== -1) {
                        docs.splice(at, 1);
                    }
                }
            }
        },
        deleteMany: async filter => {
            for (let at = docs.length - 1; at >= 0; at--) {
                if (match(filter, docs[at])) {
                    docs.splice(at, 1);
                }
            }
        }
    };
    return { docs, log, collection };
};

const fakeRedis = (style) => {
    const hashes = new Map();
    const log = [];
    const hash = key => hashes.get(key) ?? hashes.set(key, new Map()).get(key);
    const impl = {
        hget: async (key, field) => { log.push(['hget', key, field]); return hash(key).get(field) ?? null; },
        hmget: async (key, fields) => { log.push(['hmget', key, fields]); return fields.map(field => hash(key).get(field) ?? null); },
        hset: async (key, field, value) => { log.push(['hset', key, field]); hash(key).set(field, value); },
        hdel: async (key, field) => { log.push(['hdel', key, field]); hash(key).delete(field); },
        del: async keys => { log.push(['del', keys]); for (const key of [].concat(keys)) hashes.delete(key); },
        keys: async pattern => { log.push(['keys', pattern]); const head = pattern.slice(0, -1); return [...hashes.keys()].filter(key => key.startsWith(head)); }
    };
    const names = style === 'node-redis'
        ? { hGet: 'hget', hmGet: 'hmget', hSet: 'hset', hDel: 'hdel', del: 'del', keys: 'keys' }
        : { hget: 'hget', hmget: 'hmget', hset: 'hset', hdel: 'hdel', del: 'del', keys: 'keys' };
    const client = {};
    for (const [exposed, target] of Object.entries(names)) {
        client[exposed] = (...args) => impl[target](...args);
    }
    client.multi = () => {
        const queued = [];
        const chain = {};
        for (const exposed of Object.keys(names)) {
            chain[exposed] = (...args) => { queued.push([exposed, args]); return chain; };
        }
        chain.exec = async () => {
            for (const [exposed, args] of queued) {
                await client[exposed](...args);
            }
        };
        return chain;
    };
    return { hashes, log, client };
};

const roundTrip = async (label, auth, reopen) => {
    await auth.saveCreds();
    await auth.state.keys.set({ 'pre-key': { 1: preKey }, 'app-state-sync-key': { key1: syncKey } });

    const keys = await auth.state.keys.get('pre-key', ['1']);
    assert.ok(Buffer.isBuffer(keys['1'].public), `${label}: a buffer survives the round trip`);
    assert.equal(keys['1'].public.toString('hex'), '010203', `${label}: bytes are unchanged`);

    const synced = await auth.state.keys.get('app-state-sync-key', ['key1']);
    assert.ok(synced.key1 instanceof proto.Message.AppStateSyncKeyData, `${label}: an app state key comes back as its message type`);

    const missing = await auth.state.keys.get('pre-key', ['404']);
    assert.deepEqual(missing, {}, `${label}: an unknown id is absent, not undefined`);

    await auth.state.keys.set({ 'pre-key': { 1: null } });
    assert.deepEqual(await auth.state.keys.get('pre-key', ['1']), {}, `${label}: a null value deletes the row`);

    const reopened = await reopen();
    assert.equal(reopened.state.creds.registrationId, auth.state.creds.registrationId, `${label}: creds survive a reopen`);
    assert.ok(reopened.state.creds.noiseKey.private instanceof Uint8Array, `${label}: reopened creds keep their key bytes`);

    await auth.clearAuth();
    const cleared = await reopen();
    assert.notEqual(cleared.state.creds.registrationId, auth.state.creds.registrationId, `${label}: clearAuth leaves nothing behind`);
};

const postgres = fakePostgres();
const postgresAuth = await usePostgresAuthState({ pool: postgres.pool });
await roundTrip('postgres', postgresAuth, () => usePostgresAuthState({ pool: postgres.pool }));
assert.match(postgres.log[0].text, /^CREATE TABLE IF NOT EXISTS "baileys_auth"/);
assert.ok(postgres.log.some(entry => entry.text === 'BEGIN'), 'postgres writes inside a transaction');
assert.ok(postgres.log.some(entry => entry.text === 'COMMIT'));
assert.ok(postgres.log.some(entry => entry.text.includes('ON CONFLICT (session, type, id) DO UPDATE')));
assert.ok(postgres.log.some(entry => entry.text.includes('id = ANY($3)')), 'postgres reads many ids in one query');
await assert.rejects(() => usePostgresAuthState({ pool: postgres.pool, table: 'drop; --' }), /plain identifier/);
await assert.rejects(() => usePostgresAuthState({}), /pool, a connectionString, or a config/);

const mysql = fakeMysql();
const mysqlAuth = await useMySQLAuthState({ pool: mysql.pool });
await roundTrip('mysql', mysqlAuth, () => useMySQLAuthState({ pool: mysql.pool }));
assert.match(mysql.log[0].text, /^CREATE TABLE IF NOT EXISTS `baileys_auth`/);
assert.ok(mysql.log.some(entry => entry.text === 'BEGIN'), 'mysql writes inside a transaction');
assert.ok(mysql.log.some(entry => entry.text === 'COMMIT'));
assert.ok(mysql.log.some(entry => entry.text.includes('ON DUPLICATE KEY UPDATE value = VALUES(value)')));
await assert.rejects(() => useMySQLAuthState({ pool: mysql.pool, table: 'a b' }), /plain identifier/);
await assert.rejects(() => useMySQLAuthState({}), /pool, a uri, or a config/);

const mongo = fakeMongo();
const mongoAuth = await useMongoAuthState({ collection: mongo.collection });
await roundTrip('mongo', mongoAuth, () => useMongoAuthState({ collection: mongo.collection }));
assert.deepEqual(mongo.log[0], { op: 'createIndex', spec: { session: 1, type: 1, id: 1 }, options: { unique: true } });
assert.ok(mongo.log.some(entry => entry.op === 'bulkWrite'), 'mongo batches a key write');
await assert.rejects(() => useMongoAuthState({}), /collection, a db, or a uri/);

for (const style of ['ioredis', 'node-redis']) {
    const redis = fakeRedis(style);
    const redisAuth = await useRedisAuthState({ client: redis.client });
    await roundTrip(`redis/${style}`, redisAuth, () => useRedisAuthState({ client: redis.client }));
    assert.ok(redis.log.some(entry => entry[0] === 'hmget'), `${style}: reads many ids in one call`);
    assert.ok(redis.log.some(entry => entry[1] === 'baileys_auth:default:pre-key'), `${style}: one hash per key type`);
}
await assert.rejects(() => useRedisAuthState({ client: {} }), /exposes none of/);
await assert.rejects(() => useRedisAuthState({}), /client or a uri/);

/** Two sessions in one database must not read each other's keys. */
const shared = fakePostgres();
const first = await usePostgresAuthState({ pool: shared.pool, session: 'a' });
const second = await usePostgresAuthState({ pool: shared.pool, session: 'b' });
await first.state.keys.set({ 'pre-key': { 1: preKey } });
assert.deepEqual(await second.state.keys.get('pre-key', ['1']), {}, 'sessions are isolated');
assert.ok((await first.state.keys.get('pre-key', ['1']))['1']);

console.log('database auth state tests passed');
