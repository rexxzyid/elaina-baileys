"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveJid = resolveJid;

/**
Resolve LID / raw id menjadi JID WhatsApp asli
@param {import('@rexxhayanasi/elaina-baileys').WASocket} conn
@param {any} m
@param {string|null} target
@returns {Promise<string|null>}
*/

async function resolveJid(conn, m, target) {
let input =
target ||
(m.mentionedJid && m.mentionedJid[0]) ||
(m.quoted && m.quoted.sender) ||
m.sender;

if (!input) return null;


if (/@s.whatsapp.net$/.test(input))
return input;


if (!m.isGroup || !m.chat)
return null;

let meta;
try {
meta = await conn.groupMetadata(m.chat);
} catch {
return null;
}

if (!meta || !Array.isArray(meta.participants))
return null;

const participant = meta.participants.find(p =>
p.jid === input ||
p.id === input ||
p.lid === input ||
(typeof input === "string" && input.replace(/@lid$/, "") === p.lid?.replace(/@lid$/, ""))
);

if (participant && participant.jid)
return participant.jid;

return null;
}
