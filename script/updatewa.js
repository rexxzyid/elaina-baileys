import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function fetchLatestWaWebVersion() {
    try {
        const response = await fetch('https://web.whatsapp.com/sw.js', {
            headers: {
                'sec-fetch-site': 'none',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch sw.js: ${response.statusText}`)
        }

        const data = await response.text()
        const regex = /\\?"client_revision\\?":\s*(\d+)/
        const match = data.match(regex)

        if (!match?.[1]) {
            throw new Error('Could not find client revision in sw.js')
        }

        return [2, 3000, Number.parseInt(match[1], 10)]
    } catch (error) {
        console.error('Failed to fetch latest WhatsApp version:', error.message)
        throw error
    }
}

function updateFile(filePath, regex, replacement) {
    try {
        const fullPath = join(__dirname, '..', filePath)

        if (!existsSync(fullPath)) {
            console.warn(`! Skip (tidak ada): ${filePath}`)
            return false
        }

        const originalContent = readFileSync(fullPath, 'utf8')
        const updatedContent = originalContent.replace(regex, replacement)

        if (originalContent !== updatedContent) {
            writeFileSync(fullPath, updatedContent)
            console.log(`✓ Updated ${filePath}`)
            return true
        }

        console.warn(`! Pola tidak ketemu di ${filePath}`)
        return false
    } catch (error) {
        console.error(`✗ Failed to update ${filePath}:`, error.message)
        return false
    }
}

function updateJson(filePath, version) {
    try {
        const fullPath = join(__dirname, '..', filePath)

        if (!existsSync(fullPath)) {
            console.warn(`! Skip (tidak ada): ${filePath}`)
            return false
        }

        writeFileSync(fullPath, `${JSON.stringify({ version })}\n`)
        console.log(`✓ Updated ${filePath}`)
        return true
    } catch (error) {
        console.error(`✗ Failed to update ${filePath}:`, error.message)
        return false
    }
}

async function main() {
    console.log('Fetching latest WhatsApp Web version...')

    const version = await fetchLatestWaWebVersion()

    console.log(`Latest version found: [${version.join(', ')}]`)

    const vStr = `[${version.join(', ')}]`

    updateJson('lib/Defaults/baileys-version.json', version)

    const okIndex = updateFile(
        'lib/Defaults/index.js',
        /exports\.version\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/g,
        `exports.version = ${vStr}`
    )

    updateFile(
        'src/Defaults/index.ts',
        /export const version(\s*:\s*WAVersion)?\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/g,
        `export const version = ${vStr}`
    )

    if (!okIndex) {
        console.error(
            '✗ GAGAL sync exports.version di lib/Defaults/index.js — dibatalkan agar versi tidak mismatch.'
        )
        process.exit(1)
    }

    console.log('Update complete! (baileys-version.json + index.js sinkron)')
}

main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
