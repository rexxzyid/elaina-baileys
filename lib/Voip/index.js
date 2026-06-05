"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoipClient = exports.ActiveCall = exports.CallState = void 0;

const events_1 = require("node:events");
const crypto_1 = require("node:crypto");
const path_1 = require("node:path");
const wasm_engine_js_1 = require("./wasm-engine.js");
const relay_transport_js_1 = require("./relay-transport.js");
const signaling_js_1 = require("./signaling.js");
const audio_feeder_js_1 = require("./audio-feeder.js");
const types_js_1 = require("./types.js");

Object.defineProperty(exports, "CallState", {
    enumerable: true,
    get: function () {
        return types_js_1.CallState;
    }
});

const SHA256_LEN = 32;

const loadBaileys = async () => {
    try {
        return await import("../index.js");
    } catch {
        throw new Error("Could not import internal Elaina Baileys module.");
    }
};

const toBareJid = jid => {
    if (!jid) return jid;
    const value = String(jid);
    const at = value.indexOf("@");
    if (at < 0) return value;
    const user = value.slice(0, at).split(":")[0];
    return `${user}@${value.slice(at + 1)}`;
};

const toDeviceJid = jid => {
    if (!jid) return jid;
    const value = String(jid);
    const at = value.indexOf("@");
    if (at < 0) return value;
    const user = value.slice(0, at).split(":")[0];
    const server = value.slice(at + 1);
    return `${user}:0@${server}`;
};

const computeHkdf = (key, salt, info, length) => {
    const effectiveSalt = salt && salt.length > 0 ? Buffer.from(salt) : Buffer.alloc(SHA256_LEN, 0);
    const prk = (0, crypto_1.createHmac)("sha256", effectiveSalt).update(key).digest();
    const blocks = Math.ceil(length / SHA256_LEN);
    const okm = Buffer.alloc(blocks * SHA256_LEN);
    let prev = Buffer.alloc(0);

    for (let i = 1; i <= blocks; i += 1) {
        prev = (0, crypto_1.createHmac)("sha256", prk)
            .update(prev)
            .update(info)
            .update(Buffer.from([i]))
            .digest();
        prev.copy(okm, (i - 1) * SHA256_LEN);
    }

    return new Uint8Array(okm.buffer, okm.byteOffset, length);
};

const computeHmacSha256 = (data, key) => {
    const result = (0, crypto_1.createHmac)("sha256", Buffer.from(key)).update(data).digest();
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
};

const isCallReceiptNode = node => {
    if (node?.tag !== "receipt") return false;
    const child = Array.isArray(node.content) ? node.content[0] : null;
    return !!(child?.attrs?.["call-id"] || child?.attrs?.call_id);
};

class ActiveCall extends events_1.EventEmitter {
    constructor(callId, engine, durationMs) {
        super();
        this.callId = callId;
        this.engine = engine;
        this._state = types_js_1.CallState.Idle;
        this._endResolver = undefined;
        this._endPromise = undefined;
        this._endTimer = null;
        this._ended = false;
        this._audioSource = "silence";

        this.end = () => {
            if (this._ended) return;
            try { this.engine.endCall(0, true); } catch {}
            this._forceEnd("local_end");
        };

        this.mute = muted => {
            try { this.engine.setMute(muted); } catch {}
        };

        this.waitForEnd = () => this._endPromise;

        this._updateState = state => {
            this._state = state;
            if (state === types_js_1.CallState.PreacceptReceived) {
                this.emit("ringing");
            } else if (state === types_js_1.CallState.Active) {
                this.emit("connected");
            } else if (state === types_js_1.CallState.Idle || state === types_js_1.CallState.Ending) {
                this._forceEnd("ended");
            }
        };

        this._emitAudio = pcm => {
            this.emit("audio", pcm);
        };

        this._forceEnd = reason => {
            if (this._ended) return;
            this._ended = true;
            if (this._endTimer) {
                clearTimeout(this._endTimer);
                this._endTimer = null;
            }
            this.emit("ended", reason);
            this._endResolver(reason);
        };

        this._endPromise = new Promise(resolve => {
            this._endResolver = resolve;
        });

        if (durationMs > 0) {
            this._endTimer = setTimeout(() => this.end(), durationMs);
        }
    }

    get state() {
        return this._state;
    }
}

exports.ActiveCall = ActiveCall;

