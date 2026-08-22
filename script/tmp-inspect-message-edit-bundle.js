import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const report = JSON.parse(readFileSync('.wa-bundle/report.json', 'utf8'))
const snapshot = report.snapshot
const terms = [
    'Message Edit',
    'MessageEdit',
    'messageEdit',
    'MESSAGE_EDIT',
    'secretEncryptedMessage',
    'SecretEncryptedMessage',
    'targetMessageKey',
    'secretEncType',
    'remoteKeyId',
    'wasaRootSecretAction',
    'messageSecret',
    'HKDF',
    'hkdf',
    'AES-GCM',
    'aesGcm',
    'HMAC'
]
const modules = []

for (const name of readdirSync(snapshot)) {
    if (!name.endsWith('.js')) continue
    const source = readFileSync(join(snapshot, name), 'utf8')
    const starts = []
    let from = 0
    while (true) {
        const at = source.indexOf('__d("', from)
        if (at < 0) break
        starts.push(at)
        from = at + 5
    }
    for (let index = 0; index < starts.length; index++) {
        const start = starts[index]
        const end = index + 1 < starts.length ? starts[index + 1] : source.length
        const body = source.slice(start, end)
        const nameMatch = body.match(/^__d\("([^"]+)"/)
        if (!nameMatch) continue
        const moduleName = nameMatch[1]
        const counts = Object.fromEntries(terms.map(term => [term, body.split(term).length - 1]))
        const relevant = moduleName.includes('MessageEdit') || moduleName.includes('SecretEncrypted') || counts.MessageEdit || counts.messageEdit || counts.MESSAGE_EDIT || counts.secretEncryptedMessage || counts.SecretEncryptedMessage || counts.targetMessageKey || counts.wasaRootSecretAction
        if (!relevant) continue
        const excerpts = []
        for (const term of terms) {
            let offset = 0
            let count = 0
            while (count < 5) {
                const at = body.indexOf(term, offset)
                if (at < 0) break
                excerpts.push({
                    term,
                    at,
                    text: body.slice(Math.max(0, at - 3500), Math.min(body.length, at + term.length + 3500))
                })
                count++
                offset = at + term.length
            }
        }
        const score = (moduleName.includes('MessageEdit') ? 200 : 0) + (moduleName.includes('SecretEncrypted') ? 150 : 0) + counts.targetMessageKey * 80 + counts.secretEncryptedMessage * 80 + counts.SecretEncryptedMessage * 60 + counts['Message Edit'] * 50 + counts.MessageEdit * 40 + counts.messageEdit * 40 + counts.MESSAGE_EDIT * 40 + counts.remoteKeyId * 20 + counts.wasaRootSecretAction * 20 + counts.messageSecret * 10 + counts.HKDF * 10 + counts.hkdf * 10 + counts['AES-GCM'] * 10 + counts.aesGcm * 10 + counts.HMAC * 10
        modules.push({ file: basename(name), moduleName, bytes: body.length, score, counts, excerpts, body: body.length <= 60000 && (moduleName.includes('MessageEdit') || moduleName.includes('SecretEncrypted')) ? body : undefined })
    }
}

modules.sort((a, b) => b.score - a.score || a.moduleName.localeCompare(b.moduleName))
let output = ''
output += `pinned=${report.pinned}\n`
output += `live=${report.live}\n`
output += `verdict=${report.verdict}\n`
output += `protoGaps=${report.protoGaps}\n`
output += `verifyPassed=${report.verifyPassed}\n`
output += `matchingModules=${modules.length}\n\n`
for (const item of modules.slice(0, 60)) {
    output += `===== ${item.moduleName} file=${item.file} bytes=${item.bytes} score=${item.score} =====\n`
    output += JSON.stringify(item.counts) + '\n'
    if (item.body) {
        output += `--- FULL MODULE ---\n${item.body}\n`
    } else {
        const seen = []
        for (const excerpt of item.excerpts.sort((a, b) => a.at - b.at)) {
            if (seen.some(at => Math.abs(at - excerpt.at) < 1800)) continue
            seen.push(excerpt.at)
            output += `--- ${excerpt.term} @ ${excerpt.at} ---\n${excerpt.text}\n`
            if (seen.length >= 8) break
        }
    }
    output += '\n'
}
writeFileSync('bundle-message-edit-evidence.txt', output)
