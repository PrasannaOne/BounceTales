(() => {
'use strict';
const W=240,H=320,SCALE=0.660187;
const LEVELS=[
  {resource:'bf',name:'Misty Morning'},
  {resource:'bg',name:'Unfriendly Friends'},
  {resource:'bh',name:'Seeking Answers'},
  {resource:'bi',name:'Bumpy Cracks'},
  {resource:'bj',name:'Secret Stalkway'},
  {resource:'bk',name:'Into the Mines'},
  {resource:'bl',name:'A Gloomy Path'},
  {resource:'bm',name:'Rumbling Sounds'},
  {resource:'bn',name:'Trapped in Machine'},
  {resource:'bo',name:'Tunnel of Treasures'},
  {resource:'bp',name:'Wicked Circus'},
  {resource:'bq',name:'Hunting Colours'},
  {resource:'br',name:'Almost There'},
  {resource:'bs',name:'Final Ride'},
  {resource:'bt',name:'Fantastic Fair'}
];
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const menu=document.getElementById('menu'),pauseLayer=document.getElementById('pause-layer'),settingsLayer=document.getElementById('settings-layer');
const status=document.getElementById('statusline'),eggHud=document.getElementById('egg-hud'),gameHint=document.getElementById('game-hint');
const input=new BounceOriginalInput.OriginalInputState();
let levelData=null,world=null,body=null,worldGeometry=[],renderObjects=[],eggs=[],enemies=[],waters=[],trampolines=[],cannons=[],bonusEggs=[];
let cannonState=null;
let currentLevel=LEVELS[0],levelLoadToken=0;
let atlases=[],imageMaps=null,spriteCatalogue=null,loadedImages=new Map(),collected=0,elapsed=0,mode='title';
const musicController=typeof BounceAudioController!=='undefined'?new BounceAudioController.AudioController({storage:localStorage}):null;
let eventEngine=null,playerObjectId=-1,fieldMessage='',fieldMessageTimer=0,languageStrings=[],checkpointPosition=null;
let spriteAnimations=new Map(),cameraSnap=false,playerDeathTimer=0;
let lastTime=0,cameraX=0,cameraY=0,cameraSpring=null,unlockedForme=0,toastTimer=0,toastText='';
const simulationClock=new BounceGameTiming.FixedStepClock();
let renderAlpha=0;
let fpsMode=localStorage.getItem('bounce-fps-mode')||'auto',showFps=localStorage.getItem('bounce-show-fps')==='true',fpsFrames=0,fpsStamp=0,displayFps=0,lastRenderAt=0;
if(!['auto','30','60'].includes(fpsMode))fpsMode='auto';
const S={play:'play',title:'title',select:'select',pause:'pause',complete:'complete',guide:'guide'};
const COVER_IDS=[359,363,364,365,328,366,367,368,369,329,370,360,361,362,330];
const LEVEL_TEXT_INDICES=[20,24,25,26,32,27,28,29,30,33,31,21,22,23,34];
const BONUS_REQUIREMENTS={4:60,9:200,14:400};
let progress=BounceOriginalProgression.load(localStorage),selectedLevelIndex=progress.selected||0;
let particles=new BounceGameParticles.ParticleSystem();
let victoryTimer=0,deathAnimationElapsed=0,deathBaseY=0,completionResult=null,worldMinY=-Infinity,worldMaxY=Infinity;
function toast(t){toastText=t;toastTimer=1.3;}
function fixedPoint(m,x,y){return {x:(m[0]*x+m[1]*y)/65536+m[2]/65536,y:(m[3]*x+m[4]*y)/65536+m[5]/65536};}
function matrixPoint(m,x,y){return fixedPoint(m,x,y);}
function getWorldPos(o){const m=world.get(o.id);return fixedPoint(m,0,0);}
function imgFor(index){
  if(!Number.isInteger(index)||index<0||index>=atlases.length)return null;
  if(loadedImages.has(index))return loadedImages.get(index);
  const im=new Image();im.src='assets/original/'+atlases[index];loadedImages.set(index,im);return im;
}
function drawImageMap(id,x,y,seen=new Set(),frame=0,targetCtx=ctx){
  if(seen.has(id))return;
  seen.add(id);
  // IDs 0–325 use the decoded o.java type-2 descriptor table directly.
  // The catalogue was validated against all 326 legacy image-map records at boot.
  const exact=spriteCatalogue?.get(id);
  if(exact){
    const crop=exact.crop,offset=exact.draw_offset,im=imgFor(exact.image_slot);
    if(im&&im.complete&&im.naturalWidth){
      targetCtx.drawImage(im,crop.x,crop.y,crop.width,crop.height,
        Math.round(x-offset.x),Math.round(y-offset.y),crop.width,crop.height);
    }
    seen.delete(id);return;
  }
  const map=imageMaps.maps[String(id)];
  if(!map){seen.delete(id);return;}
  if(map.type==='simple'){
    if(map.width<=0||map.height<=0){seen.delete(id);return;}
    const im=imgFor(map.image);
    if(im&&im.complete&&im.naturalWidth){
      targetCtx.drawImage(im,map.atlasX,map.atlasY,map.width,map.height,
        Math.round(x-map.originX),Math.round(y-map.originY),map.width,map.height);
    }
  }else if(map.type==='compound'){
    for(const part of map.parts)drawImageMap(part[2],x+part[0],y+part[1],seen,frame,targetCtx);
  }else if(map.type==='animated'&&map.frames.length){
    const at=((frame|0)%map.frames.length+map.frames.length)%map.frames.length;
    drawImageMap(map.frames[at],x,y,seen,frame,targetCtx);
  }
  seen.delete(id);
}
function transformObject(o){
  return world.get(o.id);
}
function startSpriteAnimation(id){
  const object=levelData?.objects.find(o=>o.id===id&&o.type==='sprite');
  if(!object)return;
  const state=BounceOriginalSpriteAnimation.start(object.sprites);
  if(state.slots.some(Boolean))spriteAnimations.set(id,state);
}
function updateSpriteAnimations(dt){
  for(const [id,state] of spriteAnimations){
    if(!BounceOriginalSpriteAnimation.update(state,dt*1000))spriteAnimations.delete(id);
  }
}
function refreshGeometryWorld(nextWorld=world){
  if(nextWorld)world=nextWorld;
  for(const poly of worldGeometry){
    const m=world.get(poly.id);
    if(!m)continue;
    const local16=poly.localVertices16||poly.localVertices.map(v=>[BounceFixed16.toFixed16(v[0]),BounceFixed16.toFixed16(v[1])]);
    const previousVertices=poly.vertices16;
    const currentVertices=local16.map(v=>{const p=BounceFixed16.transformPoint(m,v[0],v[1]);return [p.x,p.y];});
    poly.prevVertices16=previousVertices||currentVertices.map(v=>v.slice());
    poly.vertices16=currentVertices;
    poly.vertices=poly.vertices16.map(v=>({x:v[0]/65536,y:v[1]/65536}));
    poly.area=poly.vertices.slice(0,-1).reduce((a,p,i)=>a+p.x*poly.vertices[i+1].y-poly.vertices[i+1].x*p.y,0)/2;
    const flags=poly.object.runtimeFlags??poly.object.flags??0;
    poly.nocollide=(flags&0x20)!==0;
  }
}
function buildRuntime(parsed){
  world=BounceRLEF.buildWorld(parsed.objects);
  levelData=parsed;
  const player=parsed.objects.find(o=>o.type==='player');
  if(!player)throw new Error('The first level has no player start record');
  playerObjectId=player.id;
  const spawn=getWorldPos(player);
  body=new BouncePhysics.BounceBody(spawn.x,spawn.y,unlockedForme);
  body.slopeCosAbs=1;
  worldGeometry=[];renderObjects=[];eggs=[];enemies=[];waters=[];trampolines=[];cannons=[];cannonState=null;bonusEggs=[];playerDeathTimer=0;
  for(const o of parsed.objects){
    if(o.type==='player'){
      renderObjects.push({type:'player',object:o});
    }else if(o.type==='geometry'){
      const m=transformObject(o);
      const localVertices16=o.vertices16||o.vertices.map(v=>[BounceFixed16.toFixed16(v[0]),BounceFixed16.toFixed16(v[1])]);
      const vertices16=localVertices16.map(v=>{const q=BounceFixed16.transformPoint(m,v[0],v[1]);return [q.x,q.y];});
      const verts=vertices16.map(v=>({x:v[0]/65536,y:v[1]/65536}));
      const area=verts.slice(0,-1).reduce((a,p,i)=>a+p.x*verts[i+1].y-verts[i+1].x*p.y,0)/2;
      const nocollide=(o.flags&0x20)!==0;
      const poly={id:o.id,object:o,localVertices:o.vertices,localVertices16,vertices16,vertices:verts,faces:o.faces,color:o.color,area,nocollide};
      worldGeometry.push(poly);renderObjects.push({type:'geometry',object:o,poly});
    }else if(o.type==='sprite'){
      const m=transformObject(o);renderObjects.push({type:'sprite',object:o,matrix:m});
    }else if(o.type==='egg'){
      const p=getWorldPos(o);eggs.push({id:o.id,x:p.x,y:p.y,collected:false,object:o});renderObjects.push({type:'egg',object:o,point:p});
    }else if(o.type==='enemy'){
      const p=getWorldPos(o);const m=transformObject(o);
      const parentM=o.parent>=0?(world.get(o.parent)||[65536,0,0,0,65536,0]):[65536,0,0,0,65536,0];
      const localX=o.matrix[2]/65536,localY=o.matrix[5]/65536;
      const mp=(o.movePoints||[[0,0],[0,0]]).map(q=>fixedPoint(parentM,localX+q[0],localY+q[1]));
      const e={...o,object:o,x:p.x,y:p.y,initialX:p.x,initialY:p.y,matrix:m,dead:false,moveWorld:mp,state:1,propelType:1,moleWaitTimer:2000,molePeekTimer:0,molePeekPeriod:800,moleIsVulnerable:false,rechargeTimer:0,curMovePoint:0,facingLeft:(o.movePoints?.[0]?.[0]||0)<(o.movePoints?.[1]?.[0]||0)};
      BounceOriginalEnemies.reset(e);
      enemies.push(e);renderObjects.push({type:'enemy',enemy:e});
    }else if(o.type==='water'){
      const zone=BounceOriginalWater.createZone(o,transformObject(o));waters.push(zone);renderObjects.push({type:'water',object:o,water:zone});
    }else if(o.type==='trampoline'){
      const p=getWorldPos(o);const t={object:o,imageId:BounceOriginalTrampoline.imageForLevel(currentLevel.index||0),basePush:o.basePush,x:p.x,y:p.y,active:false,progress:0,period:0,animFrame:0,calcPush:0,jumpFinished:false};trampolines.push(t);renderObjects.push({type:'trampoline',trampoline:t});
    }else if(o.type==='cannon'){
      const p=getWorldPos(o);const c={object:o,x:p.x,y:p.y,power:o.power|0,animCountdown:0,launched:false};cannons.push(c);renderObjects.push({type:'cannon',cannon:c,object:o,point:p});
    }else if(o.type==='friend'){
      const p=getWorldPos(o);renderObjects.push({type:'friend',object:o,point:p});
    }
  }
  collected=0;elapsed=0;victoryTimer=0;deathAnimationElapsed=0;completionResult=null;particles.clear();
  spriteAnimations.clear();fieldMessage='';fieldMessageTimer=0;
  cameraSpring=new BounceOriginalCamera.CameraSpring(body.x,body.y+96,{width:W,height:H,scale:SCALE});
  eventEngine=new BounceEventEngine.EventEngine(parsed.objects,{
    strings:languageStrings,playerObjectId,
    onWorldChanged:next=>refreshGeometryWorld(next),
    onMessage:(id,text)=>{fieldMessage=text;fieldMessageTimer=6.5;},
    onAnimate:id=>startSpriteAnimation(id),
    onFlagsChanged:(obj,flags)=>{const poly=worldGeometry.find(p=>p.id===obj.id);if(poly)poly.nocollide=(flags&0x20)!==0;},
    onCameraTarget:id=>{cameraSnap=true;},
    onCameraParams:(bounce,stabilize,snap)=>{cameraSpring?.setParams(bounce,stabilize);cameraSnap=!!snap;},
    onCheckpoint:point=>{checkpointPosition={x:point.x,y:point.y};particles.emitCheckpoint(point.x,point.y);toast('CHECKPOINT');}
  });
  world=eventEngine.world;refreshGeometryWorld(world);
  checkpointPosition={x:body.x,y:body.y};
  const ys=worldGeometry.flatMap(poly=>poly.vertices.map(v=>v.y));worldMinY=ys.length?Math.min(...ys):-Infinity;worldMaxY=ys.length?Math.max(...ys):Infinity;
  cameraX=body.x;cameraY=body.y+96;cameraSpring?.snap(cameraX,cameraY);
  refreshHud();
}
function screenPoint(p){return {x:W/2+(p.x-cameraX)*SCALE,y:H/2-(p.y-cameraY)*SCALE};}
function resolveTerrain(dt,previous){
  body.radius=BouncePhysics.parameters.radius[body.forme];
  const result=BounceOriginalCollision.resolve(body,worldGeometry,dt,previous,8);
  // Penetration recovery is only a safety net for spawns or event teleports that
  // begin inside terrain; ordinary swept contacts use the c.class LP32 path.
  if(!result.contacts){
    BounceTerrainCollision.resolveCirclePolygons(body,worldGeometry,dt,8,previous);
    body.syncFixedPosition();
  }
}
function collectEggs(){
  for(const e of eggs.concat(bonusEggs)){
    if(e.collected)continue;
    const flags=e.object?(e.object.runtimeFlags??e.object.flags??0):0;
    if(flags&0x20)continue;
    const p=e.object?getWorldPos(e.object):e;
    const dx=body.x-p.x,dy=body.y-p.y;
    if(dx*dx+dy*dy<2025){e.collected=true;collected++;particles.emitEgg(p.x,p.y,10);}
  }
  refreshHud();
}
function collideEnemies(previous){
  for(const e of enemies){
    if(e.dead||((e.object?.runtimeFlags??e.object?.flags??0)&0x20))continue;
    const result=BounceOriginalEnemies.collision(e,body,previous);
    if(!result)continue;
    if(result.egg){bonusEggs.push({...result.egg,collected:false});particles.emitBurst(result.egg.x,result.egg.y,10);}
    if(result.type==='player-hit'){
      playerDeathTimer=3;deathAnimationElapsed=0;deathBaseY=body.y;body.enabled=false;body.eyeFrame=1;body.resetPhysics();musicController?.playCue(33);toast('TRY AGAIN');
    }
  }
  refreshHud();
}
function updatePlayerEyes(dt){
  const ms=dt*1000;
  if(body.idleAnimTimer>0){
    body.idleAnimTimer-=ms;
    body.idleAnimStartTimer=3000;
    if(body.idleAnimTimer<=0){
      if(body.eyeFrame<2||body.eyeFrame>8){
        body.idleAnimTimer=0;body.eyeFrame=0;
      }else{
        body.eyeFrame=(Math.floor(Math.random()*3)===0)?3:(Math.floor(Math.random()*6)+3);
        body.idleAnimTimer=body.eyeFrame===3?600:1500;
      }
    }
  }else if(Math.abs(body.vx)<40&&Math.abs(body.vy)<40){
    body.idleAnimStartTimer-=ms;
    if(body.idleAnimStartTimer<=0){
      body.idleAnimTimer=600;body.eyeFrame=2;body.idleAnimStartTimer=3000;
    }
  }
  if(Math.abs(body.vx)>=40||Math.abs(body.vy)>=40){
    if(body.eyeFrame!==1)body.eyeFrame=0;
    body.idleAnimStartTimer=3000;
  }
}

function updateEnemies(dt){
  for(const e of enemies){e.prevX=e.x;e.prevY=e.y;BounceOriginalEnemies.update(e,body,dt);}
}
function updateTrampolines(dt,previousPosition){
  for(const t of trampolines){
    const m=world.get(t.object.id)||t.object.matrix,p=BounceOriginalWater.worldPoint(m,0,0);t.x=p.x;t.y=p.y;
    if((t.object.runtimeFlags??t.object.flags??0)&0x20)continue;
    if(t.active){BounceOriginalTrampoline.update(t,body,imageMaps,dt);continue;}
    if(body.vy>=0)continue;
    const prev=BounceOriginalWater.inversePoint(m,previousPosition.x,previousPosition.y);
    const now=BounceOriginalWater.inversePoint(m,body.x,body.y);
    const dy=now.y-prev.y;
    if(Math.abs(dy)<1e-9)continue;
    const fraction=(95-prev.y)/dy;
    if(fraction<0||fraction>1)continue;
    const hitX=prev.x+(now.x-prev.x)*fraction;
    if(hitX>=-70&&hitX<=70)BounceOriginalTrampoline.begin(t,body,imageMaps);
  }
}
function cannonAngle(c){
  const m=world.get(c.object.id)||c.object.matrix;
  let a=Math.atan2(m[3],m[0]);
  if(a<0)a+=Math.PI*2;
  return a;
}
function enterCannon(c){
  if(cannonState||!body||!body.visible)return;
  if(c.object.targetObject!==playerObjectId)return;
  const p=getWorldPos(c.object);
  body.resetPhysics();body.x=p.x;body.y=p.y+35;body.enabled=false;body.visible=false;
  cannonState={cannon:c,angle:cannonAngle(c),facingRight:(c.object.matrix[0]>=0),animCountdown:0,launched:false};
  toast('CANNON · hold ◀ / ▶ to aim · JUMP to fire');
  if(gameHint)gameHint.textContent='Hold ◀ / ▶ to aim · Tap JUMP to fire';
}
function segmentHitsBox(a,b,minX,minY,maxX,maxY){
  let lo=0,hi=1,dx=b.x-a.x,dy=b.y-a.y;
  for(const [p,q] of [[-dx,a.x-minX],[dx,maxX-a.x],[-dy,a.y-minY],[dy,maxY-a.y]]){
    if(Math.abs(p)<1e-9){if(q<0)return false;continue;}
    const t=q/p;if(p<0){if(t>hi)return false;if(t>lo)lo=t;}else{if(t<lo)return false;if(t<hi)hi=t;}
  }
  return true;
}
function checkCannonContacts(previous){
  if(cannonState||!body.visible)return;
  for(const c of cannons){
    const p=getWorldPos(c.object);c.x=p.x;c.y=p.y;
    if(segmentHitsBox(previous,{x:body.x,y:body.y},p.x-60,p.y-60,p.x+60,p.y+60)){enterCannon(c);break;}
  }
}
function updateCannonAim(c,dt,direction){
  const step=3*dt;
  const lo=cannonState.facingRight?0:Math.PI/2;
  const hi=cannonState.facingRight?Math.PI/2:Math.PI;
  cannonState.angle=clamp(cannonState.angle+step*direction,lo,hi);
  const a=cannonState.angle,m=c.object.matrix;
  m[0]=Math.round(Math.cos(a)*65536);m[1]=Math.round(-Math.sin(a)*65536);
  m[3]=Math.round(Math.sin(a)*65536);m[4]=Math.round(Math.cos(a)*65536);
  c.object.matrix=m;c.object.runtimeMatrixDirty=true;
  eventEngine?.rebuildWorld();world=eventEngine?.world||world;refreshGeometryWorld(world);
}
function fireCannon(){
  if(!cannonState||cannonState.animCountdown>0)return;
  cannonState.animCountdown=900;cannonState.launched=false;
}
function updateCannon(dt,held){
  if(!cannonState)return false;
  const c=cannonState.cannon;
  if(cannonState.animCountdown<=0){
    if(held.left)updateCannonAim(c,dt,cannonState.facingRight?-1:1);
    if(held.right)updateCannonAim(c,dt,cannonState.facingRight?1:-1);
  }else{
    cannonState.animCountdown-=dt*1000;
    if(!cannonState.launched&&cannonState.animCountdown<=300){
      const a=cannonState.angle,p=getWorldPos(c.object),m=c.object.matrix;
      body.x=p.x+Math.cos(a)*120;body.y=p.y+Math.sin(a)*120;
      body.vx=Math.floor((c.power*m[0])/4096);body.vy=Math.floor((c.power*m[3])/4096);
      body.lastVx=0;body.lastVy=0;body.enabled=true;body.visible=true;body.grounded=false;body.airTime=0;body.skipAccelStretch=true;
      cannonState.launched=true;cannonState=null;if(gameHint)gameHint.textContent='Hold ◀ / ▶ to move · Hold JUMP to bounce · * changes form when available';toast('FIRE!');return false;
    }
  }
  return true;
}
function beginVictory(){
  if(victoryTimer>0||mode!==S.play)return;
  victoryTimer=3;particles.emitBurst(body.x,body.y,20);body.resetPhysics();body.enabled=false;input.clear();musicController?.playCue(34);toast('CHAPTER COMPLETE');
}
function beginDeath(){
  if(playerDeathTimer>0||victoryTimer>0)return;
  playerDeathTimer=3;deathAnimationElapsed=0;deathBaseY=body.y;particles.emitBurst(body.x,body.y,16);body.enabled=false;body.eyeFrame=1;body.resetPhysics();musicController?.playCue(33);toast('TRY AGAIN');
}
function update(dt,sourceDeltaMs=Math.round(dt*1000)){
  if(mode!==S.play||!body)return;
  if(victoryTimer>0){
    victoryTimer=Math.max(0,victoryTimer-dt);
    updateSpriteAnimations(dt);particles.update(dt);
    if(victoryTimer===0)completeCurrentChapter();
    return;
  }
  if(playerDeathTimer>0){
    deathAnimationElapsed+=dt;playerDeathTimer=Math.max(0,playerDeathTimer-dt);
    const t=deathAnimationElapsed;
    if(t<=1){body.y=deathBaseY+Math.sin(t*Math.PI)*95;}
    else{body.y=deathBaseY+Math.max(-380,95-(t-1)*260);}
    const pos=screenPoint(body);if(pos.y>H+25)cameraY+=Math.min(80,dt*90);
    particles.update(dt);updateSpriteAnimations(dt);
    if(playerDeathTimer===0){
      const pos=checkpointPosition||spawn;body.reset(pos.x,pos.y);body.enabled=true;body.visible=true;body.eyeFrame=0;body.idleAnimStartTimer=3000;cameraX=body.x;cameraY=body.y+96;cameraSpring?.snap(cameraX,cameraY);eventEngine?.vars.fill(0);musicController?.playLevel(currentLevel.index);toast('CHECKPOINT');
    }
    if(toastTimer>0)toastTimer-=dt;
    return;
  }
  const held=input.gameHeld();
  if(cannonState){
    updateCannon(dt,held);
    if(eventEngine){eventEngine.update(body,{x:body.x,y:body.y},dt,playerObjectId);world=eventEngine.world;}
    if(eventEngine?.vars[0]===1)beginDeath();
    if(eventEngine?.vars[0]===2)beginVictory();
    particles.update(dt);if(fieldMessageTimer>0)fieldMessageTimer=Math.max(0,fieldMessageTimer-dt);
    updateSpriteAnimations(dt);if(toastTimer>0)toastTimer-=dt;return;
  }
  if(held.left)body.moveLeft(false);
  if(held.right)body.moveRight(false);
  if(held.jump)body.jump(false);
  const previousPosition={x:body.x,y:body.y};
  const wasGrounded=body.grounded;
  const waterRippleHeads=new Map(waters.map(zone=>[zone,zone.ripples[zone.ripples.length-1]||null]));
  body.update(dt,SCALE,sourceDeltaMs);
  if(body.enabled)updatePlayerEyes(dt);
  resolveTerrain(dt,previousPosition);
  if(!wasGrounded&&body.grounded){
    const impact=Math.max(.25,Math.min(2.2,Math.abs(body.lastVy||body.vy)/180));
    particles.emitLanding(body.x,body.y-body.radius,impact);
  }
  for(const zone of waters)zone.matrix=world.get(zone.object.id)||zone.matrix;
  BounceOriginalWater.update(waters,body,previousPosition,dt);
  for(const zone of waters){
    const head=zone.ripples[zone.ripples.length-1];
    if(head&&head!==waterRippleHeads.get(zone)){
      const point=BounceOriginalWater.worldPoint(zone.matrix,head.x,zone.object.areaMinY);
      particles.emitSplash(point.x,point.y,Math.max(.3,Math.min(2,head.amplitude/8)));
    }
  }
  updateTrampolines(dt,previousPosition);
  checkCannonContacts(previousPosition);
  updateEnemies(dt);
  collectEggs();
  collideEnemies(previousPosition);
  if(eventEngine){eventEngine.update(body,previousPosition,dt,playerObjectId);world=eventEngine.world;}
  if(eventEngine?.vars[0]===1)beginDeath();
  if(eventEngine?.vars[0]===2||(BONUS_REQUIREMENTS[currentLevel.index]&&collected>=30))beginVictory();
  if(Number.isFinite(worldMinY)&&body.y<worldMinY-160)beginDeath();
  let targetX=body.x,targetY=body.y;
  if(eventEngine&&eventEngine.cameraTargetId>=0&&eventEngine.cameraTargetId!==playerObjectId){
    const target=world.get(eventEngine.cameraTargetId);
    if(target){targetX=target[2]/65536;targetY=target[5]/65536;}
  }
  if(!cameraSpring)cameraSpring=new BounceOriginalCamera.CameraSpring(cameraX,cameraY,{width:W,height:H,scale:SCALE});
  if(eventEngine){cameraSpring.setParams(eventEngine.cameraBounceFactor,eventEngine.cameraStabilizeSpeed);}
  const cameraActor=(eventEngine&&eventEngine.cameraTargetId>=0&&eventEngine.cameraTargetId!==playerObjectId)?{vx:0,vy:0}:body;
  const cameraPos=cameraSpring.update(dt,{x:targetX,y:targetY},{actor:cameraActor,offsetY:H/(5*SCALE),snap:cameraSnap});
  cameraX=cameraPos.x;cameraY=cameraPos.y;cameraSnap=false;
  if(eventEngine)eventEngine.cameraSnap=false;
  particles.update(dt);
  if(toastTimer>0)toastTimer-=dt;
  if(fieldMessageTimer>0)fieldMessageTimer=Math.max(0,fieldMessageTimer-dt);
  updateSpriteAnimations(dt);
}

function drawWater(zone){
  const o=zone.object,m=world.get(o.id)||zone.matrix;if(!m)return;
  const left=BounceOriginalWater.worldPoint(m,o.areaMinX,o.areaMinY),right=BounceOriginalWater.worldPoint(m,o.areaMaxX,o.areaMinY);
  const lowerRight=BounceOriginalWater.worldPoint(m,o.areaMaxX,o.areaMaxY),lowerLeft=BounceOriginalWater.worldPoint(m,o.areaMinX,o.areaMaxY);
  const sl=screenPoint(left),sr=screenPoint(right),br=screenPoint(lowerRight),bl=screenPoint(lowerLeft);
  const wave=zone.region===1?0:1;
  ctx.beginPath();ctx.moveTo(sl.x,sl.y);
  const steps=18;
  for(let i=1;i<=steps;i++){
    const t=i/steps,x=left.x+(right.x-left.x)*t;
    let ripple=0;
    for(const r of zone.ripples){const dx=x-r.x;const radius=60+r.age*150;if(Math.abs(dx)<radius)ripple+=Math.sin(dx*.18-r.age*13)*r.amplitude*(1-r.age/r.life);}
    const point=BounceOriginalWater.worldPoint(m,o.areaMinX+(o.areaMaxX-o.areaMinX)*t,o.areaMinY+ripple*wave);
    const sp=screenPoint(point);ctx.lineTo(sp.x,sp.y);
  }
  ctx.lineTo(br.x,br.y);ctx.lineTo(bl.x,bl.y);ctx.closePath();
  ctx.fillStyle=zone.isAirTunnel?'rgba(8,12,17,.28)':'rgba(17,17,238,.27)';ctx.fill();
  if(!zone.isAirTunnel&&zone.region===0){
    ctx.beginPath();
    for(let i=0;i<=steps;i++){
      const t=i/steps,x=left.x+(right.x-left.x)*t;let ripple=0;
      for(const r of zone.ripples){const dx=x-r.x,range=60+r.age*150;if(Math.abs(dx)<range)ripple+=Math.sin(dx*.18-r.age*13)*r.amplitude*(1-r.age/r.life);}
      const p=BounceOriginalWater.worldPoint(m,o.areaMinX+(o.areaMaxX-o.areaMinX)*t,o.areaMinY+ripple),sp=screenPoint(p);
      if(i===0)ctx.moveTo(sp.x,sp.y);else ctx.lineTo(sp.x,sp.y);
    }
    ctx.strokeStyle='rgba(175,231,255,.58)';ctx.lineWidth=1;ctx.stroke();
  }
  for(const bubble of zone.bubbles){
    const p=BounceOriginalWater.worldPoint(m,bubble.x,bubble.y+bubble.age*24),sp=screenPoint(p);
    ctx.globalAlpha=Math.max(0,1-bubble.age/bubble.life)*.55;ctx.strokeStyle='#d8f4ff';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(sp.x,sp.y,1.2+bubble.age,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }
}
function drawGeometry(poly){
  const vs=poly.vertices,faces=poly.faces;
  ctx.fillStyle='#'+poly.color.toString(16).padStart(6,'0');
  ctx.beginPath();
  for(let i=0;i+2<faces.length;i+=3){
    const a=screenPoint(vs[faces[i]]),b=screenPoint(vs[faces[i+1]]),c=screenPoint(vs[faces[i+2]]);
    ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();
  }
  ctx.fill();
}
function drawSprite(o,m){
  if(!m)return;
  const anim=spriteAnimations.get(o.id);
  for(let i=0;i<(o.sprites||[]).length;i++){
    const s=o.sprites[i],p=fixedPoint(m,s[0],s[1]),screen=screenPoint(p);
    const visual=anim?BounceOriginalSpriteAnimation.frame(anim,i,elapsed*1000):null;
    if(visual){
      ctx.save();
      const priorAlpha=ctx.globalAlpha;
      ctx.globalAlpha=(typeof priorAlpha==='number'?priorAlpha:1)*visual.alpha;
      drawImageMap(visual.imageId,screen.x,screen.y,new Set(),visual.frame);
      ctx.restore();
    }else drawImageMap(s[2],screen.x,screen.y);
  }
}
// BounceObject.fillStretchedCircle translated from the public readable
// decompilation and checked against c.class's 2.0.3 stretch state arrays.
function drawStretchedCircle(cx,cy,radius,stretchRadius,color,writeBuffer=false,expand=false){
  const st=body.stretch,abs=st.resultAbs,balance=st.balance;
  let axisIndex=2;
  ctx.fillStyle=color;
  for(let axis=0;axis<4;axis++){
    let width=radius-(((abs[axisIndex]+balance[axisIndex])>>10)*radius/stretchRadius);
    const height=radius-(((abs[axis>>1]+balance[axis>>1])>>10)*radius/stretchRadius);
    if(expand)width++;
    const w=Math.max(0.5,width),h=Math.max(0.5,height);
    if(writeBuffer)body.stretchBuffer[axis]=Math.min(w,h);
    const offsetY=(abs[1]+balance[1])>>10;
    // MIDP fillArc uses positive counter-clockwise angles. Canvas uses a
    // downward-positive screen axis, so reverse the sweep to preserve the
    // original four quadrants and keep Bounce's facial overlays aligned.
    const arc=BounceMIDPGraphics.arcAngles(axis*90,90);
    ctx.beginPath();ctx.moveTo(cx,cy+offsetY);
    ctx.ellipse(cx,cy+offsetY,w,h,0,arc.start,arc.end,arc.anticlockwise);
    ctx.closePath();ctx.fill();
    if(axis===0)axisIndex++;
    if(axis===2)axisIndex--;
  }
}
function drawBounceForm(x,y,r){
  for(let a=0;a<4;a++){
    let balance=0;for(let b=0;b<4;b++)if(a!==b)balance-=body.stretchResultAbs[b]>>1;
    body.stretchDirBalance[a]=balance;
  }
  body.stretchBuffer.fill(999);
  drawStretchedCircle(x,y,r+2,r+2,'#000000');
  drawStretchedCircle(x,y,r,r,'#ed1c24',true);
  const inner=Math.floor(r*.9);
  drawStretchedCircle(x,y+2,inner,r,'#af1100');
  drawStretchedCircle(x+1,y-1,inner,r,'#ed1c24',false,true);
  const top=body.stretchBuffer[1]>>1;
  const inset=(body.stretchBuffer[1]-top)+1;
  const highlightX=x+Math.trunc(Math.cos(5.3)*inset);
  const highlightY=y+Math.trunc(Math.sin(5.3)*inset);
  for(let i=0;i<12;i++){
    const imageId=(i&1)+31,percent=100-(i<<2),angle=body.rotation+i*.8;
    const base=(body.stretchResultAbs[1]+body.stretchDirBalance[1])>>10;
    for(let quadrant=0;quadrant<4;quadrant++){
      const buffer=body.stretchBuffer[quadrant];
      const distance=((buffer-((buffer>>1)>>1))*percent)/100;
      const sx=x+Math.trunc(Math.cos(angle)*distance);
      const sy=y+Math.trunc(Math.sin(angle)*distance);
      const inside=quadrant===0?(sx>=x&&sy<=y):quadrant===1?(sx<=x&&sy<=y):quadrant===2?(sx<=x&&sy>=y):(sx>=x&&sy>=y);
      if(inside){drawImageMap(imageId,sx,quadrant===0?sy:base+sy);break;}
    }
  }
  drawImageMap(17,x,y);
  drawStretchedCircle(highlightX,highlightY,top>>1,r,'#ffffff');
  drawImageMap(28,x,y);
}
function drawBumpyForm(x,y){
  const ids=[211,212,223,234,237,238,239,240,241,242,213,214,215,216,217,218,219,220,221,222,224,225,226,227,228,229,230,231,232,233,235,236];
  let degrees=Math.trunc(body.rotation*180/Math.PI)%360;if(degrees<0)degrees+=360;
  const index=31-Math.trunc(degrees/11.25);
  drawImageMap(ids[index],x,y);
}
function drawWollyForm(x,y,r){
  const colors=['#ededed','#0064bc','#ededed','#e11900','#ededed','#e8df05'];
  ctx.fillStyle='#000000';ctx.beginPath();ctx.arc(x,y,r+2,0,Math.PI*2);ctx.fill();
  for(let i=0;i<6;i++){
    const arc=BounceMIDPGraphics.arcAngles(i*60-body.rotation*180/Math.PI,60);
    ctx.fillStyle=colors[i];ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r,arc.start,arc.end,arc.anticlockwise);ctx.closePath();ctx.fill();
  }
  const center=Math.floor(r)>>2;ctx.fillStyle=colors[0];ctx.beginPath();ctx.arc(x,y,center,0,Math.PI*2);ctx.fill();
  drawImageMap(5,x,y);
}
function drawPlayer(){
  if(body.visible===false)return;
  const renderBody={x:body.prevX+(body.x-body.prevX)*renderAlpha,y:body.prevY+(body.y-body.prevY)*renderAlpha};
  const p=screenPoint(renderBody),r=Math.floor(BouncePhysics.parameters.radius[body.forme]*SCALE)+1;
  if(body.forme===0)drawBounceForm(p.x,p.y,r);
  else if(body.forme===1)drawBumpyForm(p.x,p.y);
  else drawWollyForm(p.x,p.y,r);
  // The eyes are original image-map animations, drawn after the active form.
  if(body.eyeFrame===1){
    drawImageMap(20,p.x,p.y);
  }else if(body.eyeFrame===2||body.eyeFrame===3){
    const count=body.eyeFrame===2?2:4;
    const frameInv=Math.min(count-1,Math.floor((body.idleAnimTimer*count)/600));
    drawImageMap(body.eyeFrame===2?462:447,p.x,p.y,new Set(),(count-1)-frameInv);
  }else if(body.eyeFrame>=4&&body.eyeFrame<=8){
    drawImageMap([458,460,454,452,456][body.eyeFrame-4],p.x,p.y);
  }
}
function drawEnemy(e){
  const renderX=(e.prevX??e.x)+(e.x-(e.prevX??e.x))*renderAlpha;
  const renderY=(e.prevY??e.y)+(e.y-(e.prevY??e.y))*renderAlpha;
  const screen=screenPoint({x:renderX,y:renderY});
  if(e.enemyType===0)drawImageMap(467,screen.x,screen.y,new Set(),Math.floor(elapsed*20));
  else if(e.enemyType===2){
    const bodyFrame=e.state===0?Math.floor(elapsed*1000/150)%4:0;
    drawImageMap(504,screen.x,screen.y,new Set(),bodyFrame);
    if(e.state!==0){
      const peekY=(e.molePeekTimer*61)/Math.max(1,e.molePeekPeriod);
      // Original l.java clips the peeking face at the mole's centre line.
      ctx.save();ctx.beginPath();ctx.rect(0,0,W,clamp(screen.y,0,H));ctx.clip();
      drawImageMap(e.facingLeft?189:194,screen.x,screen.y+61-peekY);
      ctx.restore();
    }
  }else if(e.enemyType===1||e.enemyType===3){
    // The supplied runtime resolves these two legacy image IDs as the original
    // 20x20 invalid-resource checkerboard (drawImageRes handles IDs below zero).
    const x=Math.round(screen.x),y=Math.round(screen.y)-20;ctx.fillStyle='#ffffff';ctx.fillRect(x,y,20,20);
    ctx.fillStyle='#ff00ff';ctx.fillRect(x,y,10,10);ctx.fillRect(x+10,y+10,10,10);
  }
}
function javaRandom(seed){
  let state=(BigInt(seed)^0x5DEECE66Dn)&((1n<<48n)-1n);
  return ()=>{
    state=(state*0x5DEECE66Dn+0xBn)&((1n<<48n)-1n);
    return Number(BigInt.asIntN(32,state>>16n));
  };
}
function makeParallaxLayer(imageIds,moveNum,moveDen,xStep,xRange,yBase,yRange,count,stripeFill=-1,rng){
  const xs=new Array(count+1).fill(0),ys=new Array(count+1).fill(0),indices=new Array(count+1).fill(0);
  ys[0]=(yRange?(rng()%yRange):0)+yBase;
  for(let i=1;i<count+1;i++){
    const step=xRange?Math.abs(rng()%xRange):0;
    xs[i]=step+xs[i-1]+xStep;
    ys[i]=(yRange?(rng()%yRange):0)+yBase;
    indices[i]=Math.abs(rng()%imageIds.length);
  }
  return {imageIds,moveNum,moveDen,xs,ys,indices,groupWidth:xs[count],stripeFill};
}
function buildOriginalParallax(levelIndex){
  const kind=levelIndex<=4?0:(levelIndex<=9?1:2);
  const rng=javaRandom(levelIndex+1),scaleTiles=1;
  const defs=kind===0?[
    {ids:[252],speed:20,x:200,xRange:140,y:-200,yRange:200,count:5,fill:-1},
    {ids:[251],speed:50,x:100,xRange:70,y:-70,yRange:300,count:5,fill:-1},
    {ids:[388],speed:80,x:150,xRange:100,y:-70,yRange:300,count:5,fill:-1}
  ]:kind===1?[
    {ids:[159,160],speed:20,x:200,xRange:140,y:-200,yRange:200,count:5,fill:-1},
    {ids:[161],speed:50,x:100,xRange:70,y:-70,yRange:300,count:5,fill:-1},
    {ids:[373],speed:80,x:150,xRange:100,y:-70,yRange:300,count:5,fill:-1}
  ]:[
    {ids:[353],speed:5,x:600,xRange:100,y:-80,yRange:50,count:2,fill:-1},
    {ids:[114],speed:20,x:((imageMaps.maps['114']?.width)||240),xRange:0,y:-50,yRange:0,count:3,fill:0x15113C},
    {ids:[113],speed:50,x:((imageMaps.maps['113']?.width)||240),xRange:0,y:-30,yRange:0,count:3,fill:0x02021A}
  ];
  return {kind,baseCameraY:cameraY,layers:defs.map(d=>makeParallaxLayer(d.ids,d.speed,100,d.x,d.xRange,d.y,d.yRange,d.count*scaleTiles,d.fill,rng))};
}
let parallaxCache=null;
function drawOriginalParallax(){
  if(!parallaxCache||parallaxCache.level!==currentLevel.index){
    parallaxCache={level:currentLevel.index,...buildOriginalParallax(currentLevel.index)};
  }
  const layerState=parallaxCache;
  const gradientColors=layerState.kind===0?['#529ae6','#71d5ff']:
    layerState.kind===1?['#6ed5c9','#9fffff']:['#7610f4','#02021a'];
  const bonus=[4,9,14].includes(currentLevel.index);
  const top=bonus?'#b400bd':gradientColors[0],bottom=bonus?'#fd8c13':gradientColors[1];
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,top);bg.addColorStop(1,bottom);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  for(const layer of layerState.layers){
    const group=layer.groupWidth;if(!group)continue;
    const xMotion=((cameraX+33000)*SCALE*layer.moveNum)/layer.moveDen;
    let mod=((xMotion%group)+group)%group;
    const baseX=group-mod;
    const baseY=H+((cameraY-layerState.baseCameraY)*SCALE*layer.moveNum)/layer.moveDen;
    for(let i=0;i<layer.xs.length-1;i++){
      const id=layer.imageIds[layer.indices[i]||0],x=layer.xs[i]+baseX,y=layer.ys[i]+baseY;
      if(i<2)drawImageMap(id,x,y);
      if(i>2)drawImageMap(id,x-(group*2),y);
      drawImageMap(id,x-group,y);
    }
    if(layer.stripeFill!==-1){
      const c=layer.stripeFill;ctx.fillStyle='#'+c.toString(16).padStart(6,'0');
      const stripeY=layer.ys[0]+baseY;ctx.fillRect(0,stripeY,W,H-stripeY);
    }
  }
}
function drawFieldMessage(){
  if(!fieldMessage||fieldMessageTimer<=0)return;
  const maxWidth=202,lines=[];ctx.font='9px system-ui';
  const words=fieldMessage.replace(/[’‘]/g,"'").split(/\s+/);let line='';
  for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}
  if(line)lines.push(line);
  const shown=lines.slice(0,4),height=shown.length*12+15,y=H-height-9;
  const alpha=Math.min(0.92,fieldMessageTimer<0.4?fieldMessageTimer/0.4:0.92);
  ctx.fillStyle='rgba(7,17,19,'+alpha+')';ctx.fillRect(9,y,W-18,height);
  ctx.strokeStyle='rgba(242,232,205,.45)';ctx.strokeRect(9.5,y+.5,W-19,height-1);
  ctx.fillStyle='#f5eddb';ctx.textAlign='center';ctx.textBaseline='top';
  shown.forEach((t,i)=>ctx.fillText(t,120,y+8+i*12,maxWidth));
}
function drawOriginalChapterBook(){
  ctx.fillStyle='#3f1a01';ctx.fillRect(0,0,W>>1,H);
  ctx.fillStyle='#5e2601';ctx.fillRect(W>>1,0,W>>1,H);
  drawImageMap(4,0,0);drawImageMap(74,0,0);drawImageMap(75,0,0);drawImageMap(3,0,H);
  drawImageMap(331,120,160);
  ctx.fillStyle='#fbf7e3';ctx.fillRect(5,20,230,279);
  ctx.fillStyle='#000';ctx.fillRect(118,20,4,279);
}
function draw(){
  ctx.clearRect(0,0,W,H);
  if(mode!==S.play){
    if(mode===S.select){drawOriginalChapterBook();drawImageMap(COVER_IDS[selectedLevelIndex],120,160);return;}
    const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#203c54');bg.addColorStop(1,'#111b24');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    drawImageMap(1,120,145);return;
  }
  drawOriginalParallax();
  // Original GameObject depth sorting draws larger zCoord values first, leaving
  // lower zCoord actors in front. Read runtime flags so event opcode 29 can
  // change an object's layer during play.
  const orderedObjects=renderObjects.slice().sort((a,b)=>{
    const af=a.object?.runtimeFlags??a.object?.flags??0,bf=b.object?.runtimeFlags??b.object?.flags??0;
    return (bf&31)-(af&31);
  });
  for(const item of orderedObjects){
    const flags=item.object?.runtimeFlags??item.object?.flags??0;
    if(flags&0x80)continue;
    if(item.type==='player')drawPlayer();
    else if(item.type==='geometry')drawGeometry(item.poly);
    else if(item.type==='sprite')drawSprite(item.object,transformObject(item.object));
    else if(item.type==='egg'){
      const p=screenPoint(getWorldPos(item.object));const e=eggs.find(x=>x.id===item.object.id);
      if(e&&!e.collected)drawImageMap(208,p.x,p.y);
    }else if(item.type==='enemy'){
      if(!item.enemy.dead)drawEnemy(item.enemy);
    }else if(item.type==='trampoline'){
      const t=item.trampoline,p=screenPoint(t);drawImageMap(t.imageId,p.x,p.y,new Set(),t.active?t.animFrame:0);
    }else if(item.type==='water'){
      drawWater(item.water);
    }else if(item.type==='friend'){
      const p=screenPoint(getWorldPos(item.object));ctx.fillStyle='#ED1C24';ctx.beginPath();ctx.arc(p.x,p.y,Math.round(20*SCALE),0,Math.PI*2);ctx.fill();
    }else if(item.type==='cannon'){
      const p=screenPoint(getWorldPos(item.object)),a=cannonState?.cannon===item.cannon?cannonState.angle:cannonAngle(item.cannon);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-a);drawImageMap(48,0,0);ctx.restore();
    }
  }
  for(const e of bonusEggs){if(!e.collected){const p=screenPoint(e);drawImageMap(208,p.x,p.y);}}
  particles.draw(ctx,screenPoint,SCALE);
  drawFieldMessage();
  if(toastTimer>0){ctx.fillStyle='#06121dcc';ctx.fillRect(34,276,172,22);ctx.fillStyle='#fff';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(toastText,120,290);}
}
function refreshHud(){
  const total=eggs.length+enemies.length;
  status.textContent=(currentLevel.name.toUpperCase())+'  ·  '+collected+'/'+total+' EGGS';
  eggHud.textContent='FORM '+['BOUNCE','BUMPY','WOLLY'][body?.forme||0];
}
function syncSceneChrome(){
  const app=document.getElementById('app');if(app)app.dataset.mode=mode;
  const playing=mode===S.play;
  status.hidden=!playing;eggHud.hidden=!playing;
  const fps=document.getElementById('fps-counter');if(fps)fps.hidden=!(playing&&showFps);
}
function syncPauseButton(){const b=document.getElementById('pause-mini');if(b)b.hidden=mode!==S.play;}
function hideGameScenes(){
  for(const id of ['menu','level-screen','pause-layer','complete-layer','guide-layer']){const el=document.getElementById(id);if(el)el.hidden=true;}
  syncSceneChrome();syncPauseButton();
}

