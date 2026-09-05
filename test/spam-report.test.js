import assert from 'node:assert/strict';
import { buildSpamListNode } from '../lib/Socket/chats.js';
import { SPAM_FLOWS } from '../lib/Types/index.js';

/**
 * WASmaxOutSpamBaseReportMixin builds smax("spam_list", { spam_flow }) and the
 * per-entity request builders add jid: WAWap.JID for a contact and
 * WAWap.GROUP_JID for a group, so the tag and both attribute names are fixed.
 */
const contact = buildSpamListNode('62811111111@s.whatsapp.net');
assert.equal(contact.tag, 'spam_list');
assert.equal(contact.attrs.jid, '62811111111@s.whatsapp.net');
assert.equal(contact.attrs.spam_flow, SPAM_FLOWS.OverflowMenuReport);

/** A device suffix never rides along on the reported jid. */
assert.equal(buildSpamListNode('62811111111:12@s.whatsapp.net').attrs.jid, '62811111111@s.whatsapp.net');

/** WASmaxOutSpamGroupReportRequest keeps the group jid whole and carries source. */
const group = buildSpamListNode('12345-67890@g.us', {
    flow: SPAM_FLOWS.GroupInfoReport,
    source: '62811111111:3@s.whatsapp.net'
});
assert.equal(group.attrs.jid, '12345-67890@g.us');
assert.equal(group.attrs.spam_flow, 'group_info_report');
assert.equal(group.attrs.source, '62811111111@s.whatsapp.net');

/**
 * subject comes from WASmaxOutSpamEntitySubjectMixin and is_known_chat from
 * WASmaxOutSpamIsKnownChatMixin; both are optional and neither may appear as an
 * empty attribute when the caller said nothing.
 */
assert.equal('subject' in contact.attrs, false);
assert.equal('is_known_chat' in contact.attrs, false);
assert.equal('source' in contact.attrs, false);
assert.equal(buildSpamListNode('62811111111@s.whatsapp.net', { subject: 'Toko' }).attrs.subject, 'Toko');
assert.equal(buildSpamListNode('62811111111@s.whatsapp.net', { isKnownChat: true }).attrs.is_known_chat, 'true');
assert.equal(buildSpamListNode('62811111111@s.whatsapp.net', { isKnownChat: false }).attrs.is_known_chat, 'false');

/** Every attribute goes on the wire as a string, never a boolean. */
for (const value of Object.values(buildSpamListNode('62811111111@s.whatsapp.net', { isKnownChat: true, subject: 'Toko' }).attrs)) {
    assert.equal(typeof value, 'string');
}

/** A missing or malformed jid is refused here, not answered by the server. */
for (const bad of [undefined, null, '', 'bukan-jid', 62811111111, {}]) {
    assert.throws(() => buildSpamListNode(bad), err => {
        assert.equal(err.output.statusCode, 400);
        return true;
    }, 'rejects ' + JSON.stringify(bad));
}

/** An empty flow would send spam_flow="" and the report would mean nothing. */
assert.throws(() => buildSpamListNode('62811111111@s.whatsapp.net', { flow: '' }), err => {
    assert.match(err.message, /SPAM_FLOWS/);
    return true;
});

/** The flows are the ones WAWebSpamConstants freezes, spelled the same way. */
assert.equal(SPAM_FLOWS.Block, 'block_dialog');
assert.equal(SPAM_FLOWS.OneToOneChatSpamBannerReport, '1_1_spam_banner_report');
assert.equal(SPAM_FLOWS.NewsletterInfoReport, 'newsletter_info_report');
assert.throws(() => { SPAM_FLOWS.Block = 'x'; }, TypeError, 'the table is frozen');

console.log('spam report tests passed');
