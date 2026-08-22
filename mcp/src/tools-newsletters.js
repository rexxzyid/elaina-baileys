import * as z from 'zod';
import { normalizeJid } from './runtime.js';
import { register } from './shared.js';

export const registerNewsletters = (server, runtime) => {
    register(server, 'whatsapp_newsletter_list', {
        title: 'List Newsletters',
        description: 'Fetch newsletters subscribed by the linked account.',
        inputSchema: z.object({})
    }, async () => {
        const sock = await runtime.socket();
        return sock.newsletterSubscribed();
    });

    register(server, 'whatsapp_newsletter_metadata', {
        title: 'Newsletter Metadata',
        description: 'Fetch newsletter metadata by newsletter JID.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.newsletterMetadata('jid', normalizeJid(jid));
    });

    register(server, 'whatsapp_newsletter_create', {
        title: 'Create Newsletter',
        description: 'Create a WhatsApp newsletter/channel.',
        inputSchema: z.object({
            name: z.string().min(1).max(100),
            description: z.string().max(2048).default('')
        })
    }, async ({ name, description }) => {
        const sock = await runtime.socket();
        return sock.newsletterCreate(name, description);
    }, 'write');

    register(server, 'whatsapp_newsletter_follow', {
        title: 'Follow Newsletter',
        description: 'Follow one WhatsApp newsletter.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.newsletterFollow(normalizeJid(jid));
    }, 'write');

    register(server, 'whatsapp_newsletter_unfollow', {
        title: 'Unfollow Newsletter',
        description: 'Unfollow one WhatsApp newsletter.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.newsletterUnfollow(normalizeJid(jid));
    }, 'destructive');

    register(server, 'whatsapp_newsletter_mute', {
        title: 'Mute Newsletter',
        description: 'Mute one WhatsApp newsletter.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.newsletterMute(normalizeJid(jid));
    }, 'write');

    register(server, 'whatsapp_newsletter_unmute', {
        title: 'Unmute Newsletter',
        description: 'Unmute one WhatsApp newsletter.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.newsletterUnmute(normalizeJid(jid));
    }, 'write');

    register(server, 'whatsapp_newsletter_update_name', {
        title: 'Update Newsletter Name',
        description: 'Change a newsletter name.',
        inputSchema: z.object({
            jid: z.string().min(1),
            name: z.string().min(1).max(100)
        })
    }, async ({ jid, name }) => {
        const sock = await runtime.socket();
        return sock.newsletterUpdateName(normalizeJid(jid), name);
    }, 'write');

    register(server, 'whatsapp_newsletter_update_description', {
        title: 'Update Newsletter Description',
        description: 'Change a newsletter description.',
        inputSchema: z.object({
            jid: z.string().min(1),
            description: z.string().max(2048)
        })
    }, async ({ jid, description }) => {
        const sock = await runtime.socket();
        return sock.newsletterUpdateDescription(normalizeJid(jid), description);
    }, 'write');

    register(server, 'whatsapp_newsletter_update_picture', {
        title: 'Update Newsletter Picture',
        description: 'Update a newsletter picture from an HTTP URL or local path.',
        inputSchema: z.object({
            jid: z.string().min(1),
            source: z.string().min(1)
        })
    }, async ({ jid, source }) => {
        const sock = await runtime.socket();
        return sock.newsletterUpdatePicture(normalizeJid(jid), { url: source });
    }, 'write');

    register(server, 'whatsapp_newsletter_remove_picture', {
        title: 'Remove Newsletter Picture',
        description: 'Remove a newsletter picture.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.newsletterRemovePicture(normalizeJid(jid));
    }, 'destructive');

    register(server, 'whatsapp_newsletter_react', {
        title: 'React to Newsletter Message',
        description: 'React to a newsletter message by server ID. Empty reaction removes it.',
        inputSchema: z.object({
            jid: z.string().min(1),
            serverId: z.union([z.string().min(1), z.number().int().nonnegative()]),
            reaction: z.string()
        })
    }, async ({ jid, serverId, reaction }) => {
        const sock = await runtime.socket();
        await sock.newsletterReactMessage(normalizeJid(jid), serverId, reaction);
        return { ok: true };
    }, 'write');

    register(server, 'whatsapp_newsletter_messages', {
        title: 'Fetch Newsletter Messages',
        description: 'Fetch newsletter messages around an optional server cursor.',
        inputSchema: z.object({
            jid: z.string().min(1),
            count: z.number().int().min(1).max(100).default(20),
            after: z.union([z.string(), z.number()]).optional(),
            before: z.union([z.string(), z.number()]).optional()
        })
    }, async ({ jid, count, after, before }) => {
        const sock = await runtime.socket();
        return sock.newsletterFetchMessages('jid', normalizeJid(jid), count, after, before);
    });

    register(server, 'whatsapp_newsletter_admin_capabilities', {
        title: 'Newsletter Admin Capabilities',
        description: 'Fetch server-enabled admin capabilities for a newsletter.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.newsletterAdminCapabilities(normalizeJid(jid));
    });

    register(server, 'whatsapp_newsletter_admin_info', {
        title: 'Newsletter Admin Info',
        description: 'Fetch newsletter admin information.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.newsletterAdminInfo(normalizeJid(jid));
    });

    register(server, 'whatsapp_newsletter_followers', {
        title: 'Newsletter Followers',
        description: 'Fetch newsletter follower information.',
        inputSchema: z.object({
            jid: z.string().min(1),
            count: z.number().int().min(1).max(500).default(100)
        })
    }, async ({ jid, count }) => {
        const sock = await runtime.socket();
        return sock.newsletterFollowers(normalizeJid(jid), { count });
    });

    register(server, 'whatsapp_newsletter_insights', {
        title: 'Newsletter Insights',
        description: 'Fetch newsletter insights for selected metrics.',
        inputSchema: z.object({
            jid: z.string().min(1),
            metrics: z.array(z.string().min(1)).default(['NET_FOLLOWS', 'UNFOLLOWS'])
        })
    }, async ({ jid, metrics }) => {
        const sock = await runtime.socket();
        return sock.newsletterInsights(normalizeJid(jid), { metrics });
    });

    register(server, 'whatsapp_newsletter_recommended', {
        title: 'Recommended Newsletters',
        description: 'Fetch recommended newsletters.',
        inputSchema: z.object({
            limit: z.number().int().min(1).max(100).default(20),
            countryCodes: z.array(z.string().length(2)).default([])
        })
    }, async ({ limit, countryCodes }) => {
        const sock = await runtime.socket();
        return sock.newsletterRecommended({ limit, countryCodes });
    });

    register(server, 'whatsapp_newsletter_search', {
        title: 'Search Newsletter Directory',
        description: 'Search the WhatsApp newsletter directory.',
        inputSchema: z.object({
            query: z.string().min(1),
            categories: z.array(z.string()).default([]),
            limit: z.number().int().min(1).max(100).default(20)
        })
    }, async ({ query, categories, limit }) => {
        const sock = await runtime.socket();
        return sock.newsletterDirectorySearch(query, { categories, limit });
    });

    register(server, 'whatsapp_newsletter_poll_vote', {
        title: 'Vote Newsletter Poll',
        description: 'Vote on a newsletter poll by parent server ID and option names.',
        inputSchema: z.object({
            jid: z.string().min(1),
            serverId: z.union([z.string().min(1), z.number().int().nonnegative()]),
            options: z.array(z.string().min(1)).min(1)
        })
    }, async ({ jid, serverId, options }) => {
        const sock = await runtime.socket();
        return sock.newsletterSendPollVote(normalizeJid(jid), serverId, options);
    }, 'write');

    register(server, 'whatsapp_newsletter_delete', {
        title: 'Delete Newsletter',
        description: 'Delete a newsletter owned by the linked account.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        await sock.newsletterDelete(normalizeJid(jid));
        return { ok: true };
    }, 'destructive');

};
