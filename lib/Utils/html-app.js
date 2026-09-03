/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */

export const HTML_APP_BYTE_BUDGET = 1024 * 1024;

export const HTML_APP_BYTE_LIMIT = HTML_APP_BYTE_BUDGET;

const STORAGE_APIS = ['localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'caches'];

const strip = (html) => html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/data:[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]*;base64,[A-Za-z0-9+/=]+/gi, 'data:');

const hasVisibilityGuard = (source) => /document\.(hidden|visibilityState)|visibilitychange|IntersectionObserver|cancelAnimationFrame|clearInterval/.test(source);

export const checkHtmlApp = (html, { height, maxBytes = HTML_APP_BYTE_BUDGET } = {}) => {
    if (typeof html !== 'string') {
        throw new TypeError('checkHtmlApp requires an HTML string');
    }

    const bytes = Buffer.byteLength(html, 'utf-8');
    const source = strip(html);
    const problems = [];
    const warnings = [];

    if (bytes > maxBytes) {
        warnings.push(`the page is ${Math.round(bytes / 1024)}KB, over the ${Math.round(maxBytes / 1024)}KB budget — the whole app travels inside the message, and no hard ceiling has been established, so treat this as a cost rather than a refusal`);
    }

    const remote = [...source.matchAll(/\b(?:src|href)\s*=\s*["']?(https?:)?\/\//gi)];
    if (remote.length) {
        problems.push(`${remote.length} remote subresource${remote.length === 1 ? '' : 's'} — the page runs in an opaque origin with no network, so every one of them fails silently; embed as data: URIs instead`);
    }

    if (/\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|new\s+EventSource/.test(source)) {
        problems.push('a call over the HTTP stack — fetch, XHR, sendBeacon and EventSource were measured dead in this WebView, and no securitypolicyviolation fires to tell the page why');
    }

    const socket = /new\s+WebSocket/.test(source);
    const peer = /RTCPeerConnection/.test(source);
    if (socket && !/wss:\/\//.test(source)) {
        problems.push('a WebSocket on something other than wss:// — the page is not a secure context, and a cleartext ws:// endpoint sends the room and every move in the open');
    }
    if ((socket || peer) && !hasVisibilityGuard(source)) {
        warnings.push('a live connection with nothing closing it — the bubble outlives the screen, so close or pause the socket on visibilitychange');
    }

    const storage = STORAGE_APIS.filter(api => source.includes(api));
    if (storage.length) {
        problems.push(`${storage.join(', ')} — every storage API throws SecurityError in an opaque origin, so the catch branch always runs`);
    }

    if (/crypto\.subtle/.test(source)) {
        problems.push('crypto.subtle needs a secure context and this page is not one');
    }

    const rafLoop = /requestAnimationFrame/.test(source);
    const interval = /setInterval\s*\(/.test(source);
    if ((rafLoop || interval) && !hasVisibilityGuard(source)) {
        problems.push('an animation or timer loop with nothing to stop it — the bubble stays alive while the chat scrolls, so it keeps burning CPU and battery off-screen; gate it on document.hidden or an IntersectionObserver');
    }

    const reportsHeight = /AndroidBridge\s*\.\s*updateSize/.test(source);
    if (height === undefined && !reportsHeight) {
        const pinned = /(?:html|body)[^{}]*\{[^{}]*height\s*:\s*\d/i.test(source);
        if (!pinned) {
            warnings.push('no height settled — pass height or autoHeight to sendHtmlApp, or call AndroidBridge.updateSize yourself, or the host and the page measure each other and the card shudders');
        }
    }

    if (/aspect-ratio\s*:/i.test(source)) {
        warnings.push('aspect-ratio makes the height depend on the width, which is the layout chase the host cannot settle');
    }

    if (/<canvas[^>]*style\s*=\s*["'][^"']*height\s*:\s*auto/i.test(source)) {
        warnings.push('a canvas at height:auto resizes with the bubble; give it pixel dimensions');
    }

    const dataUris = [...html.matchAll(/data:[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]*;base64,([A-Za-z0-9+/=]+)/gi)];
    const embedded = dataUris.reduce((total, match) => total + match[1].length, 0);
    if (embedded > bytes * 0.6 && dataUris.length) {
        warnings.push(`${Math.round(embedded / 1024)}KB of the page is embedded media — shrink it before the byte budget forces you to`);
    }

    return { ok: problems.length === 0, bytes, embeddedBytes: embedded, problems, warnings };
};
