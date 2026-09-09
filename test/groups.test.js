import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractGroupMetadata } from '../lib/Socket/groups.js';
import { describeUnusableGroupMetadata, isUsableGroupMetadata } from '../lib/Utils/group-metadata-cache.js';
import { toNewsletterUserSettingInput, toNewsletterServerIds } from '../lib/Socket/newsletter.js';
import { QueryIds, XWAPaths } from '../lib/Types/index.js';
import { EventEmitter } from 'node:events';
import { parseNewsletterStatusAck, waitForNewsletterStatusServerId } from '../lib/Utils/newsletter-status.js';

test('group-metadata', async () => {
    const node = (addressingMode, participants) => ({
        tag: 'iq',
        attrs: {},
        content: [{
            tag: 'group',
            attrs: {
                id: '120363412365836486@g.us',
                addressing_mode: addressingMode,
                subject: 'Warkop & Coding',
                s_o: '226663140991110@lid',
                s_o_pn: '31657851239@s.whatsapp.net',
                s_t: '1786687183',
                creation: '1786687183',
                creator: '226663140991110@lid',
                creator_pn: '31657851239@s.whatsapp.net',
                size: String(participants.length)
            },
            content: participants.map(attrs => ({ tag: 'participant', attrs, content: undefined }))
        }]
    });

    const lidGroup = extractGroupMetadata(node('lid', [
        { jid: '165159209271535@lid', phone_number: '6285133801810@s.whatsapp.net' },
        { jid: '234256710246613@lid', participant_username: 'hanntylor' },
        { jid: '226663140991110@lid', phone_number: '31657851239@s.whatsapp.net', type: 'superadmin' }
    ]));

    assert.equal(lidGroup.addressingMode, 'lid');

    const [withPn, withUsername, owner] = lidGroup.participants;

    assert.equal(withPn.id, '165159209271535@lid');
    assert.equal(withPn.lid, '165159209271535@lid');
    assert.equal(withPn.phoneNumber, '6285133801810@s.whatsapp.net');
    assert.equal(withPn.admin, null);

    assert.equal(withUsername.lid, '234256710246613@lid');
    assert.equal(withUsername.phoneNumber, undefined);
    assert.equal(withUsername.username, 'hanntylor');

    assert.equal(owner.admin, 'superadmin');

    const pnGroup = extractGroupMetadata(node('pn', [
        { jid: '6285133801810@s.whatsapp.net', lid: '165159209271535@lid' },
        { jid: '6289676358643@s.whatsapp.net' }
    ]));

    assert.equal(pnGroup.addressingMode, 'pn');

    const [pnWithLid, pnOnly] = pnGroup.participants;

    assert.equal(pnWithLid.id, '6285133801810@s.whatsapp.net');
    assert.equal(pnWithLid.phoneNumber, '6285133801810@s.whatsapp.net');
    assert.equal(pnWithLid.lid, '165159209271535@lid');

    assert.equal(pnOnly.phoneNumber, '6289676358643@s.whatsapp.net');
    assert.equal(pnOnly.lid, undefined);

    const suffixed = extractGroupMetadata({
        tag: 'iq',
        attrs: {},
        content: [{
            tag: 'group',
            attrs: {
                id: '120363412365836486@g.us',
                addressing_mode: 'lid',
                s_o: '226663140991110:12@lid',
                s_o_pn: '31657851239:12@s.whatsapp.net',
                s_t: '1786687183',
                creation: '1786687183',
                creator: '226663140991110:12@lid'
            },
            content: []
        }]
    });

    assert.equal(suffixed.subjectOwner, '226663140991110@lid');
    assert.equal(suffixed.subjectOwnerPn, '31657851239@s.whatsapp.net');
    assert.equal(suffixed.owner, '226663140991110@lid');
});

