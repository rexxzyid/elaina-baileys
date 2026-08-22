import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import pino from 'pino';
import makeWASocket, {
    DisconnectReason,
    jidNormalizedUser,
    makeInMemoryStore,
    normalizeMessageContent,
    useMultiFileAuthState
} from '../../lib/index.js';

const STORE_EVENTS = [
    'messaging-history.set',
    'messages.upsert',
    'messages.update',
    'messages.delete',
    'contacts.upsert',
    'contacts.update',
    'chats.upsert',
    'chats.update',
    'chats.delete',
    'groups.update',
    'group-participants.update'
];

const digitsOnly = value => String(value ?? '').replace(/\D/g, '');

export const normalizePhone = value => {
    const phone = digitsOnly(value);
    if (!phone) {
        throw new Error('phone number is required');
    }
    return phone;
};

export const normalizeJid = value => {
    const raw = String(value ?? '').trim();
    if (!raw) {
        throw new Error('jid is required');
    }
    if (!raw.includes('@')) {
        return `${normalizePhone(raw)}@s.whatsapp.net`;
    }
    return jidNormalizedUser(raw) || raw;
};

export const messageText = input => {
    const message = normalizeMessageContent(input?.message || input) || {};
    return message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.documentMessage?.caption ||
        message.editedMessage?.message?.conversation ||
        message.editedMessage?.message?.extendedTextMessage?.text ||
        '';
};

export const simplifyMessage = message => ({
    key: message?.key,
    pushName: message?.pushName,
    messageTimestamp: message?.messageTimestamp?.toString?.() || message?.messageTimestamp,
    text: messageText(message),
    status: message?.status,
    messageStubType: message?.messageStubType,
    messageType: message?.message ? Object.keys(normalizeMessageContent(message.message) || {})[0] : undefined
});

export class WhatsAppRuntime {
    constructor(options = {}) {
        this.dataDir = path.resolve(options.dataDir || process.env.ELAINA_MCP_DATA_DIR || '.mcp-data');
        this.authDir = path.join(this.dataDir, 'auth');
        this.storeFile = path.join(this.dataDir, 'store.json');
        this.logger = pino({ level: 'silent' });
        this.store = makeInMemoryStore({ logger: this.logger });
        this.sock = undefined;
        this.authState = undefined;
        this.saveCreds = undefined;
        this.connection = 'close';
        this.lastDisconnectStatus = undefined;
        this.connectPromise = undefined;
        this.reconnectTimer = undefined;
        this.storeWriteTimer = undefined;
        this.closing = false;
    }

    async start() {
        fs.mkdirSync(this.authDir, { recursive: true });
        if (fs.existsSync(this.storeFile)) {
            try {
                this.store.readFromFile(this.storeFile);
            }
            catch (error) {
                console.error(`Elaina MCP store load failed: ${error.message}`);
            }
        }
        const auth = await useMultiFileAuthState(this.authDir);
        this.authState = auth.state;
        this.saveCreds = auth.saveCreds;
        await this.connect();
        return this;
    }

    async connect() {
        if (this.closing) {
            return this.sock;
        }
        if (this.connectPromise) {
            return this.connectPromise;
        }
        this.connectPromise = this.createSocket().finally(() => {
            this.connectPromise = undefined;
        });
        return this.connectPromise;
    }

    async createSocket() {
        const sock = makeWASocket({
            auth: this.authState,
            logger: this.logger,
            markOnlineOnConnect: false,
            getMessage: key => this.getMessage(key)
        });
        this.sock = sock;
        this.store.bind(sock.ev);
        sock.ev.on('creds.update', this.saveCreds);
        for (const event of STORE_EVENTS) {
            sock.ev.on(event, () => this.scheduleStoreWrite());
        }
        sock.ev.on('connection.update', update => this.handleConnectionUpdate(sock, update));
        return sock;
    }

