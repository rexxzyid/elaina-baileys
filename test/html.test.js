import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HTML_APP_BYTE_LIMIT, checkHtmlApp, HTML_APP_BYTE_BUDGET } from '../lib/Utils/html-app.js';
import { createHash } from 'node:crypto';
import { AIRich, ContentValidationError } from '../lib/MessageBuilder/index.js';
import { botMediaMetadata, decodeAIRich, prepareFileArtifact, sendHtmlArtifact, dataUri, htmlMedia } from '../lib/MessageBuilder/extras.js';
import { htmlMultiplayerPrelude, withHtmlMultiplayer } from '../lib/Utils/html-multiplayer.js';

test('html-app-guard', async () => {
    const clean = checkHtmlApp('<style>html,body{height:300px;margin:0}</style><div>halo</div>', { height: 300 });
    assert.equal(clean.ok, true);
    assert.deepEqual(clean.problems, []);
    assert.deepEqual(clean.warnings, []);

    const remote = checkHtmlApp('<img src="https://example.com/a.png"><img src="//cdn.example.com/b.png">', { height: 100 });
    assert.equal(remote.ok, false);
    assert.match(remote.problems.join(' '), /2 remote subresources/);

    const network = checkHtmlApp('<script>fetch("/x").then(r => r.json())</script>', { height: 100 });
    assert.equal(network.ok, false);
    assert.match(network.problems.join(' '), /HTTP stack/);

    const socket = checkHtmlApp('<style>body{height:100px}</style><script>const ws = new WebSocket("wss://x.example"); addEventListener("visibilitychange", () => ws.close())</script>', { height: 100 });
    assert.equal(socket.ok, true);
    assert.deepEqual(socket.warnings, []);

    const storage = checkHtmlApp('<script>try { localStorage.setItem("a", 1) } catch {}</script>', { height: 100 });
    assert.equal(storage.ok, false);
    assert.match(storage.problems.join(' '), /localStorage/);

    const runaway = checkHtmlApp('<script>const loop = () => { requestAnimationFrame(loop) }; loop()</script>', { height: 100 });
    assert.equal(runaway.ok, false);
    assert.match(runaway.problems.join(' '), /burning CPU/);

    const guarded = checkHtmlApp('<script>const loop = () => { if (document.hidden) return; requestAnimationFrame(loop) }; loop()</script>', { height: 100 });
    assert.equal(guarded.ok, true);

    const stoppable = checkHtmlApp('<script>const t = setInterval(tick, 16); addEventListener("visibilitychange", () => clearInterval(t))</script>', { height: 100 });
    assert.equal(stoppable.ok, true);

    const noHeight = checkHtmlApp('<div>halo</div>');
    assert.equal(noHeight.ok, true);
    assert.match(noHeight.warnings.join(' '), /no height settled/);

    const pinned = checkHtmlApp('<style>body{height:240px}</style><div>halo</div>');
    assert.equal(pinned.warnings.length, 0);

    const ratio = checkHtmlApp('<style>body{height:200px}.a{aspect-ratio:16/9}</style>');
    assert.match(ratio.warnings.join(' '), /aspect-ratio/);

    const tooBig = checkHtmlApp('<style>body{height:100px}</style>' + 'x'.repeat(HTML_APP_BYTE_LIMIT + 1), { height: 100 });
    assert.equal(tooBig.ok, false, 'past the budget the receiving client drops the message');
    assert.match(tooBig.problems.join(' '), /over the .*KB budget/);
    assert.match(tooBig.problems.join(' '), /dropped by the receiving client/);

    const emoji = checkHtmlApp('<style>body{height:100px}</style><div>' + '\u2b07\ufe0f'.repeat(200) + '</div>', { height: 100 });
    assert.ok(emoji.wireBytes > emoji.bytes, 'escaping is counted');
    assert.match(emoji.warnings.join(' '), /escaping inflates/);

    const inComment = checkHtmlApp('<style>body{height:100px}</style><!-- <img src="https://example.com/a.png"> -->', { height: 100 });
    assert.equal(inComment.ok, true);

    const embedded = checkHtmlApp('<style>body{height:100px}</style><img src="data:image/png;base64,' + 'A'.repeat(4000) + '">', { height: 100 });
    assert.equal(embedded.ok, true);
    assert.ok(embedded.embeddedBytes >= 4000);
    assert.match(embedded.warnings.join(' '), /embedded media/);

    assert.throws(() => checkHtmlApp(null), TypeError);
});

