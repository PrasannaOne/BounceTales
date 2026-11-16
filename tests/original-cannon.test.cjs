'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const RLEF=require('../src/rlef-reader.js');
const Cannon=require('../src/original-cannon.js');
const parsed=RLEF.parse(fs.readFileSync(path.join(root,'assets/original/bu')));
const mesh=Cannon.createMesh(parsed);

assert.equal(parsed.objectCount,13,'the shared bu resource contains one root and twelve polygon records');
assert.equal(mesh.parts.length,12,'the cannon mesh has twelve original polygon templates');
assert.deepEqual(mesh.parts.map(part=>part.vertices16.length),[19,19,11,19,19,11,19,19,11,19,19,11]);
assert.deepEqual(mesh.parts.map(part=>part.faces.length),[48,48,24,48,48,24,48,48,24,48,48,24]);
assert.deepEqual(mesh.durations,[500,100,300]);
assert.equal(mesh.totalDuration,900);
assert.equal(mesh.launchAt,600);

const rest=Cannon.frameAt(mesh,0,false);
const firstPose=Cannon.frameAt(mesh,0,true);
const firstTransition=Cannon.frameAt(mesh,500,true);
const secondTransition=Cannon.frameAt(mesh,600,true);
const finished=Cannon.frameAt(mesh,900,true);
for(let part=0;part<3;part++){
  assert.deepEqual(rest[part].vertices16,mesh.parts[9+part].vertices16,'idle mesh starts from the original dynamic polygon group');
  assert.deepEqual(firstPose[part].vertices16,mesh.parts[part].vertices16,'the firing animation begins from the first authored pose');
  assert.deepEqual(firstTransition[part].vertices16,mesh.parts[3+part].vertices16,'500 ms reaches the second original pose');
  assert.deepEqual(secondTransition[part].vertices16,mesh.parts[6+part].vertices16,'600 ms reaches the third original pose and launch point');
  assert.deepEqual(finished[part].vertices16,mesh.parts[part].vertices16,'900 ms resets the dynamic polygons to the first original pose');
}
const midpoint=Cannon.frameAt(mesh,250,true);
assert.notDeepEqual(midpoint[0].vertices16,rest[0].vertices16,'intermediate frames interpolate polygon vertices');
assert.notDeepEqual(midpoint[0].vertices16,firstTransition[0].vertices16,'intermediate frames are not snapped to an endpoint');

const cannon={};
assert.equal(Cannon.begin(cannon),true);
Cannon.update([cannon],600);
assert.equal(cannon.animationElapsedMs,Cannon.LAUNCH_AT);
assert.equal(cannon.animationActive,true,'the cannon animation continues after the player launch threshold');
Cannon.update([cannon],300,mesh);
assert.equal(cannon.animationElapsedMs,Cannon.ANIMATION_DURATION);
assert.equal(cannon.animationActive,false);
assert.equal(mesh.restored,true,'the shared polygon copies reset to the first pose after the firing animation');
assert.deepEqual(Cannon.frameAt(mesh,0,false)[0].vertices16,mesh.parts[0].vertices16);
assert.equal(Cannon.resetMesh(mesh),true);
assert.equal(mesh.restored,false,'loading a new chapter restores the original resource state');
assert.equal(Cannon.reset(cannon),true);
assert.equal(cannon.animationElapsedMs,0);
assert.equal(cannon.animationActive,false);

const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
assert.match(game,/fetch\('assets\/original\/bu'\)/,'the original shared cannon mesh is loaded from its preserved resource');
assert.match(game,/animCountdown<=300/,'the player launch remains at the original 600 ms boundary of the 900 ms animation');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
assert.match(html,/src\/original-cannon\.js\?v=62/,'the new cannon module is loaded by the V54 page');
assert.match(sw,/assets\/original\/bu/,'the shared cannon resource is precached for offline play');
assert.match(sw,/src\/original-cannon\.js\?v=62/,'the new cannon module is part of the service-worker shell');
assert.match(game,/BounceOriginalCannon\.frameAt\(cannonMesh,elapsedMs,c\.animationActive\)/,'the runtime renders the original interpolated cannon mesh');
assert.match(game,/BounceOriginalCannon\.update\(cannons,dt\*1000,cannonMesh\)/,'cannon animation continues after launch');
assert.match(game,/drawImageMap\(48,0,0\)/,'a safe visual fallback remains if the shared mesh cannot be loaded');
console.log('Original cannon: all 12 bu polygons, three animation poses, 500/100/300 ms timing and 600 ms launch boundary verified');
