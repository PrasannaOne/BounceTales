const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const RLEF=require('../src/rlef-reader.js');
const {EventEngine,parseLanguage}=require('../src/event-engine.js');
const root=path.resolve(__dirname,'..');
const parsed=RLEF.parse(fs.readFileSync(path.join(root,'assets/original/bf')));
const strings=parseLanguage(fs.readFileSync(path.join(root,'assets/original/lang.xx')));
assert.equal(strings.length,91,'lang.xx should expose the 91 indexed messages');
assert.match(strings[58],/^’There may be more hypnotised friends/,'localized scenario text should decode from the original language resource');

const world=RLEF.buildWorld(parsed.objects);
const player=parsed.objects.find(o=>o.type==='player');
assert.equal(player.id,100,'Misty Morning player record should retain original object ID');
const playerWorld=world.get(player.id);
const body={x:playerWorld[2]/65536,y:playerWorld[5]/65536,vx:0,vy:0,pushX:0,pushY:0,gravityX:0,gravityY:0};
const messages=[],animations=[];
const engine=new EventEngine(parsed.objects,{
  strings,playerObjectId:player.id,
  onMessage:(id,text)=>messages.push({id,text}),
  onAnimate:id=>animations.push(id)
});
for(let i=0;i<150;i++)engine.update(body,{x:body.x,y:body.y},0.033,player.id);
assert.deepEqual(messages.map(x=>x.id),[58,59,60],'the JAR autostart event should play its original three Misty Morning scenario lines');
assert.match(messages[0].text,/hypnotised friends/);
assert.deepEqual(animations,[76],'the original autostart script should request its sprite animation');
assert.equal(engine.unsupported.size,0,'Misty Morning autostart event should use implemented event opcodes');
assert.equal(engine.events.find(e=>e.id===99).state,1,'non-repeatable autostart event should terminate');

engine.reset();messages.length=0;animations.length=0;
for(let i=0;i<150;i++)engine.update(body,{x:body.x,y:body.y},0.033,player.id);
assert.deepEqual(messages.map(x=>x.id),[58,59,60],'reset should restore the original autostart script and replay its messages');
assert.deepEqual(animations,[76],'reset should replay the original sprite-animation event');

// Exercise a real area-triggered Misty Morning event. Keep the other stage
// triggers terminated so this test isolates event 94 and its authored script.
const triggerObjects=RLEF.parse(fs.readFileSync(path.join(root,'assets/original/bf'))).objects;
for(const object of triggerObjects){if(object.type==='event'&&object.id!==94)object.eventType=1;}
const triggeredMessages=[];
const stageEngine=new EventEngine(triggerObjects,{
  strings,playerObjectId:100,
  onMessage:(id,text)=>triggeredMessages.push({id,text})
});
const stageBody={x:1455,y:533,vx:0,vy:0,pushX:0,pushY:0,gravityX:0,gravityY:0};
for(let i=0;i<400;i++)stageEngine.update(stageBody,{x:1000,y:533},0.033,100);
assert.deepEqual(triggeredMessages.map(x=>x.id),[65,66,67],'entering the original event-94 trigger should run its authored localized story messages');
assert.equal(stageEngine.events.find(e=>e.id===94).state,1,'the real one-shot level event should terminate after its script');
assert.equal(stageEngine.getObject(76).parent,-1,'the event should detach its original sprite from the machine');
assert.equal(stageEngine.getObject(77).parent,-1,'the event should detach its second original sprite');
assert.equal(stageEngine.world.get(76)[2],stageEngine.getObject(76).matrix[2],'original detach command should preserve local matrix values rather than world position');
assert.equal(stageEngine.getObject(74).runtimeFlags,154,'the event should apply its original visibility flag update');

const identity=[65536,0,0,0,65536,0];
const synthetic=[
  {id:100,type:'player',parent:-1,matrix:identity.slice(),flags:0},
  {id:1,type:'event',parent:-1,matrix:identity.slice(),flags:0,bbox:[-30,30,30,-30],eventType:0,triggerByLeave:0,repeatable:0,triggerObjId:100,commands:[[7,2,0,32,0,0,0,42],[23]]}
];
const triggerEngine=new EventEngine(synthetic,{playerObjectId:100});
const movingBody={x:0,y:0,vx:0,vy:0,pushX:0,pushY:0,gravityX:0,gravityY:0};
triggerEngine.update(movingBody,{x:-100,y:0},0.016,100);
assert.equal(triggerEngine.vars[0],42,'entering an event AABB should run its integer variable-set command');
assert.equal(triggerEngine.events[0].state,1,'a triggered one-shot event should run through END and terminate');

const rotateObject={id:9,type:'sprite',parent:-1,matrix:identity.slice(),flags:0};
const rotateEngine=new EventEngine([rotateObject],{});
const rotateEvent={state:2,repeatable:0};
const cmd=new Uint8Array(31),view=new DataView(cmd.buffer);
cmd[0]=17;view.setInt16(1,9,false);view.setInt32(3,Math.round(Math.PI/2*65536),false);view.setInt32(7,1000,false);view.setInt32(11,1000,false);
view.setInt32(15,65536,false);view.setInt32(19,0,false);view.setInt32(23,0,false);view.setInt32(27,65536,false);
rotateEngine.runCommand(rotateEvent,cmd,100,movingBody,100);
assert.equal(rotateObject.matrix[0],65536,'rotation command should preserve its initial angle at elapsed time zero');
view.setInt32(11,900,false);
rotateEngine.runCommand(rotateEvent,cmd,100,movingBody,100);
assert.ok(rotateObject.matrix[0]<65536&&rotateObject.matrix[3]>0,'rotation command should advance from the original matrix using its elapsed counter');

let savedCheckpoint=null;
const checkpointObject={id:20,type:'event',parent:-1,matrix:[65536,0,10*65536,0,65536,20*65536],flags:0,bbox:[0,10,10,0],eventType:0,triggerByLeave:0,repeatable:0,triggerObjId:-1,commands:[]};
const checkpointEngine=new EventEngine([checkpointObject],{onCheckpoint:point=>savedCheckpoint=point});
checkpointEngine.runCommand(checkpointEngine.events[0],new Uint8Array([25]),16,{x:400,y:500},100);
assert.deepEqual({x:savedCheckpoint.x,y:savedCheckpoint.y},{x:10,y:20},'checkpoint opcode should save the event object transform, as the original runtime does');

console.log('Event engine: original Misty Morning dialogue, sprite animation event, restart, area trigger, variable set, rotation and checkpoint passed');
