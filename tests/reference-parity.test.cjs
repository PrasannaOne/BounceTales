const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const parser=require('../src/rlef-reader.js');
const root=path.join(__dirname,'..');
const levels=['bf','bg','bh','bi','bj','bk','bl','bm','bn','bo','bp','bq','br','bs','bt','bu'];
const typeName={0:'root',4:'geometry',6:'event',8:'player',9:'sprite',10:'water',11:'cannon',12:'trampoline',13:'egg',14:'friend',15:'enemy'};
const animations=JSON.parse(fs.readFileSync(path.join(root,'reference/animations.json'),'utf8'));
let objects=0,polygons=0,vertices=0,triangles=0,events=0,sequences=0;

const hashes=JSON.parse(fs.readFileSync(path.join(root,'reference/original-resource-sha256.json'),'utf8'));
const assetDir=path.join(root,'assets/original');
assert.equal(Object.keys(hashes).length,105,'all 105 original resources recorded');
for(const [name,expected] of Object.entries(hashes)){
  const bytes=fs.readFileSync(path.join(assetDir,name));
  const actual=require('node:crypto').createHash('sha256').update(bytes).digest('hex');
  assert.equal(actual,expected,'original resource SHA-256 '+name);
}

const animationByObject=new Map(animations.animation_objects.map(a=>[a.level+':'+a.object_index,a]));
for(const level of levels){
  const parsed=parser.parse(fs.readFileSync(path.join(root,'assets/original',level)));
  const fixture=JSON.parse(fs.readFileSync(path.join(root,'reference/decoded-levels',level+'.json'),'utf8'));
  assert.equal(parsed.objectCount,fixture.declared_object_count,level+' declared object count');
  assert.equal(parsed.objects.length,fixture.objects.length,level+' record count');
  for(let i=0;i<parsed.objects.length;i++){
    const p=parsed.objects[i],r=fixture.objects[i],base=r.base_header;
    assert.equal(p.id,r.index,level+' id '+i);
    assert.equal(p.parent,base.parent_index,level+' parent '+i);
    assert.equal(p.previous,base.child_index,level+' child '+i);
    assert.equal(p.transformFlags,base.transform_flags,level+' transform flags '+i);
    const tx=base.transform.tx_fixed??base.transform.c??0,ty=base.transform.ty_fixed??base.transform.f??0;
    assert.equal(p.matrix[2],tx,level+' tx '+i);
    assert.equal(p.matrix[5],ty,level+' ty '+i);
    assert.equal(p.flags,base.packed_flags,level+' flags '+i);
    if(typeName[r.type_code])assert.equal(p.type,typeName[r.type_code],level+' type '+i);
    if(r.type_code===4){
      const geo=r.polygon_geometry;
      assert.equal(p.vertices.length,geo.vertices.length,level+' polygon vertices '+i);
      assert.deepEqual(p.vertices,geo.vertices.map(v=>[v.x,v.y]),level+' polygon vertices '+i);
      assert.deepEqual(p.faces,geo.triangle_indices,level+' polygon indices '+i);
      assert.equal(p.color,parseInt(geo.color_argb_hex.slice(-6),16),level+' polygon color '+i);
      polygons++;vertices+=geo.vertex_count;triangles+=geo.triangle_count;
    }
    if(r.type_code===6){
      const a=animationByObject.get(level+'.json:'+i);
      assert.ok(a,level+' animation fixture '+i);
      assert.equal(p.eventType,a.mode,level+' animation mode '+i);
      assert.equal(p.triggerByLeave,a.state_bytes[0],level+' animation state byte 0 '+i);
      assert.equal(p.repeatable,a.state_bytes[1],level+' animation state byte 1 '+i);
      assert.equal(p.triggerObjId,a.animation_id,level+' animation id '+i);
      assert.deepEqual(p.commands,a.sequences,level+' exact opcode streams '+i);
      assert.equal(p.commands.length,a.sequence_count,level+' animation sequence count '+i);
      events++;sequences+=p.commands.length;
    }
    objects++;
  }
}
assert.equal(objects,2240);
assert.equal(polygons,490);
assert.equal(vertices,5776);
assert.equal(triangles,4306);
assert.equal(events,316);
assert.equal(sequences,1143);
assert.equal(animationByObject.size,316);
console.log('V18 source parity: 105 original assets match SHA-256; 16 RLEF levels, 2,240 object headers, 490 polygons / 5,776 vertices / 4,306 triangles, and 316 animations / 1,143 exact command streams match the decoded reference');
