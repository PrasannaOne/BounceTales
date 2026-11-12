const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const parser=require('../src/rlef-reader.js');
const levels={
 bf:[101,6],bg:[146,20],bh:[159,17],bi:[108,15],bj:[139,21],bk:[185,24],bl:[176,27],
 bm:[173,32],bn:[189,48],bo:[256,47],bp:[157,26],bq:[160,15],br:[109,12],bs:[56,0],bt:[113,6],bu:[13,0]
};
for(const [name,[objects,events]] of Object.entries(levels)){
 const bytes=fs.readFileSync(path.join(__dirname,'../assets/original',name));
 const parsed=parser.parse(bytes);
 assert.equal(parsed.objectCount,objects,name+' objectCount');
 assert.equal(parsed.eventCount,events,name+' eventCount');
 assert.equal(parsed.objects.length,objects,name+' records');
 const world=parser.buildWorld(parsed.objects);
 assert.equal(world.size,objects,name+' world matrices');
 assert.ok(parsed.objects.some(o=>o.type==='player')||name==='bu',name+' player exists');
}
const first=parser.parse(fs.readFileSync(path.join(__dirname,'../assets/original/bf')));
const counts=first.objects.reduce((m,o)=>(m[o.type]=(m[o.type]||0)+1,m),{});
assert.equal(counts.geometry,18);assert.equal(counts.sprite,44);assert.equal(counts.egg,29);
assert.equal(counts.event,6);assert.equal(counts.player,1);assert.equal(counts.trampoline,1);assert.equal(counts.enemy,1);
const world=parser.buildWorld(first.objects),player=first.objects.find(o=>o.type==='player'),pm=world.get(player.id);
assert.equal(Math.round(pm[2]/65536),-1740);assert.equal(Math.round(pm[5]/65536),918);
const imageMap=JSON.parse(fs.readFileSync(path.join(__dirname,'../src/image-map.json')));
assert.equal(imageMap.atlases.length,46);assert.equal(Object.keys(imageMap.maps).length,540);
for(const id of [17,20,28,447,452,454,456,458,460,462])assert.ok(imageMap.maps[String(id)],'original Bounce visual map '+id+' exists');
console.log('RLEF: all 16 levels validated; Misty Morning objects, spawn, image map and transforms verified');