test('html-artifact', async () => {
    const doc = {
        fileSha256: Buffer.from('aa'.repeat(32), 'hex'),
        fileEncSha256: Buffer.from('bb'.repeat(32), 'hex'),
        mediaKey: Buffer.from('cc'.repeat(32), 'hex'),
        directPath: '/v/t62.7119-24/abc',
        mediaKeyTimestamp: 1700000000,
        mimetype: 'text/html',
        fileLength: 1234
    };

    const meta = botMediaMetadata(doc);
    assert.equal(meta.fileSha256, doc.fileSha256.toString('base64'));
    assert.equal(meta.fileEncSha256, doc.fileEncSha256.toString('base64'));
    assert.equal(meta.mediaKey, doc.mediaKey.toString('base64'));
    assert.equal(meta.directPath, '/v/t62.7119-24/abc');
    assert.equal(meta.mediaKeyTimestamp, 1700000000);
    assert.equal(meta.mimetype, 'text/html');
    assert.equal(typeof meta.fileSha256, 'string');

    assert.equal('mediaKeyTimestamp' in botMediaMetadata({ directPath: '/x' }), false);
    assert.throws(() => botMediaMetadata(null), TypeError);

    const calls = [];
    let uploads = 0;
    const sock = {
        user: { id: '1@s.whatsapp.net' },
        waUploadToServer: async () => {
            uploads++;
            return { mediaUrl: 'https://mmg.whatsapp.net/x', directPath: '/v/t62/enc' };
        },
        relayMessage: async (jid, message) => { calls.push({ jid, message }); }
    };

    const html = '<!DOCTYPE html><body><h1>jendela</h1></body>';
    const artifact = await prepareFileArtifact(sock, html, { fileName: 'main.html', title: 'Judul', id: 'fixed-id' });

    assert.equal(artifact.mediaId, 'fixed-id');
    assert.equal(artifact.section.view_model.primitive.__typename, 'GenAIFilePrimitive');
    assert.equal(artifact.section.view_model.primitive.preview_image.media_id, 'fixed-id');
    assert.equal(artifact.section.view_model.primitive.preview_image.mime_type, 'text/html');
    assert.equal(artifact.section.view_model.primitive.file_extension, 'html');
    assert.equal(artifact.section.view_model.primitive.title, 'Judul');
    assert.equal(artifact.mediaDetails.id, 'fixed-id');
    assert.equal(artifact.mediaDetails.previewMedia.directPath, '/v/t62/enc');
    assert.equal(artifact.mediaDetails.highResMedia.directPath, '/v/t62/enc');
    assert.ok(artifact.media.mediaKey);
    assert.equal(artifact.section.view_model.primitive.file_length, Number(artifact.documentMessage.fileLength));

    assert.equal(uploads, 1);
    assert.equal(
        artifact.media.fileSha256,
        createHash('sha256').update(Buffer.from(html, 'utf-8')).digest('base64')
    );

    calls.length = 0;
    const sent = await sendHtmlArtifact(sock, '2@s.whatsapp.net', html, { fileName: 'app.html', title: 'Mini App', label: 'buka' });

    assert.ok(sent.message.key.id);
    assert.ok(sent.mediaId);
    assert.equal(calls.length, 1);

    const botMetadata = calls[0].message.messageContextInfo.botMetadata;
    assert.equal(botMetadata.messageDisclaimerText, 'Mini App');
    assert.ok(botMetadata.verificationMetadata);
    const list = botMetadata.unifiedResponseMutation.mediaDetailsMetadataList;
    assert.equal(list.length, 1);
    assert.equal(list[0].id, sent.mediaId);
    assert.equal(typeof list[0].previewMedia.mediaKey, 'string');

    const decoded = decodeAIRich({ message: calls[0].message });
    assert.deepEqual(decoded.typenames, ['GenAIFilePrimitive']);
    assert.equal(decoded.sections[0].view_model.primitive.preview_image.media_id, sent.mediaId);
    assert.deepEqual(
        (calls[0].message.botForwardedMessage?.message?.richResponseMessage ?? calls[0].message.richResponseMessage).submessages,
        [{ messageType: 2, messageText: 'buka' }]
    );

    const rich = new AIRich(sock);
    assert.throws(() => rich.setBotMetadata('bukan objek'), ContentValidationError);
    assert.throws(() => rich.setBotMetadata([]), ContentValidationError);
    rich.setBotMetadata({ a: 1 }).setBotMetadata({ b: 2 });
    assert.deepEqual(rich._botMetadataExtra, { a: 1, b: 2 });

    await assert.rejects(() => prepareFileArtifact(null, html), TypeError);
    await assert.rejects(() => prepareFileArtifact(sock, 42), TypeError);
    await assert.rejects(() => sendHtmlArtifact(sock, '', html), TypeError);
});

