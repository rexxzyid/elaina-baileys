import { proto } from '../../WAProto/index.js'
import { initAuthCreds } from './auth-utils.js'
import { BufferJSON } from './generics.js'

export async function useNekoDBAuth(db, collectionName = 'baileys_elaina_auth') {
    if (!db || typeof db.collection !== 'function') {
        throw new Error(
            'useNekoDBAuth: argumen pertama harus instance NekoDB yang terkoneksi'
        )
    }

    const col = db.collection(collectionName).helper()

    const writeData = async (data, key) => {
        const value = JSON.stringify(data, BufferJSON.replacer)

        await col.upsert(
            { k: key },
            {
                k: key,
                v: value
            }
        )
    }

    const readData = async key => {
        const doc = await col.findOne({ k: key })

        if (!doc || doc.v == null) {
            return null
        }

        try {
            return JSON.parse(doc.v, BufferJSON.reviver)
        } catch (error) {
            throw new Error(`useNekoDBAuth: data auth '${key}' rusak: ${error.message}`, { cause: error })
        }
    }

    const removeData = async key => {
        await col.deleteWhere({ k: key })
    }

    const creds =
        (await readData('creds')) ||
        initAuthCreds()

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {}

                    await Promise.all(
                        ids.map(async id => {
                            let value = await readData(`${type}-${id}`)

                            if (
                                type === 'app-state-sync-key' &&
                                value
                            ) {
                                value =
                                    proto.Message.AppStateSyncKeyData.fromObject(
                                        value
                                    )
                            }

                            data[id] = value
                        })
                    )

                    return data
                },

                set: async data => {
                    const tasks = []

                    for (const category in data) {
                        const entries = data[category]

                        for (const id in entries) {
                            const value = entries[id]
                            const key = `${category}-${id}`

                            tasks.push(
                                value !== null && value !== undefined
                                    ? writeData(value, key)
                                    : removeData(key)
                            )
                        }
                    }

                    await Promise.all(tasks)
                }
            }
        },

        saveCreds: async () => {
            await writeData(creds, 'creds')
        },

        clearAuth: async () => {
            await db.deleteCollection(collectionName)
        }
    }
}
