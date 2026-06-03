"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalingBridge = void 0;

const S_WHATSAPP_NET = "@s.whatsapp.net";
const TC_TOKEN_REQUEST_TIMEOUT_MS = 3500;
const SESSION_CACHE_TTL_MS = 5 * 60000;
const ACK_TIMEOUT_MS = 15000;

let _baileysModule = null;

const loadBaileys = async () => {
    if (_baileysModule) {
        return _baileysModule;
    }

    try {
        _baileysModule = await import("../index.js");
        return _baileysModule;
    } catch {
        throw new Error("Could not import internal Elaina Baileys module.");
    }
};

const getNodeChildren = node => Array.isArray(node.content) ? node.content : [];

const setNodeChildren = (node, children) => {
    node.content = children.length ? children : undefined;
};

const replaceNodeChild = (node, tag, nextChild) => {
    const children = getNodeChildren(node);
    const index = children.findIndex(child => child.tag === tag);

    if (index >= 0) {
        children[index] = nextChild;
    } else {
        children.push(nextChild);
    }

    setNodeChildren(node, children);
};

const removeNodeChildrenByTag = (node, tag) => {
    setNodeChildren(
        node,
        getNodeChildren(node).filter(child => child.tag !== tag)
    );
};

const parseCountAttr = (value, fallback = 0) => {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : fallback;
};

