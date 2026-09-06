/* Elaina Baileys maintained distribution. Upstream notices and license are preserved in LICENSE and NOTICE.md. */
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetDir = join(root, 'lib/assets/wasm');
const readmePath = join(assetDir, 'README.md');
const RISKY = [
    ['eval(', /\beval\s*\(/g],
    ['new Function', /\bnew\s+Function\s*\(/g],
    ['child_process', /child_process/g],
    ['process.env', /process\.env/g]
];
const readme = readFileSync(readmePath, 'utf8');
const documented = new Map();
for (const match of readme.matchAll(/\|\s*`([^`]+)`\s*\|[^|]*\|\s*`([0-9a-f]{64})`\s*\|/g)) {
    documented.set(match[1], match[2]);
}
if (!documented.size) {
    console.error('no checksum table found in lib/assets/wasm/README.md');
    process.exit(1);
}
let failed = 0;
for (const [name, expected] of documented) {
    const path = join(assetDir, name);
    let bytes;
    try {
        bytes = readFileSync(path);
    }
    catch {
        console.error(`MISSING  ${name}`);
        failed += 1;
        continue;
    }
    const actual = createHash('sha256').update(bytes).digest('hex');
    if (actual !== expected) {
        console.error(`CHANGED  ${name}\n  documented ${expected}\n  on disk    ${actual}`);
        failed += 1;
        continue;
    }
    console.log(`ok       ${name}  ${statSync(path).size} B  ${actual.slice(0, 16)}…`);
}
for (const name of ['loader.js', 'worker-modules.js']) {
    const source = readFileSync(join(assetDir, name), 'utf8');
    for (const [label, pattern] of RISKY) {
        const hits = source.match(pattern);
        if (hits) {
            console.error(`FOUND    ${name} contains ${label} (${hits.length}x), which the README says it does not`);
            failed += 1;
        }
    }
}
if (failed) {
    console.error(`\n${failed} problem(s). The vendored assets no longer match what lib/assets/wasm/README.md documents.`);
    process.exit(1);
}
console.log('\nthe vendored WhatsApp Web assets match their documented checksums and carry no eval, Function constructor, child process or env read.');
