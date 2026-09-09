import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import { useMongoAuthState } from '../lib/Utils/use-mongo-auth-state.js';
import { useMySQLAuthState } from '../lib/Utils/use-mysql-auth-state.js';
import { usePostgresAuthState } from '../lib/Utils/use-postgres-auth-state.js';
import { useRedisAuthState } from '../lib/Utils/use-redis-auth-state.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { useSqliteAuthState } from '../lib/Utils/use-sqlite-auth-state.js';
import { commitSenderKeyDelivery, deliveredSenderKeyJids, pickSenderKeyRecipients, senderKeyResetSummary } from '../lib/Utils/sender-key-memory.js';
import { DEFAULT_MAX_EVENT_LISTENERS, makeEventBuffer } from '../lib/Utils/event-buffer.js';
import { DEFAULT_CONNECTION_CONFIG } from '../lib/Defaults/index.js';
import { generateWAMessageContent } from '../lib/Utils/messages.js';

test('auth-state-db', async () => {
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
});

test('auth-state-sqlite', async () => {
    /**
     * better-sqlite3 is an optional peer dependency, so a machine without it must
     * still get a green suite rather than a failure about a missing native module.
     */
    let available = true;
    try {
        await import('better-sqlite3');
    }
    catch {
        available = false;
    }

    if (!available) {
        console.log('sqlite auth state tests skipped, better-sqlite3 is not installed');
    }
    else {
        const dir = mkdtempSync(join(tmpdir(), 'elaina-sqlite-auth-'));
        const dbPath = join(dir, 'session.db');
        try {
            const auth = await useSqliteAuthState({ dbPath });
            await auth.saveCreds();
            await auth.state.keys.set({
                'pre-key': { 1: { public: Buffer.from([1, 2, 3]), private: Buffer.from([4, 5, 6]) } },
                'app-state-sync-key': { key1: { keyData: Buffer.from([7, 8]), timestamp: 3 } }
            });

            const keys = await auth.state.keys.get('pre-key', ['1']);
            assert.ok(Buffer.isBuffer(keys['1'].public), 'a buffer survives the round trip');
            assert.equal(keys['1'].public.toString('hex'), '010203');

            const synced = await auth.state.keys.get('app-state-sync-key', ['key1']);
            assert.ok(synced.key1 instanceof proto.Message.AppStateSyncKeyData, 'an app state key comes back as its message type');

            assert.deepEqual(await auth.state.keys.get('pre-key', ['404']), {}, 'an unknown id is absent');

            await auth.state.keys.set({ 'pre-key': { 1: null } });
            assert.deepEqual(await auth.state.keys.get('pre-key', ['1']), {}, 'a null value deletes the row');

            const reopened = await useSqliteAuthState({ dbPath });
            assert.equal(reopened.state.creds.registrationId, auth.state.creds.registrationId, 'creds survive a reopen');
            await reopened.close();

            await auth.clearAuth();
            const cleared = await useSqliteAuthState({ dbPath });
            assert.notEqual(cleared.state.creds.registrationId, auth.state.creds.registrationId, 'clearAuth leaves nothing behind');
            await cleared.close();

            /** close only owns the handle it opened, so a caller's database stays usable. */
            const Database = (await import('better-sqlite3')).default;
            const database = new Database(join(dir, 'shared.db'));
            const borrowed = await useSqliteAuthState({ database });
            await borrowed.close();
            assert.equal(database.open, true, 'a caller supplied database is left open');
            database.close();

            await auth.close();
            console.log('sqlite auth state tests passed');
        }
        finally {
            rmSync(dir, { recursive: true, force: true });
        }
    }
});

