import { execFile } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import {
    diffBundle,
    liveRevision,
    loadBundle,
    pinnedRevision,
    readForkInterfaces,
    root,
    snapshotBundle,
    writePinnedRevision
} from './protobundle.js'
import { diffSnapshots, renderReport } from './diffbundle.js'

const execFileAsync = promisify(execFile)

const flag = name => process.argv.includes(name)
const option = (name, fallback) => {
    const at = process.argv.indexOf(name)
    return at !== -1 && process.argv[at + 1] ? process.argv[at + 1] : fallback
}

const cacheDir = option('--cache', process.env.WA_BUNDLE_CACHE || join(root, '.wa-bundle'))
const keep = Math.max(2, Number.parseInt(option('--keep', '3'), 10) || 3)
const apply = flag('--apply')
const reportDir = option('--out', join(root, '.wa-bundle'))

mkdirSync(cacheDir, { recursive: true })
mkdirSync(reportDir, { recursive: true })

const chunkCount = path => {
    try {
        return readdirSync(path).filter(name => name.endsWith('.js')).length
    }
    catch {
        return 0
    }
}

const snapshotDirs = () => readdirSync(cacheDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^\d+$/.test(entry.name))
    .map(entry => ({ revision: Number.parseInt(entry.name, 10), path: join(cacheDir, entry.name) }))
    .filter(entry => chunkCount(entry.path) > 0)
    .sort((a, b) => a.revision - b.revision)

const step = message => console.log(`• ${message}`)

const pinned = pinnedRevision()
step(`Revisi terpasang di repo: ${pinned}`)

/**
 * WhatsApp rolls a release out gradually, so different edge nodes answer with
 * different revisions at the same moment. Sampling once picks whichever node
 * replied and can walk backwards between runs; take the highest of a few.
 */
const samples = []
for (let attempt = 0; attempt < 5; attempt++) samples.push(await liveRevision())
const observed = snapshotDirs().map(entry => entry.revision)
const live = Math.max(...samples, pinned, ...observed)
const spread = [...new Set(samples)].sort((a, b) => b - a)
step(`Revisi live WhatsApp Web: ${live}`)
if (spread.length > 1) step(`  beberapa revisi dilayani bersamaan: ${spread.join(', ')}`)
if (live > Math.max(...samples)) step(`  sampel kali ini maksimum ${Math.max(...samples)}, memakai yang lebih tinggi dan pernah teramati`)

const existing = snapshotDirs()
const previous = existing.filter(entry => entry.revision !== live).pop()
let current = existing.find(entry => entry.revision === live)

if (current) {
    step(`Snapshot revisi ${live} sudah ada di ${current.path}, memakai ulang`)
}
else {
    const target = join(cacheDir, String(live))
    step(`Mengunduh bundle revisi ${live} ke ${target}`)
    const meta = await snapshotBundle({
        directory: target,
        onProgress: (done, total) => {
            if (done % 100 === 0 || done === total) step(`  ${done}/${total} chunk`)
        }
    })
    if (meta.failed) step(`  ${meta.failed} chunk gagal diunduh`)
    current = { revision: live, path: target }
}

step('Membaca spesifikasi protobuf dari bundle')
const bundle = await loadBundle({ directory: current.path })
const fork = readForkInterfaces()
const { missingMessage, gaps, undeclared } = diffBundle(bundle, fork)
const protoGaps = missingMessage.length + gaps.length

step(`Field Message: bundle ${bundle.messageFields.size}, WAProto ${fork.get('Message').size}`)
step(`Field yang belum ada di WAProto: ${protoGaps}`)

let snapshotDiff
if (previous) {
    step(`Membandingkan dengan snapshot revisi ${previous.revision}`)
    try {
        snapshotDiff = await diffSnapshots(previous.path, current.path)
    }
    catch (error) {
        step(`  snapshot ${previous.revision} tidak terbaca (${error.message}), diff antar-revisi dilewati`)
        snapshotDiff = undefined
    }
}
else {
    step('Belum ada snapshot lama, diff antar-revisi dilewati')
}

const run = async (label, file, env = {}) => {
    step(`Menjalankan ${label}`)
    try {
        const { stdout } = await execFileAsync(process.execPath, [join(root, 'script', file)], {
            cwd: root,
            env: { ...process.env, ...env },
            maxBuffer: 64 * 1024 * 1024
        })
        return { ok: true, output: stdout.trim() }
    }
    catch (error) {
        return { ok: false, output: String(error.stdout || '').trim() + '\n' + String(error.stderr || error.message).trim() }
    }
}

