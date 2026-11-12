const assert=require('node:assert/strict');
const {BounceBody,parameters:P}=require('../src/bounce-physics.js');
let b=new BounceBody(10,100);
b.moveRight();b.update(.016);
assert.ok(b.vx>0&&b.x>10);
b.grounded=true;b.slopeCosAbs=1;b.jump(false);
assert.equal(b.grounded,false);assert.equal(b.pushY,P.jumpAcceleration[0]);
b.update(.016);assert.ok(b.vy>0);
b=new BounceBody();b.cycleForme();assert.equal(b.forme,0); // no unlocked forms in chapter 1
b.unlockedForme=2;b.cycleForme();assert.equal(b.forme,1);
b.cycleForme();assert.equal(b.forme,2);b.cycleForme();assert.equal(b.forme,0);
console.log('Physics: source-derived acceleration, jump and forme-lock behaviour passed');