function showTitleMenu(){mode=S.title;hideGameScenes();document.getElementById('menu').hidden=false;input.clear();musicController?.playTitle();updateMenuSummary();syncPauseButton();}
function renderLevelCover(index){
  const cover=document.getElementById('level-cover'),coverCtx=cover?.getContext('2d');if(!coverCtx||!imageMaps)return;
  coverCtx.clearRect(0,0,cover.width,cover.height);
  const grad=coverCtx.createLinearGradient(0,0,0,cover.height);grad.addColorStop(0,'#7cb9d7');grad.addColorStop(1,'#d5e2ca');coverCtx.fillStyle=grad;coverCtx.fillRect(0,0,cover.width,cover.height);
  coverCtx.fillStyle='#234b29';coverCtx.fillRect(0,cover.height-13,cover.width,13);
  drawImageMap(COVER_IDS[index],cover.width/2,cover.height/2,new Set(),0,coverCtx);
  if(!BounceOriginalProgression.isUnlocked(progress,index)){coverCtx.fillStyle='#10161499';coverCtx.fillRect(0,0,cover.width,cover.height);coverCtx.fillStyle='#fff0c9';coverCtx.font='bold 10px system-ui';coverCtx.textAlign='center';coverCtx.fillText('LOCKED',cover.width/2,cover.height/2+4);}
}
function getLocalizedLevelName(index){return languageStrings?.[LEVEL_TEXT_INDICES[index]]||LEVELS[index]?.name||'Unknown chapter';}
function updateMenuSummary(){
  const selected=progress.selected||0,record=progress.records[selected]||progress.records[0];
  const cont=document.getElementById('continue-game');if(cont)cont.textContent=BounceOriginalProgression.unlockedCount(progress)>1?'CONTINUE ADVENTURE':'START ADVENTURE';
  const summary=document.getElementById('save-summary');if(summary){const total=BounceOriginalProgression.totalEggs(progress);summary.textContent=getLocalizedLevelName(selected)+' · '+total+' eggs collected';}
}
function updateLevelBook(){
  selectedLevelIndex=clamp(selectedLevelIndex,0,14)|0;const r=progress.records[selectedLevelIndex],unlocked=BounceOriginalProgression.isUnlocked(progress,selectedLevelIndex),required=BONUS_REQUIREMENTS[selectedLevelIndex];
  const name=document.getElementById('level-name'),chapter=document.getElementById('level-chapter'),record=document.getElementById('level-record'),lock=document.getElementById('level-lock'),pos=document.getElementById('level-position'),play=document.getElementById('play-level');
  const localized=getLocalizedLevelName(selectedLevelIndex);
  if(name)name.textContent=localized;
  const group=BounceOriginalProgression.chapterGroup(selectedLevelIndex),groupNames=['ACT I · GREEN HILL ZONE','ACT II · SPOOKY ZONE','ACT III · MACHINE WORLD'];
  if(chapter)chapter.textContent=(required?'BONUS CHAPTER · ':'')+groupNames[group];
  if(record)record.textContent=(r.clearTime>0&&r.clearTime<9999?'BEST '+formatTime(r.clearTime)+' · ':'NOT YET COMPLETED · ')+r.eggs+'/30 EGGS';
  if(lock){lock.hidden=unlocked;lock.textContent=required?'LOCKED · '+required+' TOTAL EGGS REQUIRED':'LOCKED · COMPLETE THE PREVIOUS CHAPTER';}
  if(play){play.disabled=!unlocked;play.textContent=unlocked?'PLAY CHAPTER':'CHAPTER LOCKED';}
  if(pos)pos.textContent=String(selectedLevelIndex+1).padStart(2,'0')+' / 15';
  renderLevelCover(selectedLevelIndex);
}
function formatTime(seconds){const mins=Math.floor(seconds/60),secs=seconds%60;return String(mins).padStart(2,'0')+':'+String(secs).padStart(2,'0');}
function showChapterBook(){mode=S.select;hideGameScenes();document.getElementById('level-screen').hidden=false;input.clear();updateLevelBook();syncPauseButton();}
function changeBookPage(delta){selectedLevelIndex=clamp(selectedLevelIndex+delta,0,14);updateLevelBook();}
function openGuide(){mode=S.guide;hideGameScenes();document.getElementById('guide-layer').hidden=false;input.clear();syncPauseButton();}
function startLevel(){
  mode=S.play;hideGameScenes();syncPauseButton();input.clear();lastTime=0;simulationClock.reset();renderAlpha=0;musicController?.playLevel(currentLevel.index);
  if(eventEngine){eventEngine.reset();world=eventEngine.world;refreshGeometryWorld(world);}
  spriteAnimations.clear();fieldMessage='';fieldMessageTimer=0;cameraSnap=false;
  body.reset(spawn.x,spawn.y);body.enabled=true;body.visible=true;cannonState=null;if(gameHint)gameHint.textContent='Hold ◀ / ▶ to move · Hold JUMP to bounce';body.rotation=0;body.unlockedForme=progress.unlockedForme;body.forme=0;body.slopeCosAbs=1;body.eyeFrame=0;body.idleAnimStartTimer=3000;
  eggs.forEach(e=>e.collected=false);bonusEggs=[];collected=0;elapsed=0;checkpointPosition={x:spawn.x,y:spawn.y};
  trampolines.forEach(t=>{t.active=false;t.progress=0;t.period=0;t.animFrame=0;t.jumpFinished=false;});
  enemies.forEach(e=>{e.x=e.initialX;e.y=e.initialY;BounceOriginalEnemies.reset(e);});
  waters.forEach(w=>{w.ripples=[];w.bubbles=[];w.ambientTimer=0;w.swimTimer=0;});particles.clear();playerDeathTimer=0;deathAnimationElapsed=0;victoryTimer=0;completionResult=null;cameraX=body.x;cameraY=body.y+96;cameraSpring?.snap(cameraX,cameraY);refreshHud();
  progress.selected=currentLevel.index;BounceOriginalProgression.save(localStorage,progress);
}
let spawn={x:0,y:0};
async function loadLevel(index,options={}){
  const chosen=LEVELS[index];if(!chosen)throw new Error('Unknown level index '+index);
  const token=++levelLoadToken;status.textContent='LOADING '+chosen.name.toUpperCase()+'…';
  const response=await fetch('assets/original/'+chosen.resource);if(!response.ok)throw new Error('Could not load original level resource '+chosen.resource);
  const parsed=BounceRLEF.parse(new Uint8Array(await response.arrayBuffer()));if(token!==levelLoadToken)return false;
  const player=parsed.objects.find(o=>o.type==='player');if(!player)throw new Error(chosen.name+' has no player start record');
  currentLevel={...chosen,index,objectCount:parsed.objectCount,eventCount:parsed.eventCount,name:getLocalizedLevelName(index)};
  buildRuntime(parsed);spawn={x:body.x,y:body.y};mode=S.title;hideGameScenes();input.clear();lastTime=0;simulationClock.reset();renderAlpha=0;
  selectedLevelIndex=index;progress.selected=index;BounceOriginalProgression.save(localStorage,progress);
  refreshHud();status.textContent=chosen.name.toUpperCase()+' · ORIGINAL LEVEL DATA LOADED';
  if(options.start)startLevel();else if(options.book)showChapterBook();else showTitleMenu();
  return true;
}
function completeCurrentChapter(){
  if(mode!==S.play||completionResult)return;
  const previousForms=progress.unlockedForme;
  completionResult=BounceOriginalProgression.complete(progress,currentLevel.index,collected,elapsed*1000);
  progress.totalGameTime+=elapsed;progress.selected=currentLevel.index;BounceOriginalProgression.save(localStorage,progress);unlockedForme=progress.unlockedForme;
  document.getElementById('complete-title').textContent=getLocalizedLevelName(currentLevel.index);
  document.getElementById('complete-eggs').textContent=completionResult.eggs+' / 30';
  document.getElementById('complete-stats').textContent='Time '+formatTime(completionResult.seconds)+' · Score '+completionResult.score;
  const next=document.getElementById('next-level');
  if(completionResult.nextLevel>=0&&BounceOriginalProgression.isUnlocked(progress,completionResult.nextLevel)){next.textContent='NEXT CHAPTER';next.disabled=false;}
  else{next.textContent='CHAPTER BOOK';next.disabled=false;}
  if(progress.unlockedForme>previousForms)toast('NEW FORM UNLOCKED');
  if(completionResult.nextLevel>=0&&BounceOriginalProgression.isUnlocked(progress,completionResult.nextLevel))progress.selected=completionResult.nextLevel;else progress.selected=currentLevel.index;
  BounceOriginalProgression.save(localStorage,progress);
  mode=S.complete;hideGameScenes();document.getElementById('complete-layer').hidden=false;input.clear();updateMenuSummary();syncPauseButton();
}
function startSelectedChapter(){
  const chosen=selectedLevelIndex;
  if(!BounceOriginalProgression.isUnlocked(progress,chosen)){toast('CHAPTER LOCKED');return;}
  if(currentLevel.index===chosen&&levelData){startLevel();return;}
  loadLevel(chosen,{start:true}).catch(error=>{console.error(error);toast('Could not load this chapter');});
}