class VoipClient {
    constructor(config = {}) {
        this._config = config;
        this._engine = null;
        this._relay = null;
        this._signaling = null;
        this._sock = config.socket || config.sock || config.conn || null;
        this._activeCall = null;
        this._baileys = null;
        this._externalSocket = !!this._sock;
        this._capturePtr = 0;
        this._captureChunkBytes = 0;
        this._captureSampleRate = 16000;
        this._captureChannels = 1;
        this._captureFramesPerChunk = 320;
        this._feeder = null;

        this.connect = async () => {
            this._baileys = await loadBaileys();

            if (this._sock) {
                await this._initVoipStack();
                return;
            }

            const { useMultiFileAuthState, default: makeWASocket, DisconnectReason } = this._baileys;
            const makeSocket = makeWASocket ?? this._baileys.makeWASocket ?? this._baileys;

            if (!this._config.authDir) {
                throw new Error("authDir wajib diisi jika tidak memakai socket/conn.");
            }

            const authDir = (0, path_1.resolve)(this._config.authDir);
            const { state, saveCreds } = await useMultiFileAuthState(authDir);

            const silentLogger = {
                level: "silent",
                child: () => silentLogger,
                trace: () => {},
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {},
                fatal: () => {}
            };

            const createSocket = () => makeSocket({
                auth: state,
                emitOwnEvents: true,
                logger: silentLogger
            });

            await new Promise((resolveOpen, rejectOpen) => {
                let opened = false;
                let retries = 0;
                const maxRetries = 5;

                const connectSocket = () => {
                    this._sock = createSocket();
                    this._sock.ev.on("creds.update", saveCreds);

                    const onUncaughtException = err => {
                        const code = err?.output?.statusCode ?? err?.data?.attrs?.code;
                        if ((code === 515 || code === "515") && !opened && retries < maxRetries) {
                            retries += 1;
                            setTimeout(connectSocket, 1500);
                            return;
                        }
                        if (!opened) {
                            process.off("uncaughtException", onUncaughtException);
                            rejectOpen(err);
                        }
                    };

                    process.on("uncaughtException", onUncaughtException);

                    this._sock.ev.on("connection.update", update => {
                        if (update.qr) {
                            console.log("QR diterima, tapi qrcode-terminal tidak dipakai.");
                            console.log(update.qr);
                        }
                        if (update.connection === "open") {
                            opened = true;
                            process.off("uncaughtException", onUncaughtException);
                            resolveOpen();
                            return;
                        }
                        if (update.connection === "close" && !opened) {
                            const statusCode = update.lastDisconnect?.error?.output?.statusCode;
                            const shouldReconnect = statusCode === 515 || statusCode === DisconnectReason?.restartRequired;
                            if (shouldReconnect && retries < maxRetries) {
                                retries += 1;
                                setTimeout(connectSocket, 1000);
                            } else {
                                process.off("uncaughtException", onUncaughtException);
                                rejectOpen(update.lastDisconnect?.error ?? new Error("socket closed before open"));
                            }
                        }
                    });
                };

                connectSocket();
            });

            await this._initVoipStack();
        };

        this.call = async (phoneNumber, opts = {}) => {
            if (!this._engine || !this._signaling) {
                throw new Error("Not connected. Call connect() first.");
            }

            if (this._activeCall) {
                try { this._activeCall._forceEnd("replaced"); } catch {}
                try { this._engine?.endCall?.(0, true); } catch {}
                try { this._feeder?.stop(); } catch {}
                this._feeder = null;
                this._activeCall = null;
            }

            const targetNumber = phoneNumber.replace(/\D/g, "");
            if (!targetNumber) {
                throw new Error("Nomor target tidak valid.");
            }

            const targetPnJid = `${targetNumber}@s.whatsapp.net`;
            const durationMs = opts.durationMs ?? 120000;
            const audioSource = opts.audioSource ?? "silence";

            const peerLid = await this._signaling.resolveLid(targetPnJid);
            if (!peerLid) {
                throw new Error(`Tidak bisa resolve LID untuk ${targetPnJid}. Pastikan target valid dan sudah tersimpan mapping LID/PN atau USync LID bisa diakses.`);
            }

            const peerJid = peerLid;
            const peerPn = targetPnJid;
            const isLidCall = true;

            for (const jid of [targetPnJid, peerLid]) {
                try { await this._sock.presenceSubscribe(jid); } catch {}
            }
            await new Promise(resolve => setTimeout(resolve, 750));

            let peerDeviceJids = [];
            try {
                peerDeviceJids = await this._signaling.discoverPeerDevices(peerLid);
            } catch (err) {
                console.error("[RTC DISCOVER DEVICES ERROR]", err?.message || err);
            }

            const deviceList = peerDeviceJids.length ? peerDeviceJids : [toBareJid(peerLid)];

            try {
                await this._signaling.ensureSessionsForPeers(deviceList);
            } catch (err) {
                console.error("[RTC ENSURE SESSIONS WARNING]", err?.message || err);
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                await this._signaling.issueTcToken(peerLid);
            } catch (err) {
                console.error("[RTC ISSUE TC TOKEN ERROR]", err?.message || err);
            }

            let tcToken = null;
            try {
                tcToken = await this._signaling.ensureTcToken(peerLid, targetPnJid);
            } catch (err) {
                console.error("[RTC ENSURE TC TOKEN ERROR]", err?.message || err);
            }

            if (!tcToken || !tcToken.length) {
    console.warn("[RTC TC TOKEN WARNING] TC token kosong, lanjut startCall dengan token kosong seperti baileys-caller rc11.");
    tcToken = undefined;
}

            const callId = ("00" + (0, crypto_1.randomBytes)(16).toString("hex").slice(2)).toUpperCase();
            const call = new ActiveCall(callId, this._engine, durationMs);

            call._audioSource = audioSource;
            this._activeCall = call;

            call.once("ended", () => {
                if (this._activeCall === call) this._activeCall = null;
            });

            call.once("error", () => {
                if (this._activeCall === call) this._activeCall = null;
            });

            console.log("[RTC START CALL PARAMS]", {
                peerJid,
                peerPn,
                peerList: deviceList,
                callId,
                isLidCall,
                targetPnJid,
                peerLid,
                hasTcToken: !!tcToken,
                tcTokenLength: tcToken?.length || 0
            });

            try {
                const startResult = this._engine.startCall({
                    peerJid,
                    peerPn,
                    peerList: deviceList,
                    callId,
                    isVideo: false,
                    isLidCall,
                    isFromDialer: false,
                    extraData: tcToken
                });
                console.log("[RTC START CALL RESULT]", startResult);
                setTimeout(() => {
    try {
        this._startAudioFeeder?.();
    } catch (err) {
        console.error("[RTC AUDIO FORCE START ERROR]", err?.message || err);
    }
}, 1500);
            } catch (err) {
                if (this._activeCall === call) this._activeCall = null;
                try { call._forceEnd("start_call_failed"); } catch {}
                throw err;
            }

            return call;
        };

        this.disconnect = () => {
            this._activeCall?._forceEnd("disconnect");
            this._activeCall = null;
            try { this._feeder?.stop(); } catch {}
            this._feeder = null;
            this._relay?.closeAll();
            this._engine?.destroy();
            if (!this._externalSocket) {
                this._sock?.end?.();
            }
            this._engine = null;
            this._relay = null;
            this._signaling = null;
            if (!this._externalSocket) {
                this._sock = null;
            }
        };

        this.resetCallState = () => {
            try { this._activeCall?._forceEnd("reset"); } catch {}
            try { this._engine?.endCall?.(0, true); } catch {}
            try { this._feeder?.stop(); } catch {}
            this._feeder = null;
            this._activeCall = null;
        };

        this._initVoipStack = async () => {
            if (!this._sock) {
                throw new Error("Socket Baileys belum tersedia.");
            }

            this._signaling = new signaling_js_1.SignalingBridge({ sock: this._sock });
            await this._signaling.init();

            this._relay = new relay_transport_js_1.RelayRtcTransport({
                onTransportMessage: (data, ip, port) => this._engine?.handleOnTransportMessage(data, ip, port),
                onIceRtt: (rttMs, ip, port) => this._engine?.updateIceRtt(rttMs, ip, port)
            });

            this._engine = new wasm_engine_js_1.WasmEngine({
                callbacks: {
                    onSignalingXmpp: (peerJid, callId, xmlPayload) => {
                        console.log("[RTC WASM SIGNALING XMPP]", {
                            peerJid,
                            callId,
                            payloadLength: xmlPayload?.length || 0
                        });
                        return this._signaling.sendSignaling(peerJid, callId, xmlPayload);
                    },
                    onCallEvent: (eventType, eventData) => this._handleCallEvent(eventType, eventData),
                    sendDataToRelay: (data, ip, port) => this._relay.send(data, ip, port),
                    onAudioCaptureInit: config => this._handleAudioCaptureInit(config),
                    onAudioCaptureStart: () => this._handleAudioCaptureStart(),
                    onAudioCaptureStop: () => this._handleAudioCaptureStop(),
                    onAudioPlaybackData: audioData => this._activeCall?._emitAudio(audioData),
                    cryptoHkdf: computeHkdf,
                    hmacSha256: computeHmacSha256
                }
            });

            await this._engine.initialize();
            this._signaling.attachEngine(this._engine);

            const selfPnJidRaw =
                this._sock.authState?.creds?.me?.id ||
                this._sock.authState?.creds?.me?.jid ||
                this._sock.user?.id ||
                this._sock.user?.jid;

            const selfPnJid = toBareJid(selfPnJidRaw);
            const selfLidJid =
                this._sock.authState?.creds?.me?.lid ||
                this._sock.authState?.creds?.me?.lidJid ||
                "";

            if (!selfPnJid) {
                throw new Error("Tidak bisa membaca JID bot dari socket utama.");
            }

            console.log("[RTC SELF JID]", { selfPnJid, selfLidJid });

            this._engine.initVoipStack(selfPnJid, selfPnJid, selfLidJid);
            await this._engine.waitForVoipStackReady();

            try { this._engine.updateNetworkMedium(2, 0); } catch {}

            if (this._sock.ws?.on) {
                this._sock.ws.on("CB:call", node => {
                    this._signaling.processIncomingCall(node, this._engine, this._activeCall?.callId ?? "");
                });

                this._sock.ws.on("CB:receipt", node => {
                    if (!isCallReceiptNode(node)) return;
                    this._signaling.processIncomingReceipt(node, this._engine, this._activeCall?.callId ?? "");
                });
            }
        };

        this._handleCallEvent = (eventType, eventData) => {
            console.log("[RTC CALL EVENT]", { eventType, hasData: !!eventData, data: eventData });

            if (eventType === 16 && eventData) {
                try {
                    const parsed = JSON.parse(eventData);
                    const info = parsed.call_info ?? parsed.callInfo ?? {};
                    const callState = Number(info.call_state ?? info.callState ?? 0);
                    console.log("[RTC CALL STATE]", callState);
                    this._activeCall?._updateState(callState);
                } catch {}
            } else if (eventType === 156 && eventData) {
                try {
                    const update = JSON.parse(eventData);
                    this._relay?.updateRelayList(update);
                } catch {}
            } else if (eventType === 2) {
                this._activeCall?._forceEnd("remote_end");
            }
        };

        this._handleAudioCaptureInit = config => {
            if (!this._engine) return;
            this._captureSampleRate = config.sampleRate || 16000;
            this._captureChannels = config.channels || 1;
            this._captureFramesPerChunk = config.framesPerChunk || 320;
            const chunkSamples = this._captureFramesPerChunk * this._captureChannels;
            this._captureChunkBytes = chunkSamples * Float32Array.BYTES_PER_ELEMENT;
            this._capturePtr = this._engine.malloc(this._captureChunkBytes);
        };

      this._startAudioFeeder = () => {
    if (!this._engine || !this._capturePtr) {
        console.warn("[RTC AUDIO] capturePtr belum siap, audio feeder batal start");
        return;
    }

    if (this._feeder) return;

    const audioSource = this._activeCall?._audioSource ?? "silence";

    console.log("[RTC AUDIO] start feeder:", {
        audioSource,
        sampleRate: this._captureSampleRate,
        channels: this._captureChannels,
        framesPerChunk: this._captureFramesPerChunk
    });

    this._feeder = new audio_feeder_js_1.AudioFeeder(
        this._captureSampleRate,
        this._captureChannels,
        this._captureFramesPerChunk,
        chunk => {
            if (this._engine && this._capturePtr) {
                this._engine.sendAudioData(chunk, this._capturePtr);
            }
        },
        audioSource
    );

    this._feeder.start();
};

this._handleAudioCaptureStart = () => {
    this._startAudioFeeder();
};

        this._handleAudioCaptureStop = () => {
            this._feeder?.stop();
            this._feeder = null;
            if (this._engine && this._capturePtr) {
                try { this._engine.free(this._capturePtr); } catch {}
                this._capturePtr = 0;
            }
        };
    }
}

exports.VoipClient = VoipClient;
exports.default = VoipClient;

module.exports = VoipClient;
module.exports.VoipClient = VoipClient;
module.exports.ActiveCall = ActiveCall;
module.exports.CallState = types_js_1.CallState;
module.exports.default = VoipClient;
Object.defineProperty(module.exports, "__esModule", { value: true });