test('group-metadata-cache', async () => {
    const participants = [{ id: '628000@s.whatsapp.net' }];

    /**
     * The group send reads addressingMode off the metadata and, when it is absent,
     * used to fall back to "lid" — a guess. Guessing wrong tells the server one
     * addressing mode while the sender key was made under the other identity, and
     * the group stops being able to read anything the bot says. A cache that omits
     * the field must send us back to the server instead.
     */
    {
        assert.equal(isUsableGroupMetadata({ participants, addressingMode: 'lid' }), true);
        assert.equal(isUsableGroupMetadata({ participants, addressingMode: 'pn' }), true);

        assert.equal(isUsableGroupMetadata({ participants }), false, 'participants alone are not enough');
        assert.equal(describeUnusableGroupMetadata({ participants }), 'no addressingMode');
    }

    /** Anything else the cache might hand back is refused rather than half-trusted. */
    {
        const cases = [
            [undefined, 'nothing cached'],
            [null, 'nothing cached'],
            ['lid', 'nothing cached'],
            [{}, 'no participants'],
            [{ participants: 'x', addressingMode: 'lid' }, 'no participants'],
            [{ participants, addressingMode: null }, 'no addressingMode'],
            [{ participants, addressingMode: 'LID' }, 'addressingMode "LID" is not pn or lid'],
            [{ participants, addressingMode: '' }, 'addressingMode "" is not pn or lid']
        ];
        for (const [metadata, reason] of cases) {
            assert.equal(isUsableGroupMetadata(metadata), false, JSON.stringify(metadata));
            assert.equal(describeUnusableGroupMetadata(metadata), reason, JSON.stringify(metadata));
        }
    }

    /** An empty group is still usable metadata — empty is a fact, missing is not. */
    {
        assert.equal(isUsableGroupMetadata({ participants: [], addressingMode: 'pn' }), true);
    }
});

test('newsletter-mute', async () => {
    /**
     * WAWebNewsletterUpdateUserSettingsAction is the only thing behind the mute
     * toggle now: every caller passes NewsletterUserSetting.AdminActivity, and
     * WAWebNewsletterUpdateUserSettingJob turns MUTED_STATE into
     * { type: "MUTE_ADMIN_ACTIVITY", value: "ON" } before
     * WAWebMexUpdateNewsletterUserSetting wraps the whole thing in `input`.
     */
    const muted = toNewsletterUserSettingInput('120363000000000000@newsletter', 'ADMIN_NOTIFICATIONS', true);
    assert.deepEqual(muted, {
        input: {
            newsletter_id: '120363000000000000@newsletter',
            type: 'MUTE_ADMIN_ACTIVITY',
            value: 'ON'
        }
    });

    const unmuted = toNewsletterUserSettingInput('120363000000000000@newsletter', 'ADMIN_NOTIFICATIONS', false);
    assert.equal(unmuted.input.value, 'OFF');

    /** The follower half of the same mutation keeps its own type. */
    assert.equal(toNewsletterUserSettingInput('120363000000000000@newsletter', 'FOLLOWER_NOTIFICATIONS', true).input.type, 'MUTE_FOLLOWER_ACTIVITY');

    /** ON and OFF are strings on the wire, not booleans. */
    assert.equal(typeof muted.input.value, 'string');

    /** A group or contact jid here would mute nothing and report success. */
    for (const bad of ['12345-67890@g.us', '62811111111@s.whatsapp.net', '', null, undefined, 120363]) {
        assert.throws(() => toNewsletterUserSettingInput(bad, 'ADMIN_NOTIFICATIONS', true), TypeError, 'rejects ' + JSON.stringify(bad));
    }

    /**
     * The dedicated mute operations are gone from both WhatsApp Web and the Android
     * client, so nothing may reach for them again: the mutation above is the whole
     * path. Their ids were MUTE 29766401636284406 and UNMUTE 9864994326891137.
     */
    assert.equal(QueryIds.MUTE, undefined);
    assert.equal(QueryIds.UNMUTE, undefined);
    assert.equal(XWAPaths.xwa2_newsletter_mute_v2, undefined);
    assert.equal(XWAPaths.xwa2_newsletter_unmute_v2, undefined);

    /** The id the mutation does ride on is the one the bundle ships. */
    assert.equal(QueryIds.UPDATE_USER_SETTING, '31938993655691868');
    assert.equal(XWAPaths.xwa2_newsletter_update_user_setting, 'xwa2_newsletter_update_user_setting');
});

