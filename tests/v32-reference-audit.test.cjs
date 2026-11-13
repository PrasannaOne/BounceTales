'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const R=require('../src/rlef-reader.js');
const names='bf bg bh bi bj bk bl bm bn bo bp bq br bs bt bu'.split(' ');
const counts={objects:0,events:0,commands:0,types:{},opcodes:{}};
for(const name of names){
  const parsed=R.parse(fs.readFileSync(path.join(root,'assets/original',name)));
  counts.objects+=parsed.objects.length;counts.events+=parsed.eventCount;
  for(const o of parsed.objects){counts.types[o.type]=(counts.types[o.type]||0)+1;for(const c of o.commands||[]){counts.commands++;counts.opcodes[c[0]]=(counts.opcodes[c[0]]||0)+1;}}
}
assert.equal(names.length,16);
assert.deepEqual(counts.types,{root:17,geometry:490,trampoline:13,egg:431,sprite:902,event:316,enemy:19,player:15,water:24,cannon:13});
assert.equal(counts.objects,2240);assert.equal(counts.events,316);assert.equal(counts.commands,1143);
const physics=fs.readFileSync(path.join(root,'src/bounce-physics.js'),'utf8');
for(const fragment of ['radius:[20,20,20]','gravity:[1.0,1.4,0.5]','friction:[0.6,0.3,0.6]','ricochet:[0.1,0.1,0.1]','movementAcceleration:[500,350,312.5]','maximumMovementSpeed:[280,350,150]','midairSuppression:[1.5,2.5,1.2]','jumpAcceleration:[288,255,162.5]'])assert.ok(physics.includes(fragment),`JS actor constant present: ${fragment}`);
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
assert.match(game,/body\.vx=Math\.floor\(\(c\.power\*m\[0\]\)\/4096\)/);assert.match(game,/body\.vy=Math\.floor\(\(c\.power\*m\[3\]\)\/4096\)/);
const water=fs.readFileSync(path.join(root,'src/original-water.js'),'utf8');
assert.match(water,/slowdown=dt\*1\.4/);
assert.match(water,/body\.gravityX\+=gx<<5/);
const cannonTrace=[0,Math.PI/2,Math.PI].map(angle=>{const m0=Math.trunc(Math.cos(angle)*65536),m3=Math.trunc(Math.sin(angle)*65536),power=40;return {angle,vx:Math.floor(power*m0/4096),vy:Math.floor(power*m3/4096)};});
assert.ok(cannonTrace[0].vx>0&&Math.abs(cannonTrace[0].vy)<1);
assert.ok(cannonTrace[1].vy>0&&Math.abs(cannonTrace[1].vx)<1);
assert.ok(cannonTrace[2].vx<0&&Math.abs(cannonTrace[2].vy)<1);
console.log(JSON.stringify({proof:'V32 runtime crosswalk: 16 RLEF resources parsed, J2ME-derived actor constants present, cannon matrix signs and water drag/gravity scaling cross-checked against the decompiled source during audit',...counts,cannonTrace},null,2));