test('sender-key-memory', async () => {
    const node = jid => ({ tag: 'to', attrs: { jid }, content: [] });

    /** Only devices that have not been given the key yet, and only real ones. */
    {
        const devices = [
            { jid: 'a@s.whatsapp.net', device: 0 },
            { jid: 'b@s.whatsapp.net', device: 1 },
            { jid: 'c@s.whatsapp.net', device: 99 },
            { jid: undefined, device: 0 }
        ];
        const senderKeyMap = { 'a@s.whatsapp.net': true };
        const picked = pickSenderKeyRecipients(devices, senderKeyMap, { skip: device => device.device === 99 });
        assert.deepEqual(picked, ['b@s.whatsapp.net'], 'known devices, hosted devices and blank jids are all left out');
    }

    /** A retry resend forces the key out again even to devices already marked. */
    {
        const devices = [{ jid: 'a@s.whatsapp.net', device: 0 }, { jid: 'b@s.whatsapp.net', device: 0 }];
        const senderKeyMap = { 'a@s.whatsapp.net': true, 'b@s.whatsapp.net': true };
        assert.deepEqual(pickSenderKeyRecipients(devices, senderKeyMap, { force: true }).length, 2);
        assert.deepEqual(pickSenderKeyRecipients(devices, senderKeyMap), []);
    }

    /** Picking must not mark anything — that is the whole point of splitting it. */
    {
        const senderKeyMap = {};
        pickSenderKeyRecipients([{ jid: 'a@s.whatsapp.net', device: 0 }], senderKeyMap);
        assert.deepEqual(senderKeyMap, {}, 'nothing is recorded until the key actually goes out');
    }

    {
        assert.deepEqual([...deliveredSenderKeyJids([node('a@s.whatsapp.net'), { attrs: {} }, null])], ['a@s.whatsapp.net']);
        assert.deepEqual([...deliveredSenderKeyJids(undefined)], []);
    }

    /**
     * The bug this file exists for: createParticipantNodes swallows a per-recipient
     * encryption failure and returns fewer nodes than it was given. Marking every
     * recipient regardless meant that device was recorded as holding a sender key
     * it never received, and since the map is stored per group, it could never
     * decrypt anything the bot said in that one group again.
     */
    {
        const senderKeyMap = {};
        const recipients = ['a@s.whatsapp.net', 'b@s.whatsapp.net', 'c@s.whatsapp.net'];
        const nodes = [node('a@s.whatsapp.net'), node('c@s.whatsapp.net')];

        const { marked, skipped } = commitSenderKeyDelivery(senderKeyMap, recipients, nodes);
        assert.deepEqual(marked, ['a@s.whatsapp.net', 'c@s.whatsapp.net']);
        assert.deepEqual(skipped, ['b@s.whatsapp.net']);
        assert.deepEqual(senderKeyMap, { 'a@s.whatsapp.net': true, 'c@s.whatsapp.net': true });
        assert.equal('b@s.whatsapp.net' in senderKeyMap, false, 'the failed device is not recorded');

        const again = pickSenderKeyRecipients(
            recipients.map(jid => ({ jid, device: 0 })),
            senderKeyMap
        );
        assert.deepEqual(again, ['b@s.whatsapp.net'], 'so the next send retries exactly that device');
    }

    /** A device that was marked before and fails now loses its mark rather than keeping a stale one. */
    {
        const senderKeyMap = { 'a@s.whatsapp.net': true, 'b@s.whatsapp.net': true };
        const { skipped } = commitSenderKeyDelivery(senderKeyMap, ['a@s.whatsapp.net', 'b@s.whatsapp.net'], [node('a@s.whatsapp.net')]);
        assert.deepEqual(skipped, ['b@s.whatsapp.net']);
        assert.deepEqual(senderKeyMap, { 'a@s.whatsapp.net': true });
    }

    /** Everything succeeding is the ordinary path and marks the lot. */
    {
        const senderKeyMap = {};
        const recipients = ['a@s.whatsapp.net', 'b@s.whatsapp.net'];
        const { marked, skipped } = commitSenderKeyDelivery(senderKeyMap, recipients, recipients.map(node));
        assert.deepEqual(marked, recipients);
        assert.deepEqual(skipped, []);
        assert.deepEqual(senderKeyMap, { 'a@s.whatsapp.net': true, 'b@s.whatsapp.net': true });
    }

    /** Nodes for jids nobody asked about never leak into the map. */
    {
        const senderKeyMap = {};
        commitSenderKeyDelivery(senderKeyMap, ['a@s.whatsapp.net'], [node('a@s.whatsapp.net'), node('z@s.whatsapp.net')]);
        assert.deepEqual(senderKeyMap, { 'a@s.whatsapp.net': true });
    }

    /**
     * resetGroupSenderKey reports what it forgot, because a bare undefined leaves
     * you unable to tell "cleared four devices" from "there was nothing stored, so
     * your problem is somewhere else".
     */
    {
        const stored = { 'g@g.us': { 'a@s.whatsapp.net': true, 'b@s.whatsapp.net': true } };
        assert.deepEqual(senderKeyResetSummary(stored, 'g@g.us'), {
            jid: 'g@g.us',
            cleared: 2,
            devices: ['a@s.whatsapp.net', 'b@s.whatsapp.net']
        });
        assert.deepEqual(senderKeyResetSummary({}, 'g@g.us'), { jid: 'g@g.us', cleared: 0, devices: [] });
        assert.deepEqual(senderKeyResetSummary(undefined, 'g@g.us'), { jid: 'g@g.us', cleared: 0, devices: [] });
        assert.deepEqual(senderKeyResetSummary({ 'g@g.us': null }, 'g@g.us'), { jid: 'g@g.us', cleared: 0, devices: [] });
    }
});

