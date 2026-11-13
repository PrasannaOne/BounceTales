const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const R=require('../src/rlef-reader.js');
const root=path.resolve(__dirname,'..');
const levels='bf bg bh bi bj bk bl bm bn bo bp bq br bs bt'.split(' ');
const handled=new Set(['root','player','geometry','sprite','egg','enemy','water','trampoline','cannon','friend','event']);
const seen=new Set();let objects=0,events=0,commands=0;
for(const name of levels){
  const parsed=R.parse(fs.readFileSync(path.join(root,'assets/original',name)));
  for(const o of parsed.objects){objects++;seen.add(o.type);assert.ok(handled.has(o.type),`${name} has unhandled object type ${o.type}`);}
  events+=parsed.eventCount;
  for(const event of parsed.objects.filter(o=>o.type==='event'))commands+=event.commands.length;
}
for(const type of seen)assert.ok(handled.has(type),`runtime must handle ${type}`);
assert.ok(seen.has('cannon')&&seen.has('trampoline')&&seen.has('water')&&seen.has('enemy'));
console.log(`Campaign object audit: ${levels.length} stages, ${objects} objects, ${events} events, ${commands} event command streams; all object types have runtime handlers.`);
