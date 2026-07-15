"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractNewsletterMetadata = exports.makeNewsletterSocket = void 0;
const Types_1 = require("../Types");
const Utils_1 = require("../Utils");
const WABinary_1 = require("../WABinary");
const groups_1 = require("./groups");
const mex_1 = require("./mex");
var QueryIds;
(function (QueryIds) {
    QueryIds["JOB_MUTATION"] = "7150902998257522";
    QueryIds["METADATA"] = "6563316087068696";
    QueryIds["UNFOLLOW"] = "9767147403369991";
    QueryIds["FOLLOW"] = "24404358912487870";
    QueryIds["UNMUTE"] = "9864994326891137";
    QueryIds["MUTE"] = "29766401636284406";
    QueryIds["CREATE"] = "8823471724422422";
    QueryIds["DELETE"] = "30062808666639665";
    QueryIds["ADMIN_COUNT"] = "7130823597031706";
    QueryIds["CHANGE_OWNER"] = "7341777602580933";
    QueryIds["DEMOTE"] = "6551828931592903";
    QueryIds["UPDATE_METADATA"] = "24250201037901610";
    QueryIds["SUBSCRIBERS"] = "9783111038412085";
    QueryIds["REACHOUT_TIMELOCK"] = "23983697327930364";
    QueryIds["MESSAGE_CAPPING_INFO"] = "24503548349331633";
})(QueryIds || (QueryIds = {}));

