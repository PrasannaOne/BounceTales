const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const RLEF=require('../src/rlef-reader.js');
const Physics=require('../src/bounce-physics.js');
const Collision=require('../src/terrain-collision.js');
const root=path.join(__dirname,'..','assets','original');
const levels=['bf','bg','bh','bi','bj','bk','bl','bm','bn','bo','bp','bq','br','bs','bt'];
for(const resource of levels){
  const parsed=RLEF.parse(fs.readFileSync(path.join(root,resource)));
  const world=RLEF.buildWorld(parsed.objects);
  const player=parsed.objects.find(o=>o.type==='player');
  assert.ok(player,resource+' must contain an original player start');
  const m=world.get(player.id),body=new Physics.BounceBody(m[2]/65536,m[5]/65536);
  const polygons=parsed.objects.filter(o=>o.type==='geometry').map(o=>{
    const wm=world.get(o.id),vertices=o.vertices.map(v=>({
      x:(wm[0]*v[0]+wm[1]*v[1])/65536+wm[2]/65536,
      y:(wm[3]*v[0]+wm[4]*v[1])/65536+wm[5]/65536
    }));
    const area=vertices.slice(0,-1).reduce((sum,p,i)=>sum+p.x*vertices[i+1].y-vertices[i+1].x*p.y,0)/2;
    return {id:o.id,vertices,area,nocollide:(o.flags&0x20)!==0};
  });
  let previous={x:body.x,y:body.y};
  for(let frame=0;frame<300;frame++){
    body.update(1/60);
    Collision.resolveCirclePolygons(body,polygons,1/60,6,previous);
    previous={x:body.x,y:body.y};
  }
  const embedded=polygons.filter(p=>!p.nocollide&&Collision.pointInside(body.x,body.y,p.vertices));
  assert.equal(embedded.length,0,resource+' player must not remain embedded in solid terrain after initial fall/landing');
  assert.ok(Number.isFinite(body.x)&&Number.isFinite(body.y),resource+' player coordinates must stay finite');
}
console.log('RLEF terrain regression: player spawn/fall/landing stayed outside solid geometry in all 15 original chapters');