function pauseGame(){if(mode===S.play){mode=S.pause;simulationClock.reset();renderAlpha=0;hideGameScenes();document.getElementById('pause-layer').hidden=false;input.clear();syncPauseButton();}}
function resumeGame(){if(mode===S.pause){mode=S.play;hideGameScenes();syncPauseButton();input.clear();lastTime=0;simulationClock.reset();renderAlpha=0;}}
function cycleForme(){
  if(mode!==S.play)return;const before=body.forme;body.cycleForme();
  if(body.forme===before)toast('Other forms unlock later');else{particles.emitTransform(body.x,body.y,before,body.forme);toast('Form '+(body.forme+1));}
  refreshHud();
}
function onEdge(id){
  window.dispatchEvent(new CustomEvent('bouncetales:original-key',{detail:{id}}));
  if(mode===S.play){if(id===5)pauseGame();else if(id===20)cycleForme();else if(id===7&&cannonState)fireCannon();}
  else if(mode===S.title){if(id===7||id===1)startLevel();}
  else if(mode===S.select){if(id===3)changeBookPage(-1);else if(id===4)changeBookPage(1);else if(id===7||id===1)startSelectedChapter();else if(id===5||id===6)showTitleMenu();}
  else if(mode===S.pause){if(id===7||id===1||id===5)resumeGame();else if(id===3||id===4||id===6)showChapterBook();}
  else if(mode===S.complete){if(id===7||id===1)advanceAfterChapter();else if(id===5||id===6)showChapterBook();}
  else if(mode===S.guide){if(id===7||id===1||id===5||id===6)showTitleMenu();}
}
function advanceAfterChapter(){
  const next=completionResult?.nextLevel;
  if(next>=0&&BounceOriginalProgression.isUnlocked(progress,next)){selectedLevelIndex=next;loadLevel(next,{start:true}).catch(error=>{console.error(error);showChapterBook();});}
  else showChapterBook();
}

