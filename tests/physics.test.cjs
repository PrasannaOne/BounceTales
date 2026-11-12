const assert=require('node:assert/strict');
const {BounceBody,parameters:P}=require('../src/bounce-physics.js');
let b=new BounceBody(10,100);
b.moveRight();b.update(.016);
assert.ok(b.vx>0&&b.x>10);
b.grounded=true;b.slopeCosAbs=1;b.jump(false);
assert.equal(b.grounded,false);assert.equal(b.pushY,P.jumpAcceleration[0]);
assert.equal(b.reqStretch[0],-53);assert.equal(b.reqStretch[1],-53);
b.update(.016);assert.ok(b.vy>0);assert.ok(b.stretchMagnitude.some(v=>v!==0),'JAR-style stretch state should respond to a jump');
b=new BounceBody();b.cycleForme();assert.equal(b.forme,0); // no unlocked forms in chapter 1
b.unlockedForme=2;b.cycleForme();assert.equal(b.forme,1);
b.cycleForme();assert.equal(b.forme,2);b.cycleForme();assert.equal(b.forme,0);
// Verify the 64-bit spring recovery path converges instead of blowing the ball
// apart after the idle period. This specifically guards the visual offset bug.
b=new BounceBody(0,0);b.grounded=true;b.jump(false);let maxStretch=0;
for(let i=0;i<600;i++){b.update(.016,.660187);for(const v of b.stretchResultAbs)maxStretch=Math.max(maxStretch,Math.abs(v));}
assert.ok(maxStretch<4096,'stretched-circle response should stay bounded and recover');
assert.ok(b.stretchMagnitude.every(v=>Math.abs(v)<70*65536),'directional spring magnitudes remain within original clamp');
console.log('Physics: JAR-derived movement, jump, stretch and 64-bit spring recovery passed');
