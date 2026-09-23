/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
export const ANTIBUG_DEFAULTS = {
    maxText: 65536,
    maxCaption: 32768,
    maxMentions: 1500,
    maxGroupMentions: 200,
    maxButtons: 100,
    maxSections: 100,
    maxRows: 300,
    maxCards: 60,
    maxDepth: 12,
    maxNodes: 20000,
    maxBytes: 3 * 1024 * 1024,
    maxParamsJson: 262144,
    maxInvisibleRun: 500,
    maxCombiningRun: 100,
    maxControlChars: 0,
    maxNewlines: 20000,
    maxPollOptions: 512,
    maxContacts: 1024,
    maxAiRichItems: 500
};

const INVISIBLE = /[\u200A-\u200F\u202A-\u202E\u2028\u2029\u2060-\u2064\u206A-\u206F\u2800\u3164\u115F\u1160\uFFA0\uFEFF\uFFF9-\uFFFB]/;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;
const COMBINING = /[̀-ͯ҃-҉֑-ֽؐ-ًؚ-ٟۖ-ۜ۟-ۤัิ-ฺັິ-ຼ᪰-᫿᷀-᷿⃐-⃿︠-︯]/;

const longestRun = (text, matcher) => {
    let run = 0;
    let best = 0;
    for (const ch of text) {
        if (matcher.test(ch)) {
            run += 1;
            if (run > best) {
                best = run;
            }
        }
        else {
            run = 0;
        }
    }
    return best;
};

const countChar = (text, ch) => {
    let n = 0;
    for (let i = 0; i < text.length; i += 1) {
        if (text[i] === ch) {
            n += 1;
        }
    }
    return n;
};

const unwrapContent = (message) => {
    let current = message;
    let depth = 0;
    const wrappers = [
        'ephemeralMessage',
        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',
        'documentWithCaptionMessage',
        'editedMessage',
        'deviceSentMessage',
        'botInvokeMessage'
    ];
    while (current && typeof current === 'object' && depth < 64) {
        const wrapper = wrappers.find((w) => current[w]?.message);
        if (!wrapper) {
            break;
        }
        current = current[wrapper].message;
        depth += 1;
    }
    return { content: current, wrapDepth: depth };
};

