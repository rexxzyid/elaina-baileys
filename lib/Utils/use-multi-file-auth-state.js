/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { Mutex } from 'async-mutex';
import { mkdir, readFile, stat, unlink, writeFile } from 'fs/promises';
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

export const countAuthFileLocks = () => fileLocks.size;

export const useMultiFileAuthState = async (folder) => {

    const writeData = async (data, file) => {
        const filePath = join(folder, fixFileName(file));
        return withFileLock(filePath, () => writeFile(filePath, JSON.stringify(data, BufferJSON.replacer)));
    };
    const readData = async (file) => {
        try {
            const filePath = join(folder, fixFileName(file));
            return await withFileLock(filePath, async () => {
                const data = await readFile(filePath, { encoding: 'utf-8' });
                return JSON.parse(data, BufferJSON.reviver);
            });
        }
        catch (error) {
            return null;
        }
    };
    const removeData = async (file) => {
        try {
            const filePath = join(folder, fixFileName(file));
            return await withFileLock(filePath, async () => {
                try {
                    await unlink(filePath);
                }
                catch {
                }
            });
        }
        catch { }
    };
    const folderInfo = await stat(folder).catch(() => { });
    if (folderInfo) {
        if (!folderInfo.isDirectory()) {
            throw new Error(`found something that is not a directory at ${folder}, either delete it or specify a different location`);
        }
    }
    else {
        await mkdir(folder, { recursive: true });
    }
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
                            tasks.push(value ? writeData(value, file) : removeData(file));
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