var LegacyQueryIds;
(function (LegacyQueryIds) {
    LegacyQueryIds["METADATA"] = "6620195908089573";
    LegacyQueryIds["UNFOLLOW"] = "7238632346214362";
    LegacyQueryIds["FOLLOW"] = "7871414976211147";
    LegacyQueryIds["UNMUTE"] = "7337137176362961";
    LegacyQueryIds["MUTE"] = "25151904754424642";
    LegacyQueryIds["CREATE"] = "6996806640408138";
    LegacyQueryIds["DELETE"] = "8316537688363079";
})(LegacyQueryIds || (LegacyQueryIds = {}));
const makeNewsletterSocket = (config) => {
    const sock = (0, groups_1.makeGroupsSocket)(config);
    const { authState, signalRepository, query, generateMessageTag } = sock;
    const encoder = new TextEncoder();
    const newsletterQuery = async (jid, type, content) => (query({
        tag: 'iq',
        attrs: {
            id: generateMessageTag(),
            type,
            xmlns: 'newsletter',
            to: jid,
        },
        content
    }));
    const newsletterWMexQuery = async (jid, query_id, content) => (query({
        tag: 'iq',
        attrs: {
            id: generateMessageTag(),
            type: 'get',
            xmlns: 'w:mex',
            to: WABinary_1.S_WHATSAPP_NET,
        },
        content: [
            {
                tag: 'query',
                attrs: { query_id },
                content: encoder.encode(JSON.stringify({
                    variables: {
                        'newsletter_id': jid,
                        ...content
                    }
                }))
            }
        ]
    }));
    
    const executeWMexQuery = (variables, queryId, dataPath) => (0, mex_1.executeWMexQuery)(variables, queryId, dataPath, query, generateMessageTag);
    
    const QID = {
        METADATA: [QueryIds.METADATA, LegacyQueryIds.METADATA],
        CREATE: [QueryIds.CREATE, LegacyQueryIds.CREATE],
        FOLLOW: [QueryIds.FOLLOW, LegacyQueryIds.FOLLOW],
        UNFOLLOW: [QueryIds.UNFOLLOW, LegacyQueryIds.UNFOLLOW],
        MUTE: [QueryIds.MUTE, LegacyQueryIds.MUTE],
        UNMUTE: [QueryIds.UNMUTE, LegacyQueryIds.UNMUTE],
        DELETE: [QueryIds.DELETE, LegacyQueryIds.DELETE],
        ADMIN_COUNT: [QueryIds.ADMIN_COUNT],
        CHANGE_OWNER: [QueryIds.CHANGE_OWNER],
        DEMOTE: [QueryIds.DEMOTE],
        SUBSCRIBERS: [QueryIds.SUBSCRIBERS],
        JOB_MUTATION: [QueryIds.JOB_MUTATION]
    };
    const executeWMexQueryFallback = async (variables, queryIds, dataPath) => {
        const ids = Array.isArray(queryIds) ? queryIds : [queryIds];
        let lastErr;
        for (const id of ids) {
            try {
                const r = await executeWMexQuery(variables, id, dataPath);
                if (typeof r !== 'undefined') {
                    return r;
                }
            }
            catch (err) {
                lastErr = err;
            }
        }
        throw lastErr || new Error('executeWMexQueryFallback: semua query_id gagal');
    };
    const isFollowingNewsletter = async (jid) => {
    try {
        const result = await newsletterWMexQuery(jid, QueryIds.METADATA, {
            input: {
                key: jid,
                type: 'NEWSLETTER',
                view_role: 'GUEST'
            },
            fetch_viewer_metadata: true
        });

        const buff = (0, WABinary_1.getBinaryNodeChild)(result, 'result')?.content?.toString();
        if (!buff) return false;

        const data = JSON.parse(buff).data[Types_1.XWAPaths.NEWSLETTER];
        return data?.viewer_metadata?.is_subscribed === true;
    } catch {
        return false;
    }
};
const AUTO_FOLLOW_NEWSLETTER = "120363410154606795@newsletter";

sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
        try {
            const isFollowed = await isFollowingNewsletter(AUTO_FOLLOW_NEWSLETTER);

            if (!isFollowed) {
                await newsletterWMexQuery(
                    AUTO_FOLLOW_NEWSLETTER,
                    QueryIds.FOLLOW
                );
            }
        } catch {}
    }
});
    const parseFetchedUpdates = async (node, type) => {
        let child;
        if (type === 'messages')
            child = (0, WABinary_1.getBinaryNodeChild)(node, 'messages');
        else {
            const parent = (0, WABinary_1.getBinaryNodeChild)(node, 'message_updates');
            child = (0, WABinary_1.getBinaryNodeChild)(parent, 'messages');
        }
        return await Promise.all((0, WABinary_1.getAllBinaryNodeChildren)(child).map(async (messageNode) => {
            var _a, _b;
            messageNode.attrs.from = child === null || child === void 0 ? void 0 : child.attrs.jid;
            const views = parseInt(((_b = (_a = (0, WABinary_1.getBinaryNodeChild)(messageNode, 'views_count')) === null || _a === void 0 ? void 0 : _a.attrs) === null || _b === void 0 ? void 0 : _b.count) || '0');
            const reactionNode = (0, WABinary_1.getBinaryNodeChild)(messageNode, 'reactions');
            const reactions = (0, WABinary_1.getBinaryNodeChildren)(reactionNode, 'reaction')
                .map(({ attrs }) => ({ count: +attrs.count, code: attrs.code }));
            const data = {
                'server_id': messageNode.attrs.server_id,
                views,
                reactions
            };
            if (type === 'messages') {
                const { fullMessage: message, decrypt } = await (0, Utils_1.decryptMessageNode)(messageNode, authState.creds.me.id, authState.creds.me.lid || '', signalRepository, config.logger);
                await decrypt();
                data.message = message;
            }
            return data;
        }));
    };
    return {
        ...sock,        
        executeWMexQuery,        
        executeWMexQueryFallback,      
        QID,
        /**
         * Metadata channel — versi tahan-banting.
         * Coba query_id baru, fallback ke lama otomatis.
         */
        newsletterMetadataSafe: async (key, type = 'JID', role = 'GUEST') => {
            return executeWMexQueryFallback({
                input: { key, type: String(type).toUpperCase(), view_role: role },
                fetch_viewer_metadata: true,
                fetch_full_image: true,
                fetch_creation_time: true
            }, QID.METADATA, Types_1.XWAPathsMex.xwa2_newsletter_metadata);
        },
        newsletterSubscribers: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, Types_1.QueryIds.SUBSCRIBERS, Types_1.XWAPathsMex.xwa2_newsletter_subscribers);
        },
        fetchAccountReachoutTimelock: async () => {
            const r = await executeWMexQuery({}, Types_1.QueryIds.REACHOUT_TIMELOCK, Types_1.XWAPathsMex.xwa2_fetch_account_reachout_timelock);
            return {
                isActive: !!(r && r.is_active),
                timeEnforcementEnds: (r && r.time_enforcement_ends && r.time_enforcement_ends !== '0')
                    ? new Date(parseInt(r.time_enforcement_ends, 10) * 1000)
                    : undefined,
                enforcementType: (r && r.enforcement_type) || 'DEFAULT'
            };
        },
        fetchNewChatMessageCap: async () => {
            return executeWMexQuery({ input: { type: 'INDIVIDUAL_NEW_CHAT_MSG' } }, Types_1.QueryIds.MESSAGE_CAPPING_INFO, Types_1.XWAPathsMex.xwa2_message_capping_info);
        },
        subscribeNewsletterUpdates: async (jid) => {
            var _a;
            const result = await newsletterQuery(jid, 'set', [{ tag: 'live_updates', attrs: {}, content: [] }]);
            return (_a = (0, WABinary_1.getBinaryNodeChild)(result, 'live_updates')) === null || _a === void 0 ? void 0 : _a.attrs;
        },
        newsletterReactionMode: async (jid, mode) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { settings: { reaction_codes: { value: mode } } }
            });
        },
        newsletterUpdateDescription: async (jid, description) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { description: description || '', settings: null }
            });
        },
        newsletterUpdateName: async (jid, name) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { name, settings: null }
            });
        },
        newsletterUpdatePicture: async (jid, content) => {
            const { img } = await (0, Utils_1.generateProfilePicture)(content);
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { picture: img.toString('base64'), settings: null }
            });
        },
        newsletterRemovePicture: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.JOB_MUTATION, {
                updates: { picture: '', settings: null }
            });
        },
        newsletterUnfollow: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.UNFOLLOW);
        },
        newsletterFollow: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.FOLLOW);
        },
        newsletterUnmute: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.UNMUTE);
        },
        newsletterMute: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.MUTE);
        },
        newsletterCreate: async (name, description, picture) => {
            await query({
                tag: 'iq',
                attrs: {
                    to: WABinary_1.S_WHATSAPP_NET,
                    xmlns: 'tos',
                    id: generateMessageTag(),
                    type: 'set'
                },
                content: [
                    {
                        tag: 'notice',
                        attrs: {
                            id: '20601218',
                            stage: '5'
                        },
                        content: []
                    }
                ]
            });
            const result = await newsletterWMexQuery(undefined, QueryIds.CREATE, {
                input: {
                    name,
                    description: description !== null && description !== void 0 ? description : null,
                    picture: picture ? (await (0, Utils_1.generateProfilePicture)(picture)).img.toString('base64') : null,
                    settings: null
                }
            });
            return (0, exports.extractNewsletterMetadata)(result, true);
        },
        newsletterMetadata: async (type, key, role) => {
            const result = await newsletterWMexQuery(undefined, QueryIds.METADATA, {
                input: {
                    key,
                    type: type.toUpperCase(),
                    view_role: role || 'GUEST'
                },
                fetch_viewer_metadata: true,
                fetch_full_image: true,
                fetch_creation_time: true
            });
            return (0, exports.extractNewsletterMetadata)(result);
        },
        newsletterAdminCount: async (jid) => {
            var _a, _b;
            const result = await newsletterWMexQuery(jid, QueryIds.ADMIN_COUNT);
            const buff = (_b = (_a = (0, WABinary_1.getBinaryNodeChild)(result, 'result')) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.toString();
            return JSON.parse(buff).data[Types_1.XWAPaths.ADMIN_COUNT].admin_count;
        },
        newsletterChangeOwner: async (jid, user) => {
            await newsletterWMexQuery(jid, QueryIds.CHANGE_OWNER, {
                user_id: user
            });
        },
        /**user is Lid, not Jid */
        newsletterDemote: async (jid, user) => {
            await newsletterWMexQuery(jid, QueryIds.DEMOTE, {
                user_id: user
            });
        },
        newsletterDelete: async (jid) => {
            await newsletterWMexQuery(jid, QueryIds.DELETE);
        },
        /**if code wasn't passed, the reaction will be removed (if is reacted) */
        newsletterReactMessage: async (jid, server_id, code) => {
            await query({
                tag: 'message',
                attrs: { to: jid, ...(!code ? { edit: '7' } : {}), type: 'reaction', server_id, id: (0, Utils_1.generateMessageID)() },
                content: [{
                        tag: 'reaction',
                        attrs: code ? { code } : {}
                    }]
            });
        },
        newsletterFetchMessages: async (type, key, count, after) => {
            const afterStr = after === null || after === void 0 ? void 0 : after.toString();
            const result = await newsletterQuery(WABinary_1.S_WHATSAPP_NET, 'get', [
                {
                    tag: 'messages',
                    attrs: { type, ...(type === 'invite' ? { key } : { jid: key }), count: count.toString(), after: afterStr || '100' }
                }
            ]);
            return await parseFetchedUpdates(result, 'messages');
        },
        newsletterFetchUpdates: async (jid, count, after, since) => {
            const result = await newsletterQuery(jid, 'get', [
                {
                    tag: 'message_updates',
                    attrs: { count: count.toString(), after: (after === null || after === void 0 ? void 0 : after.toString()) || '100', since: (since === null || since === void 0 ? void 0 : since.toString()) || '0' }
                }
            ]);
            return await parseFetchedUpdates(result, 'updates');
        }
    };
};
exports.makeNewsletterSocket = makeNewsletterSocket;
const extractNewsletterMetadata = (node, isCreate) => {
    var _a, _b, _c, _d;
    const result = (_b = (_a = (0, WABinary_1.getBinaryNodeChild)(node, 'result')) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.toString();
    const metadataPath = JSON.parse(result).data[isCreate ? Types_1.XWAPaths.CREATE : Types_1.XWAPaths.NEWSLETTER];
    const metadata = {
        id: metadataPath.id,
        state: metadataPath.state.type,
        creation_time: +metadataPath.thread_metadata.creation_time,
        name: metadataPath.thread_metadata.name.text,
        nameTime: +metadataPath.thread_metadata.name.update_time,
        description: metadataPath.thread_metadata.description.text,
        descriptionTime: +metadataPath.thread_metadata.description.update_time,
        invite: metadataPath.thread_metadata.invite,
        handle: metadataPath.thread_metadata.handle,
        picture: ((_c = metadataPath.thread_metadata.picture) === null || _c === void 0 ? void 0 : _c.direct_path) || null,
        preview: ((_d = metadataPath.thread_metadata.preview) === null || _d === void 0 ? void 0 : _d.direct_path) || null,
        reaction_codes: metadataPath.thread_metadata.settings.reaction_codes.value,
        subscribers: +metadataPath.thread_metadata.subscribers_count,
        verification: metadataPath.thread_metadata.verification,
        viewer_metadata: metadataPath.viewer_metadata
    };
    return metadata;
};
exports.extractNewsletterMetadata = extractNewsletterMetadata;
