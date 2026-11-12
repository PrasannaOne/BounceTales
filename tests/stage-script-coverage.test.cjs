const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const RLEF=require('../src/rlef-reader.js');
const root=path.join(__dirname,'..');
const names=['bf','bg','bh','bi','bj','bk','bl','bm','bn','bo','bp','bq','br','bs','bt'];
const supported=new Set(Array.from({length:33},(_,i)=>i));
const seen=new Set();let eventCount=0,commandCount=0;
for(const name of names){
  const parsed=RLEF.parse(fs.readFileSync(path.join(root,'assets/original',name)));
  for(const event of parsed.objects.filter(o=>o.type==='event')){
    eventCount++;
    for(const command of event.commands){
      commandCount++;seen.add(command[0]);
      assert.ok(supported.has(command[0]),`${name} event ${event.id} uses unsupported opcode ${command[0]}`);
    }
  }
}
assert.equal(names.length,15);
assert.ok(eventCount>200,'all original stage events should be included in coverage');
assert.ok(commandCount>900,'all original event commands should be included in coverage');
assert.ok(seen.has(25),'checkpoint opcode is present in the campaign fixtures');
assert.ok(seen.has(29),'runtime visibility/collision flag opcode is present');
assert.ok(seen.has(31),'camera tuning opcode is present');
console.log(`Stage scripts: ${names.length} stages, ${eventCount} events and ${commandCount} commands use the supported 0–32 opcode set`);
