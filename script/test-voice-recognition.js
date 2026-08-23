import assert from 'node:assert/strict';
import { bindVoiceRecognition, matchVoiceWakePhrase, normalizeVoiceText, removeVoiceWakePhrase } from '../lib/Utils/voice-recognition.js';

const BOT = '628111111111@s.whatsapp.net';
const USER = '628222222222@s.whatsapp.net';

const makeHarness = options => {
    const listeners = new Map();
    const emitted = [];
    const ev = {
        on(name, handler) {
            const list = listeners.get(name) || [];
            list.push(handler);
            listeners.set(name, list);
        },
        off(name, handler) {
            listeners.set(name, (listeners.get(name) || []).filter(item => item !== handler));
        },
        emit(name, data) {
            if (name !== 'messages.upsert') {
                emitted.push({ name, data });
            }
        }
    };
    const sock = {
        ev,
        authState: {
            creds: {
                me: {
                    id: BOT
                }
            }
        }
    };
    const downloadContentFromMessage = async () => (async function* () {
        yield Buffer.from('voice');
    })();
    bindVoiceRecognition(sock, {
        getMessage: async () => undefined,
        voiceRecognition: {
            enabled: true,
            transcribe: async () => options.transcript,
            wakePhrases: options.wakePhrases,
            getWakePhrases: options.getWakePhrases,
            allowQuotedActivation: options.allowQuotedActivation,
            pttOnly: options.pttOnly,
            maxDuration: options.maxDuration
        }
    }, { downloadContentFromMessage });
    return {
        emitted,
        async dispatch(message) {
            await Promise.all((listeners.get('messages.upsert') || []).map(handler => handler({ messages: [message], type: 'notify' })));
        }
    };
};

const message = ({ contextInfo, ptt = true, seconds = 8 } = {}) => ({
    key: {
        remoteJid: USER,
        fromMe: false,
        id: 'VOICE-1'
    },
    message: {
        audioMessage: {
            ptt,
            seconds,
            mimetype: 'audio/ogg; codecs=opus',
            mediaKey: Buffer.alloc(32, 1),
            directPath: '/voice',
            contextInfo
        }
    }
});

assert.equal(normalizeVoiceText('Hai, Elaina-Baileys!'), 'hai elaina baileys');
assert.equal(matchVoiceWakePhrase('Hai Elaina Baileys tolong buka menu', ['hai elaina-baileys'])?.phrase, 'hai elaina-baileys');
assert.equal(removeVoiceWakePhrase('Hai Elaina Baileys tolong buka menu', 'hai elaina-baileys'), 'tolong buka menu');

const wake = makeHarness({
    transcript: 'Hai Elaina Baileys, tolong buka menu',
    getWakePhrases: async ({ senderJid }) => senderJid === USER ? ['hai elaina-baileys'] : []
});
await wake.dispatch(message());
assert.equal(wake.emitted.filter(event => event.name === 'voice.transcription').length, 1);
assert.equal(wake.emitted.filter(event => event.name === 'voice.command').length, 1);
assert.equal(wake.emitted.find(event => event.name === 'voice.command').data.activation, 'wake-phrase');
assert.equal(wake.emitted.find(event => event.name === 'voice.command').data.commandText, 'tolong buka menu');

const quoted = makeHarness({ transcript: 'Tolong buka menu' });
await quoted.dispatch(message({
    contextInfo: {
        stanzaId: 'BOT-MESSAGE',
        participant: BOT,
        quotedMessage: {
            conversation: 'menu'
        }
    }
}));
assert.equal(quoted.emitted.find(event => event.name === 'voice.command').data.activation, 'quoted');
assert.equal(quoted.emitted.find(event => event.name === 'voice.command').data.commandText, 'tolong buka menu');

const ignored = makeHarness({ transcript: 'Besok kita pergi jam tujuh', wakePhrases: ['hai elaina'] });
await ignored.dispatch(message());
assert.equal(ignored.emitted.filter(event => event.name === 'voice.transcription').length, 1);
assert.equal(ignored.emitted.filter(event => event.name === 'voice.command').length, 0);

const notPtt = makeHarness({ transcript: 'Hai Elaina buka menu', wakePhrases: ['hai elaina'] });
await notPtt.dispatch(message({ ptt: false }));
assert.equal(notPtt.emitted.length, 0);

const tooLong = makeHarness({ transcript: 'Hai Elaina buka menu', wakePhrases: ['hai elaina'], maxDuration: 5 });
await tooLong.dispatch(message({ seconds: 8 }));
assert.equal(tooLong.emitted.length, 0);

console.log('voice recognition tests passed');
