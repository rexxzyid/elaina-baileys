import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { proto } from '../WAProto/index.js';
import { useSqliteAuthState } from '../lib/Utils/use-sqlite-auth-state.js';

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
