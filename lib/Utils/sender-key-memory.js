/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */

export const pickSenderKeyRecipients = (devices, senderKeyMap, { force = false, skip } = {}) => {
    const recipients = []
    for (const device of devices) {
        const deviceJid = device?.jid
        if (!deviceJid) {
            continue
        }
        if (!force && senderKeyMap[deviceJid]) {
            continue
        }
        if (skip && skip(device)) {
            continue
        }
        recipients.push(deviceJid)
    }
    return recipients
}

export const deliveredSenderKeyJids = nodes => {
    const delivered = new Set()
    for (const node of nodes || []) {
        const jid = node?.attrs?.jid
        if (jid) {
            delivered.add(jid)
        }
    }
    return delivered
}

export const commitSenderKeyDelivery = (senderKeyMap, recipients, nodes) => {
    const delivered = deliveredSenderKeyJids(nodes)
    const marked = []
    const skipped = []
    for (const jid of recipients) {
        if (delivered.has(jid)) {
            senderKeyMap[jid] = true
            marked.push(jid)
        }
        else {
            delete senderKeyMap[jid]
            skipped.push(jid)
        }
    }
    return { marked, skipped }
}
