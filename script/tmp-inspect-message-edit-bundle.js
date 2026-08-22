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
    'messageSecret'
]
const hits = []

for (const name of readdirSync(snapshot)) {
    if (!name.endsWith('.js')) continue
    const path = join(snapshot, name)
    const source = readFileSync(path, 'utf8')
    const matches = []
    for (const term of terms) {
        let from = 0
        let count = 0
        while (count < 12) {
            const at = source.indexOf(term, from)
            if (at < 0) break
            matches.push({ term, at })
            count++
            from = at + term.length
        }
    }
    if (!matches.length) continue
    const selected = []
    const seen = []
    matches.sort((a, b) => a.at - b.at)
    for (const match of matches) {
        if (seen.some(at => Math.abs(at - match.at) < 2500)) continue
        seen.push(match.at)
        selected.push({
            term: match.term,
            at: match.at,
            snippet: source.slice(Math.max(0, match.at - 5000), Math.min(source.length, match.at + 5000))
        })
        if (selected.length >= 10) break
    }
    hits.push({
        file: basename(path),
        bytes: source.length,
        counts: Object.fromEntries(terms.map(term => [term, source.split(term).length - 1])),
        selected
    })
}

hits.sort((a, b) => {
    const score = x => x.counts['Message Edit'] * 20 + x.counts.MessageEdit * 20 + x.counts.messageEdit * 20 + x.counts.MESSAGE_EDIT * 20 + x.counts.secretEncryptedMessage * 10 + x.counts.targetMessageKey * 10 + x.counts.remoteKeyId * 5 + x.counts.wasaRootSecretAction * 5 + x.counts.messageSecret
    return score(b) - score(a)
})

let output = ''
output += `pinned=${report.pinned}\n`
output += `live=${report.live}\n`
output += `verdict=${report.verdict}\n`
output += `protoGaps=${report.protoGaps}\n`
output += `verifyPassed=${report.verifyPassed}\n`
output += `matchingFiles=${hits.length}\n\n`
for (const hit of hits.slice(0, 40)) {
    output += `===== ${hit.file} bytes=${hit.bytes} =====\n`
    output += JSON.stringify(hit.counts) + '\n'
    for (const item of hit.selected) {
        output += `--- ${item.term} @ ${item.at} ---\n`
        output += item.snippet + '\n'
    }
    output += '\n'
}
writeFileSync('bundle-message-edit-evidence.txt', output)
