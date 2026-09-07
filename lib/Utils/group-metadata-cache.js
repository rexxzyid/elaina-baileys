/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */

export const GROUP_ADDRESSING_MODES = Object.freeze(['pn', 'lid'])

export const isUsableGroupMetadata = metadata => {
    if (!metadata || typeof metadata !== 'object') {
        return false
    }
    if (!Array.isArray(metadata.participants)) {
        return false
    }
    return GROUP_ADDRESSING_MODES.includes(metadata.addressingMode)
}

export const describeUnusableGroupMetadata = metadata => {
    if (!metadata || typeof metadata !== 'object') {
        return 'nothing cached'
    }
    if (!Array.isArray(metadata.participants)) {
        return 'no participants'
    }
    if (metadata.addressingMode === undefined || metadata.addressingMode === null) {
        return 'no addressingMode'
    }
    return `addressingMode ${JSON.stringify(metadata.addressingMode)} is not pn or lid`
}
