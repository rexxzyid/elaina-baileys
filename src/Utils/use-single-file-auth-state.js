/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { randomBytes } from 'crypto';
import { chmod, readFile, rename, stat, unlink, writeFile } from 'fs/promises';
import { DEFAULT_CACHE_TTLS } from '../Defaults/index.js';
import { proto } from '../../WAProto/index.js';
import { initAuthCreds } from './auth-utils.js';
import { BufferJSON } from './generics.js';
import { LRUCache } from 'lru-cache';
import { Mutex } from 'async-mutex';

const FLUSH_TIMEOUT_MS = 3000;

export const useSingleFileAuthState = async (fileName) => {
    const cache = new LRUCache({
        max: 20000,
        ttl: 1000 * DEFAULT_CACHE_TTLS.SIGNAL_STORE,
        updateAgeOnGet: false,
        updateAgeOnHas: false,
        ttlAutopurge: true
    });

    const mutex = new Mutex();
    let fileData = {};
    let isLoaded = false;
    let flushTimeout = null;
    let flushPromise = null;
    let flushError = null;
    let dirty = false;
    const loadKey = async () => {
        return await mutex.runExclusive(async () => {
            if (isLoaded)
                return;
            try {
                const data = JSON.parse(await readFile(fileName, 'utf-8'), BufferJSON.reviver);
                fileData = data || {};
                for (const [keyName, value] of Object.entries(fileData)) {
                    cache.set(keyName, value);
                }
            }
            catch (error) {
                if (error?.code !== 'ENOENT') {
                    throw new Error(`failed to read auth file ${fileName}: ${error.message}`, { cause: error });
                }
                fileData = {};
            }
            isLoaded = true;
        });
    };
    const persist = async () => {
        await mutex.runExclusive(async () => {
            if (!dirty) {
                return;
            }
            const tempFile = `${fileName}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
            const serialized = JSON.stringify(fileData, BufferJSON.replacer);
            dirty = false;
            try {
                await writeFile(tempFile, serialized, { mode: 0o600 });
                await rename(tempFile, fileName);
            }
            catch (error) {
                dirty = true;
                await unlink(tempFile).catch(() => { });
                throw error;
            }
        });
    };
    const runScheduledFlush = async () => {
        try {
            await persist();
            flushError = null;
        }
        catch (error) {
            flushError = error;
        }
    };
    const scheduleFlush = () => {
        if (flushTimeout) {
            return;
        }
        flushTimeout = setTimeout(() => {
            flushTimeout = null;
            const current = runScheduledFlush();
            flushPromise = current;
            void current.finally(() => {
                if (flushPromise === current) {
                    flushPromise = null;
                }
            });
        }, FLUSH_TIMEOUT_MS);
    };
    const flush = async () => {
        if (flushTimeout) {
            clearTimeout(flushTimeout);
            flushTimeout = null;
        }
        if (flushPromise) {
            await flushPromise;
        }
        if (flushError) {
            const error = flushError;
            flushError = null;
            throw error;
        }
        await persist();
    };
    const writeKey = (keyName, value) => {
        cache.set(keyName, value);
        fileData[keyName] = value;
        dirty = true;
        scheduleFlush();
    };
    const removeKey = (keyName) => {
        cache.delete(keyName);
        delete fileData[keyName];
        dirty = true;
        scheduleFlush();
    };
    const fileInfo = await stat(fileName).catch(error => {
        if (error?.code === 'ENOENT') {
            return null;
        }
        throw error;
    });
    if (!fileInfo) {
        await writeFile(fileName, '{}', { mode: 0o600 });
    }
    else if (!fileInfo.isFile()) {
        throw new Error(`found something that is not a file at ${fileName}, either delete it or specify a different location`);
    }
    await chmod(fileName, 0o600);
    await loadKey();
    const creds = fileData['creds'] || initAuthCreds();
    return {
        state: {
            creds,
            keys: {
                get: (type, ids) => {
                    const data = {};
                    for (const id of ids) {
                        const keyName = type + id;
                        let value = cache.get(keyName);
                        if (value === undefined && fileData[keyName] !== undefined) {
                            value = fileData[keyName];
                            cache.set(keyName, value);
                        }
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }
                    return data;
                },
                set: (data) => {
                    for (const category in data) {
                        for (const id in data[category]) {
                            const keyName = category + id;
                            const value = data[category][id];
                            value !== null && value !== undefined ? writeKey(keyName, value) : removeKey(keyName);
                        }
                    }
                }
            }
        },
        saveCreds: async () => {
            writeKey('creds', creds);
            await flush();
        },
        flush,
        close: async () => {
            await flush();
            cache.clear();
        }
    };
};
