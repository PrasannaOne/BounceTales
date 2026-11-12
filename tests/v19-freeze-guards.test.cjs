const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const fixed=require('../src/fixed-point.js');
assert.equal(fixed.sqrtBigInt((1n<<200n)*(1n<<200n)),1n<<200n);
for(const file of ['src/fixed-point.js','src/original-collision.js','src/terrain-collision.js','src/game-timing.js','game.js']){
  const s=fs.readFileSync(path.join(root,file),'utf8');
  if(file.endsWith('fixed-point.js'))assert.match(s,/iterationLimit=Math\.min\(512/);
  if(file.endsWith('original-collision.js'))assert.match(s,/Math\.min\(8/);
  if(file.endsWith('terrain-collision.js'))assert.match(s,/Math\.min\(8/);
  if(file.endsWith('game-timing.js'))assert.match(s,/steps<30/);
  if(file.endsWith('game.js'))assert.match(s,/seen\.size>=32/);
}
const events=fs.readFileSync(path.join(root,'src/event-engine.js'),'utf8');assert.match(events,/safety\+\+<128/);
const reader=fs.readFileSync(path.join(root,'src/rlef-reader.js'),'utf8');assert.match(reader,/recordGuard\+\+<r\.b\.length/);
const spring=fs.readFileSync(path.join(root,'src/original-trampoline.js'),'utf8');assert.match(spring,/MAX_SPRING_DURATION_MS=2000/);
console.log('Freeze guards: bounded fixed-point, collision, event, timing, sprite-recursion and trampoline loops verified');
