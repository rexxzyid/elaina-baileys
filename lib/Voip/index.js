/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { EventEmitter } from 'node:events';
import { createHmac, randomBytes } from 'node:crypto';
import { WasmEngine } from './wasm-engine.js';
import { RelayRtcTransport } from './relay-transport.js';
import { SignalingBridge } from './signaling.js';
import { AudioFeeder } from './audio-feeder.js';
import { VideoFeeder, VIDEO_FORMAT_I420 } from './video-feeder.js';
import { CallState } from './types.js';
export { CallState };

const SHA256_LEN = 32;


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
    const prk = createHmac("sha256", effectiveSalt).update(key).digest();
    const blocks = Math.ceil(length / SHA256_LEN);
    const okm = Buffer.alloc(blocks * SHA256_LEN);
    let prev = Buffer.alloc(0);

    for (let i = 1; i <= blocks; i += 1) {
        prev = createHmac("sha256", prk)
            .update(prev)
            .update(info)
            .update(Buffer.from([i]))
            .digest();
        prev.copy(okm, (i - 1) * SHA256_LEN);
    }

    return new Uint8Array(okm.buffer, okm.byteOffset, length);
};

const computeHmacSha256 = (data, key) => {
    const result = createHmac("sha256", Buffer.from(key)).update(data).digest();
    return new Uint8Array(result.buffer, result.byteOffset, result.byteLength);
};

const isCallReceiptNode = node => {
    if (node?.tag !== "receipt") return false;
    const child = Array.isArray(node.content) ? node.content[0] : null;
    return !!(child?.attrs?.["call-id"] || child?.attrs?.call_id);
};

