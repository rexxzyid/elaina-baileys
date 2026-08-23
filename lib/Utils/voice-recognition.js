import { downloadContentFromMessage } from './messages-media.js';
import { normalizeMessageContent } from './messages.js';
import { areJidsSameUser, isJidGroup, jidNormalizedUser } from '../WABinary/index.js';

const DEFAULT_MAX_DURATION = 60;
const DEFAULT_MAX_BYTES = 16 * 1024 * 1024;

const streamToBuffer = async (stream, maxBytes) => {
    const chunks = [];
    let total = 0;
    for await (const chunk of stream) {
        const buffer = Buffer.from(chunk);
        total += buffer.length;
        if (maxBytes && total > maxBytes) {
            throw new Error('voice message exceeds maxBytes');
        }
        chunks.push(buffer);
    }
    return Buffer.concat(chunks);
};

export const normalizeVoiceText = value => String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const matchVoiceWakePhrase = (transcript, phrases = []) => {
    const normalizedTranscript = normalizeVoiceText(transcript);
    if (!normalizedTranscript) {
        return null;
    }
    const candidates = [...new Map((Array.isArray(phrases) ? phrases : [phrases])
        .map(phrase => ({ raw: String(phrase ?? '').trim(), normalized: normalizeVoiceText(phrase) }))
        .filter(phrase => phrase.normalized)
        .map(phrase => [phrase.normalized, phrase])).values()]
        .sort((a, b) => b.normalized.length - a.normalized.length);
    for (const phrase of candidates) {
        const index = ` ${normalizedTranscript} `.indexOf(` ${phrase.normalized} `);
        if (index >= 0) {
            return {
                phrase: phrase.raw,
                normalizedPhrase: phrase.normalized,
                normalizedTranscript
            };
        }
    }
    return null;
};

export const removeVoiceWakePhrase = (transcript, wakePhrase) => {
    const normalizedTranscript = normalizeVoiceText(transcript);
    const normalizedPhrase = normalizeVoiceText(wakePhrase);
    if (!normalizedPhrase) {
        return normalizedTranscript;
    }
    const words = normalizedTranscript.split(' ');
    const phraseWords = normalizedPhrase.split(' ');
    for (let index = 0; index <= words.length - phraseWords.length; index += 1) {
        if (phraseWords.every((word, offset) => words[index + offset] === word)) {
            words.splice(index, phraseWords.length);
            break;
        }
    }
    return words.join(' ').trim();
};

const getVoiceSenderJid = message => jidNormalizedUser(message?.key?.participantAlt ||
    message?.key?.participant ||
    message?.key?.remoteJidAlt ||
    message?.key?.remoteJid);

const isQuotedToSelf = async ({ message, audioMessage, meId, meLid, getMessage }) => {
    const contextInfo = audioMessage?.contextInfo;
    if (!contextInfo?.quotedMessage && !contextInfo?.stanzaId) {
        return false;
    }
    const quotedAuthor = contextInfo.participantAlt || contextInfo.participant;
    if (quotedAuthor && (areJidsSameUser(quotedAuthor, meId) || areJidsSameUser(quotedAuthor, meLid))) {
        return true;
    }
    if (!contextInfo.stanzaId || typeof getMessage !== 'function') {
        return false;
    }
    const target = await getMessage({
        remoteJid: message.key.remoteJid,
        remoteJidAlt: message.key.remoteJidAlt,
        participant: quotedAuthor,
        id: contextInfo.stanzaId
    });
    return target?.key?.fromMe === true;
};

const normalizeTranscriptionResult = value => {
    if (typeof value === 'string') {
        return { text: value };
    }
    if (value && typeof value === 'object') {
        return {
            ...value,
            text: String(value.text ?? value.transcript ?? '')
        };
    }
    return { text: '' };
};

