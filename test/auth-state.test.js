import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { makeAuthStateFromStore } from '../src/Utils/auth-store.js';
import { makeCacheableSignalKeyStore } from '../src/Utils/auth-utils.js';
import { useMultiFileAuthState } from '../src/Utils/use-multi-file-auth-state.js';
import { useSingleFileAuthState } from '../src/Utils/use-single-file-auth-state.js';
import { useNekoDBAuth } from '../src/Utils/useNekoDBAuth.js';

const withTempDir = async work => {
    const dir = await mkdtemp(join(tmpdir(), 'elaina-auth-state-'));
    try {
        await work(dir);
    }
    finally {
        await rm(dir, { recursive: true, force: true });
    }
};

const makeMemoryStore = () => {
    const rows = new Map();
    const key = (type, id) => `${type}|${id}`;
    return {
        rows,
        async read(type, id) {
            return rows.get(key(type, id)) ?? null;
        },
        async readMany(type, ids) {
            return Object.fromEntries(ids.filter(id => rows.has(key(type, id))).map(id => [id, rows.get(key(type, id))]));
        },
        async write(type, id, value) {
            rows.set(key(type, id), value);
        },
        async apply(writes, removals) {
            for (const { type, id, value } of writes) {
                rows.set(key(type, id), value);
            }
            for (const { type, id } of removals) {
                rows.delete(key(type, id));
            }
        },
        async clear() {
            rows.clear();
        }
    };
};

test('cacheable signal store keeps persisted state after a failed write', async () => {
    const persisted = { session: { abc: 'tersimpan' } };
    const store = {
        async get(type, ids) {
            return Object.fromEntries(ids.filter(id => persisted[type]?.[id] !== undefined).map(id => [id, persisted[type][id]]));
        },
        async set() {
            throw new Error('disk penuh simulasi');
        }
    };
    const cached = makeCacheableSignalKeyStore(store, null);
    assert.deepEqual(await cached.get('session', ['abc']), { abc: 'tersimpan' });
    await assert.rejects(() => cached.set({ session: { abc: 'belum-tersimpan' } }), /disk penuh/);
    assert.deepEqual(await cached.get('session', ['abc']), { abc: 'tersimpan' });
});

test('cacheable and common auth stores preserve falsy values and deletions', async () => {
    const store = makeMemoryStore();
    const auth = await makeAuthStateFromStore(store);
    const values = { zero: 0, no: false, empty: '', valid: 'ok' };
    await auth.state.keys.set({ example: values });
    assert.deepEqual(await auth.state.keys.get('example', Object.keys(values)), values);

    const cached = makeCacheableSignalKeyStore(auth.state.keys, null);
    assert.deepEqual(await cached.get('example', Object.keys(values)), values);
    await cached.set({ example: { zero: 1, no: null } });
    assert.deepEqual(await cached.get('example', ['zero', 'no', 'empty']), { zero: 1, empty: '' });
    assert.deepEqual(await auth.state.keys.get('example', ['zero', 'no', 'empty']), { zero: 1, empty: '' });
});

test('multi-file auth writes durably with private permissions and preserves falsy values', async () => {
    await withTempDir(async dir => {
        const folder = join(dir, 'session');
        const auth = await useMultiFileAuthState(folder);
        await auth.saveCreds();
        const values = { zero: 0, no: false, empty: '' };
        await auth.state.keys.set({ example: values });
        assert.deepEqual(await auth.state.keys.get('example', Object.keys(values)), values);

        const reopened = await useMultiFileAuthState(folder);
        assert.equal(reopened.state.creds.registrationId, auth.state.creds.registrationId);
        assert.deepEqual(await reopened.state.keys.get('example', Object.keys(values)), values);
        if (process.platform !== 'win32') {
            assert.equal((await stat(folder)).mode & 0o777, 0o700);
            assert.equal((await stat(join(folder, 'creds.json'))).mode & 0o777, 0o600);
        }
        const temporaryFiles = (await readdir(folder)).filter(name => name.endsWith('.tmp'));
        assert.deepEqual(temporaryFiles, []);
    });
});

test('multi-file auth rejects corrupt credentials instead of replacing them', async () => {
    await withTempDir(async dir => {
        const folder = join(dir, 'session');
        const auth = await useMultiFileAuthState(folder);
        await auth.saveCreds();
        const credsPath = join(folder, 'creds.json');
        await writeFile(credsPath, '{truncated');
        await assert.rejects(() => useMultiFileAuthState(folder), /failed to read auth file.*creds\.json/);
        assert.equal(await readFile(credsPath, 'utf8'), '{truncated');
    });
});

test('single-file saveCreds waits for persistence and close flushes keys', async () => {
    await withTempDir(async dir => {
        const fileName = join(dir, 'session.json');
        const auth = await useSingleFileAuthState(fileName);
        await auth.saveCreds();
        const saved = JSON.parse(await readFile(fileName, 'utf8'));
        assert.equal(saved.creds.registrationId, auth.state.creds.registrationId);

        const values = { zero: 0, no: false, empty: '' };
        auth.state.keys.set({ example: values });
        await auth.close();
        assert.deepEqual(auth.state.keys.get('example', Object.keys(values)), values);

        const reopened = await useSingleFileAuthState(fileName);
        assert.deepEqual(reopened.state.keys.get('example', Object.keys(values)), values);
        await reopened.close();
        if (process.platform !== 'win32') {
            assert.equal((await stat(fileName)).mode & 0o777, 0o600);
        }
        assert.deepEqual((await readdir(dir)).filter(name => name.endsWith('.tmp')), []);
    });
});

test('single-file auth rejects corrupt credentials instead of replacing them', async () => {
    await withTempDir(async dir => {
        const fileName = join(dir, 'session.json');
        await writeFile(fileName, '{broken');
        await assert.rejects(() => useSingleFileAuthState(fileName), /failed to read auth file.*session\.json/);
        assert.equal(await readFile(fileName, 'utf8'), '{broken');
    });
});

test('single-file auth reports write failures and can retry', async () => {
    await withTempDir(async dir => {
        const fileName = join(dir, 'session.json');
        const auth = await useSingleFileAuthState(fileName);
        await auth.saveCreds();
        await rm(fileName);
        await mkdir(fileName);
        await assert.rejects(() => auth.saveCreds());
        await rm(fileName, { recursive: true });
        await auth.saveCreds();
        const saved = JSON.parse(await readFile(fileName, 'utf8'));
        assert.equal(saved.creds.registrationId, auth.state.creds.registrationId);
        await auth.close();
    });
});

test('NekoDB auth preserves falsy values and propagates storage failures', async () => {
    const docs = new Map();
    const helper = {
        async upsert(filter, value) {
            docs.set(filter.k, value);
        },
        async findOne(filter) {
            return docs.get(filter.k) ?? null;
        },
        async deleteWhere(filter) {
            docs.delete(filter.k);
        }
    };
    const db = {
        collection() {
            return { helper: () => helper };
        },
        async deleteCollection() {
            throw new Error('database offline');
        }
    };
    const auth = await useNekoDBAuth(db);
    const values = { zero: 0, no: false, empty: '' };
    await auth.state.keys.set({ example: values });
    assert.deepEqual(await auth.state.keys.get('example', Object.keys(values)), values);
    await assert.rejects(() => auth.clearAuth(), /database offline/);

    docs.set('creds', { k: 'creds', v: '{broken' });
    await assert.rejects(() => useNekoDBAuth(db), /data auth 'creds' rusak/);
});