function bindInputs(){
  document.querySelectorAll('[data-key-id]').forEach(btn=>{
    const id=Number(btn.dataset.keyId),activePointers=new Set();
    btn.addEventListener('contextmenu',e=>e.preventDefault());
    btn.addEventListener('pointerdown',e=>{
      e.preventDefault();
      if(activePointers.has(e.pointerId))return;
      activePointers.add(e.pointerId);
      try{btn.setPointerCapture(e.pointerId);}catch{}
      btn.classList.add('pressed');
      if(activePointers.size===1){const was=input.isHeld(id);input.press(id);if(!was)onEdge(id);}
    });
    const release=e=>{
      if(!activePointers.delete(e.pointerId))return;
      if(activePointers.size===0){btn.classList.remove('pressed');input.release(id);}
    };
    btn.addEventListener('pointerup',release);
    btn.addEventListener('pointercancel',release);
    btn.addEventListener('lostpointercapture',release);
  });

  // Desktop keyboard: arrows or A/D move, Space/Enter jump, Shift/Q changes
  // form, Escape pauses. W/S remain usable for vertical/original menu input.
  const keys=new Set();
  const editableTarget=target=>{
    const el=target instanceof Element?target:null;
    return !!el?.closest('input,textarea,select,[contenteditable="true"]');
  };
  addEventListener('keydown',e=>{
    if(!settingsLayer.hidden){if(e.key==='Escape')closeSettings();return;}
    if(editableTarget(e.target))return;
    const accepted=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape','Backspace','Shift','*','#','w','W','a','A','s','S','d','D','q','Q'];
    if(!accepted.includes(e.key))return;
    if(e.key.startsWith('Arrow')||e.key===' ')e.preventDefault();
    const id=BounceOriginalInput.browserKeyId(e.key);
    if(id>=0&&!keys.has(e.key)){
      keys.add(e.key);const was=input.isHeld(id);input.press(id);if(!was)onEdge(id);
    }
  });
  addEventListener('keyup',e=>{const id=BounceOriginalInput.browserKeyId(e.key);if(id>=0){keys.delete(e.key);input.release(id);}});

  // A standard-mapping gamepad works in the same way as the phone controls.
  // D-pad / left stick: move or page; A: jump/select; B: form; Start: pause.
  let gamepadHeld=new Set();
  function pollGamepad(){
    const pads=navigator.getGamepads?.();if(!pads)return;
    const pad=Array.from(pads).find(p=>p&&p.connected);const next=new Set();
    if(pad){
      const axis=pad.axes?.[0]||0;
      if(axis<-.35||pad.buttons?.[14]?.pressed)next.add(3);
      if(axis>.35||pad.buttons?.[15]?.pressed)next.add(4);
      if((pad.axes?.[1]||0)<-.55||pad.buttons?.[12]?.pressed)next.add(1);
      if((pad.axes?.[1]||0)>.55||pad.buttons?.[13]?.pressed)next.add(2);
      if(pad.buttons?.[0]?.pressed)next.add(7);
      if(pad.buttons?.[1]?.pressed)next.add(20);
      if(pad.buttons?.[9]?.pressed)next.add(5);
    }
    for(const id of gamepadHeld)if(!next.has(id))input.release(id);
    for(const id of next)if(!gamepadHeld.has(id)){const was=input.isHeld(id);input.press(id);if(!was)onEdge(id);}
    gamepadHeld=next;
  }
  window.__bouncePollGamepad=pollGamepad;

  // Swipe the original chapter book left/right on touch or a trackpad.
  const book=typeof document.querySelector==='function'?document.querySelector('#level-screen .book-panel'):null;let swipe=null;
  if(book){
    book.addEventListener('pointerdown',e=>{if(e.target.closest('button,a'))return;swipe={x:e.clientX,y:e.clientY,id:e.pointerId};try{book.setPointerCapture(e.pointerId);}catch{}});
    book.addEventListener('pointerup',e=>{
      if(!swipe||swipe.id!==e.pointerId)return;
      const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;
      if(Math.abs(dx)>34&&Math.abs(dx)>Math.abs(dy)*1.2)changeBookPage(dx<0?1:-1);
    });
    book.addEventListener('pointercancel',()=>{swipe=null;});
  }

  const clearAll=()=>{keys.clear();input.clear();gamepadHeld.clear();document.querySelectorAll('[data-key-id]').forEach(b=>b.classList.remove('pressed'));};
  addEventListener('blur',clearAll);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearAll();musicController?.pause();lastTime=0;simulationClock.reset();renderAlpha=0;lastRenderAt=0;fpsStamp=0;fpsFrames=0;}else musicController?.resume();});
  window.addEventListener('pointerdown',()=>musicController?.unlock(),{once:true});
}

