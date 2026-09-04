import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { parseNewsletterStatusAck, waitForNewsletterStatusServerId } from '../lib/Utils/newsletter-status.js';

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
