import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const report = JSON.parse(readFileSync('.wa-bundle/report.json', 'utf8'))
const wanted = [
    'WAWebAddonEncryption',
    'WAWebAddonEncryptionError',
    'WAWebProcessEncryptedMessageEditMsgs',
    'WAWebCreateEncryptedMessageEditMsgData',
    'WAWebMsgGetters',
    'WAWebLidMigrationUtils'
]
const found = []

for (const file of readdirSync(report.snapshot)) {
    if (!file.endsWith('.js')) continue
    const source = readFileSync(join(report.snapshot, file), 'utf8')
    for (const name of wanted) {
        const marker = `__d("${name}"`
        const start = source.indexOf(marker)
        if (start < 0) continue
        const next = source.indexOf('__d("', start + marker.length)
        const body = source.slice(start, next < 0 ? source.length : next)
        found.push({ name, file: basename(file), body })
    }
}

let out = `pinned=${report.pinned}\nlive=${report.live}\nverdict=${report.verdict}\nverifyPassed=${report.verifyPassed}\n\n`
for (const item of found) {
    out += `===== ${item.name} file=${item.file} =====\n${item.body}\n\n`
}
writeFileSync('bundle-message-edit-evidence.txt', out)
