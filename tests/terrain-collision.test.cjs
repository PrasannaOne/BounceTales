const assert=require('node:assert/strict');
const {pointInside,resolveCirclePolygons,edgeNormal}=require('../src/terrain-collision.js');
const square={area:1600,nocollide:false,vertices:[
  {x:-20,y:-20},{x:20,y:-20},{x:20,y:20},{x:-20,y:20},{x:-20,y:-20}
]};
const makeBody=(x,y,vx=0,vy=0)=>({x,y,vx,vy,radius:10,grounded:false,land(nx,ny){this.lastNormal={x:nx,y:ny};this.grounded=true;const vn=this.vx*nx+this.vy*ny;if(vn<0){this.vx-=(1.1*vn*nx);this.vy-=(1.1*vn*ny);}}});
assert.equal(pointInside(0,0,square.vertices),true);
assert.equal(pointInside(50,0,square.vertices),false);
assert.ok(edgeNormal(square,square.vertices[1],square.vertices[2]).x>0,'right edge must point outward');

const trapped=makeBody(0,0);
assert.ok(resolveCirclePolygons(trapped,[square],1/60)>0,'a body fully inside a solid polygon must be expelled');
assert.ok(Math.hypot(trapped.x,trapped.y)>=29.9,'body should be moved outside by its radius');

const overlap=makeBody(28,0,-20,0);
assert.ok(resolveCirclePolygons(overlap,[square],1/60)>0,'approaching edge overlap should resolve');
assert.ok(overlap.x>=29.9,'edge overlap should move the body to the outside');

const clear=makeBody(40,0);
assert.equal(resolveCirclePolygons(clear,[square],1/60),0,'non-overlapping bodies should not be moved');
const noCollide={...square,nocollide:true};
const ghost=makeBody(0,0);
assert.equal(resolveCirclePolygons(ghost,[noCollide],1/60),0,'no-collide geometry must be ignored');

const fast=makeBody(-40,0,-800,0);
const swept=resolveCirclePolygons(fast,[square],.1,6,{x:40,y:0});
assert.ok(swept>0,'a fast-moving body should hit an edge it crossed between frames');
assert.ok(fast.x>=29.9,'swept collision should stop tunnelling through the solid');
assert.ok(fast.vx>0,'the original restitution response should redirect velocity away from the right wall');

// Grass-platform regression: world Y grows upward. A falling circle approaches
// a broad irregular terrain contour from above and must remain above its top.
const grass={area:-1,nocollide:false,vertices:[
  {x:-120,y:0},{x:120,y:0},{x:120,y:-100},{x:-120,y:-100},{x:-120,y:0}
]};
const falling=makeBody(0,-8,0,-500);
const groundHits=resolveCirclePolygons(falling,[grass],.05,6,{x:0,y:20});
assert.ok(groundHits>0,'descending jump must contact the grass top');
assert.ok(falling.y>=10,'Bounce must not sink into the grass body');
assert.ok(falling.vy>=0,'grass landing must cancel the inward vertical velocity');

// Overlapping RLEF terrain meshes: use the nearest correction first rather than
// ejecting through the deepest broad mesh. Repeated passes then resolve both.
const broad={area:40000,nocollide:false,vertices:[
  {x:-100,y:-100},{x:100,y:-100},{x:100,y:100},{x:-100,y:100},{x:-100,y:-100}
]};
const inset={area:256,nocollide:false,vertices:[
  {x:-8,y:-8},{x:8,y:-8},{x:8,y:8},{x:-8,y:8},{x:-8,y:-8}
]};
const layered=makeBody(0,0,0,0);
assert.ok(resolveCirclePolygons(layered,[broad,inset],1/60,8)>0,'overlapping terrain layers must recover a trapped actor');
assert.ok(!pointInside(layered.x,layered.y,broad.vertices),'actor must end outside the broad terrain');
assert.ok(!pointInside(layered.x,layered.y,inset.vertices),'actor must end outside the inset terrain');
console.log('Terrain collision: contour normals, containment, overlap, non-collide, swept edges, grass landing and layered terrain passed');