test('html-media', async () => {
    assert.throws(() => dataUri(Buffer.from('x'), 'mp4'), TypeError);
    assert.throws(() => dataUri(Buffer.alloc(0), 'video/mp4'), TypeError);
    assert.equal(dataUri(Buffer.from('hi'), 'video/mp4'), 'data:video/mp4;base64,aGk=');

    assert.throws(() => htmlMedia(Buffer.from('x'), { mimetype: 'video/mp4', tag: 'iframe' }), TypeError);
    assert.throws(() => htmlMedia(Buffer.from('x'), { mimetype: 'video/mp4', id: '9bad' }), TypeError);

    const clip = htmlMedia(Buffer.from('fake mp4 bytes'), { mimetype: 'video/mp4', id: 'clip', label: 'Tap untuk memuat' });

    assert.match(clip, /<video id="clip" controls preload="none" playsinline><\/video>/);
    assert.match(clip, /<button id="clip_go"/);
    assert.match(clip, /Tap untuk memuat/);
    assert.match(clip, /data:video\/mp4;base64,/);

    /** The source must not sit in the src attribute, or the tap gate is decorative. */
    assert.equal(/<video[^>]*\ssrc=/.test(clip), false);

    /** A label with markup in it must not be able to break out of the button. */
    const nasty = htmlMedia(Buffer.from('x'), { mimetype: 'audio/mpeg', tag: 'audio', label: '<img src=x onerror=alert(1)>' });
    assert.equal(nasty.includes('<img src=x'), false);
    assert.match(nasty, /&lt;img src=x/);

    /** Nor may the media bytes close the script tag they are embedded in. */
    const closing = htmlMedia(Buffer.from('</script><b>'), { mimetype: 'text/plain' });
    assert.equal(closing.split('</script>').length, 2);

    const poster = htmlMedia(Buffer.from('x'), { mimetype: 'video/mp4', poster: 'data:image/png;base64,AA"onerror=1' });
    assert.match(poster, /poster="data:image\/png;base64,AA&quot;onerror=1"/);

    const page = '<style>body{height:300px}</style>' + clip;
    const report = checkHtmlApp(page, { height: 300 });
    assert.equal(report.ok, true, report.problems.join(' | '));

    /** Measured: a card renders at 896KB and is dropped at 1024KB, so the budget is a real refusal. */
    const heavy = checkHtmlApp('<style>body{height:100px}</style>' + 'x'.repeat(HTML_APP_BYTE_BUDGET + 1), { height: 100 });
    assert.equal(heavy.ok, false);
    assert.match(heavy.problems.join(' '), /over the .*KB budget/);

    const justUnder = checkHtmlApp('<style>body{height:100px}</style>' + 'x'.repeat(896 * 1024), { height: 100 });
    assert.equal(justUnder.ok, true, '896KB is measured to render');
});

test('html-multiplayer', async () => {
    assert.throws(() => htmlMultiplayerPrelude({ url: 'ws://x.example', room: 'a' }), TypeError);
    assert.throws(() => htmlMultiplayerPrelude({ url: 'https://x.example', room: 'a' }), TypeError);
    assert.throws(() => htmlMultiplayerPrelude({ url: 'wss://x.example', room: '  ' }), TypeError);
    assert.throws(() => withHtmlMultiplayer('', { url: 'wss://x.example', room: 'a' }), TypeError);

    const prelude = htmlMultiplayerPrelude({ url: 'wss://game.example/ws', room: 'catur-1', seat: 2 });

    assert.match(prelude, /wss:\/\/game\.example\/ws/);
    assert.match(prelude, /"room":"catur-1"/);
    assert.match(prelude, /"seat":2/);
    assert.match(prelude, /visibilitychange/);
    assert.match(prelude, /window\.room = api/);

    const injected = htmlMultiplayerPrelude({ url: 'wss://game.example/ws', room: '</script><img onerror=alert(1)>' });
    assert.equal(injected.includes('</script><img'), false);
    assert.match(injected, /\\u003c\/script\\u003e/);

    const page = withHtmlMultiplayer('<style>html,body{height:300px;margin:0}</style><div id="board"></div>', {
        url: 'wss://game.example/ws',
        room: 'catur-1'
    });

    assert.ok(page.indexOf('<script>') < page.indexOf('<div id="board">'));

    const report = checkHtmlApp(page, { height: 300 });
    assert.equal(report.ok, true, report.problems.join(' | '));
    assert.deepEqual(report.warnings, []);

    const cleartext = checkHtmlApp('<style>body{height:100px}</style><script>new WebSocket("ws://x.example")</script>', { height: 100 });
    assert.equal(cleartext.ok, false);
    assert.match(cleartext.problems.join(' '), /other than wss/);

    const unclosed = checkHtmlApp('<style>body{height:100px}</style><script>new WebSocket("wss://x.example")</script>', { height: 100 });
    assert.equal(unclosed.ok, true);
    assert.match(unclosed.warnings.join(' '), /nothing closing it/);
});
