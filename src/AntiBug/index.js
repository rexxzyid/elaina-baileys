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
    maxNewlines: 20000
};

const INVISIBLE = /[​-‏‪-‮⁠-⁤⁪-⁯﻿￹-￻]/;
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
    const seen = new WeakSet();
    const walk = (value, depth) => {
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
        if (Array.isArray(value)) {
            for (const item of value) {
                walk(item, depth + 1);
            }
            return;
        }
        if (value && typeof value === 'object') {
            if (seen.has(value)) {
                reasons.push('circular structure');
                return;
            }
            seen.add(value);
            for (const key of Object.keys(value)) {
                walk(value[key], depth + 1);
            }
        }
    };
    walk(content, 0);

    const collectContextInfo = (node) => {
        if (!node || typeof node !== 'object') {
            return;
        }
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
                collectContextInfo(child);
            }
        }
    };
    collectContextInfo(content);

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
        thresholds: {},
        onDetect: null,
        proto: null,
        logger: sock?.logger,
        ...options
    };
    const ownJid = config.ownJid || sock?.user?.id;
    const detectOptions = { ...config.thresholds, proto: config.proto };

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
            config.logger?.warn?.({ jid, sender, reasons: result.reasons }, 'anti-bug flagged incoming message');
            await config.onDetect?.({ direction: 'incoming', message: msg, jid, sender, reasons: result.reasons });
            await removeMessage(jid, msg.key);
            await maybeBlock(sender, msg.key);
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
