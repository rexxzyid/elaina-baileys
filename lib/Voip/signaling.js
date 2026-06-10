"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignalingBridge = void 0;

const S_WHATSAPP_NET = "@s.whatsapp.net";
const TC_TOKEN_REQUEST_TIMEOUT_MS = 15000;
const SESSION_CACHE_TTL_MS = 5 * 60000;
const ACK_TIMEOUT_MS = 15000;

let _baileysModule = null;

const loadBaileys = async () => {
    if (_baileysModule) return _baileysModule;
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
    if (index >= 0) children[index] = nextChild;
    else children.push(nextChild);
    setNodeChildren(node, children);
};

const removeNodeChildrenByTag = (node, tag) => {
    setNodeChildren(node, getNodeChildren(node).filter(child => child.tag !== tag));
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

            if (this._sock.authState?.keys?.set) {
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
            }

            if (this._sock.ev?.on) {
                this._sock.ev.on("chats.update", updates => {
                    for (const update of updates || []) {
                        if (update?.id && update?.tcToken instanceof Uint8Array && update.tcToken.length > 0) {
                            console.log("[RTC TC TOKEN FROM CHATS.UPDATE]", {
                                jid: update.id,
                                length: update.tcToken.length
                            });

                            this._rememberTcToken(update.id, update.tcToken, String(Math.floor(Date.now() / 1000)));
                        }
                    }
                });
            }

            if (this._sock.ws?.on) {
                const handlePrivacyNotification = node => {
                    try {
                        if (node?.attrs?.type !== "privacy_token") return;
                        this._processPrivacyTokenNotification(node);
                    } catch (err) {
                        console.error("[RTC RAW PRIVACY TOKEN ERROR]", err?.message || err);
                    }
                };

                this._sock.ws.on("CB:notification,type:privacy_token", handlePrivacyNotification);
                this._sock.ws.on("CB:notification", handlePrivacyNotification);
            }
        };

        this.sendSignaling = (peerJid, callId, xmlPayload) => {
            this._outgoingSignalingQueue = this._outgoingSignalingQueue
                .then(() => this._doSendSignaling(peerJid, callId, xmlPayload))
                .catch(err => {
                    console.error("[RTC SIGNALING ERROR]", err?.stack || err?.message || err);
                });
        };

        this.processIncomingCall = (node, voip, activeCallId) => {
            this._incomingSignalingQueue = this._incomingSignalingQueue
                .then(() => {
                    if (!voip || (typeof voip.isInitialized === "function" && !voip.isInitialized())) return;
                    return this._doProcessIncomingCall(node, voip, activeCallId);
                })
                .catch(err => {
                    console.error("[RTC INCOMING CALL ERROR]", err?.stack || err?.message || err);
                });
        };

        this.processIncomingReceipt = (node, voip, activeCallId) => {
            this._incomingSignalingQueue = this._incomingSignalingQueue
                .then(() => {
                    if (!voip || (typeof voip.isInitialized === "function" && !voip.isInitialized())) return;
                    return this._doProcessIncomingReceipt(node, voip, activeCallId);
                })
                .catch(err => {
                    console.error("[RTC INCOMING RECEIPT ERROR]", err?.stack || err?.message || err);
                });
        };

        this.requestTcToken = async jid => {
            const userJid = this._toBareJid(jid);
            const cached = await this._getTcToken(userJid);

            if (cached?.length) return cached;

            const waiter = this._waitForTcToken(userJid, TC_TOKEN_REQUEST_TIMEOUT_MS);

            const logResponse = (label, response) => {
                console.log(`[RTC TC TOKEN RESPONSE:${label}]`, JSON.stringify(response, (key, value) => {
                    if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
                        return `<buffer:${value.length}>`;
                    }

                    return value;
                }, 2));
            };

            const tryReadResponse = async (label, response) => {
                logResponse(label, response);

                const tokenNodes = this._findTcTokenNodes(response);

                for (const tokenNode of tokenNodes) {
                    const content = tokenNode?.content;

                    if (content instanceof Uint8Array && content.length > 0) {
                        const token = Buffer.from(content);
                        const timestamp = String(tokenNode.attrs?.t ?? Math.floor(Date.now() / 1000));

                        await this._storeTcToken(userJid, token, timestamp);

                        return token;
                    }
                }

                return null;
            };

            const attempts = [];

            if (typeof this._sock.getPrivacyTokens === "function") {
                attempts.push({
                    label: "getPrivacyTokens",
                    run: () => this._sock.getPrivacyTokens([userJid])
                });
            }

            attempts.push({
                label: "privacy-set-with-t",
                run: () => this._sock.query({
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
                                        t: String(Math.floor(Date.now() / 1000)),
                                        type: "trusted_contact"
                                    }
                                }
                            ]
                        }
                    ]
                })
            });

            attempts.push({
                label: "privacy-set-no-t",
                run: () => this._sock.query({
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
                                        type: "trusted_contact"
                                    }
                                }
                            ]
                        }
                    ]
                })
            });

            for (const attempt of attempts) {
                try {
                    const response = await attempt.run();
                    const token = await tryReadResponse(attempt.label, response);

                    if (token?.length) return token;
                } catch (err) {
                    console.error(`[RTC TC TOKEN REQUEST ERROR:${attempt.label}]`, err?.stack || err?.message || err);
                }

                const stored = await this._getTcToken(userJid);
                if (stored?.length) return stored;

                const waited = await Promise.race([
                    waiter,
                    new Promise(resolve => setTimeout(() => resolve(undefined), 2500))
                ]);

                if (waited?.length) return waited;
            }

            const waited = await waiter;
            if (waited?.length) return waited;

            return this._getTcToken(userJid);
        };

        this.ensureTcToken = async (...jids) => {
            const uniqueJids = [
                ...new Set(jids.map(jid => this._toBareJid(String(jid ?? "").trim())).filter(Boolean))
            ];

            for (const jid of uniqueJids) {
                const cached = await this._getTcToken(jid);
                if (cached?.length) return cached;
            }

            for (const jid of uniqueJids) {
                const fetched = await this.requestTcToken(jid);
                if (fetched?.length) return fetched;
            }

            return undefined;
        };

        this.discoverPeerDevices = async peerJid => {
            const bareJid = this._toBareJid(peerJid);
            const { jidDecode } = this._baileys;
            const decoded = jidDecode(bareJid);

            if (!decoded?.user) return [bareJid];

            const server = bareJid.endsWith("@lid") ? "lid" : "s.whatsapp.net";
            const attempts = [
                [bareJid, false, false],
                [bareJid, true, false],
                [bareJid, false, true],
                [bareJid, true, true]
            ];

            for (const [jid, useCache, ignoreZeroDevices] of attempts) {
                try {
                    const devices = await this._sock.getUSyncDevices?.([jid], useCache, ignoreZeroDevices);
                    const jids = [];

                    for (const device of devices || []) {
                        if (!device) continue;
                        if (typeof device === "string") {
                            jids.push(device);
                            continue;
                        }
                        if (device.jid) {
                            jids.push(device.jid);
                            continue;
                        }
                        const user = device.user || decoded.user;
                        const dev = device.device;
                        if (user && dev !== undefined && dev !== null) {
                            jids.push(`${user}:${dev}@${server}`);
                        }
                    }

                    const list = this._normalizeStartCallPeerList(jids);
                    if (list.length) {
                        console.log("[RTC DEVICES]", { peerJid: bareJid, list });
                        return list;
                    }
                } catch (err) {
                    console.error("[RTC DEVICES ERROR]", err?.message || err);
                }
            }

            const fallback = [`${decoded.user}:0@${server}`];
            console.log("[RTC DEVICES FALLBACK]", { peerJid: bareJid, fallback });
            return fallback;
        };

        this.ensureSessionsForPeers = async jids => {
            const targets = this._expandSignalSessionTargets(jids);
            if (targets.length) await this._ensureSignalSessions(targets, true);
        };

        this.resolveLid = async jid => {
            const bare = this._toBareJid(String(jid || "").trim());
            if (!bare) return undefined;
            if (bare.endsWith("@lid")) return bare;

            try {
                const mapped = await this._sock.signalRepository?.lidMapping?.getLIDForPN?.(bare);
                if (mapped) return this._toBareJid(mapped);
            } catch {}

            try {
                const stored = await this._getStoredLidForPn(bare);
                if (stored) return stored;
            } catch {}

            const resolved = await this._resolveLidViaUSync(bare);
            if (resolved) {
                await this._storeLidPnMapping(resolved, bare);
                return resolved;
            }

            return undefined;
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
            } catch (err) {
                console.error("[RTC ISSUE TC TOKEN ERROR]", err?.message || err);
                return false;
            }
        };

        this.getRemoteDeviceJid = callId => this._remoteDevicePeerByCallId.get(callId);

        this._resolveLidViaUSync = async pnJid => {
            if (typeof this._sock.executeUSyncQuery !== "function") return undefined;
            const { USyncQuery, USyncUser } = this._baileys;
            if (!USyncQuery || !USyncUser) return undefined;

            const query = new USyncQuery()
                .withContext("message")
                .withLIDProtocol();
            query.withUser(new USyncUser().withId(pnJid));

            try {
                const result = await this._sock.executeUSyncQuery(query);
                const row = (result?.list || []).find(item => item?.id === pnJid || item?.lid);
                const lid = this._normalizeLid(row?.lid);
                if (lid) {
                    console.log("[RTC LID RESOLVED]", { pn: pnJid, lid });
                    return lid;
                }
            } catch (err) {
                console.error("[RTC RESOLVE LID USYNC ERROR]", err?.message || err);
            }

            return undefined;
        };

        this._normalizeLid = value => {
            const raw = String(value || "").trim();
            if (!raw) return undefined;
            if (raw.endsWith("@lid")) return this._toBareJid(raw);
            if (raw.endsWith("@hosted.lid")) return this._toBareJid(raw);
            if (/^\d+$/.test(raw)) return `${raw}@lid`;
            return raw.includes("@") ? this._toBareJid(raw) : `${raw}@lid`;
        };

        this._getStoredLidForPn = async pnJid => {
            const decoded = this._baileys.jidDecode(pnJid);
            if (!decoded?.user || !this._sock.authState?.keys?.get) return undefined;

            const stored = await this._sock.authState.keys.get("lid-mapping", [decoded.user]);
            const lidUser = stored?.[decoded.user];
            if (!lidUser) return undefined;

            return this._normalizeLid(String(lidUser));
        };

        this._storeLidPnMapping = async (lidJid, pnJid) => {
            const normalizedLid = this._normalizeLid(lidJid);
            const normalizedPn = this._toBareJid(pnJid);
            if (!normalizedLid || !normalizedPn) return;

            try {
                await this._sock.signalRepository?.lidMapping?.storeLIDPNMappings?.([
                    { lid: normalizedLid, pn: normalizedPn }
                ]);
            } catch {}

            const pnDecoded = this._baileys.jidDecode(normalizedPn);
            const lidDecoded = this._baileys.jidDecode(normalizedLid);
            if (!pnDecoded?.user || !lidDecoded?.user || !this._sock.authState?.keys?.set) return;

            try {
                await this._sock.authState.keys.set({
                    "lid-mapping": {
                        [pnDecoded.user]: lidDecoded.user,
                        [`${lidDecoded.user}_reverse`]: pnDecoded.user
                    }
                });
            } catch {}
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
                const selfCreator =
                    this._sock.authState?.creds?.me?.lid ||
                    this._sock.authState?.creds?.me?.lidJid ||
                    this._sock.authState?.creds?.me?.id ||
                    this._sock.user?.lid ||
                    this._sock.user?.id ||
                    this._sock.user?.jid;
                if (selfCreator) voipNode.attrs["call-creator"] = this._toBareJid(selfCreator);
            }

            const destination = getBinaryNodeChild(voipNode, "destination");

            if (destination) {
                const destinations = getNodeChildren(destination);
                const destinationJids = destinations.map(node => String(node.attrs.jid ?? "").trim()).filter(Boolean);
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

                    if (!targetJid || !destEnc || !(destEnc.content instanceof Uint8Array)) continue;

                    try {
                        const encrypted = await this._encryptCallKey(targetJid, destEnc.content, encCount);
                        includeDeviceIdentity = includeDeviceIdentity || encrypted.shouldIncludeDeviceIdentity;
                        setNodeChildren(destNode, [encrypted.encNode]);
                    } catch (err) {
                        console.error("[RTC ENCRYPT DEST ERROR]", err?.message || err);
                        for (const destinationNode of destinations) removeNodeChildrenByTag(destinationNode, "enc");
                        break;
                    }
                }

                if (includeDeviceIdentity) this._appendDeviceIdentity(voipNode);

                await this._sendCallStanza(this._toBareJid(peerJid), voipNode, signalingTag, effectivePeerJid, peerJid);
                return;
            }

            if (signalingTag === "offer" || signalingTag === "enc_rekey") {
                const enc = getBinaryNodeChild(voipNode, "enc");
                if (enc && enc.content instanceof Uint8Array) {
                    const targetJid = this._toCallDeviceJid(effectivePeerJid);
                    const encrypted = await this._encryptCallKey(targetJid, enc.content, parseCountAttr(enc.attrs.count));
                    replaceNodeChild(voipNode, "enc", encrypted.encNode);
                    if (encrypted.shouldIncludeDeviceIdentity) this._appendDeviceIdentity(voipNode);
                    await this._sendCallStanza(targetJid, voipNode, signalingTag, effectivePeerJid, peerJid);
                    return;
                }
            }

            const routeTo = signalingTag !== "offer" && signalingTag !== "enc_rekey"
                ? this._toBareJid(effectivePeerJid)
                : this._toCallDeviceJid(effectivePeerJid);

            await this._sendCallStanza(routeTo, voipNode, signalingTag, effectivePeerJid, peerJid);
        };

        this._sendCallStanza = async (routeTo, voipNode, signalingTag, effectivePeerJid, callbackPeerJid) => {
            const stanzaId = this._sock.generateMessageTag();
            console.log("[RTC SEND CALL STANZA]", { to: routeTo, id: stanzaId, tag: signalingTag, peer: effectivePeerJid });

            await this._sock.sendNode({
                tag: "call",
                attrs: { to: routeTo, id: stanzaId },
                content: [voipNode]
            });

            void (async () => {
                try {
                    if (typeof this._sock.waitForMessage !== "function") {
                        console.log("[RTC CALL ACK] waitForMessage not available");
                        return;
                    }
                    const ackNode = await this._sock.waitForMessage(stanzaId, ACK_TIMEOUT_MS);
                    console.log("[RTC CALL ACK]", ackNode?.attrs || null);
                    if (!ackNode || !this._voip) return;
                    if (typeof this._voip.isInitialized === "function" && !this._voip.isInitialized()) return;

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
                    } catch (err) {
                        console.error("[RTC HANDLE ACK ERROR]", err?.message || err);
                    }
                } catch (err) {
                    console.error("[RTC WAIT ACK ERROR]", err?.message || err);
                }
            })();
        };

        this._doProcessIncomingCall = async (node, voip, activeCallId) => {
            const { getAllBinaryNodeChildren, getBinaryNodeChild, encodeBinaryNode } = this._baileys;
            const voipChild = getAllBinaryNodeChildren(node)[0];
            if (!voipChild) return;

            const incomingCallId = String(voipChild.attrs["call-id"] ?? voipChild.attrs.call_id ?? "");
            const callIdForRouting = incomingCallId || activeCallId;
            if (activeCallId && incomingCallId && incomingCallId !== activeCallId) return;

            const senderDeviceJid = String(voipChild.attrs.participant ?? "") || String(node.attrs.participant ?? "") || String(node.attrs.from ?? "") || String(voipChild.attrs["call-creator"] ?? "");
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

            if (callIdForRouting && routedPeerJid) this._incomingCallPeerById.set(callIdForRouting, routedPeerJid);
            const tcToken = await this.ensureTcToken(routedPeerJid, callbackPeerJid);

            if (!voip || (typeof voip.isInitialized === "function" && !voip.isInitialized())) return;

            switch (usableNode.tag) {
                case "offer":
                    voip.handleSignalingOffer({ payload: b64, peerPlatform: Number(platform || 0), peerAppVersion: appVersion, epochId, timestamp, isOffline: offline, isOfferNotContact: false, peerJid: routedPeerJid, tcToken });
                    break;
                case "ack":
                    voip.handleSignalingAck({ payload: b64, ackError: usableNode.attrs.error ?? "0", msgType: usableNode.attrs.type ?? "", peerJid: routedPeerJid, extraData: tcToken });
                    break;
                default:
                    voip.handleSignalingMessage({ payload: b64, peerPlatform: platform, peerAppVersion: appVersion, epochId, timestamp, isOffline: offline, peerJid: routedPeerJid, tcToken });
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
            if (!receiptChild) return;
            const incomingCallId = String(receiptChild.attrs["call-id"] ?? receiptChild.attrs.call_id ?? "");
            const callIdForRouting = incomingCallId || activeCallId;
            if (activeCallId && incomingCallId && incomingCallId !== activeCallId) return;
            const callbackPeerJid = String(node.attrs.from ?? receiptChild.attrs["call-creator"] ?? "");
            const storedPeerJid = callIdForRouting ? this._incomingCallPeerById.get(callIdForRouting) : undefined;
            const routedPeerJid = this._preferOrderedRouteJid(storedPeerJid, callbackPeerJid);
            if (callIdForRouting && routedPeerJid) this._incomingCallPeerById.set(callIdForRouting, routedPeerJid);
            const tcToken = await this.ensureTcToken(routedPeerJid, callbackPeerJid);
            if (!voip || (typeof voip.isInitialized === "function" && !voip.isInitialized())) return;
            voip.handleSignalingReceipt({ payload: Buffer.from(encodeBinaryNode(node)).toString("base64"), peerJid: routedPeerJid, tcToken });
        };

        this._maybeDecryptEnc = async (voipNode, peerJid) => {
            const { getBinaryNodeChild, unpadRandomMax16, proto } = this._baileys;
            const enc = getBinaryNodeChild(voipNode, "enc");
            if (!enc || !(enc.content instanceof Uint8Array)) return voipNode;
            const type = enc.attrs.type;
            if (type !== "pkmsg" && type !== "msg") return voipNode;
            const candidates = [...new Set([peerJid, this._toCallDeviceJid(peerJid)])].filter(Boolean);
            let lastErr;
            for (const jid of candidates) {
                try {
                    const decrypted = await this._sock.signalRepository.decryptMessage({ jid, type, ciphertext: enc.content });
                    const parsed = proto.Message.decode(unpadRandomMax16(decrypted));
                    const callKey = parsed.call?.callKey;
                    if (!callKey || callKey.length === 0) throw new Error("decrypted signaling has no call.callKey");
                    enc.content = callKey;
                    return voipNode;
                } catch (err) { lastErr = err; }
            }
            throw lastErr;
        };

        this._encryptCallKey = async (targetJid, rawCallKey, count) => {
            const { encodeWAMessage } = this._baileys;
            const primaryDeviceJid = this._toPrimaryDeviceJid(targetJid);
            const sessionTargets = primaryDeviceJid && primaryDeviceJid !== targetJid ? [primaryDeviceJid, targetJid] : [targetJid];
            await this._ensureSignalSessions(sessionTargets, false);
            const { type, ciphertext } = await this._sock.signalRepository.encryptMessage({
                jid: targetJid,
                data: encodeWAMessage({ call: { callKey: Buffer.from(rawCallKey) } })
            });
            return {
                encNode: { tag: "enc", attrs: { v: "2", type, count: String(count) }, content: Buffer.from(ciphertext) },
                shouldIncludeDeviceIdentity: type === "pkmsg"
            };
        };

        this._ensureSignalSessions = async (jids, refresh) => {
    const targets = [...new Set(jids.filter(Boolean).map(jid => this._toCallDeviceJid(jid)))];

    if (!targets.length) {
        return;
    }

    if (typeof this._sock.assertSessions === "function") {
        try {
            await this._sock.assertSessions(targets, refresh);
            return;
        } catch (err) {
            console.error("[RTC ASSERT SESSIONS ERROR]", err?.message || err);
        }
    }

    const { parseAndInjectE2ESessions } = this._baileys;
    const missing = [];

    for (const jid of targets) {
        try {
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
        } catch {
            missing.push(jid);
        }
    }

    if (!missing.length) {
        return;
    }

    try {
        const sessionNode = await this._sock.query({
            tag: "iq",
            attrs: {
                xmlns: "encrypt",
                type: "get",
                to: S_WHATSAPP_NET,
                id: this._sock.generateMessageTag()
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
            try {
                this._ensuredSignalSessions.set(
                    this._sock.signalRepository.jidToSignalProtocolAddress(jid),
                    Date.now()
                );
            } catch {}
        }
    } catch (err) {
        console.error("[RTC ENSURE SIGNAL SESSION ERROR]", {
            message: err?.message || String(err),
            targets: missing
        });

        if (
            String(err?.message || err).toLowerCase().includes("connection closed") ||
            String(err?.message || err).toLowerCase().includes("socket")
        ) {
            return;
        }

        throw err;
    }
};

        this._appendDeviceIdentity = voipNode => {
            const { getBinaryNodeChild, encodeSignedDeviceIdentity } = this._baileys;
            if (getBinaryNodeChild(voipNode, "device-identity")) return;
            const account = this._sock.authState.creds.account;
            if (!account) return;
            const children = getNodeChildren(voipNode);
            children.push({ tag: "device-identity", attrs: {}, content: encodeSignedDeviceIdentity(account, true) });
            setNodeChildren(voipNode, children);
        };

        this._toBareJid = jid => {
            const { jidDecode, jidEncode } = this._baileys;
            const decoded = jidDecode(jid);
            if (!decoded?.user) return jid;
            const server = String(jid).endsWith("@lid") ? "lid" : "s.whatsapp.net";
            return jidEncode(decoded.user, server);
        };

        this._toCallDeviceJid = jid => {
            const { jidDecode } = this._baileys;
            const decoded = jidDecode(jid);
            if (!decoded?.user) return jid;
            const server = String(jid).endsWith("@lid") ? "lid" : "s.whatsapp.net";
            if (decoded.device === undefined || decoded.device === null) return `${decoded.user}:0@${server}`;
            return `${decoded.user}:${decoded.device}@${server}`;
        };

        this._toPrimaryDeviceJid = jid => {
            const { jidDecode } = this._baileys;
            const decoded = jidDecode(jid);
            if (!decoded?.user) return undefined;
            const device = decoded.device;
            if (device == null || device === 0) return undefined;
            const server = String(jid).endsWith("@lid") ? "lid" : "s.whatsapp.net";
            return `${decoded.user}:0@${server}`;
        };

        this._hasConcreteDevice = jid => {
            const decoded = this._baileys.jidDecode(jid);
            return !!decoded?.user && decoded.device != null;
        };

        this._preferDeviceRouteJid = (...candidates) => {
            for (const candidate of candidates) {
                const jid = String(candidate ?? "").trim();
                if (jid && this._hasConcreteDevice(jid)) return jid;
            }
            for (const candidate of candidates) {
                const jid = String(candidate ?? "").trim();
                if (jid) return this._toCallDeviceJid(jid);
            }
            return "";
        };

        this._preferOrderedRouteJid = (...candidates) => {
            for (const candidate of candidates) {
                const jid = String(candidate ?? "").trim();
                if (jid) return this._toCallDeviceJid(jid);
            }
            return "";
        };

        this._pickConcreteRouteHint = (...candidates) => {
            for (const candidate of candidates) {
                const jid = String(candidate ?? "").trim();
                if (jid && this._hasConcreteDevice(jid)) return jid;
            }
            return "";
        };

        this._resolveOutboundPeerJid = (callId, wasmPeerJid) => {
            const peerJid = String(wasmPeerJid ?? "").trim();
            if (!peerJid || !callId) return peerJid;
            return this._remoteDevicePeerByCallId.get(callId) ?? peerJid;
        };

        this._expandSignalSessionTargets = jids => [
            ...new Set(jids.flatMap(jid => {
                const primary = this._toPrimaryDeviceJid(jid);
                return primary && primary !== jid ? [primary, jid] : [jid];
            }))
        ];

        this._normalizeStartCallPeerList = jids => {
            const { jidDecode } = this._baileys;
            const result = new Set();
            for (const jid of jids) {
                const value = String(jid || "").trim();
                if (!value) continue;
                const decoded = jidDecode(value);
                if (!decoded?.user) {
                    result.add(value);
                    continue;
                }
                const server = value.endsWith("@lid") ? "lid" : "s.whatsapp.net";
                result.add(`${decoded.user}:0@${server}`);
                if (decoded.device !== undefined && decoded.device !== null) result.add(`${decoded.user}:${decoded.device}@${server}`);
            }
            return [...result].slice(0, 5);
        };

        this._findTcTokenNodes = node => {
            const result = [];

            const walk = item => {
                if (!item) return;

                if (Array.isArray(item)) {
                    for (const child of item) walk(child);
                    return;
                }

                if (typeof item !== "object") return;

                if (
                    item.tag === "token" &&
                    (item.attrs?.type === "trusted_contact" || item.attrs?.type === undefined) &&
                    item.content instanceof Uint8Array &&
                    item.content.length > 0
                ) {
                    result.push(item);
                }

                if (Array.isArray(item.content)) {
                    for (const child of item.content) walk(child);
                }
            };

            walk(node);
            return result;
        };

        this._processPrivacyTokenNotification = node => {
            const { getAllBinaryNodeChildren, getBinaryNodeChildren } = this._baileys;
            const child = getAllBinaryNodeChildren(node)[0];
            const tokenNodes = child ? getBinaryNodeChildren(child, "token") : [];

            for (const tokenNode of tokenNodes) {
                const jid = String(tokenNode.attrs?.jid || node.attrs?.from || "");
                const content = tokenNode.content;

                if (jid && content instanceof Uint8Array && content.length > 0) {
                    console.log("[RTC TC TOKEN FROM RAW NOTIFICATION]", {
                        jid,
                        length: content.length
                    });

                    this._storeTcToken(jid, Buffer.from(content), String(tokenNode.attrs?.t ?? Math.floor(Date.now() / 1000))).catch(() => {});
                }
            }
        };

        this._getTcTokenCandidateJids = async jid => {
            const result = new Set();
            const bare = this._toBareJid(jid);

            if (bare) result.add(bare);

            try {
                const lid = await this._sock.signalRepository?.lidMapping?.getLIDForPN?.(bare);
                if (lid) result.add(this._toBareJid(lid));
            } catch {}

            try {
                const pn = await this._sock.signalRepository?.lidMapping?.getPNForLID?.(bare);
                if (pn) result.add(this._toBareJid(pn));
            } catch {}

            return [...result].filter(Boolean);
        };

        this._storeTcToken = async (jid, token, timestamp = "") => {
            const candidates = await this._getTcTokenCandidateJids(jid);

            if (!candidates.length) candidates.push(this._toBareJid(jid));

            const write = {};

            for (const storageJid of candidates) {
                if (!storageJid) continue;
                write[storageJid] = {
                    token: Buffer.from(token),
                    timestamp: String(timestamp || Math.floor(Date.now() / 1000))
                };

                this._rememberTcToken(storageJid, token, timestamp);
            }

            try {
                if (Object.keys(write).length) {
                    await this._sock.authState.keys.set({ tctoken: write });
                }
            } catch {}

            return Buffer.from(token);
        };

        this._waitForTcToken = async (jid, timeoutMs = TC_TOKEN_REQUEST_TIMEOUT_MS) => {
            const candidates = await this._getTcTokenCandidateJids(jid);

            return new Promise(resolve => {
                const timer = setTimeout(() => {
                    for (const candidate of candidates) {
                        const waiters = this._pendingTcTokenWaiters.get(candidate);
                        if (!waiters) continue;
                        this._pendingTcTokenWaiters.set(candidate, waiters.filter(fn => fn !== done));
                    }

                    const anyWaiters = this._pendingTcTokenWaiters.get("*");
                    if (anyWaiters) {
                        this._pendingTcTokenWaiters.set("*", anyWaiters.filter(fn => fn !== done));
                    }

                    resolve(undefined);
                }, timeoutMs);

                const done = token => {
                    clearTimeout(timer);
                    resolve(Buffer.from(token));
                };

                for (const candidate of candidates) {
                    const waiters = this._pendingTcTokenWaiters.get(candidate) || [];
                    waiters.push(done);
                    this._pendingTcTokenWaiters.set(candidate, waiters);
                }

                const anyWaiters = this._pendingTcTokenWaiters.get("*") || [];
                anyWaiters.push(done);
                this._pendingTcTokenWaiters.set("*", anyWaiters);
            });
        };

        this._rememberTcToken = (jid, token, timestamp = "") => {
            const bareJid = this._toBareJid(jid);
            if (!token?.length) return;

            this._observedTcTokens.set(bareJid, {
                token: Buffer.from(token),
                timestamp
            });

            const notify = key => {
                const waiters = this._pendingTcTokenWaiters.get(key);
                if (waiters?.length) {
                    this._pendingTcTokenWaiters.delete(key);
                    for (const waiter of waiters) waiter(Buffer.from(token));
                }
            };

            notify(bareJid);
            notify("*");
        };

        this._getTcToken = async jid => {
            const candidates = await this._getTcTokenCandidateJids(jid);

            for (const candidate of candidates) {
                const observed = this._observedTcTokens.get(candidate)?.token;
                if (observed?.length) return Buffer.from(observed);
            }

            try {
                const data = await this._sock.authState.keys.get("tctoken", candidates);

                for (const candidate of candidates) {
                    const token = data[candidate]?.token;
                    if (token && token.length > 0) {
                        this._rememberTcToken(candidate, token, data[candidate]?.timestamp);
                        return Buffer.from(token);
                    }
                }
            } catch {}

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
