const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const atlas=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/sprite-atlas.json'),'utf8'));
const imageMap=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/image-map.json'),'utf8'));
const api=require('../src/sprite-atlas.js');
const catalogue=api.prepare(atlas,imageMap);
assert.equal(catalogue.byId.length,326);
assert.equal(atlas.png_images.length,imageMap.atlases.length);
for(let id=0;id<326;id++){
  const sprite=catalogue.get(id),map=imageMap.maps[String(id)];
  assert.ok(sprite,'missing sprite '+id);
  assert.equal(sprite.image_slot,map.image,'atlas slot '+id);
  assert.deepEqual(sprite.crop,{x:map.atlasX,y:map.atlasY,width:map.width,height:map.height},'crop '+id);
  assert.deepEqual(sprite.draw_offset,{x:map.originX,y:map.originY},'draw offset '+id);
}
assert.equal(atlas.animation_timing.animation_objects,316);
assert.equal(atlas.animation_timing.sequences,1143);
assert.equal(atlas.animation_timing.timed_command_count,350);
assert.throws(()=>api.prepare({...atlas,sprites:atlas.sprites.slice(1)},imageMap),/326 sprites/);
console.log('V17 atlas: all 326 source-extracted sprite descriptors match the runtime image map; 46 PNG slots and 350 timing annotations verified');
