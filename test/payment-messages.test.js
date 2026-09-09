import assert from 'node:assert/strict';
import { proto } from '../WAProto/index.js';
import {
    MONEY_OFFSET,
    ReminderFrequency,
    ReminderStatus,
    SplitPaymentStatus,
    buildPaymentReminder,
    buildSplitPayment,
    buildSplitPaymentUpdate,
    money,
    readMoney,
    readPaymentReminder,
    readSplitPayment
} from '../lib/Utils/payment-messages.js';
import { generateWAMessageContent } from '../lib/Utils/messages.js';

const options = { logger: { debug() {}, info() {}, warn() {} } };
const roundTrip = content => proto.Message.decode(proto.Message.encode(proto.Message.fromObject(content)).finish());

/**
 * Money is an integer scaled by offset, so 50000 at the usual 1000 goes out as
 * 50000000. Handing the scaled number in by mistake overcharges a thousandfold,
 * so the amount taken here is always the human one.
 */
{
    assert.deepEqual(money(50000, 'IDR'), { value: 50000000, offset: MONEY_OFFSET, currencyCode: 'IDR' });
    assert.deepEqual(money(1.5, 'usd'), { value: 1500, offset: 1000, currencyCode: 'USD' }, 'the code is upper cased');
    assert.deepEqual(readMoney(money(50000, 'IDR')), { amount: 50000, currencyCode: 'IDR' });
    assert.equal(readMoney(undefined), undefined);
    assert.equal(readMoney({ value: 1 }), undefined, 'no offset means no scale to read it by');

    assert.throws(() => money(-1, 'IDR'), /non-negative/);
    assert.throws(() => money(1, 'RUPIAH'), /three letter currency/);
    assert.throws(() => money(1, 'IDR', 0), /positive integer/);
}

/** A split needs an id the update can name, and someone to split with. */
{
    assert.throws(() => buildSplitPayment({ participants: [{ jid: 'a@s.whatsapp.net' }] }), /splitId/);
    assert.throws(() => buildSplitPayment({ splitId: 's1' }), /at least one participant/);
    assert.throws(() => buildSplitPayment({ splitId: 's1', participants: [{}] }), /participant 0 needs a jid/);
    assert.throws(() => buildSplitPaymentUpdate({ splitId: 's1' }), /both splitId and participantJid/);

    const built = buildSplitPayment({
        splitId: 's1',
        total: 150000,
        currency: 'IDR',
        participants: [{ jid: 'a@s.whatsapp.net' }]
    });
    assert.equal(built.participants[0].status, SplitPaymentStatus.PENDING, 'unpaid by default');
    assert.ok(built.createdAtMs > 0, 'stamped unless given');
    assert.equal(buildSplitPayment({ splitId: 's1', createdAt: 5, participants: [{ jid: 'a@x' }] }).createdAtMs, 5);
}

/** The whole split survives the encoder and reads back as human amounts. */
{
    const content = await generateWAMessageContent({
        splitPayment: {
            splitId: 's1',
            total: 150000,
            currency: 'IDR',
            description: 'Makan bareng',
            requesterJid: '628@s.whatsapp.net',
            participants: [
                { jid: '6281@s.whatsapp.net', amount: 50000 },
                { jid: '6282@s.whatsapp.net', amount: 100000, status: SplitPaymentStatus.PAID }
            ]
        }
    }, options);

    const read = readSplitPayment(roundTrip(content));
    assert.equal(read.splitId, 's1');
    assert.deepEqual(read.total, { amount: 150000, currencyCode: 'IDR' });
    assert.equal(read.participants.length, 2);
    assert.deepEqual(read.participants[0].amount, { amount: 50000, currencyCode: 'IDR' });
    assert.equal(read.participants[1].status, SplitPaymentStatus.PAID);

    const update = await generateWAMessageContent({
        splitPaymentUpdate: { splitId: 's1', participantJid: '6281@s.whatsapp.net' }
    }, options);
    assert.deepEqual(roundTrip(update).splitPaymentUpdateMessage.toJSON(), {
        splitId: 's1',
        participantJid: '6281@s.whatsapp.net'
    });
}

/** The reminder carries its schedule and its amount. */
{
    assert.throws(() => buildPaymentReminder({}), /reminderId/);

    const content = await generateWAMessageContent({
        paymentReminder: {
            reminderId: 'r1',
            description: 'Sewa',
            amount: 500000,
            currency: 'IDR',
            frequency: ReminderFrequency.MONTHLY
        }
    }, options);

    const read = readPaymentReminder(roundTrip(content));
    assert.equal(read.reminderId, 'r1');
    assert.equal(read.frequency, ReminderFrequency.MONTHLY);
    assert.equal(read.status, ReminderStatus.ACTIVE, 'active unless told otherwise');
    assert.deepEqual(read.amount, { amount: 500000, currencyCode: 'IDR' });
}

/** Neither reader claims a message that is not theirs. */
{
    assert.equal(readSplitPayment({ message: { conversation: 'halo' } }), null);
    assert.equal(readPaymentReminder({ message: { conversation: 'halo' } }), null);
    assert.equal(readSplitPayment(undefined), null);
}

/** The status link style sits at the top of the message, beside the text. */
{
    const content = await generateWAMessageContent(
        { text: 'cek https://x.test', statusLinkPreview: { style: 1 } },
        { ...options, getUrlInfo: async () => ({ 'matched-text': 'https://x.test' }) }
    );
    assert.equal(content.statusLinkPreviewMetadata.style, 1);
    assert.ok(content.extendedTextMessage, 'the text message is still there');
    assert.equal(roundTrip(content).statusLinkPreviewMetadata.style, 1);

    const bare = await generateWAMessageContent({ text: 'halo', statusLinkPreview: 2 }, options);
    assert.equal(bare.statusLinkPreviewMetadata.style, 2, 'a bare number works too');

    await assert.rejects(
        generateWAMessageContent({ text: 'halo', statusLinkPreview: { style: -1 } }, options),
        /non-negative integer/
    );
}

console.log('payment message tests passed');
