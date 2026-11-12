const assert=require('node:assert/strict');
const T=require('../src/original-trampoline.js');
const maps={maps:{'497':{type:'animated',frames:[498,499,500,501,502,503]},'498':{type:'compound',originY:57},'499':{type:'compound',originY:46},'500':{type:'compound',originY:43},'501':{type:'compound',originY:46},'502':{type:'compound',originY:57},'503':{type:'compound',originY:65}}};
const body={x:12,y:0,vy:-500,vx:80,enabled:true,grounded:false,torqueX:20,torqueY:30,skipAccelStretch:false,airTime:.5};
const t={imageId:497,basePush:100,x:10,y:200,active:false,progress:0,period:0,calcPush:0,animFrame:0};
assert.equal(T.imageForLevel(0),497);assert.equal(T.imageForLevel(4),497);assert.equal(T.imageForLevel(5),509);assert.equal(T.imageForLevel(9),509);assert.equal(T.imageForLevel(10),490);assert.equal(T.imageForLevel(14),490);
assert.equal(T.crossesLaunchLine({x:0,y:110},{x:0,y:90}),true,'actor sweep crosses the original y=95 segment');
assert.equal(T.crossesLaunchLine({x:90,y:110},{x:90,y:90}),false,'outside spring segment does not trigger');
assert.equal(T.crossesLaunchLine({x:0,y:110},{x:0,y:105}),false,'nearby but non-crossing pass does not trigger');
assert.equal(T.crossesLaunchLine({x:0,y:110},{x:0,y:90},20),true,'optional expanded collision margin is explicit only');
assert.equal(T.begin(t,body,maps),true);
assert.equal(t.period,320);assert.equal(t.frameStep,53,'Java int division truncates period/frameCount');assert.equal(t.progress,53);assert.equal(t.calcPush,800);assert.equal(body.enabled,false);assert.equal(body.vx,0);assert.equal(body.y,200-57/.660187);
T.update(t,body,maps,.1);assert.equal(body.enabled,false);assert.equal(t.animFrame,2);
T.update(t,body,maps,.1);assert.equal(body.enabled,false);assert.equal(t.animFrame,4);
T.update(t,body,maps,.03);assert.equal(body.enabled,true);assert.equal(body.vy,800);assert.equal(body.torqueX,0);assert.equal(body.skipAccelStretch,true);
T.update(t,body,maps,.04);assert.equal(t.active,false);assert.equal(t.period,0);

const lowBody={x:0,y:0,vy:-50,vx:0,enabled:true,grounded:false,torqueX:0,torqueY:0,skipAccelStretch:false,airTime:0};
const lowT={imageId:497,basePush:100,x:0,y:100,active:false};
assert.equal(T.begin(lowT,lowBody,maps),true);assert.equal(lowT.period,520,'period uses the source 100-unit minimum');assert.equal(lowT.calcPush,100,'launch push uses actual incoming velocity');
const fastBody={x:0,y:0,vy:-2000,vx:0,enabled:true,grounded:false,torqueX:0,torqueY:0,skipAccelStretch:false,airTime:0};
const fastT={imageId:497,basePush:100,x:0,y:100,active:false};
assert.equal(T.begin(fastT,fastBody,maps),true);assert.equal(fastT.period,70,'period uses the source 1000-unit maximum');assert.equal(fastT.calcPush,800,'launch push is limited to the original maximum');

// A complete animation must always release Bounce in a finite number of fixed steps.
const simBody={x:0,y:0,vy:-600,vx:0,enabled:true,grounded:false,torqueX:0,torqueY:0,skipAccelStretch:false,airTime:0};
const sim={imageId:497,basePush:75,x:0,y:200,active:false};
assert.equal(T.begin(sim,simBody,maps),true);
let ticks=0;while(sim.active&&ticks<90){T.update(sim,simBody,maps,1/60);ticks++;}
assert.ok(ticks<90,'spring watchdog must terminate the animation');assert.equal(simBody.enabled,true,'Bounce is re-enabled by the launch');assert.ok(simBody.vy>0,'spring launches Bounce upwards');

const damagedBody={x:0,y:0,vy:0,vx:0,enabled:false,grounded:true,torqueX:4,torqueY:3,skipAccelStretch:false,airTime:0};
const damaged={active:true,period:NaN,progress:NaN,frameStep:NaN,calcPush:NaN};
T.update(damaged,damagedBody,maps,1/60);assert.equal(damaged.active,false);assert.equal(damagedBody.enabled,true,'corrupt trampoline state cannot trap the player disabled');assert.ok(damagedBody.vy>0,'fail-safe restores a finite launch velocity');
console.log('Trampoline: exact J2ME launch segment, integer frame cadence, bounded animation, release and corrupt-state watchdog passed');