const verify = await run('verifyproto (round-trip encoder)', 'verifyproto.js', {
    PROTO_BUNDLE_DIR: current.path,
    PROTO_OFFLINE: '1'
})
step(verify.ok ? `  ${verify.output.split('\n').pop()}` : '  GAGAL')

const protocolTouched = snapshotDiff ? snapshotDiff.protocolTouched : protoGaps > 0

let verdict
if (protoGaps > 0) verdict = 'needs-work'
else if (!verify.ok) verdict = 'blocked'
else if (live !== pinned) verdict = protocolTouched ? 'bump-and-review' : 'bump-only'
else verdict = 'no-change'

const VERDICTS = {
    'no-change': 'Revisi sudah sama dengan yang terpasang. Tidak ada yang perlu dikerjakan.',
    'bump-only': 'Revisi naik tapi tidak ada permukaan protokol yang berubah. Cukup bump versi.',
    'bump-and-review': 'Revisi naik DAN ada permukaan protokol yang berubah. Baca diff sebelum bump.',
    'needs-work': 'Ada field protobuf yang belum ada di WAProto. Jalankan sync:proto lalu verifikasi ulang.',
    blocked: 'Round-trip encoder gagal. JANGAN bump versi sebelum ini hijau.'
}

const lines = []
lines.push('# Laporan update WhatsApp Web')
lines.push('')
lines.push(`- Revisi terpasang: \`${pinned}\``)
lines.push(`- Revisi live: \`${live}\``)
lines.push(`- Snapshot dipakai: \`${current.path}\``)
lines.push(`- Snapshot pembanding: \`${previous ? previous.path : 'tidak ada'}\``)
lines.push('')
lines.push(`## Kesimpulan: \`${verdict}\``)
lines.push('')
lines.push(VERDICTS[verdict])
lines.push('')
lines.push('## Pemeriksaan protobuf')
lines.push('')
lines.push(`- Field \`Message\`: bundle ${bundle.messageFields.size}, WAProto ${fork.get('Message').size}`)
lines.push(`- Field \`Message\` yang hilang: ${missingMessage.length}`)
if (missingMessage.length) for (const [name, id] of missingMessage) lines.push(`  - \`${name}\` (field ${id})`)
lines.push(`- Tipe dengan field kurang: ${gaps.length}`)
if (gaps.length) for (const gap of gaps) lines.push(`  - \`${gap.type}\`: ${gap.fields.map(field => field.name).sort().join(', ')}`)
lines.push(`- Tipe yang tidak dideklarasikan WAProto sama sekali: ${undeclared.length}`)
lines.push(`- Round-trip encoder: ${verify.ok ? 'lulus' : 'GAGAL'}`)
if (!verify.ok) {
    lines.push('')
    lines.push('```')
    lines.push(verify.output.slice(0, 4000))
    lines.push('```')
}
lines.push('')

if (snapshotDiff) {
    lines.push(renderReport(snapshotDiff).split('\n').slice(1).join('\n'))
}
else {
    lines.push('## Diff antar-revisi')
    lines.push('')
    lines.push('Dilewati: belum ada snapshot revisi sebelumnya di cache.')
    lines.push('')
}

const markdown = lines.join('\n')
const markdownPath = join(reportDir, 'report.md')
const jsonPath = join(reportDir, 'report.json')
writeFileSync(markdownPath, markdown + '\n')
writeFileSync(jsonPath, JSON.stringify({
    pinned,
    live,
    verdict,
    protoGaps,
    missingMessage,
    gaps: gaps.map(gap => ({ type: gap.type, fields: gap.fields.map(field => field.name) })),
    undeclared: undeclared.length,
    verifyPassed: verify.ok,
    protocolTouched,
    snapshot: current.path,
    comparedWith: previous ? previous.path : null,
    diff: snapshotDiff ?? null
}, null, 2) + '\n')

console.log('')
console.log(markdown)
console.log('')
step(`Laporan ditulis ke ${markdownPath} dan ${jsonPath}`)

if (apply) {
    if (verdict === 'bump-only' || verdict === 'bump-and-review') {
        const touched = writePinnedRevision(live)
        step(touched.length ? `Versi dibump ke ${live} di: ${touched.join(', ')}` : 'Tidak ada file versi yang berubah')
    }
    else {
        step(`--apply diabaikan: kesimpulannya \`${verdict}\`, bukan bump`)
    }
}

const cached = snapshotDirs()
for (const entry of cached.slice(0, Math.max(0, cached.length - keep))) {
    step(`Membersihkan snapshot lama ${entry.path}`)
    rmSync(entry.path, { recursive: true, force: true })
}

if (verdict === 'needs-work' || verdict === 'blocked') process.exitCode = 1
