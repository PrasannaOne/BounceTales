const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const audit=JSON.parse(fs.readFileSync(path.join(root,'reference/supplemental-resource-audit.json'),'utf8'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const be=fs.readFileSync(path.join(root,'assets/original/be'));
const bv=fs.readFileSync(path.join(root,'assets/original/bv'));
const atlas=JSON.parse(fs.readFileSync(path.join(root,'src/sprite-atlas.json'),'utf8'));
const imageMap=JSON.parse(fs.readFileSync(path.join(root,'src/image-map.json'),'utf8'));
const audio=require('../src/audio-controller.js');

assert.equal(audit.status,'resource identity and payload structure verified; exact gameplay consumers not fully established');
const beRecord=audit.resources.find(r=>r.name==='be');
assert.equal(beRecord.resource_type,5);
assert.deepEqual(beRecord.resource_indices,[90,91,92]);
assert.equal(be.length,258);
assert.equal(beRecord.total_length,258);
assert.deepEqual(beRecord.source_call_sites[0].line_range,[1651,1662]);
assert.match(beRecord.runtime_note,/o\.e\(37\).*o\.e\(36\)/);
assert.equal(beRecord.records.length,3);
for(let i=0;i<3;i++){
  const record=beRecord.records[i],slice=be.subarray(record.offset,record.offset+record.length);
  assert.equal(record.offset,i*86);
  assert.equal(record.length,86);
  assert.equal(slice.length,86);
  assert.equal(hash(slice),record.sha256,'be record '+i+' matches original JAR payload');
}
const bvRecord=audit.resources.find(r=>r.name==='bv');
assert.equal(bvRecord.resource_type,8);
assert.deepEqual(bvRecord.resource_indices,[109]);
assert.equal(bv.length,26);
assert.deepEqual(bvRecord.source_call_sites,[]);
assert.equal(hash(bv),bvRecord.sha256);
const words=Array.from({length:bv.length/2},(_,i)=>bv.readUInt16BE(i*2));
assert.deepEqual(words,[3,8,28,29,30,31,32,33,34,35,1,7,0]);
assert.deepEqual(words,bvRecord.big_endian_u16);
const candidateMusicIds=words.slice(2,10);
assert.deepEqual(candidateMusicIds,Object.keys(audio.SOURCE_MIDI_FILES).map(Number),
  'bv embedded resource sequence corresponds to the eight source MIDI resource IDs');
assert.equal(atlas.dynamic_sprite_table.dynamic_reference_count,214);
assert.equal(atlas.dynamic_sprite_table.dynamic_sprite_ids[0],326);
assert.equal(atlas.dynamic_sprite_table.dynamic_sprite_ids.at(-1),539);
assert.equal(Object.keys(imageMap.maps).filter(id=>Number(id)>=326).length,214);
assert.match(bvRecord.runtime_note,/semantics remain unconfirmed/);
console.log('Supplemental resource parity: be 3×86-byte type-5 records and bv 13-word type-8 payload match the original reference; bv music-ID correspondence and 214 dynamic sprite mappings verified');
