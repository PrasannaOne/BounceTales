'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const RLEF=require('../src/rlef-reader.js');
const {EventEngine}=require('../src/event-engine.js');
const root=path.resolve(__dirname,'..');
const identity=[65536,0,0,0,65536,0];
const body={x:0,y:0,vx:0,vy:0,pushX:0,pushY:0,gravityX:0,gravityY:0};
function command(target,mask,values){
  const bytes=new Uint8Array(11),view=new DataView(bytes.buffer);
  bytes[0]=29;view.setInt16(1,target,false);view.setInt32(3,mask,false);view.setInt32(7,values,false);return bytes;
}

const effects=[],changes=[];
const sprite={id:75,type:'sprite',parent:-1,matrix:identity.slice(),flags:26,sprites:[[45,-67,358]]};
const ordinary={id:76,type:'sprite',parent:-1,matrix:identity.slice(),flags:0,sprites:[[0,0,357]]};
const engine=new EventEngine([sprite,ordinary],{
  onOriginalSpriteEffect:object=>effects.push(object.id),
  onFlagsChanged:(object,flags,mask,values)=>changes.push({id:object.id,flags,mask,values})
});
engine.runCommand({id:1},command(75,129,154),16,body,100);
assert.equal(sprite.runtimeFlags,154,'selector bit 0 must replace all low five depth bits, while selector 0x80 sets visibility');
assert.equal(sprite.renderDepth,10,'cached J2ME depth is the packed low-five value minus 16');
assert.deepEqual(effects,[75],'image-358 sprite must emit the original fragment effect when selector 0x80 is touched');
engine.runCommand({id:1},command(75,32,32),16,body,100);
assert.equal(sprite.runtimeFlags,186,'selector 0x20 must independently set the collision flag');
engine.runCommand({id:1},command(75,256,256),16,body,100);
assert.equal(sprite.runtimeFlags,442,'selector 0x100 must independently set its packed flag');
engine.runCommand({id:1},command(76,128,128),16,body,100);
assert.deepEqual(effects,[75],'the image-358 effect must not fire for other sprite resources');
engine.runCommand({id:1},command(75,1,3),16,body,100);
assert.equal(sprite.runtimeFlags,419,'selector bit 0 must replace the complete low-five depth field');
assert.equal(sprite.renderDepth,-13);
assert.equal(changes.length,5);

const levelNames='bf bg bh bi bj bk bl bm bn bo bp bq br bs bt'.split(' ');
let command29Count=0,specialImage358Count=0;
const maskCounts={};
for(const name of levelNames){
  const parsed=RLEF.parse(fs.readFileSync(path.join(root,'assets/original',name)));
  const byId=new Map(parsed.objects.map(o=>[o.id,o]));
  for(const event of parsed.objects){
    for(const raw of event.commands||[]){
      if(raw[0]!==29)continue;
      const bytes=Uint8Array.from(raw),view=new DataView(bytes.buffer);
      const target=byId.get(view.getInt16(1,false)),mask=view.getInt32(3,false);
      command29Count++;maskCounts[mask]=(maskCounts[mask]||0)+1;
      assert.equal(mask&~(1|32|128|256),0,`${name} event ${event.id} uses an unhandled opcode-29 selector`);
      if((mask&128)&&target?.type==='sprite'&&target.sprites?.[0]?.[2]===358)specialImage358Count++;
    }
  }
}
assert.equal(command29Count,140,'reference campaign must retain all 140 packed-flag commands');
assert.deepEqual(maskCounts,{1:4,32:21,128:87,129:25,160:1,161:2});
assert.equal(specialImage358Count,14,'fourteen campaign commands must reach the source image-358 fragment path');
console.log('Event flag parity: packed depth, collision/visibility selectors, extension flag, image-358 effect routing and all 140 campaign commands passed');
