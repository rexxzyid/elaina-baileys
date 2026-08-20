import { mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { fetchText } from './protobundle.js'

const target = process.argv[2] || process.env.PROTO_BUNDLE_DIR || 'bundle'
mkdirSync(target, { recursive: true })

const html = await fetchText('https://web.whatsapp.com/')
const unescaped = html.replaceAll('\\/', '/')
const urls = [...new Set([...unescaped.matchAll(/https:\/\/static\.whatsapp\.net\/rsrc\.php\/[A-Za-z0-9_\-/.]+?\.js/g)].map(match => match[0]))]

if (!urls.length) throw new Error('No bundle chunks found on the page')

const queue = [...urls]
let saved = 0
let failed = 0

const workers = Array.from({ length: 12 }, async () => {
    while (queue.length) {
        const url = queue.shift()
        if (!url) return
        try {
            const source = await fetchText(url, {
                referer: 'https://web.whatsapp.com/',
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
            })
            writeFileSync(join(target, createHash('sha1').update(url).digest('hex').slice(0, 12) + '.js'), source)
            saved++
        }
        catch {
            failed++
        }
    }
})

await Promise.all(workers)

console.log(`Saved ${saved} of ${urls.length} chunks to ${target}${failed ? `, ${failed} failed` : ''}`)

if (!saved) process.exitCode = 1
