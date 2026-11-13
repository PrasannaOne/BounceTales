const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const R=require('../src/rlef-reader.js');
const T=require('../src/original-trampoline.js');
const P=require('../src/bounce-physics.js');
const maps=JSON.parse(fs.readFileSync(path.join(root,'src/image-map.json'),'utf8'));
const level=R.parse(fs.readFileSync(path.join(root,'assets/original/bf')));
const trampoline=level.objects.find(o=>o.type==='trampoline');
assert.ok(trampoline,'Misty Morning has its original trampoline object');
assert.equal(trampoline.basePush,75,'Level 1 uses the decoded JAR spring strength');
const world=R.buildWorld(level.objects);
const worldPoint=(id)=>{const m=world.get(id);return {x:m[2]/65536,y:m[5]/65536};};
const spring=worldPoint(trampoline.id);
const cliff=level.objects.find(o=>o.id===19&&o.type==='geometry');
assert.ok(cliff,'Misty Morning includes the first raised cliff collision mesh');
const cm=world.get(cliff.id);
const cliffPts=cliff.vertices.map(v=>({x:v[0]+cm[2]/65536,y:v[1]+cm[5]/65536}));
const nearbyTop=cliffPts.filter(p=>p.x>spring.x+50&&p.x<spring.x+105&&p.y<800);
assert.ok(nearbyTop.length,'high cliff top is identified from the real level mesh');
const cliffTopY=Math.max(...nearbyTop.map(p=>p.y));
const springTopY=spring.y+95;
assert.ok(cliffTopY>springTopY,'the raised ledge is above the trampoline surface');
// This is the critical V20 correction: the original JAR checks the body bounds,
// so the lower edge contacts y=95 while the body centre is still at y=115.
const prevLocal={x:0,y:116},nowLocal={x:0,y:114};
assert.equal(T.crossesLaunchLine(prevLocal,nowLocal,20),true,'the JAR radius-aware segment hit starts the trampoline');
const body=new P.BounceBody(spring.x,spring.y+115,0);body.vy=-600;
const t={imageId:497,basePush:trampoline.basePush,x:spring.x,y:spring.y,active:false};
assert.equal(T.begin(t,body,maps),true,'Level 1 spring starts');
let ticks=0;while(t.active&&ticks<90){T.update(t,body,maps,1/60);ticks++;}
assert.ok(ticks<90&&body.enabled,'spring animation releases player in a finite number of ticks');
assert.ok(body.vy>0,'launch velocity points upward in world coordinates');
assert.ok(-(body.vy/60)*.660187<0,'world-up velocity becomes canvas-up displacement');
let peakY=body.y;
for(let i=0;i<110;i++){
  body.update(1/60,.660187,Math.floor((i+1)*1000/60)-Math.floor(i*1000/60));
  peakY=Math.max(peakY,body.y);
}
assert.ok(peakY>=cliffTopY+body.radius,`spring trajectory clears the actual nearby cliff mesh: peak ${peakY.toFixed(2)}, ledge ${cliffTopY.toFixed(2)}`);
console.log(`Misty Morning springboard: launch reaches ${peakY.toFixed(1)} world Y, clearing the decoded cliff top at ${cliffTopY.toFixed(1)}`);