// Drawing follows requestAnimationFrame. V18 advances simulation on a nominal
// 60 Hz fixed-step clock with source-style integer 16/17 ms deltas and a 500 ms
// catch-up cap. Actor and enemy transforms are interpolated for smooth rendering.
function loop(now){
  if(window.__bouncePollGamepad)window.__bouncePollGamepad();
  if(!lastTime)lastTime=now;
  const requestedCap=fpsMode==='auto'?0:Number(fpsMode)||0;
  if(requestedCap){
    const frameInterval=1000/requestedCap;
    if(lastRenderAt&&now-lastRenderAt<frameInterval-1){requestAnimationFrame(loop);return;}
  }
  const elapsedMs=Math.max(0,now-lastTime);
  lastTime=now;lastRenderAt=now;
  if(mode===S.play){
    const timing=simulationClock.advance(elapsedMs,(dt,deltaMs)=>update(dt,deltaMs));
    renderAlpha=timing.alpha;
  }else{
    simulationClock.reset();renderAlpha=0;
  }
  draw();
  if(showFps){fpsFrames++;if(!fpsStamp)fpsStamp=now;if(now-fpsStamp>=500){displayFps=Math.round(fpsFrames*1000/(now-fpsStamp));fpsFrames=0;fpsStamp=now;const counter=document.getElementById('fps-counter');if(counter)counter.textContent=displayFps+' FPS';}}
  requestAnimationFrame(loop);
}
let settingsReturnFocus=null;
function setSettingsTab(tab){
  const about=tab==='about';
  document.getElementById('settings-game-pane').hidden=about;
  document.getElementById('settings-about-pane').hidden=!about;
  for(const key of ['game','about']){
    const button=document.querySelector('[data-settings-tab="'+key+'"]');
    const active=key===tab;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));
  }
}
function openSettings(){
  settingsReturnFocus=document.activeElement;const layer=document.getElementById('settings-layer');layer.hidden=false;
  setSettingsTab('game');document.getElementById('settings-game-tab').focus();
}
function closeSettings(){
  document.getElementById('settings-layer').hidden=true;
  if(settingsReturnFocus?.focus)settingsReturnFocus.focus();settingsReturnFocus=null;
}

