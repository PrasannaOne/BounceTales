const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const atlas = require('../src/sprite-atlas.json');
const Hud = require('../src/original-hud.js');

// Original sprite identity and logical draw geometry.
for (const id of [101, 102, 103]) {
  assert.ok(atlas.sprites.some(sprite => sprite.sprite_id === id), `original HUD sprite ${id} exists`);
}
const egg = atlas.sprites.find(sprite => sprite.sprite_id === 102);
const slash = atlas.sprites.find(sprite => sprite.sprite_id === 101);
const clock = atlas.sprites.find(sprite => sprite.sprite_id === 103);
assert.deepEqual(egg.draw_offset, { x: -4, y: -3 });
assert.deepEqual(slash.draw_offset, { x: 0, y: 2 });
assert.deepEqual(clock.draw_offset, { x: 28, y: -3 });

// Pure layout test: the separator follows the measured counter, and timer is
// pinned to the right edge rather than floating over level scenery.
const narrow = Hud.layout(240, 8.4);
assert.deepEqual(narrow.eggIcon, { x: 0, y: 0 });
assert.deepEqual(narrow.eggCounter, { x: 32, y: 8 });
assert.equal(narrow.eggDivider.x, 47);
assert.equal(narrow.score.x, 56);
assert.deepEqual(narrow.clock, { x: 240, y: 0 });
assert.deepEqual(narrow.timer, { right: 208, y: 8 });
const longerCount = Hud.layout(240, 17.2);
assert.equal(longerCount.eggDivider.x, 56, 'separator moves with the measured egg counter');
assert.equal(longerCount.score.x, 65, 'score remains separated from the divider');

assert.match(game, /const hudLayout=BounceOriginalHud\.layout\(W,eggTextWidth\)/);
assert.match(game, /drawImageMap\(102,hudLayout\.eggIcon\.x,hudLayout\.eggIcon\.y\)/);
assert.match(game, /drawImageMap\(101,hudLayout\.eggDivider\.x,hudLayout\.eggDivider\.y\)/);
assert.match(game, /drawImageMap\(103,hudLayout\.clock\.x,hudLayout\.clock\.y\)/);
assert.doesNotMatch(game, /drawImageMap\(102,10,8\)|drawImageMap\(101,39,8\)|drawImageMap\(103,142,8\)/,
  'old guessed HUD positions must not return');
assert.doesNotMatch(game, /drawImageMap\(10,/, 'sprite 10 is ornamental stripe art, not a menu focus state');
assert.match(game, /focused\?'#875b27'/, 'focused MIDP row uses a clean filled rectangle');
assert.match(game, /focused\?'#e5c47f'/, 'focused MIDP row gets a visible border');

assert.match(html, /src\/original-hud\.js\?v=46/);
assert.match(html, /game\.js\?v=46/);
assert.match(sw, /CACHE_NAME\s*=\s*'bounce-tales-v46'/);
assert.match(sw, /src\/original-hud\.js\?v=46/);
console.log('V46 visual regression checks: source-positioned HUD, dynamic egg separator, right-anchored clock, and clean MIDP row focus passed');
