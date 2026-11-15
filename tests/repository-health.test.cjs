const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('index.html');
const game = read('game.js');
const sw = read('sw.js');
const css = read('style.css');
const readme = read('README.md');

// Every literal game.js DOM lookup must resolve to a unique element in index.html.
const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(match => match[1]);
const idSet = new Set(ids);
assert.equal(idSet.size, ids.length, 'index.html must not contain duplicate IDs');
const refs = [...game.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)].map(match => match[1]);
for (const id of new Set(refs)) assert.ok(idSet.has(id), `game.js refers to missing #${id}`);

// PWA manifest and service-worker shell paths must all exist in the source tree.
const manifest = JSON.parse(read('manifest.webmanifest'));
for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)), `missing PWA icon: ${icon.src}`);
const match = sw.match(/const APP_SHELL = (\[[\s\S]*?\]);/);
assert.ok(match, 'service worker must declare APP_SHELL');
const appShell = JSON.parse(match[1].replace(/,\s*\]$/, '\n]'));
for (const item of appShell) {
  if (item === './') continue;
  const file = item.split('?')[0];
  assert.ok(fs.existsSync(path.join(root, file)), `missing app-shell file: ${item}`);
}

// Every local README destination must exist; external links and anchors are left to their owners.
const markdownFiles = [];
function collectMarkdown(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) collectMarkdown(full);
    else if (entry.isFile() && entry.name.endsWith('.md')) markdownFiles.push(full);
  }
}
collectMarkdown(root);
for (const file of markdownFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const link of source.matchAll(/\]\(([^)]+)\)/g)) {
    let target = decodeURIComponent(link[1].split('#')[0]);
    if (!target || /^(?:https?:|mailto:|#)/i.test(target)) continue;
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), target)), `${path.relative(root, file)} link does not exist: ${link[1]}`);
  }
}

// Port engine is available, complete, and can host a separate registry.
const importWorkflow = read('.github/workflows/import-bounce-zip.yml');
assert.match(importWorkflow, /tools\/import_runtime_zip\.py/, 'ZIP import must use the validated full-project importer');
assert.match(importWorkflow, /git add -A/, 'ZIP import must stage the complete project overlay');
assert.match(importWorkflow, /npm run verify/, 'ZIP import must verify the merged project before committing');
assert.match(read('tools/import_runtime_zip.py'), /MAX_UNCOMPRESSED = 600 \* 1024 \* 1024/, 'ZIP importer must enforce an expansion limit');
assert.match(read('tools/import_runtime_zip.py'), /stat\.S_ISREG|stat\.S_IFREG/, 'ZIP importer must validate entry file types');
assert.match(read('tools/import_runtime_zip.py'), /PROTECTED_FILES/, 'ZIP importer must protect its own execution files');

const Engine = require('../src/port-engine.js');
assert.equal(Engine.apiVersion, 1);
assert.equal(Engine.diagnostics().ready, true);
assert.equal(Engine.diagnostics().total, 21);
assert.match(css, /#app \.pause-toolbar\s*\{[\s\S]*?top:\s*40px;[\s\S]*?right:\s*-48px;[\s\S]*?width:\s*32px;[\s\S]*?height:\s*29px;/);
assert.match(css, /#app \.pause-mini\s*\{[\s\S]*?width:\s*32px[\s\S]*?height:\s*29px/);
assert.match(html, /<div class="pause-toolbar"[\s\S]*?id="pause-mini"/);
assert.match(html, /<p class="[^"]*sr-only" id="game-hint"/);
console.log(`Repository health: ${new Set(refs).size} DOM refs, ${appShell.length} precache paths, ${ids.length} unique IDs, ${markdownFiles.length} Markdown files/links and port engine verified`);
