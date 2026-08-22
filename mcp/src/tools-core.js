import * as z from 'zod';
import { normalizeJid, normalizePhone, simplifyMessage } from './runtime.js';
import { groupSummary, register, resource } from './shared.js';

export const registerCore = (server, runtime) => {
    resource(server, 'connection', 'whatsapp://connection', 'WhatsApp connection state', () => runtime.connectionInfo());
    resource(server, 'chats', 'whatsapp://chats', 'Recent WhatsApp chats', () => runtime.listChats(100));
    resource(server, 'contacts', 'whatsapp://contacts', 'WhatsApp contacts', () => runtime.listContacts(250));
    resource(server, 'groups', 'whatsapp://groups', 'Participating WhatsApp groups', async () => {
        const sock = await runtime.socket();
        const groups = await sock.groupFetchAllParticipating();
        return Object.values(groups || {}).map(groupSummary);
    });
    resource(server, 'newsletters', 'whatsapp://newsletters', 'Subscribed WhatsApp newsletters', async () => {
        const sock = await runtime.socket();
        return sock.newsletterSubscribed();
    });

    register(server, 'whatsapp_connection_status', {
        title: 'WhatsApp Connection Status',
        description: 'Read the current Elaina Baileys connection and registration state.',
        inputSchema: z.object({})
    }, () => runtime.connectionInfo());

    register(server, 'whatsapp_pairing_code', {
        title: 'Request Pairing Code',
        description: 'Request a WhatsApp linked-device pairing code for an unregistered MCP session.',
        inputSchema: z.object({
            phoneNumber: z.string().min(5),
            customCode: z.string().length(8).optional()
        })
    }, ({ phoneNumber, customCode }) => runtime.requestPairingCode(phoneNumber, customCode), 'write');

    register(server, 'whatsapp_check_number', {
        title: 'Check WhatsApp Number',
        description: 'Check whether a phone number is registered on WhatsApp.',
        inputSchema: z.object({ phoneNumber: z.string().min(5) })
    }, async ({ phoneNumber }) => {
        const sock = await runtime.socket();
        return sock.onWhatsApp(normalizePhone(phoneNumber));
    });

    register(server, 'whatsapp_list_chats', {
        title: 'List Chats',
        description: 'List chats cached in the persistent MCP store.',
        inputSchema: z.object({
            limit: z.number().int().min(1).max(500).default(50),
            query: z.string().default('')
        })
    }, ({ limit, query }) => runtime.listChats(limit, query));

    register(server, 'whatsapp_list_contacts', {
        title: 'List Contacts',
        description: 'List or search contacts cached in the persistent MCP store.',
        inputSchema: z.object({
            limit: z.number().int().min(1).max(1000).default(100),
            query: z.string().default('')
        })
    }, ({ limit, query }) => runtime.listContacts(limit, query));

    register(server, 'whatsapp_get_messages', {
        title: 'Get Messages',
        description: 'Read recent cached messages from one chat.',
        inputSchema: z.object({
            jid: z.string().min(1),
            count: z.number().int().min(1).max(200).default(30)
        })
    }, ({ jid, count }) => runtime.listMessages(jid, count));

    register(server, 'whatsapp_get_message', {
        title: 'Get Message',
        description: 'Read one cached message by chat JID and message ID.',
        inputSchema: z.object({
            jid: z.string().min(1),
            messageId: z.string().min(1),
            raw: z.boolean().default(false)
        })
    }, async ({ jid, messageId, raw }) => {
        const message = await runtime.getMessage({ remoteJid: normalizeJid(jid), id: messageId });
        if (!message) {
            throw new Error('Message not found in store');
        }
        return raw ? message : simplifyMessage(message);
    });

    register(server, 'whatsapp_profile_picture', {
        title: 'Get Profile Picture',
        description: 'Get a WhatsApp profile picture URL for a JID or phone number.',
        inputSchema: z.object({
            jid: z.string().min(1),
            type: z.enum(['preview', 'image']).default('image')
        })
    }, async ({ jid, type }) => {
        const sock = await runtime.socket();
        return { url: await sock.profilePictureUrl(normalizeJid(jid), type) };
    });

    register(server, 'whatsapp_fetch_status', {
        title: 'Fetch About Status',
        description: 'Fetch the WhatsApp About/status text for a JID or phone number.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.fetchStatus(normalizeJid(jid));
    });

    register(server, 'whatsapp_business_profile', {
        title: 'Get Business Profile',
        description: 'Fetch the WhatsApp Business profile for a JID or phone number.',
        inputSchema: z.object({ jid: z.string().min(1) })
    }, async ({ jid }) => {
        const sock = await runtime.socket();
        return sock.getBusinessProfile(normalizeJid(jid));
    });

    register(server, 'whatsapp_blocklist', {
        title: 'Get Blocklist',
        description: 'Fetch the account blocklist.',
        inputSchema: z.object({})
    }, async () => {
        const sock = await runtime.socket();
        return sock.fetchBlocklist();
    });

};
