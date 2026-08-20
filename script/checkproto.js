import { writeFileSync } from 'node:fs'
import { diffBundle, liveRevision, loadBundle, pinnedRevision, readForkInterfaces } from './protobundle.js'

const directory = process.env.PROTO_BUNDLE_DIR
const pinned = pinnedRevision()
const live = process.env.PROTO_OFFLINE ? pinned : await liveRevision()

const bundle = await loadBundle({ directory })
const fork = readForkInterfaces()
const { missingMessage, gaps, undeclared } = diffBundle(bundle, fork)

const outstanding = missingMessage.length + gaps.length

const report = [
    `WhatsApp Web client revision: live ${live}, pinned ${pinned}${live === pinned ? '' : ' (outdated)'}`,
    directory ? `Bundle read from ${directory}` : 'Bundle downloaded from web.whatsapp.com',
    `Message fields: bundle ${bundle.messageFields.size}, WAProto ${fork.get('Message').size}`,
    missingMessage.length
        ? `Missing Message fields (${missingMessage.length}):\n` + missingMessage.map(([name, id]) => `  - ${name} (field ${id})`).join('\n')
        : 'Missing Message fields: none',
    gaps.length
        ? `Types with missing fields (${gaps.length}):\n` + gaps.map(gap => `  - ${gap.type}: ${gap.fields.map(field => field.name).sort().join(', ')}`).join('\n')
        : 'Types with missing fields: none',
    `Types WAProto does not declare at all: ${undeclared.length}`
].join('\n')

console.log(report)

if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT,
        `missing_count=${outstanding}\n` +
        `revision_outdated=${live === pinned ? 'false' : 'true'}\n` +
        `live_revision=${live}\n`, { flag: 'a' })
}
if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, '```\n' + report + '\n```\n', { flag: 'a' })
}

process.exitCode = outstanding ? 1 : 0
