/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
const cache = new Map()

const MESSAGES = {
    sharp: 'sharp is an optional dependency. Install it with: npm i sharp',
    'fluent-ffmpeg': 'fluent-ffmpeg is an optional dependency. Install it with: npm i fluent-ffmpeg'
}

const isMissingModule = (error, name) => {
    const code = error?.code
    if (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'MODULE_NOT_FOUND') {
        return false
    }
    const message = String(error?.message ?? '')
    return message.includes(`'${name}'`) || message.includes(`"${name}"`)
}

const loadOptional = (name) => {
    if (!cache.has(name)) {
        cache.set(name, import(name).then(
            loaded => loaded?.default ?? loaded,
            error => {
                cache.delete(name)
                if (isMissingModule(error, name)) {
                    throw new Error(MESSAGES[name] ?? `${name} is an optional dependency. Install it with: npm i ${name}`)
                }
                throw error
            }
        ))
    }
    return cache.get(name)
}

export const loadSharp = () => loadOptional('sharp')

export const loadFfmpeg = () => loadOptional('fluent-ffmpeg')

export const hasOptionalMedia = async (name) => {
    try {
        await loadOptional(name)
        return true
    }
    catch {
        return false
    }
}
