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

// Current release/cache identity must agree across the live page, worker and manifest.
assert.match(html, /style\.css\?v=49/);
assert.match(html, /game\.js\?v=49/);
assert.match(html, /sw\.js\?v=49/);
assert.match(sw, /bounce-tales-v49/);
assert.ok(appShell.some(item => item.startsWith('src/module-registry.js?v=49')));
assert.ok(appShell.some(item => item.startsWith('src/port-engine.js?v=49')));
assert.equal(JSON.parse(read('package.json')).version, '49.0.0');

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
assert.match(importWorkflow, /ROOT_FILES=\(/, 'ZIP import must use an explicit root-file allowlist');
assert.doesNotMatch(importWorkflow, /rsync\s+-a\s+--delete/, 'ZIP import must not delete unrelated repository files');
assert.match(importWorkflow, /for directory in assets src/, 'ZIP import only mirrors the runtime asset/module directories');

const Engine = require('../src/port-engine.js');
assert.equal(Engine.apiVersion, 1);
assert.equal(Engine.diagnostics().ready, true);
assert.equal(Engine.diagnostics().total, 20);
assert.match(css, /\.pause-mini\{[^}]*top:62px[^}]*width:32px;height:30px/);
assert.match(html, /<p class="[^"]*sr-only" id="game-hint"/);
console.log(`Repository health: ${new Set(refs).size} DOM refs, ${appShell.length} precache paths, ${ids.length} unique IDs, ${markdownFiles.length} Markdown files/links and port engine verified`);