    handleConnectionUpdate(sock, update) {
        if (sock !== this.sock) {
            return;
        }
        if (update.connection) {
            this.connection = update.connection;
        }
        if (update.connection !== 'close') {
            return;
        }
        const statusCode = update.lastDisconnect?.error?.output?.statusCode ??
            update.lastDisconnect?.error?.data?.statusCode;
        this.lastDisconnectStatus = statusCode;
        if (this.closing || statusCode === DisconnectReason.loggedOut) {
            return;
        }
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(error => console.error(`Elaina MCP reconnect failed: ${error.message}`));
        }, 1500);
        this.reconnectTimer.unref?.();
    }

    scheduleStoreWrite() {
        clearTimeout(this.storeWriteTimer);
        this.storeWriteTimer = setTimeout(() => this.persistStore(), 300);
        this.storeWriteTimer.unref?.();
    }

    persistStore() {
        try {
            fs.mkdirSync(this.dataDir, { recursive: true });
            this.store.writeToFile(this.storeFile);
        }
        catch (error) {
            console.error(`Elaina MCP store write failed: ${error.message}`);
        }
    }

    async close() {
        this.closing = true;
        clearTimeout(this.reconnectTimer);
        clearTimeout(this.storeWriteTimer);
        this.persistStore();
        if (this.sock) {
            try {
                await this.sock.end(new Error('Elaina MCP shutdown'));
            }
            catch {
            }
        }
    }

    async socket(online = true) {
        if (!this.sock) {
            await this.connect();
        }
        if (online && this.connection !== 'open') {
            throw new Error(`WhatsApp is not connected, current state: ${this.connection}`);
        }
        return this.sock;
    }

    async requestPairingCode(phoneNumber, customCode) {
        if (this.authState?.creds?.registered) {
            throw new Error('WhatsApp session is already registered');
        }
        const sock = await this.socket(false);
        return sock.requestPairingCode(normalizePhone(phoneNumber), customCode);
    }

    connectionInfo() {
        return {
            connection: this.connection,
            registered: Boolean(this.authState?.creds?.registered),
            me: this.authState?.creds?.me,
            lastDisconnectStatus: this.lastDisconnectStatus,
            dataDir: this.dataDir
        };
    }

    async getMessage(key) {
        if (!key?.id) {
            return undefined;
        }
        const candidates = [key.remoteJidAlt, key.remoteJid]
            .filter(Boolean)
            .flatMap(jid => {
                const normalized = jidNormalizedUser(jid);
                return normalized && normalized !== jid ? [jid, normalized] : [jid];
            });
        for (const jid of new Set(candidates)) {
            const message = await this.store.loadMessage(jid, key.id);
            if (message) {
                return message;
            }
        }
        return undefined;
    }

    async resolveMessageKey({ jid, messageId, fromMe, participant, participantAlt }) {
        const remoteJid = normalizeJid(jid);
        const stored = await this.getMessage({ remoteJid, id: messageId });
        if (stored?.key) {
            return {
                ...stored.key,
                ...(fromMe === undefined ? {} : { fromMe }),
                ...(participant ? { participant: normalizeJid(participant) } : {}),
                ...(participantAlt ? { participantAlt: normalizeJid(participantAlt) } : {})
            };
        }
        return {
            remoteJid,
            id: messageId,
            fromMe: Boolean(fromMe),
            ...(participant ? { participant: normalizeJid(participant) } : {}),
            ...(participantAlt ? { participantAlt: normalizeJid(participantAlt) } : {})
        };
    }

    listChats(limit = 50, query = '') {
        const all = typeof this.store.chats?.all === 'function' ? this.store.chats.all() : [];
        const needle = query.toLowerCase();
        return all
            .filter(chat => !needle || String(chat.id || '').toLowerCase().includes(needle) || String(chat.name || '').toLowerCase().includes(needle))
            .slice(0, limit)
            .map(chat => ({
                id: chat.id,
                name: chat.name,
                unreadCount: chat.unreadCount,
                conversationTimestamp: chat.conversationTimestamp?.toString?.() || chat.conversationTimestamp,
                archived: chat.archived,
                readOnly: chat.readOnly
            }));
    }

    listContacts(limit = 100, query = '') {
        const needle = query.toLowerCase();
        return Object.values(this.store.contacts || {})
            .filter(contact => {
                if (!needle) {
                    return true;
                }
                return [contact.id, contact.name, contact.notify, contact.verifiedName]
                    .some(value => String(value || '').toLowerCase().includes(needle));
            })
            .slice(0, limit)
            .map(contact => ({
                id: contact.id,
                name: contact.name,
                notify: contact.notify,
                verifiedName: contact.verifiedName,
                imgUrl: contact.imgUrl,
                status: contact.status
            }));
    }

    async listMessages(jid, count = 30) {
        const normalized = normalizeJid(jid);
        const messages = await this.store.loadMessages(normalized, count);
        return messages.map(simplifyMessage);
    }
}
