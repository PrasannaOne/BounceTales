const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');

const topbarStart = html.indexOf('<header class="topbar"');
const topbarEnd = html.indexOf('</header>', topbarStart);
const toolbarStart = html.indexOf('<div class="pause-toolbar"');
const gameWrapStart = html.indexOf('<section class="game-wrap"');
const gameWrapEnd = html.indexOf('</section>', gameWrapStart);
const pauseAt = html.indexOf('id="pause-mini"');
const controlsAt = html.indexOf('id="game-controls"');

assert.ok(gameWrapStart >= 0 && gameWrapEnd > gameWrapStart, 'game viewport exists');
assert.ok(topbarStart >= 0 && topbarEnd > topbarStart, 'site header exists');
assert.ok(toolbarStart > topbarEnd && toolbarStart < gameWrapStart, 'pause toolbar sits between the header and the game viewport');
assert.ok(pauseAt > toolbarStart && pauseAt < gameWrapStart, 'pause control is outside the game viewport and above it');
assert.ok(gameWrapEnd < controlsAt, 'touch controls remain below the game viewport');
assert.match(css, /#app #game-controls\s*\{[^}]*visibility:\s*hidden/s,
  'touch controls stay hidden until their final geometry has been applied');
const layoutFnStart = game.indexOf('function applyControlLayoutToSurface');
const layoutFnEnd = game.indexOf('function applyLiveControlLayout', layoutFnStart);
const layoutFn = game.slice(layoutFnStart, layoutFnEnd);
assert.ok(layoutFn.indexOf("el.style.setProperty('min-height'") < layoutFn.indexOf("surface.dataset.layoutMeasured='true'"),
  'controls are revealed only after all button geometry is written');
assert.match(game, /async function boot\(\)[\s\S]*?applyLiveControlLayout\(\);[\s\S]*?const locale=resolveOriginalLocale\(\);/,
  'saved/default layout is applied synchronously before resource-loading awaits');
assert.match(game,/function scheduleLiveControlLayout\(\)[\s\S]*?host.dataset.layoutMeasured='false'[\s\S]*?requestAnimationFrame/,'resize hides stale coordinates before recomputing the button boxes');
assert.match(game, /applyLiveControlLayout\(\)/,
  'live layout application remains wired into startup and resize handling');

console.log('Startup control flash and external pause placement regression: PASS');
