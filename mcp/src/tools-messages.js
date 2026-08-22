import * as z from 'zod';
import { normalizeJid } from './runtime.js';
import { keySchema, quotedOptions, register } from './shared.js';

export const registerMessages = (server, runtime) => {
    register(server, 'whatsapp_send_text', {
        title: 'Send Text Message',
        description: 'Send one text message to a WhatsApp chat. Optionally quote a cached message.',
        inputSchema: z.object({
            jid: z.string().min(1),
            text: z.string().min(1),
            quotedMessageId: z.string().optional()
        })
    }, async ({ jid, text, quotedMessageId }) => {
        const sock = await runtime.socket();
        const remoteJid = normalizeJid(jid);
        const options = await quotedOptions(runtime, remoteJid, quotedMessageId);
        return sock.sendMessage(remoteJid, { text }, options);
    }, 'write');

    register(server, 'whatsapp_send_media', {
        title: 'Send Media Message',
        description: 'Send one image, video, audio, document, or sticker from an HTTP URL or local path.',
        inputSchema: z.object({
            jid: z.string().min(1),
            type: z.enum(['image', 'video', 'audio', 'document', 'sticker']),
            source: z.string().min(1),
            caption: z.string().optional(),
            mimetype: z.string().optional(),
            fileName: z.string().optional(),
            ptt: z.boolean().optional(),
            gifPlayback: z.boolean().optional(),
            quotedMessageId: z.string().optional()
        })
    }, async ({ jid, type, source, caption, mimetype, fileName, ptt, gifPlayback, quotedMessageId }) => {
        const sock = await runtime.socket();
        const remoteJid = normalizeJid(jid);
        const content = { [type]: { url: source } };
        if (caption) content.caption = caption;
        if (mimetype) content.mimetype = mimetype;
        if (fileName) content.fileName = fileName;
        if (type === 'audio' && ptt !== undefined) content.ptt = ptt;
        if (type === 'video' && gifPlayback !== undefined) content.gifPlayback = gifPlayback;
        const options = await quotedOptions(runtime, remoteJid, quotedMessageId);
        return sock.sendMessage(remoteJid, content, options);
    }, 'write');

    register(server, 'whatsapp_send_location', {
        title: 'Send Location',
        description: 'Send one geographic location message.',
        inputSchema: z.object({
            jid: z.string().min(1),
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
            name: z.string().optional(),
            address: z.string().optional()
        })
    }, async ({ jid, latitude, longitude, name, address }) => {
        const sock = await runtime.socket();
        return sock.sendMessage(normalizeJid(jid), {
            location: {
                degreesLatitude: latitude,
                degreesLongitude: longitude,
                ...(name ? { name } : {}),
                ...(address ? { address } : {})
            }
        });
    }, 'write');

    register(server, 'whatsapp_send_poll', {
        title: 'Send Poll',
        description: 'Send one text poll to a WhatsApp chat.',
        inputSchema: z.object({
            jid: z.string().min(1),
            name: z.string().min(1),
            values: z.array(z.string().min(1)).min(2).max(12),
            selectableCount: z.number().int().min(1).default(1)
        })
    }, async ({ jid, name, values, selectableCount }) => {
        const sock = await runtime.socket();
        return sock.sendMessage(normalizeJid(jid), {
            poll: { name, values, selectableCount }
        });
    }, 'write');

    register(server, 'whatsapp_react_message', {
        title: 'React to Message',
        description: 'Add or remove a reaction on one message. Use an empty reaction to remove it.',
        inputSchema: z.object({
            ...keySchema,
            reaction: z.string()
        })
    }, async args => {
        const sock = await runtime.socket();
        const key = await runtime.resolveMessageKey(args);
        return sock.sendMessage(normalizeJid(args.jid), { react: { text: args.reaction, key } });
    }, 'write');

    register(server, 'whatsapp_edit_message', {
        title: 'Edit Message',
        description: 'Edit a message using Elaina Baileys existing sendMessage edit surface.',
        inputSchema: z.object({
            ...keySchema,
            text: z.string().min(1)
        })
    }, async args => {
        const sock = await runtime.socket();
        const key = await runtime.resolveMessageKey({ ...args, fromMe: args.fromMe ?? true });
        return sock.sendMessage(normalizeJid(args.jid), { text: args.text, edit: key });
    }, 'write');

    register(server, 'whatsapp_delete_message', {
        title: 'Delete Message',
        description: 'Delete one message using its WhatsApp message key.',
        inputSchema: z.object(keySchema)
    }, async args => {
        const sock = await runtime.socket();
        const key = await runtime.resolveMessageKey(args);
        return sock.sendMessage(normalizeJid(args.jid), { delete: key });
    }, 'destructive');

    register(server, 'whatsapp_mark_read', {
        title: 'Mark Message Read',
        description: 'Send a read receipt for one message key.',
        inputSchema: z.object(keySchema)
    }, async args => {
        const sock = await runtime.socket();
        const key = await runtime.resolveMessageKey(args);
        await sock.readMessages([key]);
        return { ok: true, key };
    }, 'write');

    register(server, 'whatsapp_presence', {
        title: 'Update Presence',
        description: 'Send an account or chat presence update.',
        inputSchema: z.object({
            type: z.enum(['available', 'unavailable', 'composing', 'recording', 'paused']),
            jid: z.string().optional()
        })
    }, async ({ type, jid }) => {
        const sock = await runtime.socket();
        await sock.sendPresenceUpdate(type, jid ? normalizeJid(jid) : undefined);
        return { ok: true };
    }, 'write');

    register(server, 'whatsapp_update_profile_name', {
        title: 'Update Profile Name',
        description: 'Update the linked WhatsApp account profile name.',
        inputSchema: z.object({ name: z.string().min(1).max(100) })
    }, async ({ name }) => {
        const sock = await runtime.socket();
        await sock.updateProfileName(name);
        return { ok: true };
    }, 'write');

    register(server, 'whatsapp_update_profile_status', {
        title: 'Update Profile Status',
        description: 'Update the linked WhatsApp account About/status text.',
        inputSchema: z.object({ status: z.string().max(500) })
    }, async ({ status }) => {
        const sock = await runtime.socket();
        await sock.updateProfileStatus(status);
        return { ok: true };
    }, 'write');

    register(server, 'whatsapp_update_profile_picture', {
        title: 'Update Profile Picture',
        description: 'Update a profile or group picture from an HTTP URL or local path.',
        inputSchema: z.object({
            jid: z.string().min(1),
            source: z.string().min(1)
        })
    }, async ({ jid, source }) => {
        const sock = await runtime.socket();
        await sock.updateProfilePicture(normalizeJid(jid), { url: source });
        return { ok: true };
    }, 'write');

    register(server, 'whatsapp_remove_profile_picture', {
        title: 'Remove Profile Picture',
        description: 'Remove the profile picture for a JID.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        await sock.removeProfilePicture(normalizeJid(jid));
        return { ok: true };
    }, 'destructive');

    register(server, 'whatsapp_block_status', {
        title: 'Block or Unblock Contact',
        description: 'Block or unblock one WhatsApp JID.',
        inputSchema: z.object({
            jid: z.string().min(1),
            action: z.enum(['block', 'unblock'])
        })
    }, async ({ jid, action }) => {
        const sock = await runtime.socket();
        await sock.updateBlockStatus(normalizeJid(jid), action);
        return { ok: true };
    }, 'write');

};
