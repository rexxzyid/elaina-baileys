import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

async function fetchLatestWaWebVersion() {
    try {
        const response = await fetch('https://web.whatsapp.com/sw.js', {
            headers: {
                'sec-fetch-site': 'none',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch sw.js: ${response.status} ${response.statusText}`)
        }

        const data = await response.text()
        const match = data.match(/\\?"client_revision\\?":\s*(\d+)/)

        if (!match?.[1]) {
            throw new Error('Could not find client revision in sw.js')
        }

        return [2, 3000, Number.parseInt(match[1], 10)]
    } catch (error) {
        console.error('Failed to fetch latest WhatsApp version:', error.message)
        throw error
    }
}

function updateVersion(filePath, regex, replacement) {
    const fullPath = join(rootDir, filePath)

    if (!existsSync(fullPath)) {
        console.error(`✗ File tidak ditemukan: ${filePath}`)
        return false
    }

    try {
        const originalContent = readFileSync(fullPath, 'utf8')

        if (!regex.test(originalContent)) {
            console.error(`✗ Pola version tidak ditemukan di ${filePath}`)
            return false
        }

        regex.lastIndex = 0

        const updatedContent = originalContent.replace(regex, replacement)

        if (originalContent === updatedContent) {
            console.log(`= ${filePath} sudah menggunakan versi terbaru`)
            return true
        }

        writeFileSync(fullPath, updatedContent)

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
    const versionString = `[${version.join(', ')}]`

    console.log(`Latest version found: ${versionString}`)

    const defaultsUpdated = updateVersion(
        'lib/Defaults/index.js',
        /const\s+version\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]\s*;/,
        `const version = ${versionString};`
    )

    const genericsUpdated = updateVersion(
        'lib/Utils/generics.js',
        /const\s+baileysVersion\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]\s*;/,
        `const baileysVersion = ${versionString};`
    )

    if (!defaultsUpdated || !genericsUpdated) {
        console.error('✗ Gagal sinkronisasi versi WhatsApp.')
        process.exit(1)
    }

    console.log('')
    console.log('Update complete!')
    console.log(`WhatsApp Web version: ${versionString}`)
    console.log('✓ lib/Defaults/index.js')
    console.log('✓ lib/Utils/generics.js')
}

main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
})