test('newsletter-pin', async () => {
    /**
     * WAWebMexNewsletterPinMessagesJob sends { newsletter_id, input: { message_ids } }
     * and WAWebNewsletterPinMessageAction hands it [String(id)], so the ids go out as
     * decimal strings however the caller spelled them.
     */
    assert.deepEqual(toNewsletterServerIds(607), ['607']);
    assert.deepEqual(toNewsletterServerIds([607]), ['607']);
    assert.deepEqual(toNewsletterServerIds('607'), ['607']);
    assert.deepEqual(toNewsletterServerIds([607, '608']), ['607', '608']);

    /** The server accepts 99..2147476647; both ends are inside the range. */
    assert.deepEqual(toNewsletterServerIds(99), ['99']);
    assert.deepEqual(toNewsletterServerIds(2147476647), ['2147476647']);

    /**
     * Anything else comes back from the server as an opaque "Bad Request" with no
     * hint of which value it disliked, so it is refused here where the message can
     * say what a server id is and where to get one.
     */
    for (const bad of [0, 98, -1, 2147476648, 'abc', null, undefined, NaN, 1.5, {}]) {
        assert.throws(() => toNewsletterServerIds(bad), TypeError, 'rejects ' + JSON.stringify(bad));
    }
    assert.throws(() => toNewsletterServerIds([]), TypeError, 'rejects an empty list');
    assert.throws(() => toNewsletterServerIds([607, 0]), TypeError, 'rejects a bad id inside a good list');

    assert.throws(() => toNewsletterServerIds(5), err => {
        assert.match(err.message, /newsletterFetchMessages/, 'names where to get one');
        assert.match(err.message, /99\.\.2147476647/, 'names the range');
        assert.match(err.message, /^5 is not/, 'quotes the value it refused');
        return true;
    });

    /** A float is not silently truncated into a different message. */
    assert.throws(() => toNewsletterServerIds(607.9), TypeError);
});

test('newsletter-status-server-id', async () => {
    const JID = '120363410154606795@newsletter';
    const ID = '3EB0695B21DA9E6D481DFB';

    /** The ack the server really sends: from, class, id, t. No server_id anywhere. */
    const realAck = {
        tag: 'ack',
        attrs: { from: JID, class: 'status', id: ID, t: '1788496225' },
        content: undefined
    };

    const ack = parseNewsletterStatusAck(realAck, { jid: JID, messageId: ID });
    assert.equal(ack.class, 'status');
    assert.equal(ack.id, ID);
    assert.equal(ack.t, 1788496225);
    assert.equal(ack.serverId, undefined, 'the ack has no server id to give');
    assert.equal(ack.error, undefined);

    const sockWith = () => ({ ws: new EventEmitter() });

    /** The id arrives on the <status> echo, which is what the client reads it from. */
    {
        const sock = sockWith();
        const pending = waitForNewsletterStatusServerId(sock, { jid: JID, messageId: ID, timeoutMs: 2000 });
        sock.ws.emit('CB:status', { tag: 'status', attrs: { from: JID, id: ID, server_id: '175', t: '1788496225', is_sender: 'true' } });
        const got = await pending;
        assert.equal(got.serverId, 175);
        assert.equal(got.node.attrs.is_sender, 'true');
        assert.equal(sock.ws.listenerCount('CB:status'), 0, 'the listener is removed once resolved');
    }

    /** Another channel's status must not be mistaken for ours. */
    {
        const sock = sockWith();
        const pending = waitForNewsletterStatusServerId(sock, { jid: JID, messageId: ID, timeoutMs: 400 });
        sock.ws.emit('CB:status', { tag: 'status', attrs: { from: '120999@newsletter', id: ID, server_id: '900' } });
        assert.equal(await pending, undefined, 'a foreign jid is ignored');
    }

    /** Nor another status of ours published a moment earlier. */
    {
        const sock = sockWith();
        const pending = waitForNewsletterStatusServerId(sock, { jid: JID, messageId: ID, timeoutMs: 400 });
        sock.ws.emit('CB:status', { tag: 'status', attrs: { from: JID, id: 'OTHER', server_id: '901' } });
        assert.equal(await pending, undefined, 'a different message id is ignored');
    }

    /** A silent server must not hang the send: the wait times out and the listener goes. */
    {
        const sock = sockWith();
        const got = await waitForNewsletterStatusServerId(sock, { jid: JID, messageId: ID, timeoutMs: 250 });
        assert.equal(got, undefined);
        assert.equal(sock.ws.listenerCount('CB:status'), 0, 'no listener survives the timeout');
    }

    /** An echo with no server_id is not an answer, so the wait keeps going. */
    {
        const sock = sockWith();
        const pending = waitForNewsletterStatusServerId(sock, { jid: JID, messageId: ID, timeoutMs: 600 });
        sock.ws.emit('CB:status', { tag: 'status', attrs: { from: JID, id: ID, t: '1788496225' } });
        sock.ws.emit('CB:status', { tag: 'status', attrs: { from: JID, id: ID, server_id: '176' } });
        assert.equal((await pending).serverId, 176);
    }
});
