import { snapshotBundle } from './protobundle.js'

const target = process.argv[2] || process.env.PROTO_BUNDLE_DIR || 'bundle'

const meta = await snapshotBundle({
    directory: target,
    onProgress: (done, total) => {
        if (done % 100 === 0 || done === total) console.log(`  ${done}/${total} chunk`)
    }
})

console.log(`Saved ${meta.saved} of ${meta.total} chunks for revision ${meta.revision} to ${target}${meta.failed ? `, ${meta.failed} failed` : ''}`)
