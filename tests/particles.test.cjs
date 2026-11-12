const assert=require('node:assert/strict');
const {ParticleSystem}=require('../src/game-particles.js');
const p=new ParticleSystem(()=>0.5);
p.emitEgg(10,20,8);assert.equal(p.items.length,8);assert.ok(p.items.every(x=>x.life>0&&Number.isFinite(x.vx)));
p.update(.1);assert.ok(p.items.every(x=>x.age===.1));
const c={globalAlpha:1,beginPath(){},arc(){},fill(){}};p.draw(c,point=>point,1);assert.equal(c.globalAlpha,1);
p.update(2);assert.equal(p.items.length,0);
p.emitLanding(0,0,1);assert.ok(p.items.length>=3&&p.items.length<=12);p.clear();assert.equal(p.items.length,0);
console.log('Particles: egg burst, elapsed update, render alpha reset, expiry and landing burst passed');