const getWakePhrases = async (voiceRecognition, context) => {
    const staticPhrases = Array.isArray(voiceRecognition.wakePhrases)
        ? voiceRecognition.wakePhrases
        : voiceRecognition.wakePhrases
            ? [voiceRecognition.wakePhrases]
            : [];
    const dynamicPhrases = typeof voiceRecognition.getWakePhrases === 'function'
        ? await voiceRecognition.getWakePhrases(context)
        : [];
    return [...new Set([
        ...staticPhrases,
        ...(Array.isArray(dynamicPhrases) ? dynamicPhrases : dynamicPhrases ? [dynamicPhrases] : [])
    ].map(value => String(value ?? '').trim()).filter(Boolean))];
};

export const bindVoiceRecognition = (sock, config = {}, dependencies = {}) => {
    const voiceRecognition = config.voiceRecognition;
    if (!voiceRecognition?.enabled || typeof voiceRecognition.transcribe !== 'function') {
        return () => undefined;
    }
    const downloadContent = dependencies.downloadContentFromMessage || downloadContentFromMessage;
    const getMessage = config.getMessage;
    const logger = config.logger;
    const handler = async ({ messages, type }) => {
        if (type !== 'notify') {
            return;
        }
        for (const message of messages || []) {
            try {
                if (!message?.message || message.key?.fromMe) {
                    continue;
                }
                const content = normalizeMessageContent(message.message);
                const audioMessage = content?.audioMessage;
                if (!audioMessage) {
                    continue;
                }
                if ((voiceRecognition.pttOnly ?? true) && !audioMessage.ptt) {
                    continue;
                }
                const maxDuration = Number.isFinite(voiceRecognition.maxDuration)
                    ? Math.max(0, Number(voiceRecognition.maxDuration))
                    : DEFAULT_MAX_DURATION;
                if (maxDuration && Number(audioMessage.seconds || 0) > maxDuration) {
                    continue;
                }
                const chatJid = jidNormalizedUser(message.key.remoteJid);
                const senderJid = getVoiceSenderJid(message);
                const context = {
                    message,
                    audioMessage,
                    chatJid,
                    senderJid,
                    isGroup: isJidGroup(chatJid)
                };
                if (typeof voiceRecognition.shouldProcess === 'function' && !(await voiceRecognition.shouldProcess(context))) {
                    continue;
                }
                const maxBytes = Number.isFinite(voiceRecognition.maxBytes)
                    ? Math.max(0, Number(voiceRecognition.maxBytes))
                    : DEFAULT_MAX_BYTES;
                const declaredBytes = Number(audioMessage.fileLength?.toString?.() || audioMessage.fileLength || 0);
                if (maxBytes && declaredBytes > maxBytes) {
                    continue;
                }
                const stream = await downloadContent(audioMessage, 'audio', voiceRecognition.downloadOptions || {});
                const buffer = await streamToBuffer(stream, maxBytes);
                const transcription = normalizeTranscriptionResult(await voiceRecognition.transcribe({
                    ...context,
                    buffer,
                    mimetype: audioMessage.mimetype || 'audio/ogg; codecs=opus'
                }));
                const transcript = transcription.text.trim();
                if (!transcript) {
                    continue;
                }
                const meId = sock.authState?.creds?.me?.id;
                const meLid = sock.authState?.creds?.me?.lid;
                const quoted = (voiceRecognition.allowQuotedActivation ?? true)
                    ? await isQuotedToSelf({ message, audioMessage, meId, meLid, getMessage })
                    : false;
                const phrases = quoted ? [] : await getWakePhrases(voiceRecognition, context);
                const wake = quoted ? null : matchVoiceWakePhrase(transcript, phrases);
                const activation = quoted ? 'quoted' : wake ? 'wake-phrase' : null;
                const commandText = wake
                    ? removeVoiceWakePhrase(transcript, wake.normalizedPhrase)
                    : normalizeVoiceText(transcript);
                const event = {
                    ...context,
                    ...transcription,
                    transcript,
                    commandText,
                    activation,
                    wakePhrase: wake?.phrase || null
                };
                sock.ev.emit('voice.transcription', event);
                if (activation) {
                    sock.ev.emit('voice.command', event);
                }
            }
            catch (error) {
                logger?.warn({ err: error, key: message?.key }, 'voice recognition failed');
            }
        }
    };
    sock.ev.on('messages.upsert', handler);
    return () => sock.ev.off('messages.upsert', handler);
};
