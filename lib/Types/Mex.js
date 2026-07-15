"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryIds = exports.XWAPathsMex = void 0;
var XWAPathsMex;
(function (XWAPathsMex) {
    XWAPathsMex["xwa2_newsletter_create"] = "xwa2_newsletter_create";
    XWAPathsMex["xwa2_newsletter_subscribers"] = "xwa2_newsletter_subscribers";
    XWAPathsMex["xwa2_newsletter_view"] = "xwa2_newsletter_view";
    XWAPathsMex["xwa2_newsletter_metadata"] = "xwa2_newsletter";
    XWAPathsMex["xwa2_newsletter_admin_count"] = "xwa2_newsletter_admin";
    XWAPathsMex["xwa2_newsletter_mute_v2"] = "xwa2_newsletter_mute_v2";
    XWAPathsMex["xwa2_newsletter_unmute_v2"] = "xwa2_newsletter_unmute_v2";
    XWAPathsMex["xwa2_newsletter_follow"] = "xwa2_newsletter_follow";
    XWAPathsMex["xwa2_newsletter_unfollow"] = "xwa2_newsletter_unfollow";
    XWAPathsMex["xwa2_newsletter_join_v2"] = "xwa2_newsletter_join_v2";
    XWAPathsMex["xwa2_newsletter_leave_v2"] = "xwa2_newsletter_leave_v2";
    XWAPathsMex["xwa2_newsletter_change_owner"] = "xwa2_newsletter_change_owner";
    XWAPathsMex["xwa2_newsletter_demote"] = "xwa2_newsletter_demote";
    XWAPathsMex["xwa2_newsletter_delete_v2"] = "xwa2_newsletter_delete_v2";
    XWAPathsMex["xwa2_newsletter_update"] = "xwa2_newsletter_update";
    XWAPathsMex["xwa2_fetch_account_reachout_timelock"] = "xwa2_fetch_account_reachout_timelock";
    XWAPathsMex["xwa2_message_capping_info"] = "xwa2_message_capping_info";
})(XWAPathsMex || (exports.XWAPathsMex = XWAPathsMex = {}));
/**
 * query_id MEX dari upstream baileys 7.x (WhatsApp Web).
 * CATATAN: beberapa berbeda dgn QueryIds lama di newsletter.js (kemungkinan sudah usang).
 * Yang SAMA dgn fork: ADMIN_COUNT, CHANGE_OWNER, DEMOTE.
 */
var QueryIds;
(function (QueryIds) {
    QueryIds["CREATE"] = "8823471724422422";
    QueryIds["UPDATE_METADATA"] = "24250201037901610";
    QueryIds["METADATA"] = "6563316087068696";
    QueryIds["SUBSCRIBERS"] = "9783111038412085";
    QueryIds["FOLLOW"] = "24404358912487870";
    QueryIds["UNFOLLOW"] = "9767147403369991";
    QueryIds["MUTE"] = "29766401636284406";
    QueryIds["UNMUTE"] = "9864994326891137";
    QueryIds["ADMIN_COUNT"] = "7130823597031706";
    QueryIds["CHANGE_OWNER"] = "7341777602580933";
    QueryIds["DEMOTE"] = "6551828931592903";
    QueryIds["DELETE"] = "30062808666639665";
    QueryIds["REACHOUT_TIMELOCK"] = "23983697327930364";
    QueryIds["MESSAGE_CAPPING_INFO"] = "24503548349331633";
})(QueryIds || (exports.QueryIds = QueryIds = {}));