function applyFpsMode(value){fpsMode=['auto','30','60'].includes(value)?value:'auto';localStorage.setItem('bounce-fps-mode',fpsMode);lastTime=0;simulationClock.reset();renderAlpha=0;lastRenderAt=0;}
function resetProgress(){
  if(!confirm('Reset all Bounce Tales progress, unlocked chapters and best records?'))return;
  progress=BounceOriginalProgression.reset(localStorage);selectedLevelIndex=0;unlockedForme=0;closeSettings();
  loadLevel(0).catch(error=>{console.error(error);toast('Reset failed');});
}

async function shareSite(){
  const shareData={title:'Bounce Tales',text:'Play Bounce Tales, an HTML5 browser remaster.',url:'https://prasannaone.github.io/BounceTales/'};
  try{if(navigator.share){await navigator.share(shareData);}else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(shareData.url);toast('Site link copied');}else{prompt('Copy the Bounce Tales link',shareData.url);}}catch(e){if(e?.name!=='AbortError')console.warn('Share unavailable',e);}
}
function bindSettings(){
  const fps=document.getElementById('fps-mode'),fpsToggle=document.getElementById('show-fps'),counter=document.getElementById('fps-counter'),full=document.getElementById('fullscreen-btn');
  fps.value=['auto','30','60'].includes(fpsMode)?fpsMode:'auto';fps.addEventListener('change',()=>applyFpsMode(fps.value));
  fpsToggle.checked=showFps;counter.hidden=!showFps;fpsToggle.addEventListener('change',()=>{showFps=fpsToggle.checked;localStorage.setItem('bounce-show-fps',String(showFps));counter.hidden=!showFps;});
  const musicToggle=document.getElementById('music-enabled');if(musicToggle){musicToggle.checked=musicController?.enabled??true;musicToggle.addEventListener('change',()=>musicController?.setEnabled(musicToggle.checked));}
  document.getElementById('open-settings').addEventListener('click',openSettings);document.getElementById('close-settings').addEventListener('click',closeSettings);
  settingsLayer.addEventListener('click',e=>{if(e.target===settingsLayer)closeSettings();});document.getElementById('share-site').addEventListener('click',shareSite);
  document.getElementById('reset-game').addEventListener('click',resetProgress);
  full.addEventListener('click',async()=>{try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen();full.textContent='Exit fullscreen';}else{await document.exitFullscreen();full.textContent='Enter fullscreen';}}catch{toast('Fullscreen unavailable in this browser');}});
  document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen';});
  document.querySelectorAll('[data-settings-tab]').forEach(button=>button.addEventListener('click',()=>setSettingsTab(button.dataset.settingsTab)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!settingsLayer.hidden){closeSettings();e.stopPropagation();}});
  document.getElementById('pause-mini').addEventListener('click',pauseGame);
  document.getElementById('continue-game').addEventListener('click',()=>{const idx=progress.selected||0;if(currentLevel.index===idx)startLevel();else loadLevel(idx,{start:true}).catch(error=>{console.error(error);toast('Could not load saved chapter');});});
  document.getElementById('open-chapters').addEventListener('click',showChapterBook);
  document.getElementById('open-guide').addEventListener('click',openGuide);
  document.getElementById('level-prev').addEventListener('click',()=>changeBookPage(-1));
  document.getElementById('level-next').addEventListener('click',()=>changeBookPage(1));
  document.getElementById('play-level').addEventListener('click',startSelectedChapter);
  document.getElementById('back-title').addEventListener('click',showTitleMenu);
  document.getElementById('resume').addEventListener('click',resumeGame);
  document.getElementById('restart').addEventListener('click',()=>startLevel());
  document.getElementById('pause-chapters').addEventListener('click',showChapterBook);
  document.getElementById('next-level').addEventListener('click',advanceAfterChapter);
  document.getElementById('result-chapters').addEventListener('click',showChapterBook);
  document.getElementById('guide-back').addEventListener('click',showTitleMenu);
}

