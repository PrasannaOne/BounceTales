const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {EventEngine,parseLanguage}=require('../src/event-engine.js');
const root=path.resolve(__dirname,'..');
const strings=parseLanguage(fs.readFileSync(path.join(root,'assets/original/lang.xx')));
assert.equal(strings[17],'Continue');
assert.equal(strings[83],'Pause menu');
assert.match(strings[51],/^One misty morning/);
const identity=[65536,0,0,0,65536,0];
const objects=[
 {id:100,type:'player',parent:-1,matrix:identity.slice(),flags:0},
 {id:1,type:'event',parent:-1,matrix:identity.slice(),flags:0,bbox:[-20,20,20,-20],eventType:2,triggerByLeave:0,repeatable:0,triggerObjId:100,
  commands:[[0,0,51],[7,2,0,32,0,0,0,9],[23]]}
];
const shown=[];
const engine=new EventEngine(objects,{strings,playerObjectId:100,onMessage:(id,text)=>shown.push({id,text})});
const body={x:0,y:0};
engine.update(body,body,1/60,100);
assert.equal(shown.length,1,'message command should display exactly once');
assert.equal(shown[0].id,51);
assert.equal(engine.events[0].waitingForMessage,true,'event script should suspend on a dialogue');
assert.equal(engine.vars[0],0,'commands after a dialogue must not execute until dismissed');
for(let i=0;i<8;i++)engine.update(body,body,1/60,100);
assert.equal(shown.length,1,'a waiting dialogue must not repeat every simulation tick');
assert.equal(engine.resumeMessages(),1,'one active dialogue should resume');
engine.update(body,body,1/60,100);
assert.equal(engine.vars[0],9,'commands after dialogue resume in original sequence');
assert.equal(engine.events[0].state,1,'one-shot event should terminate after END');
assert.equal(engine.resumeMessages(),0,'no pending message remains');


const queuedObjects=[
 {id:100,type:'player',parent:-1,matrix:identity.slice(),flags:0},
 ...[1,2].map((id)=>({id,type:'event',parent:-1,matrix:identity.slice(),flags:0,bbox:[-20,20,20,-20],eventType:2,triggerByLeave:0,repeatable:0,triggerObjId:100,commands:[[0,0,51+id],[23]]}))
];
const queued=[],queueEngine=new EventEngine(queuedObjects,{strings,playerObjectId:100,onMessage:(id,text,eventId)=>queued.push({id,eventId})});
queueEngine.update(body,body,1/60,100);
assert.equal(queued.length,2,'simultaneous event messages should both be queued');
assert.equal(queueEngine.resumeMessages(1),1,'only the active dialogue event should resume');
assert.equal(queueEngine.events.find(e=>e.id===2).waitingForMessage,true,'the next queued event must remain paused until its dialogue is shown');
assert.equal(queueEngine.resumeMessages(2),1,'the second queued dialogue resumes independently');

const localeNames=['xx','bs-BA','cs-CZ','de','hr-HR','hu-HU','mk-MK','sk-SK','sl-SI','sq','sr-YU'];
for(const locale of localeNames){
 const file=path.join(root,'assets/original','lang.'+locale);
 assert.ok(fs.existsSync(file),'missing original locale '+locale);
 assert.ok(parseLanguage(fs.readFileSync(file)).length>=80,'locale should decode into indexed original strings: '+locale);
}
console.log('Original UI dialogue: modal pause/resume and all 11 original language resources passed');
