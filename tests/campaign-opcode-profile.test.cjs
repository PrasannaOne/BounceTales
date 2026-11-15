const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const RLEF=require('../src/rlef-reader.js');
const root=path.resolve(__dirname,'..');
const names='bf bg bh bi bj bk bl bm bn bo bp bq br bs bt'.split(' ');
const counts=new Map(),seen=new Set(),targeted=[];
let stages=0,events=0,commands=0;
for(const name of names){
  const parsed=RLEF.parse(fs.readFileSync(path.join(root,'assets/original',name)));
  stages++;
  const byId=new Map(parsed.objects.map(o=>[o.id,o]));
  for(const event of parsed.objects.filter(o=>o.type==='event')){
    events++;
    for(const command of event.commands){
      commands++;
      const op=command[0]; seen.add(op); counts.set(op,(counts.get(op)||0)+1);
      if(op===26||op===27||op===28){
        const target=(command[1]<<8)|command[2];
        targeted.push({stage:name,event:event.id,op,target,type:byId.get(target)?.type??null});
      }
    }
  }
}
const expected={0:28,1:32,2:30,3:24,4:57,5:8,6:177,7:206,8:2,12:25,14:3,15:12,16:138,17:35,18:14,19:1,20:18,21:39,23:18,24:2,25:48,26:2,29:140,30:42,31:30,32:12};
assert.equal(stages,15);
assert.equal(events,316);
assert.equal(commands,1143);
assert.deepEqual(Object.fromEntries([...counts].sort((a,b)=>a[0]-b[0])),expected);
assert.deepEqual([...seen].sort((a,b)=>a-b),Object.keys(expected).map(Number));
assert.deepEqual(targeted,[
  {stage:'br',event:102,op:26,target:107,type:'player'},
  {stage:'br',event:103,op:26,target:107,type:'player'}
]);
for(const absent of [9,10,11,13,22,27,28])assert.equal(seen.has(absent),false,`opcode ${absent} is implemented but absent from the 15-stage campaign`);
console.log(`Campaign opcode profile: ${stages} stages, ${events} events, ${commands} commands; ${seen.size} opcodes occur. 26/27/28 target audit passed.`);