test('event-listener-limit', async () => {
    const logger = { info() {}, debug() {}, warn() {}, error() {}, trace() {}, child() { return this } };

    /**
     * The bus is one emitter shared by the socket, the store and every plugin a bot
     * registers, so node's default of ten per event fires a leak warning on an
     * ordinary setup and buries the real lines in the log.
     */
    {
        assert.equal(DEFAULT_MAX_EVENT_LISTENERS, 64);
        assert.equal(DEFAULT_CONNECTION_CONFIG.maxEventListeners, DEFAULT_MAX_EVENT_LISTENERS);
        assert.equal(makeEventBuffer(logger).getMaxListeners(), DEFAULT_MAX_EVENT_LISTENERS);
    }

    /** Still finite by default, so a runaway registration is still reported. */
    {
        const ev = makeEventBuffer(logger);
        const warnings = [];
        const onWarning = warning => warnings.push(warning);
        const printers = process.listeners('warning');
        process.removeAllListeners('warning');
        process.on('warning', onWarning);

        for (let i = 0; i < DEFAULT_MAX_EVENT_LISTENERS + 1; i++) {
            ev.on('call', () => {});
        }
        await new Promise(resolve => setImmediate(resolve));
        process.off('warning', onWarning);
        for (const printer of printers) {
            process.on('warning', printer);
        }

        assert.ok(
            warnings.some(warning => warning.name === 'MaxListenersExceededWarning'),
            'passing the ceiling still warns rather than hiding a real leak'
        );
        ev.removeAllListeners('call');
    }

    /** A bot that genuinely wants more, or none, can say so. */
    {
        assert.equal(makeEventBuffer(logger, 8).getMaxListeners(), 8);
        assert.equal(makeEventBuffer(logger, 0).getMaxListeners(), 0, 'zero is unlimited, node treats it that way');
        assert.equal(makeEventBuffer(logger, undefined).getMaxListeners(), DEFAULT_MAX_EVENT_LISTENERS);
        assert.equal(makeEventBuffer(logger, -1).getMaxListeners(), DEFAULT_MAX_EVENT_LISTENERS, 'nonsense falls back');
        assert.equal(makeEventBuffer(logger, 'lots').getMaxListeners(), DEFAULT_MAX_EVENT_LISTENERS);
    }

    /**
     * The buffer forwarded on, off and removeAllListeners and nothing else, so a bot
     * could add listeners but never inspect them — and cleaning up duplicates left
     * behind by a hot reload meant dropping the library's own handler with them.
     */
    {
        const ev = makeEventBuffer(logger);
        const first = () => {};
        const second = () => {};
        ev.on('call', first);
        ev.addListener('call', second);
        ev.once('call', () => {});

        assert.equal(ev.listenerCount('call'), 3);
        assert.equal(ev.listeners('call').length, 3);
        assert.equal(ev.rawListeners('call').length, 3);
        assert.equal(ev.listeners('call')[0], first, 'in registration order, so the oldest is index 0');

        ev.removeListener('call', first);
        assert.equal(ev.listenerCount('call'), 2);
        assert.equal(ev.listeners('call')[0], second);

        assert.ok(ev.eventNames().includes('call'));
        ev.removeAllListeners('call');
        assert.equal(ev.listenerCount('call'), 0);
    }

    /** Duplicates from a reload share their source, which is what makes them removable. */
    {
        const ev = makeEventBuffer(logger);
        const make = () => function onCall(node) { return node };
        ev.on('call', make());
        ev.on('call', make());
        ev.on('call', () => 'different');

        const seen = new Set();
        for (const listener of ev.listeners('call')) {
            const source = listener.toString();
            if (seen.has(source)) ev.off('call', listener);
            else seen.add(source);
        }
        assert.equal(ev.listenerCount('call'), 2, 'one of each distinct listener survives');
    }
});

