import assert from 'node:assert/strict';
import { commitSenderKeyDelivery, deliveredSenderKeyJids, pickSenderKeyRecipients, senderKeyResetSummary } from '../lib/Utils/sender-key-memory.js';

const node = jid => ({ tag: 'to', attrs: { jid }, content: [] });

/** Only devices that have not been given the key yet, and only real ones. */
{
    const devices = [
        { jid: 'a@s.whatsapp.net', device: 0 },
        { jid: 'b@s.whatsapp.net', device: 1 },
        { jid: 'c@s.whatsapp.net', device: 99 },
        { jid: undefined, device: 0 }
    ];
    const senderKeyMap = { 'a@s.whatsapp.net': true };
    const picked = pickSenderKeyRecipients(devices, senderKeyMap, { skip: device => device.device === 99 });
    assert.deepEqual(picked, ['b@s.whatsapp.net'], 'known devices, hosted devices and blank jids are all left out');
}

/** A retry resend forces the key out again even to devices already marked. */
{
    const devices = [{ jid: 'a@s.whatsapp.net', device: 0 }, { jid: 'b@s.whatsapp.net', device: 0 }];
    const senderKeyMap = { 'a@s.whatsapp.net': true, 'b@s.whatsapp.net': true };
    assert.deepEqual(pickSenderKeyRecipients(devices, senderKeyMap, { force: true }).length, 2);
    assert.deepEqual(pickSenderKeyRecipients(devices, senderKeyMap), []);
}

/** Picking must not mark anything — that is the whole point of splitting it. */
{
    const senderKeyMap = {};
    pickSenderKeyRecipients([{ jid: 'a@s.whatsapp.net', device: 0 }], senderKeyMap);
    assert.deepEqual(senderKeyMap, {}, 'nothing is recorded until the key actually goes out');
}

{
    assert.deepEqual([...deliveredSenderKeyJids([node('a@s.whatsapp.net'), { attrs: {} }, null])], ['a@s.whatsapp.net']);
    assert.deepEqual([...deliveredSenderKeyJids(undefined)], []);
}

/**
 * The bug this file exists for: createParticipantNodes swallows a per-recipient
 * encryption failure and returns fewer nodes than it was given. Marking every
 * recipient regardless meant that device was recorded as holding a sender key
 * it never received, and since the map is stored per group, it could never
 * decrypt anything the bot said in that one group again.
 */
{
    const senderKeyMap = {};
    const recipients = ['a@s.whatsapp.net', 'b@s.whatsapp.net', 'c@s.whatsapp.net'];
    const nodes = [node('a@s.whatsapp.net'), node('c@s.whatsapp.net')];

    const { marked, skipped } = commitSenderKeyDelivery(senderKeyMap, recipients, nodes);
    assert.deepEqual(marked, ['a@s.whatsapp.net', 'c@s.whatsapp.net']);
    assert.deepEqual(skipped, ['b@s.whatsapp.net']);
    assert.deepEqual(senderKeyMap, { 'a@s.whatsapp.net': true, 'c@s.whatsapp.net': true });
    assert.equal('b@s.whatsapp.net' in senderKeyMap, false, 'the failed device is not recorded');

    const again = pickSenderKeyRecipients(
        recipients.map(jid => ({ jid, device: 0 })),
        senderKeyMap
    );
    assert.deepEqual(again, ['b@s.whatsapp.net'], 'so the next send retries exactly that device');
}

/** A device that was marked before and fails now loses its mark rather than keeping a stale one. */
{
    const senderKeyMap = { 'a@s.whatsapp.net': true, 'b@s.whatsapp.net': true };
    const { skipped } = commitSenderKeyDelivery(senderKeyMap, ['a@s.whatsapp.net', 'b@s.whatsapp.net'], [node('a@s.whatsapp.net')]);
    assert.deepEqual(skipped, ['b@s.whatsapp.net']);
    assert.deepEqual(senderKeyMap, { 'a@s.whatsapp.net': true });
}

/** Everything succeeding is the ordinary path and marks the lot. */
{
    const senderKeyMap = {};
    const recipients = ['a@s.whatsapp.net', 'b@s.whatsapp.net'];
    const { marked, skipped } = commitSenderKeyDelivery(senderKeyMap, recipients, recipients.map(node));
    assert.deepEqual(marked, recipients);
    assert.deepEqual(skipped, []);
    assert.deepEqual(senderKeyMap, { 'a@s.whatsapp.net': true, 'b@s.whatsapp.net': true });
}

/** Nodes for jids nobody asked about never leak into the map. */
{
    const senderKeyMap = {};
    commitSenderKeyDelivery(senderKeyMap, ['a@s.whatsapp.net'], [node('a@s.whatsapp.net'), node('z@s.whatsapp.net')]);
    assert.deepEqual(senderKeyMap, { 'a@s.whatsapp.net': true });
}

/**
 * resetGroupSenderKey reports what it forgot, because a bare undefined leaves
 * you unable to tell "cleared four devices" from "there was nothing stored, so
 * your problem is somewhere else".
 */
{
    const stored = { 'g@g.us': { 'a@s.whatsapp.net': true, 'b@s.whatsapp.net': true } };
    assert.deepEqual(senderKeyResetSummary(stored, 'g@g.us'), {
        jid: 'g@g.us',
        cleared: 2,
        devices: ['a@s.whatsapp.net', 'b@s.whatsapp.net']
    });
    assert.deepEqual(senderKeyResetSummary({}, 'g@g.us'), { jid: 'g@g.us', cleared: 0, devices: [] });
    assert.deepEqual(senderKeyResetSummary(undefined, 'g@g.us'), { jid: 'g@g.us', cleared: 0, devices: [] });
    assert.deepEqual(senderKeyResetSummary({ 'g@g.us': null }, 'g@g.us'), { jid: 'g@g.us', cleared: 0, devices: [] });
}

console.log('sender key memory tests passed');
