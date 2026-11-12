const assert=require('node:assert/strict');
const fp=require('../src/fixed-point.js');
const collision=require('../src/original-collision.js');
const ground={
  id:1,nocollide:false,
  vertices16:[
    [-100*65536,0],[100*65536,0],[100*65536,-100*65536],
    [-100*65536,-100*65536],[-100*65536,0]
  ].map(([x,y])=>[x|0,y|0])
};
function bodyAt(x,y,vy=-100){
  return {x,y,x16:fp.toFixed16(x),y16:fp.toFixed16(y),radius:20,forme:0,
    vx:0,vy,gravityX:0,gravityY:0,torqueX:0,torqueY:0,
    slopeSinAbs:0,slopeCosAbs:1,airTime:.1,grounded:false,curVelocity:Math.abs(vy)};
}
{
  const body=bodyAt(0,15,-100);
  const result=collision.resolve(body,[ground],.016,{x:0,y:35},8);
  assert.ok(result.contacts>=1,'falling actor should contact the top contour');
  assert.ok(body.y>=20&&body.y<21,'actor should be resolved just above ground');
  assert.ok(body.grounded,'contact should set grounded state');
  assert.ok(body.vy>=0,'normal velocity should be reflected away from terrain');
}
{
  const body=bodyAt(0,35,100);
  const result=collision.resolve(body,[ground],.016,{x:0,y:15},8);
  assert.equal(result.contacts,0,'moving away from a surface should not collide');
}
{
  const body=bodyAt(0,15,-100);
  const result=collision.resolve(body,[{...ground,nocollide:true}],.016,{x:0,y:35},8);
  assert.equal(result.contacts,0,'no-collide flag must be honoured');
}
{
  // Exact c.class response regression: friction is gravity × form-friction ×
  // normal gravity, not radius-scaled, and torque follows relative velocity.
  const body={x:0,y:20,x16:fp.toFixed16(0),y16:fp.toFixed16(20),radius:200,forme:0,
    vx:0,vy:-100,gravityX:0,gravityY:0,torqueX:0,torqueY:0,
    slopeSinAbs:0,slopeCosAbs:1,airTime:.2,grounded:false,curVelocity:100};
  const hit={x:fp.toFixed16(0),y:fp.toFixed16(0),normalX:0,normalY:65536};
  assert.equal(collision.applySourceResponse(body,hit,16),true);
  assert.equal(body.vy,10,'10% restitution should reflect the incoming normal velocity');
  assert.equal(body.gravityY,-240,'the source friction is 0.6 × 1.0 × 400 and has no radius multiplier');
  assert.equal(body.torqueY,5,'source torque smoothing uses half the post-contact surface-relative velocity');
}
{
  // A moving contact surface contributes its normal velocity and removes its
  // tangential velocity from the friction/torque relative-motion calculation.
  const body={x:0,y:20,x16:fp.toFixed16(0),y16:fp.toFixed16(20),radius:20,forme:0,
    vx:0,vy:-100,gravityX:0,gravityY:0,torqueX:0,torqueY:0,
    slopeSinAbs:0,slopeCosAbs:1,airTime:.2,grounded:false,curVelocity:100};
  const hit={x:fp.toFixed16(0),y:fp.toFixed16(0),normalX:0,normalY:65536,surfaceDX:0,surfaceDY:2};
  collision.applySourceResponse(body,hit,1000);
  assert.equal(body.vy,12,'actor inherits the surface normal velocity');
  assert.equal(body.torqueY,5,'torque is based on actor velocity relative to the surface');
}
{
  const poly={prevVertices16:[[0,0],[10*65536,0]],vertices16:[[2*65536,4*65536],[12*65536,4*65536]]};
  assert.deepEqual(collision.edgeSurfaceDelta(poly,0,32768,poly.vertices16),{surfaceDX:2,surfaceDY:4});
  assert.deepEqual(collision.vertexSurfaceDelta(poly,1,poly.vertices16),{surfaceDX:2,surfaceDY:4});
}
console.log('original collision tests passed');
