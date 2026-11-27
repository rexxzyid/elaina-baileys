import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decryptMessageNode, getDecryptionRetryReason } from '../src/Utils/decode-wa-message.js';
import { MessageRetryManager, RetryReason } from '../src/Utils/message-retry-manager.js';

const logger = {
    trace() {}, debug() {}, info() {}, warn() {}, error() {}
};

test('decryption failures map to Signal retry reasons', () => {
    assert.equal(getDecryptionRetryReason(new Error('Bad MAC')), RetryReason.SignalErrorBadMac);
    assert.equal(getDecryptionRetryReason(new Error('No matching sessions found for message')), RetryReason.SignalErrorBadMac);
    assert.equal(getDecryptionRetryReason(new Error('No session record')), RetryReason.SignalErrorNoSession);
    assert.equal(getDecryptionRetryReason(new Error('No session found to decrypt message')), RetryReason.SignalErrorNoSession);
    assert.equal(getDecryptionRetryReason(new Error('invalid protobuf')), RetryReason.UnknownError);
});

test('decryptMessageNode returns the Bad MAC reason for retry handling', async () => {
    const errorLogs = [];
    const debugLogs = [];
    const quietLogger = {
        ...logger,
        error(...args) { errorLogs.push(args); },
        debug(...args) { debugLogs.push(args); }
    };
    const stanza = {
        tag: 'message',
        attrs: {
            from: '628123@s.whatsapp.net',
            id: 'BAD-MAC-1',
            t: '1700000000',
            type: 'text'
        },
        content: [{ tag: 'enc', attrs: { type: 'msg' }, content: Uint8Array.from([1, 2, 3]) }]
    };
    const repository = {
        lidMapping: {
            async getLIDForPN() {
                return null;
            }
        },
        async decryptMessage() {
            throw new Error('Bad MAC');
        }
    };
    const decoded = decryptMessageNode(stanza, '628999@s.whatsapp.net', '', repository, quietLogger);
    const errorCode = await decoded.decrypt();
    assert.equal(errorCode, RetryReason.SignalErrorBadMac);
    assert.deepEqual(decoded.fullMessage.messageStubParameters, ['Bad MAC']);
    assert.equal(errorLogs.length, 0, 'Bad MAC is hidden from error logs');
    assert.equal(debugLogs.length, 1, 'diagnostics remain available at debug level');
});

test('retry manager consumes the remote MAC error code', () => {
    const manager = new MessageRetryManager(logger, 3);
    const errorCode = manager.parseRetryErrorCode('7');
    assert.equal(errorCode, RetryReason.SignalErrorBadMac);
    assert.equal(manager.isMacError(errorCode), true);
    const result = manager.shouldRecreateSession('628123@s.whatsapp.net', true, errorCode);
    assert.equal(result.recreate, true);
    assert.match(result.reason, /MAC error/);
    assert.equal(manager.parseRetryErrorCode('not-a-number'), undefined);
    manager.clear();
});
