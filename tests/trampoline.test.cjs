const assert=require('node:assert/strict');
const T=require('../src/original-trampoline.js');
const maps={maps:{'497':{type:'animated',frames:[498,499,500,501,502,503]},'498':{type:'compound',originY:57},'499':{type:'compound',originY:46},'500':{type:'compound',originY:43},'501':{type:'compound',originY:46},'502':{type:'compound',originY:57},'503':{type:'compound',originY:65}}};
const body={x:12,y:0,vy:-500,vx:80,enabled:true,grounded:false,torqueX:20,torqueY:30,skipAccelStretch:false,airTime:.5};
const t={imageId:497,basePush:100,x:10,y:200,active:false,progress:0,period:0,calcPush:0,animFrame:0};
assert.equal(T.imageForLevel(0),497);assert.equal(T.imageForLevel(4),497);assert.equal(T.imageForLevel(5),509);assert.equal(T.imageForLevel(9),509);assert.equal(T.imageForLevel(10),490);assert.equal(T.imageForLevel(14),490);
T.begin(t,body,maps);assert.equal(t.period,320);assert.equal(t.frameStep,53);assert.equal(t.progress,53);assert.equal(t.calcPush,800);assert.equal(body.enabled,false);assert.equal(body.vx,0);assert.equal(body.y,200-57/.660187);
T.update(t,body,maps,.21);assert.equal(body.enabled,false);assert.equal(t.animFrame,4);
T.update(t,body,maps,.03);assert.equal(body.enabled,true);assert.equal(body.vy,800);assert.equal(body.torqueX,0);assert.equal(body.skipAccelStretch,true);
T.update(t,body,maps,.04);assert.equal(t.active,false);assert.equal(t.period,0);

const lowBody={x:0,y:0,vy:-50,vx:0,enabled:true,grounded:false,torqueX:0,torqueY:0,skipAccelStretch:false,airTime:0};
const lowT={imageId:497,basePush:100,x:0,y:100,active:false};
T.begin(lowT,lowBody,maps);assert.equal(lowT.period,520,'period uses the source 100-unit minimum');assert.equal(lowT.calcPush,100,'launch push uses the actual incoming velocity, not the period clamp');
const fastBody={x:0,y:0,vy:-2000,vx:0,enabled:true,grounded:false,torqueX:0,torqueY:0,skipAccelStretch:false,airTime:0};
const fastT={imageId:497,basePush:100,x:0,y:100,active:false};
T.begin(fastT,fastBody,maps);assert.equal(fastT.period,70,'period uses the source 1000-unit maximum');assert.equal(fastT.calcPush,800,'launch push is limited to the original maximum');
console.log('Trampoline: original level-zone sprite, integer frame-count period, bounce release threshold and launch velocity passed');
