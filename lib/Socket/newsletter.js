/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { createHash } from 'crypto';
import { proto } from '../../WAProto/index.js';
import { QueryIds, XWAPaths } from '../Types/index.js';
import { extractNewsletterMessageMeta } from '../Utils/decode-wa-message.js';
import { generateProfilePicture } from '../Utils/messages-media.js';
import { getBinaryNodeChild, getBinaryNodeChildren, S_WHATSAPP_NET } from '../WABinary/index.js';
import { makeGroupsSocket } from './groups.js';
import { executeWMexQuery as genericExecuteWMexQuery } from './mex.js';
const parseNewsletterCreateResponse = (response) => {
    const { id, thread_metadata: thread, viewer_metadata: viewer } = response;
    return {
        id: id,
        owner: undefined,
        name: thread.name.text,
        creation_time: parseInt(thread.creation_time, 10),
        description: thread.description.text,
        invite: thread.invite,
        subscribers: parseInt(thread.subscribers_count, 10),
        verification: thread.verification,
        picture: {
            id: thread.picture?.id,
            directPath: thread.picture?.direct_path
        },
        mute_state: viewer.mute
    };
};
const parseNewsletterMetadata = (result) => {
    if (typeof result !== 'object' || result === null) {
        return null;
    }
    if ('id' in result && typeof result.id === 'string') {
        return result;
    }
    if ('result' in result && typeof result.result === 'object' && result.result !== null && 'id' in result.result) {
        return result.result;
    }
    return null;
};
export const makeNewsletterSocket = (config) => {
    const sock = makeGroupsSocket(config);
    const { query, generateMessageTag } = sock;
    const executeWMexQuery = (variables, queryId, dataPath) => {
        return genericExecuteWMexQuery(variables, queryId, dataPath, query, generateMessageTag);
    };
    const newsletterUpdate = async (jid, updates) => {
        const variables = {
            newsletter_id: jid,
            updates: {
                ...updates,
                settings: null
            }
        };
        return executeWMexQuery(variables, QueryIds.UPDATE_METADATA, 'xwa2_newsletter_update');
    };
    return {
        ...sock,
        executeWMexQuery,
        newsletterCreate: async (name, description) => {
            const variables = {
                input: {
                    name,
                    description: description ?? null
                }
            };
            const rawResponse = await executeWMexQuery(variables, QueryIds.CREATE, XWAPaths.xwa2_newsletter_create);
            return parseNewsletterCreateResponse(rawResponse);
        },
        newsletterUpdate,
        newsletterSubscribers: async (jid, options = {}) => {
            const response = await executeWMexQuery({
                input: {
                    newsletter_id: jid,
                    count: options.count ?? 100
                }
            }, QueryIds.FOLLOWERS, XWAPaths.xwa2_newsletter_followers);
            return (response?.followers?.edges ?? []).map((edge) => ({
                id: edge?.node?.id,
                phoneNumber: edge?.node?.pn,
                displayName: edge?.node?.display_name,
                username: edge?.node?.username_info?.username,
                role: edge?.role,
                followTime: edge?.follow_time
            }));
        },

        newsletterSubscribed: async () => {
            return executeWMexQuery({}, QueryIds.SUBSCRIBED, XWAPaths.xwa2_newsletter_subscribed);
        },
        newsletterMetadata: async (type, key, options = {}) => {
            const variables = {
                fetch_creation_time: options.fetchCreationTime ?? true,
                fetch_full_image: options.fetchFullImage ?? true,
                fetch_viewer_metadata: options.fetchViewerMetadata ?? true,
                fetch_pinned_messages: options.fetchPinnedMessages ?? false,
                fetch_status_metadata: options.fetchStatusMetadata ?? false,
                fetch_wamo_sub: options.fetchWamoSub ?? false,
                input: {
                    key,
                    type: type.toUpperCase()
                }
            };
            const result = await executeWMexQuery(variables, QueryIds.METADATA, XWAPaths.xwa2_newsletter_metadata);
            return parseNewsletterMetadata(result);
        },
        newsletterFollow: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.FOLLOW, XWAPaths.xwa2_newsletter_join_v2);
        },
        newsletterUnfollow: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.UNFOLLOW, XWAPaths.xwa2_newsletter_leave_v2);
        },
        newsletterUpdateUserSetting: async (jid, type, value) => {
            const setting = type === 'ADMIN_NOTIFICATIONS' ? 'MUTE_ADMIN_ACTIVITY' : 'MUTE_FOLLOWER_ACTIVITY';
            const response = await executeWMexQuery({
                input: {
                    newsletter_id: jid,
                    type: setting,
                    value: value ? 'ON' : 'OFF'
                }
            }, QueryIds.UPDATE_USER_SETTING, XWAPaths.xwa2_newsletter_update_user_setting);
            return {
                id: response?.id ?? jid,
                state: response?.state?.type
            };
        },
        newsletterMute: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.MUTE, XWAPaths.xwa2_newsletter_mute_v2);
        },
        newsletterUnmute: (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.UNMUTE, XWAPaths.xwa2_newsletter_unmute_v2);
        },
        newsletterUpdateName: async (jid, name) => {
            return await newsletterUpdate(jid, { name });
        },
        newsletterUpdateDescription: async (jid, description) => {
            return await newsletterUpdate(jid, { description });
        },
        newsletterUpdatePicture: async (jid, content) => {
            const { img } = await generateProfilePicture(content);
            return await newsletterUpdate(jid, { picture: img.toString('base64') });
        },
        newsletterRemovePicture: async (jid) => {
            return await newsletterUpdate(jid, { picture: '' });
        },
        newsletterReactMessage: async (jid, serverId, reaction) => {
            await query({
                tag: 'message',
                attrs: {
                    to: jid,
                    ...(reaction ? {} : { edit: '7' }),
                    type: 'reaction',
                    server_id: serverId,
                    id: generateMessageTag()
                },
                content: [
                    {
                        tag: 'reaction',
                        attrs: reaction ? { code: reaction } : {}
                    }
                ]
            });
        },
        newsletterFetchMessages: async (type, key, count, after, before) => {

            const messagesAttrs = {
                count: count.toString(),
                type,
                [type === 'jid' ? 'jid' : 'key']: key
            };
            if (after) {
                messagesAttrs.after = after.toString();
            }
            if (before) {
                messagesAttrs.before = before.toString();
            }
            const result = await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'get',
                    xmlns: 'newsletter',
                    to: S_WHATSAPP_NET
                },
                content: [
                    {
                        tag: 'messages',
                        attrs: messagesAttrs
                    }
                ]
            });

            const messagesNode = getBinaryNodeChild(result, 'messages');
            if (!messagesNode) {
                return [];
            }

            const newsletterJid = messagesNode.attrs.jid || (type === 'jid' ? key : undefined);
            const messages = [];

            for (const child of getBinaryNodeChildren(messagesNode, 'message')) {
                const plaintextNode = getBinaryNodeChild(child, 'plaintext');
                if (!plaintextNode?.content) {
                    continue;
                }
                try {
                    const contentBuf = typeof plaintextNode.content === 'string'
                        ? Buffer.from(plaintextNode.content, 'binary')
                        : Buffer.from(plaintextNode.content);
                    const messageProto = proto.Message.decode(contentBuf).toJSON();
                    const fullMessage = proto.WebMessageInfo.fromObject({
                        key: {
                            remoteJid: newsletterJid,
                            id: child.attrs.id || child.attrs.server_id,
                            server_id: child.attrs.server_id,
                            fromMe: child.attrs.is_sender === 'true'
                        },
                        message: messageProto,
                        messageTimestamp: child.attrs.t ? +child.attrs.t : undefined
                    }).toJSON();
                    const meta = extractNewsletterMessageMeta(child);
                    if (meta) {
                        fullMessage.newsletterMeta = meta;
                        if (meta.adminProfile?.name) {
                            fullMessage.pushName = meta.adminProfile.name;
                        }
                    }
                    messages.push(fullMessage);
                }
                catch (error) {
                    logger.error({ error }, 'Failed to decode newsletter message');
                }
            }
            return messages;
        },
        subscribeNewsletterUpdates: async (jid) => {
            const result = await query({
                tag: 'iq',
                attrs: {
                    id: generateMessageTag(),
                    type: 'set',
                    xmlns: 'newsletter',
                    to: jid
                },
                content: [{ tag: 'live_updates', attrs: {}, content: [] }]
            });
            const liveUpdatesNode = getBinaryNodeChild(result, 'live_updates');
            const duration = liveUpdatesNode?.attrs?.duration;
            return duration ? { duration: duration } : null;
        },
        newsletterAdminCount: async (jid) => {
            const response = await executeWMexQuery({ newsletter_id: jid }, QueryIds.ADMIN_COUNT, XWAPaths.xwa2_newsletter_admin_count);
            return response.admin_count;
        },
        newsletterChangeOwner: async (jid, newOwnerJid) => {
            await executeWMexQuery({ newsletter_id: jid, user_id: newOwnerJid }, QueryIds.CHANGE_OWNER, XWAPaths.xwa2_newsletter_change_owner);
        },
        newsletterDemote: async (jid, userJid) => {
            await executeWMexQuery({ newsletter_id: jid, user_id: userJid }, QueryIds.DEMOTE, XWAPaths.xwa2_newsletter_demote);
        },
        newsletterDelete: async (jid) => {
            await executeWMexQuery({ newsletter_id: jid }, QueryIds.DELETE, XWAPaths.xwa2_newsletter_delete_v2);
        },
        newsletterAdminCapabilities: async (jid) => {
            const response = await executeWMexQuery({ newsletter_id: jid }, QueryIds.ADMIN_CAPABILITIES, XWAPaths.xwa2_newsletter_admin_capabilities);
            return response?.capabilities ?? [];
        },
        newsletterCanPostStatus: async (jid) => {
            const capabilities = await executeWMexQuery({ newsletter_id: jid }, QueryIds.ADMIN_CAPABILITIES, XWAPaths.xwa2_newsletter_admin_capabilities);
            const list = capabilities?.capabilities ?? [];
            return {
                canPost: list.includes('CHANNEL_STATUS_PRODUCER'),
                canPostMusic: list.includes('CHANNEL_STATUS_MUSIC'),
                capabilities: list
            };
        },
        newsletterAdminInfo: async (jid) => {
            const response = await executeWMexQuery({ newsletter_id: jid }, QueryIds.ADMIN_INFO, XWAPaths.xwa2_newsletter_admin_info);
            return {
                id: response?.id ?? jid,
                adminCount: response?.admin_count ?? 0,
                adminProfile: response?.admin_profile
                    ? {
                        id: response.admin_profile.id,
                        name: response.admin_profile.name,
                        picture: response.admin_profile.picture
                            ? {
                                id: response.admin_profile.picture.id,
                                directPath: response.admin_profile.picture.direct_path
                            }
                            : undefined
                    }
                    : undefined,
                adminProfilesEnabled: response?.admin_settings?.admin_profiles_enabled ?? false
            };
        },
        newsletterPollVoters: async (jid, serverId, options = {}) => {
            return executeWMexQuery({
                input: {
                    newsletter_id: jid,
                    server_id: String(serverId),
                    limit: options.limit ?? 100,
                    vote_hash: options.voteHash
                }
            }, QueryIds.POLL_VOTERS, XWAPaths.voter_list);
        },
        newsletterReactionSenders: async (jid, serverId) => {
            return executeWMexQuery({
                input: {
                    id: jid,
                    server_id: String(serverId)
                }
            }, QueryIds.REACTION_SENDER_LIST, XWAPaths.xwa2_newsletters_reaction_sender_list);
        },
        newsletterPinMessages: async (jid, serverIds) => {
            const messageIds = (Array.isArray(serverIds) ? serverIds : [serverIds]).map(id => String(id));
            return executeWMexQuery({ newsletter_id: jid, input: { message_ids: messageIds } }, QueryIds.PIN_MESSAGES, XWAPaths.xwa2_newsletter_pin_messages);
        },
        newsletterUnpinMessages: async (jid, serverIds) => {
            const messageIds = (Array.isArray(serverIds) ? serverIds : [serverIds]).map(id => String(id));
            return executeWMexQuery({ newsletter_id: jid, input: { message_ids: messageIds } }, QueryIds.UNPIN_MESSAGES, XWAPaths.xwa2_newsletter_unpin_messages);
        },
        newsletterLabelAiContent: async (jid, serverId, messageType = 'MESSAGE') => {
            return executeWMexQuery({
                newsletter_id: jid,
                server_id: String(serverId),
                message_type: messageType
            }, QueryIds.LABEL_AI_CONTENT, XWAPaths.xwa2_newsletter_label_ai_content);
        },
        newsletterLabelPaidPartnership: async (jid, serverId, messageType = 'MESSAGE') => {
            return executeWMexQuery({
                newsletter_id: jid,
                server_id: String(serverId),
                message_type: messageType
            }, QueryIds.PAID_PARTNERSHIP_LABEL, XWAPaths.xwa2_newsletter_label_paid_partnership);
        },
        newsletterCreateAdminInvite: async (jid, userJid) => {
            return executeWMexQuery({ newsletter_id: jid, user_id: userJid }, QueryIds.CREATE_ADMIN_INVITE, XWAPaths.xwa2_newsletter_admin_invite_create);
        },
        newsletterRevokeAdminInvite: async (jid, userJid) => {
            return executeWMexQuery({ newsletter_id: jid, user_id: userJid }, QueryIds.REVOKE_ADMIN_INVITE, XWAPaths.xwa2_newsletter_admin_invite_revoke);
        },
        newsletterAcceptAdminInvite: async (jid) => {
            return executeWMexQuery({ newsletter_id: jid }, QueryIds.ACCEPT_ADMIN_INVITE, XWAPaths.xwa2_newsletter_admin_invite_accept);
        },
        newsletterDirectoryList: async (options = {}) => {
            return executeWMexQuery({
                fetch_status_metadata: options.fetchStatusMetadata ?? false,
                input: {
                    view: options.view ?? 'RECOMMENDED',
                    filters: {
                        country_codes: options.countryCodes ?? [],
                        categories: options.categories ?? []
                    },
                    limit: options.limit ?? 20,
                    start_cursor: options.cursorToken
                }
            }, QueryIds.DIRECTORY_LIST, XWAPaths.xwa2_newsletters_directory_list);
        },
        newsletterDirectorySearch: async (searchText, options = {}) => {
            return executeWMexQuery({
                fetch_status_metadata: options.fetchStatusMetadata ?? false,
                input: {
                    search_text: searchText,
                    categories: options.categories ?? [],
                    limit: options.limit ?? 20,
                    start_cursor: options.cursorToken
                }
            }, QueryIds.DIRECTORY_SEARCH, XWAPaths.xwa2_newsletters_directory_search);
        },
        newsletterDirectoryCategories: async (options = {}) => {
            return executeWMexQuery({
                fetch_status_metadata: options.fetchStatusMetadata ?? false,
                input: {
                    categories: options.categories ?? [],
                    country_code: options.countryCode || undefined,
                    per_category_limit: options.perCategoryLimit ?? 10
                }
            }, QueryIds.DIRECTORY_CATEGORIES, XWAPaths.xwa2_newsletters_directory_category_preview);
        },
        newsletterSendPollVote: async (jid, parentServerId, options) => {
            const names = Array.isArray(options) ? options : [options];
            const votes = names.map(name => ({
                tag: 'vote',
                attrs: {},
                content: createHash('sha256').update(String(name), 'utf-8').digest()
            }));
            const messageId = generateMessageTag();
            await query({
                tag: 'message',
                attrs: {
                    to: jid,
                    id: messageId,
                    type: 'poll',
                    server_id: String(parentServerId)
                },
                content: [
                    { tag: 'meta', attrs: { polltype: 'vote' } },
                    { tag: 'votes', attrs: {}, content: votes }
                ]
            });
            return { id: messageId };
        },
        newsletterInsights: async (jid, options = {}) => {
            return executeWMexQuery({
                input: {
                    newsletter_id: jid,
                    metrics: options.metrics ?? ['NET_FOLLOWS', 'UNFOLLOWS']
                }
            }, QueryIds.INSIGHTS, XWAPaths.xwa2_newsletter_admin_insights);
        },
        newsletterFollowers: async (jid, options = {}) => {
            return executeWMexQuery({
                input: {
                    newsletter_id: jid,
                    count: options.count ?? 100
                }
            }, QueryIds.FOLLOWERS, XWAPaths.xwa2_newsletter_followers);
        },
        newsletterPendingAdminInvites: async (jid) => {
            const response = await executeWMexQuery({ newsletter_id: jid }, QueryIds.PENDING_ADMIN_INVITES, XWAPaths.pending_admin_invites);
            return (response?.pending_admin_invites ?? []).map((invite) => ({
                id: invite?.user?.id,
                phoneNumber: invite?.user?.pn
            }));
        },
        newsletterQuestionResponseState: async (jid, serverId, responseServerId, state) => {
            return executeWMexQuery({
                newsletter_id: jid,
                server_id: String(serverId),
                response_server_id: String(responseServerId),
                state
            }, QueryIds.QUESTION_RESPONSE_STATE, XWAPaths.xwa2_newsletter_question_response_state_update);
        },
        newsletterRecommended: async (options = {}) => {
            return executeWMexQuery({
                fetch_status_metadata: options.fetchStatusMetadata ?? false,
                input: {
                    limit: options.limit ?? 20,
                    country_codes: options.countryCodes ?? []
                }
            }, QueryIds.RECOMMENDED, XWAPaths.xwa2_newsletters_recommended);
        },
        newsletterSimilar: async (jid, options = {}) => {
            return executeWMexQuery({
                fetch_status_metadata: options.fetchStatusMetadata ?? false,
                input: {
                    newsletter_id: jid,
                    limit: options.limit ?? 20,
                    country_codes: options.countryCodes ?? []
                }
            }, QueryIds.SIMILAR, XWAPaths.xwa2_newsletters_similar);
        }
    };
};
