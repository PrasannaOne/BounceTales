const assert=require('node:assert/strict');
const {pointInside,resolveCirclePolygons}=require('../src/terrain-collision.js');
const square={area:1600,nocollide:false,vertices:[
  {x:-20,y:-20},{x:20,y:-20},{x:20,y:20},{x:-20,y:20},{x:-20,y:-20}
]};
assert.equal(pointInside(0,0,square.vertices),true);
assert.equal(pointInside(50,0,square.vertices),false);
const makeBody=(x,y,vx=0,vy=0)=>({x,y,vx,vy,radius:10,land(nx,ny){this.lastNormal={x:nx,y:ny};}});
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
console.log('Terrain collision: containment, edge overlap, clear-space and no-collide tests passed');
const {BounceBody}=require('../src/bounce-physics.js');
const fast= new BounceBody(0,0);
fast.x=0;fast.y=0;fast.vx=-400;fast.vy=0;fast.radius=10;
const swept=resolveCirclePolygons(fast,[square],.1,4,{x:40,y:0});
assert.ok(swept>0,'a fast-moving body should hit an edge it crossed between frames');
assert.ok(fast.x>29.9,'swept collision should stop the player from tunnelling through the solid');
assert.ok(fast.vx>0,'the original restitution response should redirect velocity away from the wall');
console.log('Terrain collision: swept edge contact and rebound prevented tunnelling');
