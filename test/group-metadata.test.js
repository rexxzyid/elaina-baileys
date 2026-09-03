import assert from 'node:assert/strict';
import { extractGroupMetadata } from '../lib/Socket/groups.js';

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