class SignalingBridge {
    constructor(config) {
        this._sock = config.sock;
        this._baileys = null;
        this._voip = null;
        this._observedTcTokens = new Map();
        this._pendingTcTokenWaiters = new Map();
        this._ensuredSignalSessions = new Map();
        this._remoteDevicePeerByCallId = new Map();
        this._remoteObfuscatedPeerByCallId = new Map();
        this._remoteXmppRoutePeerByCallId = new Map();
        this._incomingCallPeerById = new Map();
        this._outgoingSignalingQueue = Promise.resolve(undefined);
        this._incomingSignalingQueue = Promise.resolve(undefined);

        this.attachEngine = voip => {
            this._voip = voip;
        };

        this.init = async () => {
            this._baileys = await loadBaileys();

            const originalKeysSet = this._sock.authState.keys.set.bind(this._sock.authState.keys);

            this._sock.authState.keys.set = async data => {
                const result = await originalKeysSet(data);

                for (const [jid, entry] of Object.entries(data?.tctoken ?? {})) {
                    if (entry?.token instanceof Uint8Array && entry.token.length > 0) {
                        this._rememberTcToken(jid, entry.token, entry.timestamp);
                    }
                }

                return result;
            };
        };

        this.sendSignaling = (peerJid, callId, xmlPayload) => {
            this._outgoingSignalingQueue = this._outgoingSignalingQueue
                .then(() => this._doSendSignaling(peerJid, callId, xmlPayload))
                .catch(() => { });
        };

        this.processIncomingCall = (node, voip, activeCallId) => {
            this._incomingSignalingQueue = this._incomingSignalingQueue
                .then(() => this._doProcessIncomingCall(node, voip, activeCallId))
                .catch(() => { });
        };

        this.processIncomingReceipt = (node, voip, activeCallId) => {
            this._incomingSignalingQueue = this._incomingSignalingQueue
                .then(() => this._doProcessIncomingReceipt(node, voip, activeCallId))
                .catch(() => { });
        };

        this.requestTcToken = async jid => {
            const userJid = this._toBareJid(jid);
            const cached = await this._getTcToken(userJid);

            if (cached?.length) {
                return cached;
            }

            try {
                const response = await this._sock.getPrivacyTokens([userJid]);
                const { getBinaryNodeChild, getAllBinaryNodeChildren } = this._baileys;

                const tokensNode =
                    getBinaryNodeChild(response, "tokens") ??
                    getBinaryNodeChild(getBinaryNodeChild(response, "iq"), "tokens");

                const tokenNodes = tokensNode
                    ? getAllBinaryNodeChildren(tokensNode).filter(child => child.tag === "token")
                    : [];

                for (const tokenNode of tokenNodes) {
                    const tokenJid = String(tokenNode.attrs.jid ?? "");

                    if (
                        this._baileys.jidNormalizedUser(tokenJid) !==
                        this._baileys.jidNormalizedUser(userJid)
                    ) {
                        continue;
                    }

                    const content = tokenNode.content;

                    if (content instanceof Uint8Array && content.length > 0) {
                        const token = Buffer.from(content);

                        await this._sock.authState.keys.set({
                            tctoken: {
                                [userJid]: {
                                    token,
                                    timestamp: String(tokenNode.attrs.t ?? "")
                                }
                            }
                        });

                        return token;
                    }
                }
            } catch { }

            return this._getTcToken(userJid);
        };

        this.ensureTcToken = async (...jids) => {
            const uniqueJids = [
                ...new Set(
                    jids
                        .map(jid => this._toBareJid(String(jid ?? "").trim()))
                        .filter(Boolean)
                )
            ];

            for (const jid of uniqueJids) {
                const cached = await this._getTcToken(jid);

                if (cached?.length) {
                    return cached;
                }
            }

            for (const jid of uniqueJids) {
                const fetched = await Promise.race([
                    this.requestTcToken(jid),
                    new Promise(resolve => setTimeout(() => resolve(undefined), TC_TOKEN_REQUEST_TIMEOUT_MS))
                ]);

                if (fetched?.length) {
                    return fetched;
                }
            }

            return undefined;
        };

        this.discoverPeerDevices = async peerLidJid => {
            const devices = await this._sock.getUSyncDevices([peerLidJid], true, false);

            return this._normalizeStartCallPeerList(
                devices.map(device => device.jid).filter(Boolean)
            );
        };

        this.ensureSessionsForPeers = async jids => {
            const targets = this._expandSignalSessionTargets(jids);

            if (targets.length) {
                await this._ensureSignalSessions(targets, true);
            }
        };

        this.resolveLid = async pnJid => {
            return this._sock.signalRepository.lidMapping?.getLIDForPN(pnJid);
        };

        this.issueTcToken = async jid => {
            const userJid = this._toBareJid(jid);
            const issuedAt = Math.floor(Date.now() / 1000);

            try {
                await this._sock.query({
                    tag: "iq",
                    attrs: {
                        to: S_WHATSAPP_NET,
                        type: "set",
                        xmlns: "privacy",
                        id: this._sock.generateMessageTag()
                    },
                    content: [
                        {
                            tag: "tokens",
                            attrs: {},
                            content: [
                                {
                                    tag: "token",
                                    attrs: {
                                        jid: userJid,
                                        t: String(issuedAt),
                                        type: "trusted_contact"
                                    }
                                }
                            ]
                        }
                    ]
                });

                return true;
            } catch {
                return false;
            }
        };

        this.getRemoteDeviceJid = callId => {
            return this._remoteDevicePeerByCallId.get(callId);
        };

        this._doSendSignaling = async (peerJid, callId, xmlPayload) => {
            const { decodeBinaryNode, getBinaryNodeChild } = this._baileys;
            const rawPayload = Buffer.from(xmlPayload);
            let voipNode;

            try {
                voipNode = await decodeBinaryNode(Buffer.concat([Buffer.from([0]), rawPayload]));
            } catch {
                voipNode = await decodeBinaryNode(rawPayload);
            }

            const signalingTag = String(voipNode.tag);
            const effectivePeerJid = this._resolveOutboundPeerJid(callId, peerJid);

            if (signalingTag === "offer" && !voipNode.attrs["call-creator"]) {
                const selfLid = this._sock.authState.creds.me?.lid;

                if (selfLid) {
                    voipNode.attrs["call-creator"] = selfLid;
                }
            }

            const destination = getBinaryNodeChild(voipNode, "destination");

            if (destination) {
                const destinations = getNodeChildren(destination);
                const destinationJids = destinations
                    .map(node => String(node.attrs.jid ?? "").trim())
                    .filter(Boolean);

                const sessionTargets = this._expandSignalSessionTargets(destinationJids);

                if (sessionTargets.length) {
                    await this._ensureSignalSessions(sessionTargets, signalingTag === "offer");
                }

                const rootEnc = getBinaryNodeChild(voipNode, "enc");
                const encCount = parseCountAttr(rootEnc?.attrs.count);
                let includeDeviceIdentity = false;

                for (const destNode of destinations) {
                    const targetJid = String(destNode.attrs.jid ?? "").trim();
                    const destEnc = getBinaryNodeChild(destNode, "enc");

                    if (!targetJid || !destEnc || !(destEnc.content instanceof Uint8Array)) {
                        continue;
                    }

                    try {
                        const encrypted = await this._encryptCallKey(targetJid, destEnc.content, encCount);
                        includeDeviceIdentity = includeDeviceIdentity || encrypted.shouldIncludeDeviceIdentity;
                        setNodeChildren(destNode, [encrypted.encNode]);
                    } catch {
                        for (const destinationNode of destinations) {
                            removeNodeChildrenByTag(destinationNode, "enc");
                        }

                        break;
                    }
                }

                if (includeDeviceIdentity) {
                    this._appendDeviceIdentity(voipNode);
                }

                await this._sendCallStanza(
                    this._toBareJid(peerJid),
                    voipNode,
                    signalingTag,
                    effectivePeerJid,
                    peerJid
                );

                return;
            }

            if (signalingTag === "offer" || signalingTag === "enc_rekey") {
                const enc = getBinaryNodeChild(voipNode, "enc");

                if (enc && enc.content instanceof Uint8Array) {
                    const targetJid = this._toCallDeviceJid(effectivePeerJid);
                    const encrypted = await this._encryptCallKey(
                        targetJid,
                        enc.content,
                        parseCountAttr(enc.attrs.count)
                    );

                    replaceNodeChild(voipNode, "enc", encrypted.encNode);

                    if (encrypted.shouldIncludeDeviceIdentity) {
                        this._appendDeviceIdentity(voipNode);
                    }

                    await this._sendCallStanza(
                        targetJid,
                        voipNode,
                        signalingTag,
                        effectivePeerJid,
                        peerJid
                    );

                    return;
                }
            }

            const routeTo = signalingTag !== "offer" && signalingTag !== "enc_rekey"
                ? this._toBareJid(effectivePeerJid)
                : this._toCallDeviceJid(effectivePeerJid);

            await this._sendCallStanza(
                routeTo,
                voipNode,
                signalingTag,
                effectivePeerJid,
                peerJid
            );
        };

        this._sendCallStanza = async (routeTo, voipNode, signalingTag, effectivePeerJid, callbackPeerJid) => {
            const stanzaId = this._sock.generateMessageTag();

            await this._sock.sendNode({
                tag: "call",
                attrs: {
                    to: routeTo,
                    id: stanzaId
                },
                content: [voipNode]
            });

            void (async () => {
                try {
                    const ackNode = await this._sock.waitForMessage(stanzaId, ACK_TIMEOUT_MS);

                    if (!ackNode || !this._voip) {
                        return;
                    }

                    const { encodeBinaryNode } = this._baileys;
                    const ackPayload = Buffer.from(encodeBinaryNode(ackNode)).toString("base64");
                    const tcToken = await this.ensureTcToken(effectivePeerJid, callbackPeerJid);

                    try {
                        this._voip.handleSignalingAck({
                            payload: ackPayload,
                            ackError: ackNode.attrs?.error ?? "0",
                            msgType: ackNode.attrs?.type ?? signalingTag,
                            peerJid: effectivePeerJid,
                            extraData: tcToken
                        });
                    } catch { }
                } catch { }
            })();
        };

        this._doProcessIncomingCall = async (node, voip, activeCallId) => {
            const { getAllBinaryNodeChildren, getBinaryNodeChild, encodeBinaryNode } = this._baileys;
            const voipChild = getAllBinaryNodeChildren(node)[0];

            if (!voipChild) {
                return;
            }

            const incomingCallId = String(voipChild.attrs["call-id"] ?? voipChild.attrs.call_id ?? "");
            const callIdForRouting = incomingCallId || activeCallId;

            if (activeCallId && incomingCallId && incomingCallId !== activeCallId) {
                return;
            }

            const senderDeviceJid =
                String(voipChild.attrs.participant ?? "") ||
                String(node.attrs.participant ?? "") ||
                String(node.attrs.from ?? "") ||
                String(voipChild.attrs["call-creator"] ?? "");

            const callbackPeerJid = String(node.attrs.from ?? "") || senderDeviceJid;
            const platform = voipChild.attrs.platform ?? node.attrs.platform ?? "";
            const appVersion = voipChild.attrs.version ?? node.attrs.version ?? "";
            const epochId = voipChild.attrs.e ?? node.attrs.e ?? "0";
            const timestamp = voipChild.attrs.t ?? node.attrs.t ?? "0";
            const offline = !!(voipChild.attrs.offline ?? node.attrs.offline);

            let usableNode = voipChild;

            if (getBinaryNodeChild(voipChild, "enc")) {
                usableNode = await this._maybeDecryptEnc(voipChild, senderDeviceJid);
            }

            const b64 = Buffer.from(encodeBinaryNode(usableNode)).toString("base64");
            const storedPeerJid = callIdForRouting ? this._incomingCallPeerById.get(callIdForRouting) : undefined;
            let mappedRemoteDeviceJid = callIdForRouting ? this._remoteDevicePeerByCallId.get(callIdForRouting) : undefined;

            if (callIdForRouting && (callbackPeerJid || senderDeviceJid)) {
                this._remoteXmppRoutePeerByCallId.set(callIdForRouting, callbackPeerJid || senderDeviceJid);

                const hinted = this._pickConcreteRouteHint(senderDeviceJid, callbackPeerJid);

                if (hinted && hinted !== mappedRemoteDeviceJid) {
                    mappedRemoteDeviceJid = hinted;
                    this._remoteDevicePeerByCallId.set(callIdForRouting, hinted);
                }
            }

            const routedPeerJid = usableNode.tag === "offer"
                ? this._preferDeviceRouteJid(senderDeviceJid, callbackPeerJid, storedPeerJid)
                : this._preferOrderedRouteJid(mappedRemoteDeviceJid, storedPeerJid, senderDeviceJid, callbackPeerJid);

            if (callIdForRouting && routedPeerJid) {
                this._incomingCallPeerById.set(callIdForRouting, routedPeerJid);
            }

            const tcToken = await this.ensureTcToken(routedPeerJid, callbackPeerJid);

            switch (usableNode.tag) {
                case "offer":
                    voip.handleSignalingOffer({
                        payload: b64,
                        peerPlatform: Number(platform || 0),
                        peerAppVersion: appVersion,
                        epochId,
                        timestamp,
                        isOffline: offline,
                        isOfferNotContact: false,
                        peerJid: routedPeerJid,
                        tcToken
                    });
                    break;

                case "ack":
                    voip.handleSignalingAck({
                        payload: b64,
                        ackError: usableNode.attrs.error ?? "0",
                        msgType: usableNode.attrs.type ?? "",
                        peerJid: routedPeerJid,
                        extraData: tcToken
                    });
                    break;

                default:
                    voip.handleSignalingMessage({
                        payload: b64,
                        peerPlatform: platform,
                        peerAppVersion: appVersion,
                        epochId,
                        timestamp,
                        isOffline: offline,
                        peerJid: routedPeerJid,
                        tcToken
                    });

                    if (callIdForRouting && (usableNode.tag === "terminate" || usableNode.tag === "reject")) {
                        this._incomingCallPeerById.delete(callIdForRouting);
                        this._remoteDevicePeerByCallId.delete(callIdForRouting);
                        this._remoteObfuscatedPeerByCallId.delete(callIdForRouting);
                        this._remoteXmppRoutePeerByCallId.delete(callIdForRouting);
                    }

                    break;
            }
        };

        this._doProcessIncomingReceipt = async (node, voip, activeCallId) => {
            const { getAllBinaryNodeChildren, encodeBinaryNode } = this._baileys;
            const receiptChild = getAllBinaryNodeChildren(node)[0];

            if (!receiptChild) {
                return;
            }

            const incomingCallId = String(receiptChild.attrs["call-id"] ?? receiptChild.attrs.call_id ?? "");
            const callIdForRouting = incomingCallId || activeCallId;

            if (activeCallId && incomingCallId && incomingCallId !== activeCallId) {
                return;
            }

            const callbackPeerJid = String(node.attrs.from ?? receiptChild.attrs["call-creator"] ?? "");
            const storedPeerJid = callIdForRouting ? this._incomingCallPeerById.get(callIdForRouting) : undefined;
            const routedPeerJid = this._preferOrderedRouteJid(storedPeerJid, callbackPeerJid);

            if (callIdForRouting && routedPeerJid) {
                this._incomingCallPeerById.set(callIdForRouting, routedPeerJid);
            }

            const tcToken = await this.ensureTcToken(routedPeerJid, callbackPeerJid);

            voip.handleSignalingReceipt({
                payload: Buffer.from(encodeBinaryNode(node)).toString("base64"),
                peerJid: routedPeerJid,
                tcToken
            });
        };

        this._maybeDecryptEnc = async (voipNode, peerJid) => {
            const { getBinaryNodeChild, unpadRandomMax16, proto } = this._baileys;
            const enc = getBinaryNodeChild(voipNode, "enc");

            if (!enc || !(enc.content instanceof Uint8Array)) {
                return voipNode;
            }

            const type = enc.attrs.type;

            if (type !== "pkmsg" && type !== "msg") {
                return voipNode;
            }

            const candidates = [...new Set([peerJid, this._toCallDeviceJid(peerJid)])].filter(Boolean);
            let lastErr;

            for (const jid of candidates) {
                try {
                    const decrypted = await this._sock.signalRepository.decryptMessage({
                        jid,
                        type,
                        ciphertext: enc.content
                    });

                    const parsed = proto.Message.decode(unpadRandomMax16(decrypted));
                    const callKey = parsed.call?.callKey;

                    if (!callKey || callKey.length === 0) {
                        throw new Error("decrypted signaling has no call.callKey");
                    }

                    enc.content = callKey;

                    return voipNode;
                } catch (err) {
                    lastErr = err;
                }
            }

            throw lastErr;
        };

        this._encryptCallKey = async (targetJid, rawCallKey, count) => {
            const { encodeWAMessage } = this._baileys;
            const primaryDeviceJid = this._toPrimaryDeviceJid(targetJid);

            const sessionTargets = primaryDeviceJid && primaryDeviceJid !== targetJid
                ? [primaryDeviceJid, targetJid]
                : [targetJid];

            await this._ensureSignalSessions(sessionTargets, false);

            const { type, ciphertext } = await this._sock.signalRepository.encryptMessage({
                jid: targetJid,
                data: encodeWAMessage({
                    call: {
                        callKey: Buffer.from(rawCallKey)
                    }
                })
            });

            return {
                encNode: {
                    tag: "enc",
                    attrs: {
                        v: "2",
                        type,
                        count: String(count)
                    },
                    content: Buffer.from(ciphertext)
                },
                shouldIncludeDeviceIdentity: type === "pkmsg"
            };
        };

        this._ensureSignalSessions = async (jids, refresh) => {
            const { parseAndInjectE2ESessions } = this._baileys;
            const missing = [];

            for (const jid of [...new Set(jids.filter(Boolean))]) {
                const signalId = this._sock.signalRepository.jidToSignalProtocolAddress(jid);
                const cachedAt = this._ensuredSignalSessions.get(signalId);

                if (!refresh && cachedAt && Date.now() - cachedAt < SESSION_CACHE_TTL_MS) {
                    continue;
                }

                if (!refresh) {
                    const validation = await this._sock.signalRepository.validateSession(jid);

                    if (validation.exists) {
                        this._ensuredSignalSessions.set(signalId, Date.now());
                        continue;
                    }
                }

                missing.push(jid);
            }

            if (!missing.length) {
                return;
            }

            const sessionNode = await this._sock.query({
                tag: "iq",
                attrs: {
                    xmlns: "encrypt",
                    type: "get",
                    to: S_WHATSAPP_NET
                },
                content: [
                    {
                        tag: "key",
                        attrs: {},
                        content: missing.map(jid => ({
                            tag: "user",
                            attrs: { jid }
                        }))
                    }
                ]
            });

            await parseAndInjectE2ESessions(sessionNode, this._sock.signalRepository);

            for (const jid of missing) {
                this._ensuredSignalSessions.set(
                    this._sock.signalRepository.jidToSignalProtocolAddress(jid),
                    Date.now()
                );
            }
        };

        this._appendDeviceIdentity = voipNode => {
            const { getBinaryNodeChild, encodeSignedDeviceIdentity } = this._baileys;

            if (getBinaryNodeChild(voipNode, "device-identity")) {
                return;
            }

            const account = this._sock.authState.creds.account;

            if (!account) {
                return;
            }

            const children = getNodeChildren(voipNode);

            children.push({
                tag: "device-identity",
                attrs: {},
                content: encodeSignedDeviceIdentity(account, true)
            });

            setNodeChildren(voipNode, children);
        };

        this._toBareJid = jid => {
            const { jidDecode, jidEncode } = this._baileys;
            const decoded = jidDecode(jid);

            if (!decoded?.user) {
                return jid;
            }

            const server = jid.endsWith("@lid") ? "lid" : "s.whatsapp.net";

            return jidEncode(decoded.user, server);
        };

        this._toCallDeviceJid = jid => {
            const { jidDecode, jidEncode } = this._baileys;
            const decoded = jidDecode(jid);

            if (!decoded?.user) {
                return jid;
            }

            const server = jid.endsWith("@lid") ? "lid" : "s.whatsapp.net";

            if (decoded.device == null) {
                return jidEncode(decoded.user, server);
            }

            return `${decoded.user}:${decoded.device}@${server}`;
        };

        this._toPrimaryDeviceJid = jid => {
            const { jidDecode, jidEncode } = this._baileys;
            const decoded = jidDecode(jid);

            if (!decoded?.user) {
                return undefined;
            }

            const device = decoded.device;

            if (device == null || device === 0) {
                return undefined;
            }

            const server = jid.endsWith("@lid") ? "lid" : "s.whatsapp.net";

            return jidEncode(decoded.user, server);
        };

        this._hasConcreteDevice = jid => {
            const decoded = this._baileys.jidDecode(jid);

            return !!decoded?.user && decoded.device != null;
        };

        this._preferDeviceRouteJid = (...candidates) => {
            for (const candidate of candidates) {
                const jid = String(candidate ?? "").trim();

                if (jid && this._hasConcreteDevice(jid)) {
                    return jid;
                }
            }

            for (const candidate of candidates) {
                const jid = String(candidate ?? "").trim();

                if (jid) {
                    return this._toCallDeviceJid(jid);
                }
            }

            return "";
        };

        this._preferOrderedRouteJid = (...candidates) => {
            for (const candidate of candidates) {
                const jid = String(candidate ?? "").trim();

                if (jid) {
                    return this._toCallDeviceJid(jid);
                }
            }

            return "";
        };

        this._pickConcreteRouteHint = (...candidates) => {
            for (const candidate of candidates) {
                const jid = String(candidate ?? "").trim();

                if (jid && this._hasConcreteDevice(jid)) {
                    return jid;
                }
            }

            return "";
        };

        this._resolveOutboundPeerJid = (callId, wasmPeerJid) => {
            const peerJid = String(wasmPeerJid ?? "").trim();

            if (!peerJid || !callId) {
                return peerJid;
            }

            return this._remoteDevicePeerByCallId.get(callId) ?? peerJid;
        };

        this._expandSignalSessionTargets = jids => [
            ...new Set(
                jids.flatMap(jid => {
                    const primary = this._toPrimaryDeviceJid(jid);

                    return primary && primary !== jid ? [primary, jid] : [jid];
                })
            )
        ];

        this._normalizeStartCallPeerList = jids => {
            const { jidDecode, jidEncode } = this._baileys;
            const result = new Set();

            for (const jid of jids) {
                const decoded = jidDecode(jid);

                if (!decoded?.user) {
                    result.add(jid);
                    continue;
                }

                const server = jid.endsWith("@lid") ? "lid" : "s.whatsapp.net";

                result.add(jidEncode(decoded.user, server));

                if (decoded.device != null) {
                    result.add(`${decoded.user}:${decoded.device}@${server}`);
                }
            }

            return [...result].slice(0, 5);
        };

        this._rememberTcToken = (jid, token, timestamp = "") => {
            const bareJid = this._toBareJid(jid);

            if (!token.length) {
                return;
            }

            this._observedTcTokens.set(bareJid, {
                token: Buffer.from(token),
                timestamp
            });

            const waiters = this._pendingTcTokenWaiters.get(bareJid);

            if (waiters?.length) {
                this._pendingTcTokenWaiters.delete(bareJid);

                for (const waiter of waiters) {
                    waiter(Buffer.from(token));
                }
            }
        };

        this._getTcToken = async jid => {
            const userJid = this._toBareJid(jid);
            const observed = this._observedTcTokens.get(userJid)?.token;

            if (observed?.length) {
                return Buffer.from(observed);
            }

            try {
                const data = await this._sock.authState.keys.get("tctoken", [userJid]);
                const token = data[userJid]?.token;

                if (token && token.length > 0) {
                    this._rememberTcToken(userJid, token, data[userJid]?.timestamp);
                    return token;
                }
            } catch { }

            return undefined;
        };
    }
}

exports.SignalingBridge = SignalingBridge;
exports.default = SignalingBridge;

module.exports = SignalingBridge;
module.exports.SignalingBridge = SignalingBridge;
module.exports.default = SignalingBridge;
Object.defineProperty(module.exports, "__esModule", { value: true });