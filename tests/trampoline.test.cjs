const assert=require('node:assert/strict');
const T=require('../src/original-trampoline.js');
const maps={maps:{'497':{type:'animated',frames:[498,499,500,501,502,503]},'498':{type:'compound',height:57,originY:57},'499':{type:'compound',height:46,originY:46},'500':{type:'compound',height:43,originY:43},'501':{type:'compound',height:46,originY:46},'502':{type:'compound',height:57,originY:57},'503':{type:'compound',height:65,originY:65}}};
const body={x:12,y:0,vy:-500,vx:80,enabled:true,grounded:false,torqueX:20,torqueY:30,skipAccelStretch:false,airTime:.5};
const t={imageId:497,basePush:100,x:10,y:200,active:false,progress:0,period:0,calcPush:0,animFrame:0};

const rotated=[0,-65536,10*65536,65536,0,20*65536];
const worldPoint=T.transformPointFixed(rotated,3*65536,4*65536);
assert.deepEqual(T.worldToLocalFixed(rotated,worldPoint.x,worldPoint.y),{x:3*65536,y:4*65536},'JAR inverse matrix restores points through a rotated 16.16 transform');
assert.equal(T.imageForLevel(0),497);assert.equal(T.imageForLevel(4),497);assert.equal(T.imageForLevel(5),509);assert.equal(T.imageForLevel(9),509);assert.equal(T.imageForLevel(10),490);assert.equal(T.imageForLevel(14),490);
assert.equal(T.crossesLaunchLine({x:0,y:110},{x:0,y:90}),true,'radius-zero sweep crosses the source y=95 line');
assert.equal(T.crossesLaunchLine({x:90,y:110},{x:90,y:90}),false,'outside the source segment does not trigger');
assert.equal(T.crossesLaunchLine({x:0,y:110},{x:0,y:105}),false,'a sweep that does not reach the line does not trigger');
assert.equal(T.crossesLaunchLine({x:0,y:116},{x:0,y:114}),false,'the JAR tests the centre path against y=95 without radius expansion');
assert.equal(T.crossesLaunchLine({x:100,y:110},{x:100,y:90}),false,'the finite launch segment rejects an outside path');
assert.equal(T.crossesLaunchLine({x:0,y:90},{x:0,y:110}),true,'direction is checked by the caller using world-Y velocity, not local transformed Y');
assert.equal(T.begin(t,body,maps),true);
assert.equal(t.period,320);assert.equal(t.frameStep,53,'Java int division truncates period/frameCount');assert.equal(t.progress,53);assert.equal(t.calcPush,800);assert.equal(body.enabled,false);assert.equal(body.vx,0);assert.equal(body.grounded,false,'begin preserves the JAR actor grounded flag');assert.equal(body.airTime,.5,'begin does not reset the JAR air-time accumulator');assert.equal(body.y,200+86,'frame anchor uses the corrected positive world-Y offset with JAR 16.16 scale and integer division');
T.update(t,body,maps,.1);assert.equal(body.enabled,false);assert.equal(t.animFrame,2);
T.update(t,body,maps,.1);assert.equal(body.enabled,false);assert.equal(t.animFrame,4);
T.update(t,body,maps,.03);assert.equal(body.enabled,true);assert.equal(body.vy,800);assert.equal(body.torqueX,0);assert.equal(body.skipAccelStretch,true);assert.equal(body.airTime,.5,'normal JAR release preserves the air-time accumulator');
T.update(t,body,maps,.04);assert.equal(t.active,false);assert.equal(t.period,0);

const lowBody={x:0,y:0,vy:-50,vx:0,enabled:true,grounded:false,torqueX:0,torqueY:0,skipAccelStretch:false,airTime:0};
const lowT={imageId:497,basePush:100,x:0,y:100,active:false};
assert.equal(T.begin(lowT,lowBody,maps),true);assert.equal(lowT.period,520,'period uses source 100-unit minimum');assert.equal(lowT.calcPush,100,'launch push uses actual incoming velocity');
const fastBody={x:0,y:0,vy:-2000,vx:0,enabled:true,grounded:false,torqueX:0,torqueY:0,skipAccelStretch:false,airTime:0};
const fastT={imageId:497,basePush:100,x:0,y:100,active:false};
assert.equal(T.begin(fastT,fastBody,maps),true);assert.equal(fastT.period,70,'period uses source 1000-unit maximum');assert.equal(fastT.calcPush,800,'launch push is capped by the source formula');

const simBody={x:0,y:0,vy:-600,vx:0,enabled:true,grounded:false,torqueX:0,torqueY:0,skipAccelStretch:false,airTime:0};
const sim={imageId:497,basePush:75,x:0,y:200,active:false};
assert.equal(T.begin(sim,simBody,maps),true);
let ticks=0;while(sim.active&&ticks<90){T.update(sim,simBody,maps,1/60);ticks++;}
assert.ok(ticks<90,'spring watchdog terminates the animation');assert.equal(simBody.enabled,true);assert.ok(simBody.vy>0,'positive world Y is upward');
assert.ok(-(simBody.vy/60)*.660187<0,'positive world Y maps to negative (upward) canvas displacement');

const damagedBody={x:0,y:0,vy:0,vx:0,enabled:false,grounded:true,torqueX:4,torqueY:3,skipAccelStretch:false,airTime:0};
const damaged={active:true,period:NaN,progress:NaN,frameStep:NaN,calcPush:NaN};
T.update(damaged,damagedBody,maps,1/60);assert.equal(damaged.active,false);assert.equal(damagedBody.enabled,true);assert.ok(damagedBody.vy>0);
console.log('Source-parity trampoline: exact source segment, world-Y guard, launch sign, Java frame cadence and watchdog passed');
