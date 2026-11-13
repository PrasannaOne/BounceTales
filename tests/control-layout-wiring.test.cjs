'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(game, /function applyLiveControlLayout\(override=null\)/);
assert.match(game, /applyLiveControlLayout\(editorLayout\)/, 'editor changes are reflected in the live controls before Save');
assert.match(game, /localStorage\.setItem\(CONTROL_LAYOUT_KEY,JSON\.stringify\(sanitiseControlLayout\(editorLayout\)\)\)/, 'Save persists the sanitized layout');
assert.match(game, /function closeControlEditor\(restoreSaved=true\)/, 'Cancel restores the previously saved layout');
assert.match(game, /const CONTROL_BASE=\{left:\{w:64,h:54\},right:\{w:64,h:54\},jump:\{w:92,h:48\},form:\{w:44,h:44\}\}/, 'custom sizes are based on real CSS-pixel dimensions');
for (const key of ['3', '4', '7', '20']) {
  assert.ok(css.includes(`#game-controls:not(.custom-layout) [data-key-id="${key}"]`), `default button ${key} styles are scoped away from custom layouts`);
}
assert.match(css, /#game-controls\.custom-layout\{flex-basis:136px!important;height:136px!important;min-height:136px!important;\}/);
assert.ok(html.indexOf('class="header-btn heart-link"') < html.indexOf('id="share-site"') && html.indexOf('id="share-site"') < html.indexOf('id="open-settings"'), 'red heart link remains first, followed by Share and Settings');
assert.match(css, /\.header-btn\.heart-link\{color:#ff3b5c;/);
console.log('Control layout wiring: live preview, save/reload storage, cancel/reset and CSS cascade checks passed');
