import assert from 'node:assert/strict';
import { toNewsletterUserSettingInput } from '../lib/Socket/newsletter.js';
import { QueryIds, XWAPaths } from '../lib/Types/index.js';

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

console.log('newsletter mute tests passed');