export const detectBug = (message, options = {}) => {
    const limits = { ...ANTIBUG_DEFAULTS, ...options };
    const reasons = [];
    if (!message || typeof message !== 'object') {
        return { flagged: false, reasons };
    }
    const { content, wrapDepth } = unwrapContent(message);
    if (wrapDepth >= 6) {
        reasons.push(`wrapper nesting ${wrapDepth}`);
    }
    let nodes = 0;
    const walk = (value, depth, ancestors) => {
        if (reasons.length > 40) {
            return;
        }
        nodes += 1;
        if (nodes > limits.maxNodes) {
            reasons.push(`node count > ${limits.maxNodes}`);
            return;
        }
        if (depth > limits.maxDepth) {
            reasons.push(`structure depth > ${limits.maxDepth}`);
            return;
        }
        if (typeof value === 'string') {
            if (value.length > limits.maxText) {
                reasons.push(`string length ${value.length} > ${limits.maxText}`);
            }
            if (countChar(value, '\n') > limits.maxNewlines) {
                reasons.push('excessive newlines');
            }
            let controls = 0;
            for (const ch of value) {
                if (CONTROL.test(ch)) {
                    controls += 1;
                }
            }
            if (controls > limits.maxControlChars) {
                reasons.push(`control/null chars ${controls}`);
            }
            const invisibleRun = longestRun(value, INVISIBLE);
            if (invisibleRun > limits.maxInvisibleRun) {
                reasons.push(`invisible-char run ${invisibleRun}`);
            }
            const combiningRun = longestRun(value, COMBINING);
            if (combiningRun > limits.maxCombiningRun) {
                reasons.push(`combining-char run ${combiningRun}`);
            }
            return;
        }
        if (typeof value === 'number') {
            if (!Number.isFinite(value)) {
                reasons.push('non-finite number');
            }
            return;
        }
        if (value && typeof value === 'object') {
            if (ancestors.has(value)) {
                reasons.push('circular structure');
                return;
            }
            ancestors.add(value);
            if (Array.isArray(value)) {
                for (const item of value) {
                    walk(item, depth + 1, ancestors);
                }
            }
            else {
                for (const key of Object.keys(value)) {
                    walk(value[key], depth + 1, ancestors);
                }
            }
            ancestors.delete(value);
        }
    };
    walk(content, 0, new WeakSet());

    const collectContextInfo = (node, seen) => {
        if (!node || typeof node !== 'object' || seen.has(node)) {
            return;
        }
        seen.add(node);
        for (const key of Object.keys(node)) {
            const child = node[key];
            if (key === 'contextInfo' && child && typeof child === 'object') {
                if (Array.isArray(child.mentionedJid) && child.mentionedJid.length > limits.maxMentions) {
                    reasons.push(`mentionedJid ${child.mentionedJid.length} > ${limits.maxMentions}`);
                }
                if (Array.isArray(child.groupMentions) && child.groupMentions.length > limits.maxGroupMentions) {
                    reasons.push(`groupMentions ${child.groupMentions.length} > ${limits.maxGroupMentions}`);
                }
            }
            if (child && typeof child === 'object') {
                collectContextInfo(child, seen);
            }
        }
    };
    collectContextInfo(content, new WeakSet());

    const inspectInteractive = (node) => {
        if (!node || typeof node !== 'object') {
            return;
        }
        const nativeFlow = node.nativeFlowMessage || node.interactiveMessage?.nativeFlowMessage;
        if (nativeFlow?.buttons) {
            if (nativeFlow.buttons.length > limits.maxButtons) {
                reasons.push(`nativeFlow buttons ${nativeFlow.buttons.length} > ${limits.maxButtons}`);
            }
            for (const button of nativeFlow.buttons) {
                const params = button?.buttonParamsJson;
                if (typeof params === 'string') {
                    if (params.length > limits.maxParamsJson) {
                        reasons.push(`buttonParamsJson length ${params.length}`);
                    }
                    else if (params.length) {
                        try {
                            JSON.parse(params);
                        }
                        catch {
                            reasons.push('buttonParamsJson invalid');
                        }
                    }
                }
            }
        }
        const list = node.listMessage || node.interactiveMessage?.carouselMessage;
        if (list?.sections && list.sections.length > limits.maxSections) {
            reasons.push(`list sections ${list.sections.length} > ${limits.maxSections}`);
        }
        if (Array.isArray(list?.sections)) {
            let rows = 0;
            for (const section of list.sections) {
                rows += Array.isArray(section?.rows) ? section.rows.length : 0;
            }
            if (rows > limits.maxRows) {
                reasons.push(`list rows ${rows} > ${limits.maxRows}`);
            }
        }
        const cards = node.interactiveMessage?.carouselMessage?.cards;
        if (Array.isArray(cards) && cards.length > limits.maxCards) {
            reasons.push(`carousel cards ${cards.length} > ${limits.maxCards}`);
        }
    };
    inspectInteractive(content);

    const inspectByType = (node, seen) => {
        if (!node || typeof node !== 'object' || seen.has(node)) {
            return;
        }
        seen.add(node);
        for (const key of Object.keys(node)) {
            const child = node[key];
            if (!child || typeof child !== 'object') {
                continue;
            }
            if (key === 'locationMessage' || key === 'liveLocationMessage') {
                const lat = Number(child.degreesLatitude);
                const lng = Number(child.degreesLongitude);
                if (('degreesLatitude' in child) && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
                    reasons.push('location latitude out of range');
                }
                if (('degreesLongitude' in child) && (!Number.isFinite(lng) || lng < -180 || lng > 180)) {
                    reasons.push('location longitude out of range');
                }
            }
            if (key === 'aiRichResponseMessage') {
                if (Array.isArray(child.submessages) && child.submessages.length > limits.maxAiRichItems) {
                    reasons.push(`aiRich submessages ${child.submessages.length} > ${limits.maxAiRichItems}`);
                }
                const items = child.unifiedResponse?.contentItems || child.unifiedResponse?.contentItemsMetadata?.items;
                if (Array.isArray(items) && items.length > limits.maxAiRichItems) {
                    reasons.push(`aiRich content items ${items.length} > ${limits.maxAiRichItems}`);
                }
            }
            if (key === 'pollCreationMessage' || key === 'pollCreationMessageV2' || key === 'pollCreationMessageV3') {
                if (Array.isArray(child.options) && child.options.length > limits.maxPollOptions) {
                    reasons.push(`poll options ${child.options.length} > ${limits.maxPollOptions}`);
                }
            }
            if (key === 'contactsArrayMessage' && Array.isArray(child.contacts) && child.contacts.length > limits.maxContacts) {
                reasons.push(`contacts ${child.contacts.length} > ${limits.maxContacts}`);
            }
            inspectByType(child, seen);
        }
    };
    inspectByType(content, new WeakSet());

    if (typeof options.byteLength === 'number' && options.byteLength > limits.maxBytes) {
        reasons.push(`encoded size ${options.byteLength} > ${limits.maxBytes}`);
    }
    if (options.proto?.Message) {
        try {
            const encoded = options.proto.Message.encode(options.proto.Message.fromObject(message)).finish();
            if (encoded.length > limits.maxBytes) {
                reasons.push(`encoded size ${encoded.length} > ${limits.maxBytes}`);
            }
        }
        catch (error) {
            reasons.push(`proto encode failed: ${error.message}`);
        }
    }

    return { flagged: reasons.length > 0, reasons };
};