async function boot(){
  try{
    const [mapResp,atlasResp,langResp]=await Promise.all([fetch('src/image-map.json'),fetch('src/sprite-atlas.json'),fetch('assets/original/lang.xx')]);
    if(!mapResp.ok||!atlasResp.ok||!langResp.ok)throw new Error('Could not load original JAR image, sprite atlas or language resources');
    imageMaps=await mapResp.json();atlases=imageMaps.atlases;
    const decodedAtlas=await atlasResp.json();spriteCatalogue=BounceSpriteAtlas.prepare(decodedAtlas,imageMaps);
    if(decodedAtlas.png_images.some((entry,index)=>entry.png!==atlases[index]))throw new Error('Sprite atlas PNG slot order does not match the original image archive');
    languageStrings=BounceEventEngine.parseLanguage(new Uint8Array(await langResp.arrayBuffer()));
    selectedLevelIndex=progress.selected||0;if(!BounceOriginalProgression.isUnlocked(progress,selectedLevelIndex))selectedLevelIndex=0;unlockedForme=progress.unlockedForme;
    await loadLevel(selectedLevelIndex);bindInputs();bindSettings();showTitleMenu();requestAnimationFrame(loop);
  }catch(error){
    hideGameScenes();document.getElementById('menu').hidden=false;const summary=document.getElementById('save-summary');if(summary)summary.textContent='Could not load original game resources: '+error.message;
    status.textContent='RESOURCE LOAD ERROR';console.error(error);
  }
}
boot();
})();