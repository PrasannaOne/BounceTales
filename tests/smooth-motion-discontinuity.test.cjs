const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const BouncePhysics=require('../src/bounce-physics.js');
const Trampoline=require('../src/original-trampoline.js');
const game=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
const trampolineSource=fs.readFileSync(path.join(__dirname,'..','src/original-trampoline.js'),'utf8');

const body=new BouncePhysics.BounceBody(10,600);
body.prevX=-100; body.prevY=-100;
body.vy=-500;
const maps={maps:{'497':{type:'animated',frames:[498,499],height:58},'498':{height:58},'499':{height:47}}};
const spring={x:0,y:486,imageId:497,basePush:300,active:false};
assert.equal(Trampoline.begin(spring,body,maps),true);
assert.equal(body.prevX,body.x,'contact X render position snapped');
assert.equal(body.prevY,body.y,'contact Y render position snapped');

let ticks=0;
while(spring.active===false && ticks++<1){} // begin activates spring
for(let i=0;i<20&&spring.active;i++){
  Trampoline.update(spring,body,maps,1/60,17);
  if(!body.enabled){
    assert.equal(body.prevX,body.x,'compression X render position snapped');
    assert.equal(body.prevY,body.y,'compression Y render position snapped');
  }
}
assert.equal(body.enabled,true,'spring releases player');
assert.equal(body.prevX,body.x,'release X render position snapped');
assert.equal(body.prevY,body.y,'release Y render position snapped');
assert.match(game,/body\.x=p\.x\+Math\.cos\(a\)\*120;body\.y=p\.y\+Math\.sin\(a\)\*120;\s*body\.snapRenderPosition\?\.\(\);/,'cannon launch snaps render position');
assert.match(trampolineSource,/body\.snapRenderPosition\?\.\(\);/,'trampoline paths use render snap');
console.log('Smooth Motion discontinuity checks passed: contact, compression, release, cannon launch.');
