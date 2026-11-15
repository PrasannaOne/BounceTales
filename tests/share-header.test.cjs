'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

assert.match(html, /<button class="header-btn share-only" id="share-site"[^>]*aria-label="Share Bounce Tales"/);
assert.match(html, /<svg class="share-icon"[^>]*>[\s\S]*?<path[\s\S]*?<circle[\s\S]*?<circle[\s\S]*?<circle[\s\S]*?<\/svg>/);
const iconStyle = css.match(/\.share-icon\s*\{([^}]+)\}/)?.[1] || '';
for (const declaration of ['fill: none', 'stroke: currentColor', 'stroke-width: 2', 'stroke-linecap: round', 'stroke-linejoin: round']) {
  assert.ok(iconStyle.includes(declaration), `share icon must define ${declaration}`);
}
const handler = game.match(/async function shareSite\(\)\s*\{([\s\S]*?)\n\}/)?.[1] || '';
assert.ok(handler, 'shareSite handler must exist');
assert.match(handler, /url:'https:\/\/prasannaone\.github\.io\/BounceTales\/'/, 'share action must use the canonical GitHub Pages URL');
assert.match(html, /<meta property="og:url" content="https:\/\/prasannaone\.github\.io\/BounceTales\/"\s*\/?>/, 'Open Graph canonical URL must match the share destination');
assert.match(html, /<a class="brand" href="https:\/\/prasannaone\.github\.io\/BounceTales\/"/, 'header home navigation must match the share destination');
assert.doesNotMatch(handler, /X\.gd\/BounceTales/i, 'share action must not retain the retired short URL');
assert.match(handler, /navigator\.share/);
assert.match(handler, /navigator\.clipboard\?\.writeText/);
console.log('Share header: visible connected-node icon and canonical GitHub Pages share URL verified');
