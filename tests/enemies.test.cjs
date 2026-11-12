const assert=require('node:assert/strict');
const E=require('../src/original-enemies.js');
assert.ok(Math.abs(E.worldSpeed(0)-(6000*1000/65536))<1e-12,'source speed is converted from LP32 units per millisecond');
assert.ok(Math.abs(E.worldSpeed(3)-(10000*1000/65536))<1e-12);
function enemy(type=0){return {id:7,enemyType:type,x:0,y:0,initialX:0,initialY:0,moveWorld:[{x:-100,y:0},{x:100,y:0}],dead:false};}
let e=enemy(0);E.reset(e);const player={x:1000,y:0};E.update(e,player,.02);assert.ok(e.x<0,'candle should follow its source patrol path at 6000 units/s');assert.equal(e.facingLeft,true,'source direction flag faces left when the actor moves toward decreasing X');
e=enemy(0);E.reset(e);e.x=0;e.moveWorld=[{x:-200,y:0},{x:200,y:0}];E.update(e,{x:50,y:0},.001);assert.equal(e.curMovePoint,1,'candle switches patrol endpoint rather than approaching Bounce when nearby');
e=enemy(2);E.reset(e);e.propelType=0;e.state=0;e.moleWaitTimer=5000;const before=e.x;E.update(e,{x:999,y:0},.02);assert.notEqual(e.x,before,'active mole patrol follows its two original movement points');
e=enemy(1);E.reset(e);e.moveWorld=[{x:-100,y:0},{x:100,y:0}];E.update(e,{x:999,y:0},.02);assert.ok(e.x<0,'type-1 bumper follows its original two-endpoint path');assert.ok(Math.abs(e.x+E.worldSpeed(1)*.02)<.01,'bumper movement uses the source 4000 LP32/ms speed');
e=enemy(2);E.reset(e);e.moleWaitTimer=10;E.update(e,{x:0,y:0},.02);assert.equal(e.propelType,0);assert.equal(e.state,0);assert.equal(e.moleIsVulnerable,false);
const body={x:0,y:95,vx:0,vy:-100,forme:0,pushX:0,pushY:0};e=enemy(0);E.reset(e);e.y=0;const stomp=E.collision(e,body,{x:0,y:110});assert.equal(stomp.type,'stomp');assert.equal(e.dead,true);assert.equal(stomp.egg.y,30);assert.equal(body.vy,50);
e=enemy(0);E.reset(e);e.y=0;const struck={x:1,y:50,vx:0,vy:0,pushX:0,pushY:0};const hit=E.collision(e,struck,{x:-100,y:50});assert.equal(hit,null);assert.equal(e.rechargeTimer,500);assert.equal(struck.pushX,500,'candle side contact applies the source 500-unit push');
e=enemy(3);E.reset(e);e.x=30;e.y=40;const stalkerHit=E.collision(e,{x:30,y:50,vx:0,vy:0,forme:0,pushX:0,pushY:0},{x:30,y:-10});assert.equal(stalkerHit.type,'player-hit');assert.equal(e.x,e.stalkerInitX);assert.equal(e.y,e.stalkerInitY);
e=enemy(3);E.reset(e);e.moveWorld=[{x:20,y:0},{x:120,y:0}];e.x=0;e.x16=E.toLP(0);e.rechargeTimer=1;E.update(e,{x:300,y:0},.002);assert.ok(e.moveWorld[1].x>120,'stalker extends its previous destination when the source look-ahead distance is larger');
console.log('Enemies: LP32 patrol speeds (including bumper), candle/mole state, stomp/egg, and stalker retarget/hit paths passed');
