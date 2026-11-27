/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { Mutex } from 'async-mutex';
import { randomBytes } from 'crypto';
import { chmod, mkdir, readFile, rename, stat, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { proto } from '../../WAProto/index.js';
import { initAuthCreds } from './auth-utils.js';
import { BufferJSON } from './generics.js';

const fileLocks = new Map();

const withFileLock = async (path, work) => {
    let entry = fileLocks.get(path);
    if (!entry) {
        entry = { mutex: new Mutex(), waiting: 0 };
        fileLocks.set(path, entry);
    }
    entry.waiting++;
    const release = await entry.mutex.acquire();
    try {
        return await work();
    }
    finally {
        release();
        entry.waiting--;
        if (entry.waiting === 0) {
            fileLocks.delete(path);
        }
    }
};

const writeFileAtomic = async (filePath, data) => {
    const tempPath = `${filePath}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
    try {
        await writeFile(tempPath, data, { mode: 0o600 });
        await rename(tempPath, filePath);
    }
    catch (error) {
        await unlink(tempPath).catch(() => { });
        throw error;
    }
};

export const countAuthFileLocks = () => fileLocks.size;

export const useMultiFileAuthState = async (folder) => {

    const writeData = async (data, file) => {
        const filePath = join(folder, fixFileName(file));
        return withFileLock(filePath, () => writeFileAtomic(filePath, JSON.stringify(data, BufferJSON.replacer)));
    };
    const readData = async (file) => {
        const filePath = join(folder, fixFileName(file));
        return withFileLock(filePath, async () => {
            try {
                const data = await readFile(filePath, { encoding: 'utf-8' });
                return JSON.parse(data, BufferJSON.reviver);
            }
            catch (error) {
                if (error?.code === 'ENOENT') {
                    return null;
                }
                throw new Error(`failed to read auth file ${filePath}: ${error.message}`, { cause: error });
            }
        });
    };
    const removeData = async (file) => {
        const filePath = join(folder, fixFileName(file));
        return withFileLock(filePath, async () => {
            try {
                await unlink(filePath);
            }
            catch (error) {
                if (error?.code !== 'ENOENT') {
                    throw error;
                }
            }
        });
    };
    const folderInfo = await stat(folder).catch(error => {
        if (error?.code === 'ENOENT') {
            return null;
        }
        throw error;
    });
    if (folderInfo) {
        if (!folderInfo.isDirectory()) {
            throw new Error(`found something that is not a directory at ${folder}, either delete it or specify a different location`);
        }
    }
    else {
        await mkdir(folder, { recursive: true, mode: 0o700 });
    }
    await chmod(folder, 0o700);
    const fixFileName = (file) => file?.replace(/\//g, '__')?.replace(/:/g, '-');
    const creds = (await readData('creds.json')) || initAuthCreds();
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}.json`);
                        if (type === 'app-state-sync-key' && value) {
                            value = proto.Message.AppStateSyncKeyData.fromObject(value);
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
                            const file = `${category}-${id}.json`;
                            tasks.push(value !== null && value !== undefined ? writeData(value, file) : removeData(file));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: async () => {
            return writeData(creds, 'creds.json');
        }
    };
};
