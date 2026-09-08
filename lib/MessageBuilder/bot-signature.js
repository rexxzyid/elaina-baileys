/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { X509Certificate, verify as cryptoVerify } from 'crypto'

export const BOT_SIGNATURE_VERSION = '1'
export const BOT_SIGNATURE_USE_CASE_WA_BOT_MSG = 1
export const BOT_SIGNATURE_ROOT_VERSION = '2025-10'

export const BOT_SIGNATURE_ROOT_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIC7TCCApOgAwIBAgIUAtu5QuxmVhfGT8LPkjfm40mSl0AwCgYIKoZIzj0EAwIw
dzEgMB4GA1UEAwwXTWV0YSBXQSBGZWF0dXJlIFJvb3QgQ0ExCzAJBgNVBAYTAlVT
MRMwEQYDVQQIDApDYWxpZm9ybmlhMRMwEQYDVQQHDApNZW5sbyBQYXJrMRwwGgYD
VQQKDBNNZXRhIFBsYXRmb3JtcyBJbmMuMCAXDTI1MDkwNDE3MzEyNFoYDzIwNjUw
OTA0MTczMTI0WjB3MSAwHgYDVQQDDBdNZXRhIFdBIEZlYXR1cmUgUm9vdCBDQTEL
MAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3JuaWExEzARBgNVBAcMCk1lbmxv
IFBhcmsxHDAaBgNVBAoME01ldGEgUGxhdGZvcm1zIEluYy4wWTATBgcqhkjOPQIB
BggqhkjOPQMBBwNCAAT60blw90ebreMkw8+Wpcs0ETAkr1VQjoZoyi7PSSQbsoiP
qYRnzfRrR+xiahaXbYU83qXiTHjVUiOU9wDxI83qo4H6MIH3MA8GA1UdEwEB/wQF
MAMBAf8wHQYDVR0OBBYEFNO7KMTVSYUxkL6VS3LyWJw7m76zMIG0BgNVHSMEgaww
gamAFNO7KMTVSYUxkL6VS3LyWJw7m76zoXukeTB3MSAwHgYDVQQDDBdNZXRhIFdB
IEZlYXR1cmUgUm9vdCBDQTELMAkGA1UEBhMCVVMxEzARBgNVBAgMCkNhbGlmb3Ju
aWExEzARBgNVBAcMCk1lbmxvIFBhcmsxHDAaBgNVBAoME01ldGEgUGxhdGZvcm1z
IEluYy6CFALbuULsZlYXxk/Cz5I35uNJkpdAMA4GA1UdDwEB/wQEAwIBhjAKBggq
hkjOPQQDAgNIADBFAiAINhjk9DbP416vx/WjqdUfexgic08aQsxnpDDsNE5M0gIh
ANorq7KwCQVMtS2or5uKJAQsx1FxCHyDafq2GCk9t0AN
-----END CERTIFICATE-----`

let rootCertificate = null

export const loadBotSignatureRoot = () => {
    if (!rootCertificate) {
        rootCertificate = new X509Certificate(BOT_SIGNATURE_ROOT_CERTIFICATE)
    }
    return rootCertificate
}

export const constructSignaturePayload = ({ botFbid, messageDigest, version = BOT_SIGNATURE_VERSION }) =>
    Buffer.concat([Buffer.from(version, 'utf8'), Buffer.from(String(botFbid), 'utf8'), Buffer.from(messageDigest)])

const failed = reason => ({ status: 'failed', reason })

const validAt = (certificate, at) => {
    const from = Date.parse(certificate.validFrom)
    const to = Date.parse(certificate.validTo)
    return Number.isFinite(from) && Number.isFinite(to) && at >= from && at <= to
}

export const verifyBotSignature = ({ botJid, unifiedResponseBytes, proof, at = Date.now(), root = loadBotSignatureRoot() } = {}) => {
    if (!proof) {
        return failed('no WA_BOT_MSG proof')
    }
    if (Number(proof.version) !== 1) {
        return failed(`unsupported signature version ${proof.version}`)
    }
    if (!proof.signature?.length) {
        return failed('proof carries no signature')
    }
    if (!proof.certificateChain?.length) {
        return failed('empty certificate chain')
    }
    if (!unifiedResponseBytes?.length) {
        return failed('no unified response bytes to verify')
    }
    const botFbid = String(botJid ?? '').split('@')[0]
    if (!botFbid) {
        return failed('no bot jid, the fbid is part of the signed payload')
    }

    let chain
    try {
        chain = proof.certificateChain.map(entry => new X509Certificate(Buffer.from(entry)))
    }
    catch (error) {
        return failed(`certificate did not parse: ${error.message}`)
    }

    const [leaf] = chain
    if (!validAt(leaf, at)) {
        return failed('leaf certificate is outside its validity window')
    }

    const full = [...chain, root]
    for (let index = 0; index < full.length - 1; index += 1) {
        const issuer = full[index + 1]
        if (!validAt(issuer, at)) {
            return failed(`issuer at position ${index + 1} is outside its validity window`)
        }
        let ok = false
        try {
            ok = full[index].verify(issuer.publicKey)
        }
        catch (error) {
            return failed(`chain verification threw at position ${index}: ${error.message}`)
        }
        if (!ok) {
            return failed(`chain broken at position ${index}`)
        }
    }

    const payload = constructSignaturePayload({ botFbid, messageDigest: unifiedResponseBytes })
    let ok = false
    try {
        ok = cryptoVerify(null, payload, leaf.publicKey, Buffer.from(proof.signature))
    }
    catch (error) {
        return failed(`signature verification threw: ${error.message}`)
    }
    return ok ? { status: 'passed' } : failed('signature does not match the unified response bytes')
}
