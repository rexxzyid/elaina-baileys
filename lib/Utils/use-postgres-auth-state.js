/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { loadOptionalModule, makeAuthStateFromStore } from './auth-store.js';
const quoteIdentifier = (name) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        throw new Error(`table name must be a plain identifier, got ${JSON.stringify(name)}`);
    }
    return `"${name}"`;
};
export async function usePostgresAuthState(opts = {}) {
    const table = quoteIdentifier(opts.table ?? 'baileys_auth');
    const session = opts.session ?? 'default';
    let pool = opts.pool;
    let owned = false;
    if (!pool) {
        if (!opts.connectionString && !opts.config) {
            throw new Error('usePostgresAuthState needs a pool, a connectionString, or a config');
        }
        const pg = await loadOptionalModule('pg', 'usePostgresAuthState');
        pool = new pg.Pool(opts.config ?? { connectionString: opts.connectionString });
        owned = true;
    }
    await pool.query(`CREATE TABLE IF NOT EXISTS ${table} (
        session TEXT NOT NULL,
        type TEXT NOT NULL,
        id TEXT NOT NULL,
        value TEXT NOT NULL,
        PRIMARY KEY (session, type, id)
    )`);
    const store = {
        read: async (type, id) => {
            const result = await pool.query(`SELECT value FROM ${table} WHERE session = $1 AND type = $2 AND id = $3`, [session, type, id]);
            return result.rows[0]?.value ?? null;
        },
        readMany: async (type, ids) => {
            if (!ids.length) {
                return {};
            }
            const result = await pool.query(`SELECT id, value FROM ${table} WHERE session = $1 AND type = $2 AND id = ANY($3)`, [session, type, ids]);
            const rows = {};
            for (const row of result.rows) {
                rows[row.id] = row.value;
            }
            return rows;
        },
        write: async (type, id, value) => {
            await pool.query(`INSERT INTO ${table} (session, type, id, value) VALUES ($1, $2, $3, $4)
                ON CONFLICT (session, type, id) DO UPDATE SET value = EXCLUDED.value`, [session, type, id, value]);
        },
        apply: async (writes, removals) => {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                for (const entry of writes) {
                    await client.query(`INSERT INTO ${table} (session, type, id, value) VALUES ($1, $2, $3, $4)
                        ON CONFLICT (session, type, id) DO UPDATE SET value = EXCLUDED.value`, [session, entry.type, entry.id, entry.value]);
                }
                for (const entry of removals) {
                    await client.query(`DELETE FROM ${table} WHERE session = $1 AND type = $2 AND id = $3`, [session, entry.type, entry.id]);
                }
                await client.query('COMMIT');
            }
            catch (err) {
                await client.query('ROLLBACK');
                throw err;
            }
            finally {
                client.release();
            }
        },
        clear: async () => {
            await pool.query(`DELETE FROM ${table} WHERE session = $1`, [session]);
        },
        close: async () => {
            if (owned) {
                await pool.end();
            }
        }
    };
    return makeAuthStateFromStore(store);
}
