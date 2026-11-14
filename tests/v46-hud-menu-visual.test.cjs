const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const maps = require('../src/image-map.json').maps;
const atlas = require('../src/sprite-atlas.json');
const imageMap = require('../src/image-map.json');
const Hud = require('../src/original-hud.js');
const RLEF = require('../src/rlef-reader.js');

for (const id of [90,91,92,93,94,95,96,97,98,99,100,101,102,103])
  assert.ok(maps[String(id)], `original HUD map sprite ${id} exists`);
assert.equal(imageMap.atlases[7], 'j.png', 'legacy slot 7 is the original J2ME title logo atlas');
assert.match(game,/im\.src='assets\/original\/'\+atlases\[index\]/,'in-game image slots always load their original assets');
assert.deepEqual(atlas.sprites.find(s => s.sprite_id === 102).draw_offset, {x:-4,y:-3});
assert.deepEqual(atlas.sprites.find(s => s.sprite_id === 103).draw_offset, {x:28,y:-3});
assert.equal(Hud.digitSprite(0), 90);
assert.equal(Hud.digitSprite(9), 99);
assert.deepEqual(Hud.timerParts(13), {minutes:[0],seconds:[1,3]});
assert.deepEqual(Hud.timerParts(125), {minutes:[2],seconds:[0,5]});
assert.equal(Hud.collectibleTotal(27,3),30);

assert.match(game,/drawImageMap\(102,0,0\)/,'egg icon is drawn from original sprite 102');
assert.match(game,/drawImageMap\(101,x,7\)/,'slash follows the actual collected-count sprite width');
assert.match(game,/drawHudNumber\(eggs\.length\+enemies\.length,x,7\)/,'right side of counter is total level collectibles, not score');
assert.match(game,/drawImageMap\(103,W,0\)/,'original clock is right-anchored');
assert.match(game,/drawImageMap\(100,secondsX-5,4\)/,'timer colon is right-anchored with the original glyph origin');
assert.match(game,/drawImageMap\(90\+Number\(ch\),cursor,y\)/,'all HUD numerals use original outlined digit sprites');
assert.doesNotMatch(game,/scoreLabel|eggHud\.textContent='FORM|FORM BOUNCE/,'fake score and persistent form label are gone');
assert.match(html,/id="egg-hud" hidden aria-hidden="true"><\/div>/,'legacy form badge is hidden');
assert.match(game,/if\(textCtx\)textCtx\.clearRect\(0,0,W,H\);canvasMenuHits=\[\];drawOriginalConfirmation\(\)/,'confirm dialog clears stale canvas text');
assert.match(game,/if\(confirmationState\?\.returnMode===S\.pause\)\{drawGameplayScene\(\);\}/,'confirmation does not draw the pause menu underneath itself');
assert.match(game,/drawImageMap\(332,120,160\)/,'title uses original closed-book asset');
assert.doesNotMatch(game,/index===7\?'assets\/logo-transparent\.png'/,'PWA icon is never substituted into the original game sprite atlas');
assert.match(game,/drawImageMap\(2,labelLeft-19\+pulse,centerY\)/,'selected title row uses the original left green arrow sprite with source spacing');
assert.match(game,/drawImageMap\(326,labelRight\+19-pulse,centerY\)/,'selected title row uses the original right green arrow sprite with source spacing');
assert.match(game,/drawImageMapRotatedAtTopLeft\(12,147,1,-Math\.PI\/2\)/,'title book reproduces the original upper-right metal corner transform');
assert.match(game,/drawImageMap\(15,33,85\)/,'title book hinge uses the original left-middle anchor');
assert.match(game,/\[gameText\(17,'CONTINUE'\),'continue'\],\s*\[gameText\(36,'NEW GAME'\),'newgame'\]/,'saved games retain both Continue and New Game actions');
assert.match(game,/action==='newgame'\)showConfirmation\('newgame',S\.title\)/,'New Game asks for confirmation when progress exists');
assert.match(game,/elapsed\+=dt/,'level clock advances on fixed-step simulation');
assert.match(game,/Open Settings → Touch Controls/,'instructions describe the website touch editor');
assert.doesNotMatch(game.slice(game.indexOf('function drawCanvasGuide'),game.indexOf('function drawCanvasScores')),/gameText\(12\)|number keys|Press '4'/,'guide no longer shows original handset keypad instructions');
assert.doesNotMatch(game,/drawImageMap\(10,/,'striped ornament is never stretched as a selection highlight');
assert.match(html,/src\/original-hud\.js\?v=47/);
assert.match(html,/game\.js\?v=47/);
assert.match(sw,/CACHE_NAME\s*=\s*'bounce-tales-v47'/);
assert.match(sw,/src\/original-hud\.js\?v=47/);
for(let i=0;i<15;i++){
  const resource='b'+String.fromCharCode('f'.charCodeAt(0)+i);
  const parsed=RLEF.parse(fs.readFileSync(path.join(root,'assets','original',resource)));
  const total=parsed.objects.filter(o=>o.type==='egg'||o.type==='enemy').length;
  assert.equal(total,30,`${resource} original HUD total remains 30`);
}
console.log('V47 visual parity tests: original closed-book title, green focus arrows, sprite HUD, browser instructions, and clean confirmation overlay passed');
