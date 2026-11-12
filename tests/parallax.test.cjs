const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const maps=JSON.parse(fs.readFileSync(path.join(root,'src/image-map.json'),'utf8')).maps;
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const expected=[252,251,388,159,160,161,373,353,114,113];
for(const id of expected){
  assert.ok(maps[String(id)],'original parallax image map '+id+' exists');
  assert.equal(maps[String(id)].type,'simple','parallax map '+id+' is a drawable sprite');
}
assert.match(game,/function javaRandom\(seed\)/);
assert.match(game,/0x5DEECE66Dn/,'uses the Java Random 48-bit multiplier');
assert.match(game,/function buildOriginalParallax\(levelIndex\)/);
assert.match(game,/ids:\[252\].*ids:\[251\].*ids:\[388\]/s,'green-hill layer order matches the original');
assert.match(game,/ids:\[159,160\].*ids:\[161\].*ids:\[373\]/s,'spooky-zone layer order matches the original');
assert.match(game,/ids:\[353\].*ids:\[114\].*ids:\[113\]/s,'bonus-zone layer order matches the original');
assert.match(game,/#529ae6/);assert.match(game,/#71d5ff/);
assert.match(game,/#6ed5c9/);assert.match(game,/#9fffff/);
assert.match(game,/#7610f4/);assert.match(game,/#02021a/);
assert.match(game,/#b400bd/);assert.match(game,/#fd8c13/);
assert.match(game,/drawOriginalParallax\(\)/);
console.log('Parallax: original JAR image maps, Java-seeded deterministic layer order and per-zone palettes are wired');