export class ActiveCall extends EventEmitter {
    constructor(callId, engine, durationMs) {
        super();
        this.callId = callId;
        this.engine = engine;
        this._state = CallState.Idle;
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

        this._playlist = [];
        this._feeder = null;
        this._idleTimer = null;
        this._endWhenQueueEmpty = true;
        this._idleGraceMs = 0;

        this._attachFeeder = feeder => {
            this._feeder = feeder;
        };

        this.play = source => {
            this._playlist = [];
            if (this._feeder) {
                this._feeder.clearPlaylist();
                this._feeder.enqueue(source);
                this._feeder.skip();
                return true;
            }
            this._playlist.push(source);
            return false;
        };

        this.enqueue = source => {
            this._clearIdleTimer();
            if (this._feeder) {
                return this._feeder.enqueue(source);
            }
            const tracks = Array.isArray(source) ? source : [source];
            for (const track of tracks) {
                if (track) {
                    this._playlist.push(track);
                }
            }
            return this._playlist.length;
        };

        this.skip = () => this._feeder?.skip() ?? false;

        this.queued = () => this._feeder?.playlistLength ?? this._playlist.length;

        this.nowPlaying = () => this._feeder?.currentTrack ?? null;

        this._video = false;
        this._videoSource = "black";
        this._videoPlaylist = [];
        this._videoFeeder = null;

        this._attachVideoFeeder = feeder => {
            this._videoFeeder = feeder;
        };

        this.playVideo = source => {
            this._videoPlaylist = [];
            if (this._videoFeeder) {
                this._videoFeeder.clearPlaylist();
                this._videoFeeder.enqueue(source);
                this._videoFeeder.skip();
                return true;
            }
            this._videoPlaylist.push(source);
            return false;
        };

        this.enqueueVideo = source => {
            if (this._videoFeeder) {
                return this._videoFeeder.enqueue(source);
            }
            const tracks = Array.isArray(source) ? source : [source];
            for (const track of tracks) {
                if (track) {
                    this._videoPlaylist.push(track);
                }
            }
            return this._videoPlaylist.length;
        };

        this.skipVideo = () => this._videoFeeder?.skip() ?? false;

        this.queuedVideo = () => this._videoFeeder?.playlistLength ?? this._videoPlaylist.length;

        this.nowPlayingVideo = () => this._videoFeeder?.currentTrack ?? null;

        this.isVideo = () => this._video;

        this._screenShare = false;

        this.startScreenShare = () => {
            if (!this._video) {
                throw new Error("screen share needs a video call: pass video: true, or screenShare: true which implies it");
            }
            this._screenShare = true;
            try {
                return this.engine.startScreenShare();
            }
            catch {
                return undefined;
            }
        };

        this.stopScreenShare = () => {
            this._screenShare = false;
            try {
                return this.engine.stopScreenShare();
            }
            catch {
                return undefined;
            }
        };

        this.isScreenShare = () => this._screenShare;

        this._onVideoTrackStart = track => {
            this.emit("videotrack", track);
        };

        this._onVideoTrackEnd = track => {
            this.emit("videotrackend", track);
        };

        this._clearIdleTimer = () => {
            if (this._idleTimer) {
                clearTimeout(this._idleTimer);
                this._idleTimer = null;
            }
        };

        this._onTrackStart = track => {
            this._clearIdleTimer();
            this.emit("track", track);
        };

        this._onTrackEnd = track => {
            this.emit("trackend", track);
        };

        this._onPlaylistIdle = () => {
            this.emit("idle");
            if (!this._endWhenQueueEmpty) {
                return;
            }
            this._clearIdleTimer();
            this._idleTimer = setTimeout(() => {
                this._idleTimer = null;
                if (this._feeder?.playlistLength || this._feeder?.currentTrack) {
                    return;
                }
                this.end();
            }, this._idleGraceMs);
        };

        this._updateState = state => {
            this._state = state;
            if (state === CallState.PreacceptReceived) {
                this.emit("ringing");
            } else if (state === CallState.Active) {
                this.emit("connected");
                if (this._screenShare) {
                    try { this.engine.startScreenShare(); } catch {}
                }
            } else if (state === CallState.Idle || state === CallState.Ending) {
                this._forceEnd("ended");
            }
        };

        this._emitAudio = pcm => {
            this.emit("audio", pcm);
        };

        this._forceEnd = reason => {
            if (this._ended) return;
            this._ended = true;
            this._clearIdleTimer();
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


export class VoipClient {
    constructor(config = {}) {
        this._config = config;
        this._log = typeof config.logger === 'function'
            ? config.logger
            : config.debug ? (...args) => console.log(...args) : () => {};
        this._engine = null;
        this._relay = null;
        this._signaling = null;
        this._sock = config.socket || config.sock || config.conn || null;
        this._activeCall = null;
        this._externalSocket = !!this._sock;
        this._capturePtr = 0;
        this._captureChunkBytes = 0;
        this._captureSampleRate = 16000;
        this._captureChannels = 1;
        this._captureFramesPerChunk = 320;
        this._feeder = null;
        this._videoFeeder = null;
        this._wsCallHandler = null;
        this._wsReceiptHandler = null;
        this._captureStartRequested = false;
        this._audioStartTimer = null;

        this.connect = async () => {
            if (!this._sock) {
                throw new Error('VoipClient needs the socket you are already logged in with: new VoipClient({ socket: sock }). It never opens a session of its own, so there is no second pairing or QR scan.');
            }
            if (!this._sock.ws) {
                throw new Error('the socket has no websocket yet; call connect() once connection.update reports "open"');
            }
            await this._initVoipStack();
        };

        this.attach = async socket => {
            if (!socket) {
                throw new Error('attach needs the reconnected socket');
            }
            this._detachSocketHandlers();
            this._sock = socket;
            this._externalSocket = true;
            this._signaling?.setSocket?.(socket);
            this._bindSocketHandlers();
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
                try { this._videoFeeder?.stop(); } catch {}
                this._videoFeeder = null;
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
            await new Promise(resolve => setTimeout(resolve, 150));

            let peerDeviceJids = [];
            try {
                peerDeviceJids = await this._signaling.discoverPeerDevices(peerLid);
            } catch (err) {
                this._log("[RTC DISCOVER DEVICES ERROR]", err?.message || err);
            }

            const deviceList = peerDeviceJids.length ? peerDeviceJids : [toBareJid(peerLid)];

            try {
                await this._signaling.ensureSessionsForPeers(deviceList);
            } catch (err) {
                this._log("[RTC ENSURE SESSIONS WARNING]", err?.message || err);
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            let tcToken = null;
            try {
                this._signaling.issueTcToken(peerLid).catch(err => {
                    this._log("[RTC ISSUE TC TOKEN ASYNC ERROR]", err?.message || err);
                });

                tcToken = await Promise.race([
                    this._signaling.ensureTcToken(peerLid, targetPnJid).catch(err => {
                        this._log("[RTC ENSURE TC TOKEN ERROR]", err?.message || err);
                        return null;
                    }),
                    new Promise(resolve => setTimeout(() => resolve(null), 1500))
                ]);
            } catch (err) {
                this._log("[RTC TC TOKEN FAST PATH ERROR]", err?.message || err);
            }

            if (!tcToken || !tcToken.length) {
                this._log("[RTC TC TOKEN WARNING] TC token kosong, lanjut startCall dengan token kosong.");
                tcToken = undefined;
            }

            const callId = ("00" + randomBytes(16).toString("hex").slice(2)).toUpperCase();
            const call = new ActiveCall(callId, this._engine, durationMs);

            call._audioSource = audioSource;
            call._audioStartDelayMs = Number(opts.audioStartDelayMs ?? opts.audioDelayMs ?? 1800) || 0;
            call._playlist = Array.isArray(opts.playlist) ? opts.playlist.filter(Boolean) : [];
            call._endWhenQueueEmpty = opts.endWhenQueueEmpty ?? true;
            call._idleGraceMs = Number(opts.idleGraceMs ?? 0) || 0;
            call._screenShare = !!opts.screenShare;
            call._video = !!(opts.video ?? opts.isVideo) || call._screenShare;
            call._videoSource = opts.videoSource ?? "black";
            call._videoPlaylist = Array.isArray(opts.videoPlaylist) ? opts.videoPlaylist.filter(Boolean) : [];
            this._activeCall = call;

            call.once("ended", () => {
                if (this._activeCall === call) this._activeCall = null;
            });

            call.once("error", () => {
                if (this._activeCall === call) this._activeCall = null;
            });

            this._log("[RTC START CALL PARAMS]", {
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
                    isVideo: call._video,
                    isLidCall,
                    isFromDialer: false,
                    extraData: tcToken
                });
                this._log("[RTC START CALL RESULT]", startResult);
            } catch (err) {
                if (this._activeCall === call) this._activeCall = null;
                try { call._forceEnd("start_call_failed"); } catch {}
                throw err;
            }

            return call;
        };

        this.callGroup = async (groupJid, opts = {}) => {
            if (!this._engine || !this._signaling) {
                throw new Error("Not connected. Call connect() first.");
            }
            if (typeof groupJid !== "string" || !groupJid.endsWith("@g.us")) {
                throw new Error(`${JSON.stringify(groupJid)} is not a group jid`);
            }

            const metadata = opts.metadata ?? await this._sock.groupMetadata(groupJid);
            const selfPn = toBareJid(this._sock.authState?.creds?.me?.id ?? this._sock.user?.id ?? "");
            const selfLid = toBareJid(this._sock.authState?.creds?.me?.lid ?? "");
            const members = (metadata?.participants ?? [])
                .map(participant => toBareJid(participant.id ?? participant.jid ?? ""))
                .filter(jid => jid && jid !== selfPn && jid !== selfLid);
            const wanted = Array.isArray(opts.participants) && opts.participants.length
                ? opts.participants.map(toBareJid)
                : members;

            if (!wanted.length) {
                throw new Error(`no one to call in ${groupJid}`);
            }

            const pnUserJids = [];
            const lidUserJids = [];
            const deviceJidsCsv = [];

            for (const member of wanted) {
                const isLid = member.endsWith("@lid");
                const lid = isLid ? member : await this._signaling.resolveLid(member).catch(() => null);
                const pn = isLid ? "" : member;
                if (pn) {
                    pnUserJids.push(pn);
                }
                if (lid) {
                    lidUserJids.push(lid);
                    let devices = [];
                    try {
                        devices = await this._signaling.discoverPeerDevices(lid);
                    } catch (err) {
                        this._log("[RTC GROUP DISCOVER DEVICES ERROR]", member, err?.message || err);
                    }
                    deviceJidsCsv.push((devices.length ? devices : [lid]).join(","));
                }
            }

            if (!lidUserJids.length) {
                throw new Error(`could not resolve a LID for anyone in ${groupJid}`);
            }

            const flatDevices = deviceJidsCsv.join(",").split(",").filter(Boolean);
            try {
                await this._signaling.ensureSessionsForPeers(flatDevices);
            } catch (err) {
                this._log("[RTC GROUP ENSURE SESSIONS WARNING]", err?.message || err);
            }

            const callId = ("00" + randomBytes(16).toString("hex").slice(2)).toUpperCase();
            const call = new ActiveCall(callId, this._engine, opts.durationMs ?? 120000);

            call._audioSource = opts.audioSource ?? "silence";
            call._audioStartDelayMs = Number(opts.audioStartDelayMs ?? opts.audioDelayMs ?? 1800) || 0;
            call._playlist = Array.isArray(opts.playlist) ? opts.playlist.filter(Boolean) : [];
            call._endWhenQueueEmpty = opts.endWhenQueueEmpty ?? true;
            call._idleGraceMs = Number(opts.idleGraceMs ?? 0) || 0;
            call._screenShare = !!opts.screenShare;
            call._video = !!(opts.video ?? opts.isVideo) || call._screenShare;
            call._videoSource = opts.videoSource ?? "black";
            call._videoPlaylist = Array.isArray(opts.videoPlaylist) ? opts.videoPlaylist.filter(Boolean) : [];
            call.groupJid = groupJid;
            this._activeCall = call;

            call.once("ended", () => {
                if (this._activeCall === call) this._activeCall = null;
            });

            this._log("[RTC START GROUP CALL PARAMS]", { groupJid, callId, pnUserJids, lidUserJids, deviceJidsCsv });

            try {
                const startResult = this._engine.startGroupCall({
                    pnUserJids,
                    lidUserJids,
                    deviceJidsCsv,
                    callId,
                    isVideo: call._video,
                    groupJid,
                    chatName: metadata?.subject ?? ""
                });
                this._log("[RTC START GROUP CALL RESULT]", startResult);
            } catch (err) {
                if (this._activeCall === call) this._activeCall = null;
                try { call._forceEnd("start_group_call_failed"); } catch {}
                throw err;
            }

            return call;
        };

        this.joinGroupCall = async (invite, opts = {}) => {
            if (!this._engine || !this._signaling) {
                throw new Error("Not connected. Call connect() first.");
            }
            const callId = invite?.callId ?? invite?.id;
            const groupJid = invite?.groupJid ?? invite?.from;
            const callCreatorJid = invite?.callCreatorJid ?? invite?.creator ?? invite?.from;
            if (!callId || !callCreatorJid) {
                throw new Error("joinGroupCall needs at least { callId, callCreatorJid } from the incoming offer");
            }

            const call = new ActiveCall(callId, this._engine, opts.durationMs ?? 0);
            call._audioSource = opts.audioSource ?? "silence";
            call._audioStartDelayMs = Number(opts.audioStartDelayMs ?? opts.audioDelayMs ?? 1800) || 0;
            call._playlist = Array.isArray(opts.playlist) ? opts.playlist.filter(Boolean) : [];
            call._endWhenQueueEmpty = opts.endWhenQueueEmpty ?? true;
            call._idleGraceMs = Number(opts.idleGraceMs ?? 0) || 0;
            call._screenShare = !!opts.screenShare;
            call._video = !!(opts.video ?? opts.isVideo) || call._screenShare;
            call._videoSource = opts.videoSource ?? "black";
            call._videoPlaylist = Array.isArray(opts.videoPlaylist) ? opts.videoPlaylist.filter(Boolean) : [];
            call.groupJid = groupJid;
            this._activeCall = call;

            call.once("ended", () => {
                if (this._activeCall === call) this._activeCall = null;
            });

            try {
                const result = this._engine.joinOngoingCall({
                    callId,
                    callCreatorJid,
                    initialPeerJid: invite?.initialPeerJid ?? callCreatorJid,
                    pnUserJids: invite?.pnUserJids ?? [],
                    lidUserJids: invite?.lidUserJids ?? [],
                    deviceJidsCsv: invite?.deviceJidsCsv ?? [],
                    groupJid: groupJid ?? "",
                    isVideo: call._video,
                    joinAndAccept: opts.joinAndAccept ?? true,
                    chatName: invite?.chatName ?? ""
                });
                this._log("[RTC JOIN CALL RESULT]", result);
            } catch (err) {
                if (this._activeCall === call) this._activeCall = null;
                try { call._forceEnd("join_call_failed"); } catch {}
                throw err;
            }

            return call;
        };

        this.acceptCall = (isMicEnabled = true) => this._engine?.acceptCall(isMicEnabled, false);

        this.disconnect = () => {
            this._activeCall?._forceEnd("disconnect");
            this._activeCall = null;
            this._captureStartRequested = false;
            try { this._feeder?.stop(); } catch {}
            this._feeder = null;
            try { this._videoFeeder?.stop(); } catch {}
            this._videoFeeder = null;
            if (this._audioStartTimer) {
                clearTimeout(this._audioStartTimer);
                this._audioStartTimer = null;
            }
            try { this._signaling?.attachEngine?.(null); } catch {}
            this._detachSocketHandlers();
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
            try { this._videoFeeder?.stop(); } catch {}
            this._videoFeeder = null;
            if (this._audioStartTimer) {
                clearTimeout(this._audioStartTimer);
                this._audioStartTimer = null;
            }
            this._captureStartRequested = false;
            this._activeCall = null;
        };

        this._initVoipStack = async () => {
            if (!this._sock) {
                throw new Error("Socket Baileys belum tersedia.");
            }

            this._signaling = new SignalingBridge({
                sock: this._sock,
                logger: this._config.logger,
                debug: this._config.debug
            });
            await this._signaling.init();

            this._relay = new RelayRtcTransport({
                onTransportMessage: (data, ip, port) => this._engine?.handleOnTransportMessage(data, ip, port),
                onIceRtt: (rttMs, ip, port) => this._engine?.updateIceRtt(rttMs, ip, port)
            });

            this._engine = new WasmEngine({
                callbacks: {
                    onSignalingXmpp: (peerJid, callId, xmlPayload) => {
                        this._log("[RTC WASM SIGNALING XMPP]", {
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
                    onVideoCaptureStart: config => this._handleVideoCaptureStart(config),
                    onVideoCaptureStop: () => this._handleVideoCaptureStop(),
                    onDesktopCaptureStart: config => this._handleDesktopCaptureStart(config),
                    onDesktopCaptureStop: () => this._handleDesktopCaptureStop(),
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

            this._log("[RTC SELF JID]", { selfPnJid, selfLidJid });

            this._engine.initVoipStack(selfPnJid, selfPnJid, selfLidJid);
            await this._engine.waitForVoipStackReady();

            try { this._engine.updateNetworkMedium(2, 0); } catch {}

            this._bindSocketHandlers();
        };

        this._detachSocketHandlers = () => {
            const ws = this._sock?.ws;
            if (ws?.off) {
                try { if (this._wsCallHandler) ws.off("CB:call", this._wsCallHandler); } catch {}
                try { if (this._wsReceiptHandler) ws.off("CB:receipt", this._wsReceiptHandler); } catch {}
            }
            this._wsCallHandler = null;
            this._wsReceiptHandler = null;
        };

        this._bindSocketHandlers = () => {
            if (!this._sock?.ws?.on) {
                return;
            }
            this._detachSocketHandlers();

            this._wsCallHandler = node => {
                const signaling = this._signaling;
                const engine = this._engine;
                if (!signaling || !engine) return;
                if (typeof engine.isInitialized === "function" && !engine.isInitialized()) return;
                signaling.processIncomingCall(node, engine, this._activeCall?.callId ?? "");
            };

            this._wsReceiptHandler = node => {
                if (!isCallReceiptNode(node)) return;
                const signaling = this._signaling;
                const engine = this._engine;
                if (!signaling || !engine) return;
                if (typeof engine.isInitialized === "function" && !engine.isInitialized()) return;
                signaling.processIncomingReceipt(node, engine, this._activeCall?.callId ?? "");
            };

            this._sock.ws.on("CB:call", this._wsCallHandler);
            this._sock.ws.on("CB:receipt", this._wsReceiptHandler);
        };

        this._handleCallEvent = (eventType, eventData) => {
            this._log("[RTC CALL EVENT]", { eventType, hasData: !!eventData, data: eventData });

            if (eventType === 16 && eventData) {
                try {
                    const parsed = JSON.parse(eventData);
                    const info = parsed.call_info ?? parsed.callInfo ?? {};
                    const callState = Number(info.call_state ?? info.callState ?? 0);
                    this._log("[RTC CALL STATE]", callState);
                    this._activeCall?._updateState(callState);
                    if (callState === CallState.Active) {
                        this._captureStartRequested = true;
                        setTimeout(() => {
                            try { this._startAudioFeeder?.(); } catch (err) {
                                this._log("[RTC AUDIO START ON ACTIVE ERROR]", err?.message || err);
                            }
                        }, 300);
                    }
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
            if (this._captureStartRequested && this._activeCall?.state === CallState.Active) {
                setTimeout(() => {
                    try { this._startAudioFeeder?.(); } catch {}
                }, 100);
            }
        };

      this._startAudioFeeder = () => {
    this._captureStartRequested = true;

    if (this._activeCall?.state !== CallState.Active) {
        this._log("[RTC AUDIO] capture siap, tunggu call active sebelum audio start");
        return;
    }

    if (!this._engine || !this._capturePtr) {
        this._log("[RTC AUDIO] capturePtr belum siap, audio feeder batal start");
        return;
    }

    if (this._feeder) return;

    const audioDelayMs = Number(this._activeCall?._audioStartDelayMs ?? 0) || 0;
    if (audioDelayMs > 0 && !this._audioStartTimer) {
        this._log("[RTC AUDIO] call active, audio ditunda:", audioDelayMs);
        this._audioStartTimer = setTimeout(() => {
            this._audioStartTimer = null;
            if (this._activeCall?.state === CallState.Active) {
                this._activeCall._audioStartDelayMs = 0;
                this._startAudioFeeder();
            }
        }, audioDelayMs);
        return;
    }

    if (this._audioStartTimer) return;

    const call = this._activeCall;
    const playlist = call?._playlist?.length ? [...call._playlist] : [call?._audioSource ?? "silence"];

    this._log("[RTC AUDIO] start feeder:", {
        playlist,
        sampleRate: this._captureSampleRate,
        channels: this._captureChannels,
        framesPerChunk: this._captureFramesPerChunk
    });

    this._feeder = new AudioFeeder(
        this._captureSampleRate,
        this._captureChannels,
        this._captureFramesPerChunk,
        chunk => {
            if (this._engine && this._capturePtr && (!this._engine.isInitialized || this._engine.isInitialized())) {
                this._engine.sendAudioData(chunk, this._capturePtr);
            }
        },
        undefined,
        {
            onTrackStart: track => call?._onTrackStart(track),
            onTrackEnd: track => call?._onTrackEnd(track),
            onIdle: () => call?._onPlaylistIdle(),
            ffmpegPath: this._config.ffmpegPath
        }
    );

    call?._attachFeeder(this._feeder);
    this._feeder.start(playlist);
};

this._startVideoFeeder = (config, useDesktopCapture) => {
    const call = this._activeCall;
    const label = useDesktopCapture ? "SCREEN" : "VIDEO";
    if (!call?._video) {
        this._log(`[RTC ${label}] capture diminta tapi call ini bukan video, diabaikan`);
        return;
    }
    if (this._videoFeeder) {
        return;
    }
    const width = config?.width ?? 640;
    const height = config?.height ?? 480;
    const fps = config?.fps ?? 24;
    const playlist = call._videoPlaylist?.length ? [...call._videoPlaylist] : [call._videoSource ?? "black"];

    this._log(`[RTC ${label}] start feeder:`, { width, height, fps, playlist });

    this._videoFeeder = new VideoFeeder(
        width,
        height,
        fps,
        (frame, w, h, rate) => {
            if (this._engine && (!this._engine.isInitialized || this._engine.isInitialized())) {
                this._engine.sendVideoFrame(frame, w, h, rate, VIDEO_FORMAT_I420, 0, useDesktopCapture);
            }
        },
        undefined,
        {
            onTrackStart: track => call._onVideoTrackStart(track),
            onTrackEnd: track => call._onVideoTrackEnd(track),
            ffmpegPath: this._config.ffmpegPath
        }
    );

    call._attachVideoFeeder(this._videoFeeder);
    this._videoFeeder.start(playlist);
};

this._stopVideoFeeder = label => {
    this._log(`[RTC ${label}] stop feeder`);
    try { this._videoFeeder?.stop(); } catch {}
    this._videoFeeder = null;
    try { this._engine?.releaseVideoFrameBuffer?.(); } catch {}
};

this._handleVideoCaptureStart = config => this._startVideoFeeder(config, false);
this._handleVideoCaptureStop = () => this._stopVideoFeeder("VIDEO");
this._handleDesktopCaptureStart = config => this._startVideoFeeder(config, true);
this._handleDesktopCaptureStop = () => this._stopVideoFeeder("SCREEN");

this._handleAudioCaptureStart = () => {
    this._captureStartRequested = true;
    if (this._activeCall?.state === CallState.Active) {
        this._startAudioFeeder();
    } else {
        this._log("[RTC AUDIO] startCaptureJS diterima sebelum active, audio ditahan dulu");
    }
};

        this._handleAudioCaptureStop = () => {
            this._captureStartRequested = false;
            this._feeder?.stop();
            this._feeder = null;
            try { this._videoFeeder?.stop(); } catch {}
            this._videoFeeder = null;
            if (this._engine && this._capturePtr) {
                try { this._engine.free(this._capturePtr); } catch {}
                this._capturePtr = 0;
            }
        };
    }
}

export { VideoFeeder, VIDEO_FORMAT_I420 } from './video-feeder.js';
export { AudioFeeder } from './audio-feeder.js';
export const makeVoipClient = async (socket, config = {}) => {
    const client = new VoipClient({ ...config, socket });
    await client.connect();
    return client;
};
export default VoipClient;