export const createAntiBugGuard = (sock, options = {}) => {
    const config = {
        autoDelete: true,
        deleteMode: 'auto',
        guardIncoming: true,
        guardOutgoing: true,
        blockOnBug: false,
        selfOnly: false,
        burstThreshold: 2,
        burstWindowMs: 60000,
        kickOnBurst: true,
        leaveGroupOnBurst: false,
        cooldownMs: 15000,
        thresholds: {},
        onDetect: null,
        proto: null,
        logger: sock?.logger,
        ...options
    };
    const ownJid = config.ownJid || sock?.user?.id;
    const detectOptions = { ...config.thresholds, proto: config.proto };
    const flaggedBySender = new Map();
    const chatCooldown = new Map();
    const escalated = new Set();
    const isGroupJid = (j) => typeof j === 'string' && j.endsWith('@g.us');

    const removeMessage = async (jid, key) => {
        if (!config.autoDelete) {
            return;
        }
        const revoke = config.deleteMode === 'everyone' || (config.deleteMode === 'auto' && key?.fromMe);
        try {
            if (revoke) {
                await sock.sendMessage(jid, { delete: key });
            }
            else if (typeof sock.chatModify === 'function') {
                await sock.chatModify({ deleteForMe: { key, timestamp: Date.now(), deleteMedia: false } }, jid);
            }
        }
        catch (error) {
            config.logger?.warn?.({ error: error.message }, 'anti-bug delete failed');
        }
    };

    const maybeBlock = async (jid, key) => {
        if (!config.blockOnBug || key?.fromMe || typeof sock.updateBlockStatus !== 'function') {
            return;
        }
        try {
            await sock.updateBlockStatus(jid, 'block');
        }
        catch (error) {
            config.logger?.warn?.({ error: error.message }, 'anti-bug block failed');
        }
    };

    const escalate = async (sender, jid) => {
        if (!sender || escalated.has(sender)) {
            return;
        }
        escalated.add(sender);
        config.logger?.warn?.({ sender, jid }, 'anti-bug burst escalation');
        if (typeof sock.updateBlockStatus === 'function') {
            try {
                await sock.updateBlockStatus(sender, 'block');
            }
            catch (error) {
                config.logger?.warn?.({ error: error.message }, 'anti-bug escalate block failed');
            }
        }
        if (isGroupJid(jid)) {
            let removed = false;
            if (config.kickOnBurst && typeof sock.groupParticipantsUpdate === 'function') {
                try {
                    await sock.groupParticipantsUpdate(jid, [sender], 'remove');
                    removed = true;
                }
                catch (error) {
                    config.logger?.warn?.({ error: error.message }, 'anti-bug kick failed');
                }
            }
            if (!removed && config.leaveGroupOnBurst && typeof sock.groupLeave === 'function') {
                try {
                    await sock.groupLeave(jid);
                }
                catch (error) {
                    config.logger?.warn?.({ error: error.message }, 'anti-bug leave failed');
                }
            }
        }
        await config.onDetect?.({ direction: 'escalation', jid, sender });
    };

    const recordBurst = (sender) => {
        const now = Date.now();
        const history = (flaggedBySender.get(sender) || []).filter((t) => now - t < config.burstWindowMs);
        history.push(now);
        flaggedBySender.set(sender, history);
        return history.length;
    };

    const handleUpsert = async ({ messages }) => {
        if (!config.guardIncoming || !Array.isArray(messages)) {
            return;
        }
        for (const msg of messages) {
            const content = msg?.message;
            if (!content) {
                continue;
            }
            const jid = msg.key?.remoteJid;
            if (config.selfOnly && jid !== ownJid && !msg.key?.fromMe) {
                continue;
            }
            const result = detectBug(content, detectOptions);
            if (!result.flagged) {
                continue;
            }
            const sender = msg.key?.participant || jid;
            const now = Date.now();
            const inCooldown = now - (chatCooldown.get(jid) || 0) < config.cooldownMs;
            chatCooldown.set(jid, now);
            if (!inCooldown) {
                config.logger?.warn?.({ jid, sender, reasons: result.reasons }, 'anti-bug flagged incoming message');
                await config.onDetect?.({ direction: 'incoming', message: msg, jid, sender, reasons: result.reasons });
            }
            await removeMessage(jid, msg.key);
            await maybeBlock(sender, msg.key);
            if (!msg.key?.fromMe && recordBurst(sender) >= config.burstThreshold) {
                await escalate(sender, jid);
            }
        }
    };

    if (config.guardIncoming && sock?.ev?.on) {
        sock.ev.on('messages.upsert', handleUpsert);
    }

    let originalSend = null;
    if (config.guardOutgoing && typeof sock?.sendMessage === 'function') {
        originalSend = sock.sendMessage.bind(sock);
        sock.sendMessage = async (jid, content, sendOptions) => {
            const probe = detectBug(content, detectOptions);
            if (probe.flagged) {
                config.logger?.warn?.({ jid, reasons: probe.reasons }, 'anti-bug blocked outgoing message');
                await config.onDetect?.({ direction: 'outgoing', jid, content, reasons: probe.reasons });
                throw new Error(`anti-bug blocked outgoing message: ${probe.reasons.join('; ')}`);
            }
            return originalSend(jid, content, sendOptions);
        };
    }

    return {
        detect: (message) => detectBug(message, detectOptions),
        stop: () => {
            if (config.guardIncoming && sock?.ev?.off) {
                sock.ev.off('messages.upsert', handleUpsert);
            }
            if (originalSend) {
                sock.sendMessage = originalSend;
            }
        }
    };
};
