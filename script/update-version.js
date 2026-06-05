const { readFileSync, writeFileSync } = require('fs');
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
        const originalContent = readFileSync(fullPath, 'utf8');
        const updatedContent = originalContent.replace(regex, replacement);
        
        if (originalContent !== updatedContent) {
            writeFileSync(fullPath, updatedContent);
            console.log(`✓ Updated ${filePath}`);
            return true;
        } else {
            console.warn(`! Could not find pattern in ${filePath}`);
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
        const content = { version };
        writeFileSync(fullPath, JSON.stringify(content) + '\n');
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
    
    updateJson('lib/Defaults/baileys-version.json', version);
    updateFile('lib/Defaults/index.js', /const\.version\s*=\s*\[\d+,\s*\d+,\s*\d+\]/g, `const.version = ${vStr}`);

    console.log('Update complete!');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