test('apk-proto-fields', async () => {
    const round = (T, value) => T.toObject(T.decode(T.encode(value).finish()));

    const album = round(proto.Message.AlbumMessage, { caption: 'kapsi', expectedImageCount: 2, expectedVideoCount: 1 });
    assert.equal(album.caption, 'kapsi');
    assert.equal(album.expectedImageCount, 2);
    assert.equal(album.expectedVideoCount, 1);

    const button = round(proto.HydratedTemplateButton.HydratedURLButton, {
        displayText: 'buka',
        url: 'https://example.com',
        consentedUsersUrl: 'https://example.com/c',
        webviewPresentation: 1,
        webviewInteraction: true
    });
    assert.equal(button.webviewInteraction, true);
    assert.equal(button.webviewPresentation, 1);
    assert.equal(button.consentedUsersUrl, 'https://example.com/c');

    const plugin = round(proto.BotPluginMetadata, { pluginVersion: 8, searchQuery: 'q' });
    assert.equal(plugin.pluginVersion, 8);
    assert.equal(plugin.searchQuery, 'q');

    const invite = round(proto.Message, {
        newsletterFollowerInviteMessage: { newsletterJid: '1@newsletter', newsletterName: 'N', caption: 'c' }
    });
    assert.equal(invite.newsletterFollowerInviteMessage.newsletterJid, '1@newsletter');
    assert.equal(invite.newsletterFollowerInviteMessage.caption, 'c');

    const both = round(proto.Message, {
        newsletterFollowerInviteMessage: { newsletterJid: 'a@newsletter' },
        newsletterFollowerInviteMessageV2: { newsletterJid: 'b@newsletter' }
    });
    assert.equal(both.newsletterFollowerInviteMessage.newsletterJid, 'a@newsletter');
    assert.equal(both.newsletterFollowerInviteMessageV2.newsletterJid, 'b@newsletter');

    const upload = async () => ({});
    const withCaption = await generateWAMessageContent(
        { album: [{ image: { url: 'a' } }, { image: { url: 'b' } }], caption: 'judul album' },
        { upload }
    );
    assert.equal(withCaption.albumMessage.caption, 'judul album');
    assert.equal(withCaption.albumMessage.expectedImageCount, 2);

    const withoutCaption = await generateWAMessageContent(
        { album: [{ image: { url: 'a' } }, { video: { url: 'b' } }] },
        { upload }
    );
    assert.equal(withoutCaption.albumMessage.caption ?? null, null);
    assert.equal(withoutCaption.albumMessage.expectedVideoCount, 1);
});
