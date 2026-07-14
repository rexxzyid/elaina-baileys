const { readFileSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

async function fetchLatestWaWebVersion() {
    try {
        const response = await fetch('https://web.whatsapp.com/sw.js', {
            headers: {
                'sec-fetch-site': 'none',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch sw.js: ${response.statusText}`);
        }

        const data = await response.text();
        const regex = /\\?"client_revision\\?":\s*(\d+)/;
        const match = data.match(regex);
        if (!match || !match[1]) {
            throw new Error('Could not find client revision in sw.js');
        }
        return [2, 3000, parseInt(match[1])];
    } catch (error) {
        console.error('Failed to fetch latest WhatsApp version:', error.message);
        throw error;
    }
}

function updateFile(filePath, regex, replacement) {
    try {
        const fullPath = join(__dirname, '..', filePath);
        if (!existsSync(fullPath)) {
            console.warn(`! Skip (tidak ada): ${filePath}`);
            return false;
        }
        const originalContent = readFileSync(fullPath, 'utf8');
        const updatedContent = originalContent.replace(regex, replacement);

        if (originalContent !== updatedContent) {
            writeFileSync(fullPath, updatedContent);
            console.log(`✓ Updated ${filePath}`);
            return true;
        } else {
            console.warn(`! Pola tidak ketemu di ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`✗ Failed to update ${filePath}:`, error.message);
        return false;
    }
}

function updateJson(filePath, version) {
    try {
        const fullPath = join(__dirname, '..', filePath);
        if (!existsSync(fullPath)) {
            console.warn(`! Skip (tidak ada): ${filePath}`);
            return false;
        }
        writeFileSync(fullPath, JSON.stringify({ version }) + '\n');
        console.log(`✓ Updated ${filePath}`);
        return true;
    } catch (error) {
        console.error(`✗ Failed to update ${filePath}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('Fetching latest WhatsApp Web version...');
    const version = await fetchLatestWaWebVersion();
    console.log(`Latest version found: [${version.join(', ')}]`);

    const vStr = `[${version.join(', ')}]`;

    // 1) file JSON
    updateJson('lib/Defaults/baileys-version.json', version);

    // 2) versi HARDCODED di lib/Defaults/index.js (INI yang benar-benar dipakai runtime).
    //    FIX: dulu regex mencari "const.version" -> salah. Yang benar "exports.version".
    const okIndex = updateFile(
        'lib/Defaults/index.js',
        /exports\.version\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/g,
        `exports.version = ${vStr}`
    );

    // 3) kalau kamu punya sumber TS (src/Defaults/index.ts), update juga (aman kalau tak ada).
    updateFile(
        'src/Defaults/index.ts',
        /export const version(\s*:\s*WAVersion)?\s*=\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]/g,
        `export const version = ${vStr}`
    );

    // penjaga: kalau index.js gagal ter-update, hentikan supaya tidak publish versi tak sinkron.
    if (!okIndex) {
        console.error('✗ GAGAL sync exports.version di lib/Defaults/index.js — dibatalkan agar versi tidak mismatch.');
        process.exit(1);
    }

    console.log('Update complete! (baileys-version.json + index.js sinkron)');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
