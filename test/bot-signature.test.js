import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { X509Certificate, sign as cryptoSign, createPrivateKey } from 'node:crypto';
import {
    BOT_SIGNATURE_ROOT_CERTIFICATE,
    constructSignaturePayload,
    loadBotSignatureRoot,
    verifyBotSignature
} from '../lib/MessageBuilder/bot-signature.js';

/**
 * The root the client ships is the anchor every proof has to chain to. If Meta
 * rotates it this assertion is the first thing that fails.
 */
{
    const root = loadBotSignatureRoot();
    assert.match(root.subject, /Meta WA Feature Root CA/);
    assert.equal(root.ca, true);
    assert.equal(root.verify(root.publicKey), true, 'the root is self-signed');
    assert.equal(root.publicKey.asymmetricKeyType, 'ec');
    assert.equal(loadBotSignatureRoot(), root, 'parsed once and cached');
    assert.ok(BOT_SIGNATURE_ROOT_CERTIFICATE.includes('BEGIN CERTIFICATE'));
}

/** version || botFbid || unified response bytes, concatenated, nothing else. */
{
    const payload = constructSignaturePayload({ botFbid: '867051314767696', messageDigest: Buffer.from('halo') });
    assert.deepEqual(payload, Buffer.concat([Buffer.from('1'), Buffer.from('867051314767696'), Buffer.from('halo')]));
}

let openssl = true;
try {
    execFileSync('openssl', ['version'], { stdio: 'ignore' });
}
catch {
    openssl = false;
}

if (!openssl) {
    console.log('bot signature tests passed (openssl absent, chain tests skipped)');
}
else {
    const dir = mkdtempSync(join(tmpdir(), 'botsig-'));
    const path = name => join(dir, name);
    const run = args => execFileSync('openssl', args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });

    try {
        run(['ecparam', '-name', 'prime256v1', '-genkey', '-noout', '-out', path('ca.key')]);
        run(['req', '-x509', '-new', '-key', path('ca.key'), '-sha256', '-days', '3650',
            '-subj', '/CN=Test Root', '-out', path('ca.pem')]);

        run(['genpkey', '-algorithm', 'ed25519', '-out', path('leaf.key')]);
        run(['req', '-new', '-key', path('leaf.key'), '-subj', '/CN=Test Bot Leaf', '-out', path('leaf.csr')]);
        writeFileSync(path('ext.cnf'), 'basicConstraints=CA:FALSE\nkeyUsage=digitalSignature\n');
        run(['x509', '-req', '-in', path('leaf.csr'), '-CA', path('ca.pem'), '-CAkey', path('ca.key'),
            '-CAcreateserial', '-days', '3650', '-extfile', path('ext.cnf'), '-out', path('leaf.pem')]);

        const root = new X509Certificate(readFileSync(path('ca.pem')));
        const leaf = new X509Certificate(readFileSync(path('leaf.pem')));
        const leafKey = createPrivateKey(readFileSync(path('leaf.key')));

        const botJid = '867051314767696@bot';
        const unifiedResponseBytes = Buffer.from(JSON.stringify({ response_id: 'r-1', sections: [] }));
        const signature = cryptoSign(null, constructSignaturePayload({
            botFbid: '867051314767696',
            messageDigest: unifiedResponseBytes
        }), leafKey);

        const proof = { version: 1, useCase: 1, signature, certificateChain: [leaf.raw] };

        /** A proof that chains to the root and covers these exact bytes passes. */
        {
            const result = verifyBotSignature({ botJid, unifiedResponseBytes, proof, root });
            assert.deepEqual(result, { status: 'passed' }, result.reason);
        }

        /** Change one byte of the payload and it stops matching. */
        {
            const tampered = Buffer.from(unifiedResponseBytes);
            tampered[tampered.length - 2] ^= 1;
            const result = verifyBotSignature({ botJid, unifiedResponseBytes: tampered, proof, root });
            assert.equal(result.status, 'failed');
            assert.match(result.reason, /does not match/);
        }

        /** The bot fbid is inside the payload, so relaying under another bot fails. */
        {
            const result = verifyBotSignature({ botJid: '123456@bot', unifiedResponseBytes, proof, root });
            assert.equal(result.status, 'failed');
            assert.match(result.reason, /does not match/);
        }

        /** A leaf that chains to some other CA is refused. */
        {
            const result = verifyBotSignature({ botJid, unifiedResponseBytes, proof, root: loadBotSignatureRoot() });
            assert.equal(result.status, 'failed');
            assert.match(result.reason, /chain broken|threw/);
        }

        /** Filler bytes in place of a real proof never pass. */
        {
            const placeholder = { version: 1, useCase: 1, signature: Buffer.alloc(64, 9), certificateChain: [Buffer.alloc(48, 3)] };
            const result = verifyBotSignature({ botJid, unifiedResponseBytes, proof: placeholder, root });
            assert.equal(result.status, 'failed');
            assert.match(result.reason, /did not parse/);
        }

        /** Every missing piece names itself rather than failing vaguely. */
        {
            const cases = [
                [{ botJid, unifiedResponseBytes, proof: undefined }, /no WA_BOT_MSG proof/],
                [{ botJid, unifiedResponseBytes, proof: { ...proof, version: 2 } }, /unsupported signature version/],
                [{ botJid, unifiedResponseBytes, proof: { ...proof, signature: undefined } }, /no signature/],
                [{ botJid, unifiedResponseBytes, proof: { ...proof, certificateChain: [] } }, /empty certificate chain/],
                [{ botJid, unifiedResponseBytes: Buffer.alloc(0), proof }, /no unified response bytes/],
                [{ botJid: '', unifiedResponseBytes, proof }, /no bot jid/]
            ];
            for (const [input, pattern] of cases) {
                const result = verifyBotSignature({ ...input, root });
                assert.equal(result.status, 'failed', JSON.stringify(input));
                assert.match(result.reason, pattern);
            }
        }

        /** An expired leaf is caught before the signature is even checked. */
        {
            const future = Date.parse(leaf.validTo) + 86400000;
            const result = verifyBotSignature({ botJid, unifiedResponseBytes, proof, root, at: future });
            assert.equal(result.status, 'failed');
            assert.match(result.reason, /validity window/);
        }

        console.log('bot signature tests passed');
    }
    finally {
        rmSync(dir, { recursive: true, force: true });
    }
}
