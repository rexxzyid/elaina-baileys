/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */

export const SplitPaymentStatus = Object.freeze({ PENDING: 0, PAID: 1 })

export const ReminderFrequency = Object.freeze({
    REMINDER_FREQUENCY_UNKNOWN: 0,
    WEEKLY: 1,
    BI_WEEKLY: 2,
    MONTHLY: 3,
    QUARTERLY: 4
})

export const ReminderStatus = Object.freeze({
    REMINDER_STATUS_UNKNOWN: 0,
    ACTIVE: 1,
    CANCELLED_BY_CREATOR: 2,
    STOPPED_BY_RECEIVER: 3,
    EXPIRED: 4,
    PAID: 5
})

export const MONEY_OFFSET = 1000

const drop = (object) => {
    for (const key of Object.keys(object)) {
        if (object[key] === undefined || object[key] === null) {
            delete object[key]
        }
    }
    return object
}

/**
 * Money travels as an integer scaled by offset, so 50000 rupiah at the usual
 * offset of 1000 goes on the wire as 50000000. Passing the scaled value by
 * mistake overcharges by three orders of magnitude, so the amount here is
 * always the human one.
 */
export const money = (amount, currencyCode, offset = MONEY_OFFSET) => {
    const value = Number(amount)
    if (!Number.isFinite(value) || value < 0) {
        throw new TypeError('money needs a non-negative amount')
    }
    if (typeof currencyCode !== 'string' || currencyCode.length !== 3) {
        throw new TypeError('money needs a three letter currency code, like IDR or USD')
    }
    if (!Number.isInteger(offset) || offset <= 0) {
        throw new TypeError('money offset must be a positive integer')
    }
    return { value: Math.round(value * offset), offset, currencyCode: currencyCode.toUpperCase() }
}

export const readMoney = (value) => {
    if (!value?.offset) {
        return undefined
    }
    return {
        amount: Number(value.value) / Number(value.offset),
        currencyCode: value.currencyCode
    }
}

export const buildSplitPayment = ({ splitId, total, currency, description, requesterJid, participants = [], createdAt } = {}) => {
    if (!splitId) {
        throw new TypeError('buildSplitPayment needs a splitId, the update message is keyed on it')
    }
    if (!participants.length) {
        throw new TypeError('buildSplitPayment needs at least one participant')
    }
    return drop({
        splitId: String(splitId),
        totalAmount: total === undefined ? undefined : money(total, currency),
        description,
        requesterJid,
        participants: participants.map((participant, index) => {
            if (!participant?.jid) {
                throw new TypeError(`participant ${index} needs a jid`)
            }
            return drop({
                jid: participant.jid,
                amount: participant.amount === undefined ? undefined : money(participant.amount, participant.currency ?? currency),
                status: participant.status ?? SplitPaymentStatus.PENDING
            })
        }),
        createdAtMs: createdAt === undefined ? Date.now() : Number(createdAt)
    })
}

export const buildSplitPaymentUpdate = ({ splitId, participantJid } = {}) => {
    if (!splitId || !participantJid) {
        throw new TypeError('buildSplitPaymentUpdate needs both splitId and participantJid')
    }
    return { splitId: String(splitId), participantJid }
}

export const buildPaymentReminder = ({
    reminderId,
    instanceId,
    description,
    frequency = ReminderFrequency.MONTHLY,
    status = ReminderStatus.ACTIVE,
    amount,
    currency,
    payeeVpa,
    payeeJid,
    payerJid
} = {}) => {
    if (!reminderId) {
        throw new TypeError('buildPaymentReminder needs a reminderId')
    }
    return drop({
        reminderId: String(reminderId),
        instanceId: instanceId === undefined ? undefined : String(instanceId),
        description,
        frequency,
        status,
        amount: amount === undefined ? undefined : money(amount, currency),
        payeeVpa,
        payeeJid,
        payerJid
    })
}

export const readSplitPayment = (msg) => {
    const message = msg?.message ?? msg
    const split = message?.splitPaymentMessage
    if (!split) {
        return null
    }
    return drop({
        splitId: split.splitId,
        total: readMoney(split.totalAmount),
        description: split.description,
        requesterJid: split.requesterJid,
        createdAtMs: split.createdAtMs === undefined ? undefined : Number(split.createdAtMs),
        participants: (split.participants ?? []).map(participant => drop({
            jid: participant.jid,
            amount: readMoney(participant.amount),
            status: participant.status
        }))
    })
}

export const readPaymentReminder = (msg) => {
    const message = msg?.message ?? msg
    const reminder = message?.paymentReminderMessage
    if (!reminder) {
        return null
    }
    return drop({
        reminderId: reminder.reminderId,
        instanceId: reminder.instanceId,
        description: reminder.description,
        frequency: reminder.frequency,
        status: reminder.status,
        amount: readMoney(reminder.amount),
        payeeVpa: reminder.payeeVpa,
        payeeJid: reminder.payeeJid,
        payerJid: reminder.payerJid
    })
}
