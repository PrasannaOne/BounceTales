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
let atlases=[],imageMaps=null,loadedImages=new Map(),collected=0,elapsed=0,mode='title';
let eventEngine=null,playerObjectId=-1,fieldMessage='',fieldMessageTimer=0,languageStrings=[],checkpointPosition=null;
let spriteAnimations=new Map(),cameraFollowSpeed=5,cameraSnap=false,playerDeathTimer=0;
let lastTime=0,cameraX=0,cameraY=0,unlockedForme=0,toastTimer=0,toastText='';
let fpsMode=localStorage.getItem('bounce-fps-mode')||'auto',showFps=localStorage.getItem('bounce-show-fps')==='true',fpsFrames=0,fpsStamp=0,displayFps=0,lastRenderAt=0;
if(!['auto','30','60'].includes(fpsMode))fpsMode='auto';
const S={play:'play',title:'title',pause:'pause'};
function toast(t){toastText=t;toastTimer=1.3;}
function fixedPoint(m,x,y){return {x:(m[0]*x+m[1]*y)/65536+m[2]/65536,y:(m[3]*x+m[4]*y)/65536+m[5]/65536};}
function matrixPoint(m,x,y){return fixedPoint(m,x,y);}
function getWorldPos(o){const m=world.get(o.id);return fixedPoint(m,0,0);}
function imgFor(index){
  if(!Number.isInteger(index)||index<0||index>=atlases.length)return null;
  if(loadedImages.has(index))return loadedImages.get(index);
  const im=new Image();im.src='assets/original/'+atlases[index];loadedImages.set(index,im);return im;
}
function drawImageMap(id,x,y,seen=new Set(),frame=0){
  const map=imageMaps.maps[String(id)];
  if(!map||seen.has(id))return;
  seen.add(id);
  if(map.type==='simple'){
    if(map.width<=0||map.height<=0){seen.delete(id);return;}
    const im=imgFor(map.image);
    if(im&&im.complete&&im.naturalWidth){
      ctx.drawImage(im,map.atlasX,map.atlasY,map.width,map.height,
        Math.round(x-map.originX),Math.round(y-map.originY),map.width,map.height);
    }
  }else if(map.type==='compound'){
    for(const part of map.parts)drawImageMap(part[2],x+part[0],y+part[1],seen,frame);
  }else if(map.type==='animated'&&map.frames.length){
    const at=((frame|0)%map.frames.length+map.frames.length)%map.frames.length;
    drawImageMap(map.frames[at],x,y,seen,frame);
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
    poly.vertices=poly.localVertices.map(v=>fixedPoint(m,v[0],v[1]));
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
      const verts=o.vertices.map(v=>fixedPoint(m,v[0],v[1]));
      const area=verts.slice(0,-1).reduce((a,p,i)=>a+p.x*verts[i+1].y-verts[i+1].x*p.y,0)/2;
      const nocollide=(o.flags&0x20)!==0;
      const poly={id:o.id,object:o,localVertices:o.vertices,vertices:verts,faces:o.faces,color:o.color,area,nocollide};
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
  collected=0;elapsed=0;
  spriteAnimations.clear();fieldMessage='';fieldMessageTimer=0;
  eventEngine=new BounceEventEngine.EventEngine(parsed.objects,{
    strings:languageStrings,playerObjectId,
    onWorldChanged:next=>refreshGeometryWorld(next),
    onMessage:(id,text)=>{fieldMessage=text;fieldMessageTimer=6.5;},
    onAnimate:id=>startSpriteAnimation(id),
    onFlagsChanged:(obj,flags)=>{const poly=worldGeometry.find(p=>p.id===obj.id);if(poly)poly.nocollide=(flags&0x20)!==0;},
    onCameraTarget:id=>{cameraSnap=false;},
    onCameraParams:(bounce,stabilize,snap)=>{cameraFollowSpeed=clamp(stabilize/28,1.5,10);cameraSnap=!!snap;},
    onCheckpoint:point=>{checkpointPosition={x:point.x,y:point.y};}
  });
  world=eventEngine.world;refreshGeometryWorld(world);
  checkpointPosition={x:body.x,y:body.y};
  cameraX=body.x;cameraY=body.y+96;
  refreshHud();
}
function screenPoint(p){return {x:W/2+(p.x-cameraX)*SCALE,y:H/2-(p.y-cameraY)*SCALE};}
function resolveTerrain(dt,previous){
  body.radius=BouncePhysics.parameters.radius[body.forme];
  BounceTerrainCollision.resolveCirclePolygons(body,worldGeometry,dt,4,previous);
}
function collectEggs(){
  for(const e of eggs.concat(bonusEggs)){
    if(e.collected)continue;
    const flags=e.object?(e.object.runtimeFlags??e.object.flags??0):0;
    if(flags&0x20)continue;
    const p=e.object?getWorldPos(e.object):e;
    const dx=body.x-p.x,dy=body.y-p.y;
    if(dx*dx+dy*dy<2025){e.collected=true;collected++;}
  }
  refreshHud();
}
function collideEnemies(previous){
  for(const e of enemies){
    if(e.dead||((e.object?.runtimeFlags??e.object?.flags??0)&0x20))continue;
    const result=BounceOriginalEnemies.collision(e,body,previous);
    if(!result)continue;
    if(result.egg)bonusEggs.push({...result.egg,collected:false});
    if(result.type==='player-hit'){
      playerDeathTimer=3;body.enabled=false;toast('TRY AGAIN');
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
  for(const e of enemies)BounceOriginalEnemies.update(e,body,dt);
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
function update(dt){
  if(mode!==S.play||!body)return;
  elapsed+=dt;
  if(playerDeathTimer>0){
    playerDeathTimer=Math.max(0,playerDeathTimer-dt);
    if(playerDeathTimer===0){
      const pos=checkpointPosition||spawn;body.reset(pos.x,pos.y);body.enabled=true;body.visible=true;body.eyeFrame=0;toast('CHECKPOINT');
    }
    updateSpriteAnimations(dt);if(toastTimer>0)toastTimer-=dt;return;
  }
  const held=input.gameHeld();
  if(cannonState){
    updateCannon(dt,held);
    if(eventEngine){eventEngine.update(body,{x:body.x,y:body.y},dt,playerObjectId);world=eventEngine.world;}
    if(fieldMessageTimer>0)fieldMessageTimer=Math.max(0,fieldMessageTimer-dt);
    updateSpriteAnimations(dt);if(toastTimer>0)toastTimer-=dt;return;
  }
  if(held.left)body.moveLeft(false);
  if(held.right)body.moveRight(false);
  if(held.jump)body.jump(false);
  const previousPosition={x:body.x,y:body.y};
  body.update(dt,SCALE);
  if(body.enabled)updatePlayerEyes(dt);
  resolveTerrain(dt,previousPosition);
  // WaterObject contact logic is evaluated after the actor's movement, exactly
  // like the original collision pass. The first overlapping zone owns the update.
  for(const zone of waters)zone.matrix=world.get(zone.object.id)||zone.matrix;
  BounceOriginalWater.update(waters,body,previousPosition,dt);
  updateTrampolines(dt,previousPosition);
  checkCannonContacts(previousPosition);
  updateEnemies(dt);
  collectEggs();
  collideEnemies(previousPosition);
  if(eventEngine){
    eventEngine.update(body,previousPosition,dt,playerObjectId);
    world=eventEngine.world;
  }
  let targetX=body.x,targetY=body.y+96;
  if(eventEngine&&eventEngine.cameraTargetId>=0&&eventEngine.cameraTargetId!==playerObjectId){
    const target=world.get(eventEngine.cameraTargetId);
    if(target){targetX=target[2]/65536;targetY=target[5]/65536;}
  }
  const cameraStep=Math.min(1,dt*cameraFollowSpeed);
  if(cameraSnap){cameraX=targetX;cameraY=targetY;}else{cameraX+=(targetX-cameraX)*cameraStep;cameraY+=(targetY-cameraY)*cameraStep;}
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
  const p=screenPoint(body),r=Math.floor(BouncePhysics.parameters.radius[body.forme]*SCALE)+1;
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
  const screen=screenPoint({x:e.x,y:e.y});
  if(e.enemyType===0)drawImageMap(467,screen.x,screen.y,new Set(),Math.floor(elapsed*20));
  else if(e.enemyType===2){
    const bodyFrame=e.state===0?Math.floor(elapsed*1000/150)%4:0;
    drawImageMap(504,screen.x,screen.y,new Set(),bodyFrame);
    if(e.state!==0){
      const peekY=(e.molePeekTimer*61)/Math.max(1,e.molePeekPeriod);
      drawImageMap(e.facingLeft?189:194,screen.x,screen.y+61-peekY);
    }
  }else if(e.enemyType===1||e.enemyType===3){
    // The supplied runtime resolves these two legacy image IDs as the original
    // 20x20 invalid-resource checkerboard (drawImageRes handles IDs below zero).
    const x=Math.round(screen.x),y=Math.round(screen.y)-20;ctx.fillStyle='#ffffff';ctx.fillRect(x,y,20,20);
    ctx.fillStyle='#ff00ff';ctx.fillRect(x,y,10,10);ctx.fillRect(x+10,y+10,10,10);
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
function draw(){
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#73b8df');bg.addColorStop(.7,'#b7d9e0');bg.addColorStop(1,'#dce4d1');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
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
      const p=screenPoint(getWorldPos(item.object));ctx.fillStyle='#d84b44';ctx.beginPath();ctx.arc(p.x,p.y,12,0,7);ctx.fill();
    }else if(item.type==='cannon'){
      const p=screenPoint(getWorldPos(item.object)),a=cannonState?.cannon===item.cannon?cannonState.angle:cannonAngle(item.cannon);
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-a);drawImageMap(48,0,0);ctx.restore();
    }
  }
  for(const e of bonusEggs){if(!e.collected){const p=screenPoint(e);drawImageMap(208,p.x,p.y);}}
  drawFieldMessage();
  if(toastTimer>0){ctx.fillStyle='#06121dcc';ctx.fillRect(34,276,172,22);ctx.fillStyle='#fff';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(toastText,120,290);}
}
function refreshHud(){
  const total=eggs.length+enemies.length;
  status.textContent=(currentLevel.name.toUpperCase())+'  ·  '+collected+'/'+total+' EGGS';
  eggHud.textContent='FORM '+['BOUNCE','BUMPY','WOLLY'][body?.forme||0];
}
function startLevel(){
  mode=S.play;menu.hidden=true;pauseLayer.hidden=true;input.clear();lastTime=0;
  if(eventEngine){eventEngine.reset();world=eventEngine.world;refreshGeometryWorld(world);}
  spriteAnimations.clear();fieldMessage='';fieldMessageTimer=0;cameraFollowSpeed=5;cameraSnap=false;
  body.reset(spawn.x,spawn.y);body.enabled=true;body.visible=true;cannonState=null;if(gameHint)gameHint.textContent='Hold ◀ / ▶ to move · Hold JUMP to bounce · * changes form when available';body.rotation=0;body.unlockedForme=unlockedForme;body.forme=0;body.slopeCosAbs=1;
  eggs.forEach(e=>e.collected=false);bonusEggs=[];collected=0;elapsed=0;checkpointPosition={x:spawn.x,y:spawn.y};
  trampolines.forEach(t=>{t.active=false;t.progress=0;t.period=0;t.animFrame=0;t.jumpFinished=false;});
  enemies.forEach(e=>{e.x=e.initialX;e.y=e.initialY;BounceOriginalEnemies.reset(e);});
  waters.forEach(w=>{w.ripples=[];w.bubbles=[];w.ambientTimer=0;w.swimTimer=0;});playerDeathTimer=0;cameraX=body.x;cameraY=body.y+96;refreshHud();
}
let spawn={x:0,y:0};
async function loadLevel(index){
  const chosen=LEVELS[index];
  if(!chosen)throw new Error('Unknown level index '+index);
  const token=++levelLoadToken;
  const startButton=document.getElementById('start');
  const selector=document.getElementById('level-select');
  const title=document.getElementById('menu-level-name');
  const detail=document.getElementById('level-detail');
  if(startButton)startButton.disabled=true;
  if(title)title.textContent='Loading · '+chosen.name;
  if(detail)detail.textContent='Reading original RLEF level data…';
  status.textContent='LOADING '+chosen.name.toUpperCase()+'…';
  const response=await fetch('assets/original/'+chosen.resource);
  if(!response.ok)throw new Error('Could not load original level resource '+chosen.resource);
  const parsed=BounceRLEF.parse(new Uint8Array(await response.arrayBuffer()));
  if(token!==levelLoadToken)return false;
  const player=parsed.objects.find(o=>o.type==='player');
  if(!player)throw new Error(chosen.name+' has no player start record');
  currentLevel={...chosen,index,objectCount:parsed.objectCount,eventCount:parsed.eventCount};
  buildRuntime(parsed);
  spawn={x:body.x,y:body.y};
  mode=S.title;pauseLayer.hidden=true;menu.hidden=false;input.clear();lastTime=0;
  if(title)title.textContent='Level '+String(index+1).padStart(2,'0')+' · '+chosen.name;
  if(detail)detail.textContent='Original level data · '+parsed.objectCount+' objects · '+parsed.eventCount+' event scripts · preview build';
  if(selector)selector.value=String(index);
  if(startButton)startButton.disabled=false;
  refreshHud();
  status.textContent=chosen.name.toUpperCase()+' · ORIGINAL LEVEL DATA LOADED';
  return true;
}
function pauseGame(){if(mode===S.play){mode=S.pause;pauseLayer.hidden=false;input.clear();}}
function resumeGame(){if(mode===S.pause){mode=S.play;pauseLayer.hidden=true;input.clear();}}
function cycleForme(){
  if(mode!==S.play)return;
  const before=body.forme;body.cycleForme();
  if(body.forme===before)toast('Other forms unlock later');
  else{toast('Form '+(body.forme+1));}
  refreshHud();
}
function onEdge(id){
  window.dispatchEvent(new CustomEvent('bouncetales:original-key',{detail:{id}}));
  if(mode===S.play){
    if(id===5)pauseGame();
    else if(id===20)cycleForme();
    else if(id===7&&cannonState)fireCannon();
  }else if(mode===S.pause){
    if(id===7||id===1)resumeGame();
    else if(id===6){pauseLayer.hidden=true;menu.hidden=false;mode=S.title;}
  }else if(mode===S.title&&(id===7||id===1)){
    startLevel();
  }
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
  const keys=new Set();
  addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape','Backspace','q','Q','*'].includes(e.key)){
      if(e.key.startsWith('Arrow')||e.key===' ')e.preventDefault();
      const id=BounceOriginalInput.browserKeyId(e.key);
      if(id>=0&&!keys.has(e.key)){keys.add(e.key);const was=input.isHeld(id);input.press(id);if(!was)onEdge(id);}
    }
  });
  addEventListener('keyup',e=>{const id=BounceOriginalInput.browserKeyId(e.key);if(id>=0){keys.delete(e.key);input.release(id);}});
  const clearAll=()=>{keys.clear();input.clear();document.querySelectorAll('[data-key-id]').forEach(b=>b.classList.remove('pressed'));};
  addEventListener('blur',clearAll);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearAll();lastTime=0;lastRenderAt=0;fpsStamp=0;fpsFrames=0;}});
}

// Drawing follows requestAnimationFrame. Simulation consumes elapsed time like
// the original JAR (integer milliseconds, capped at 500 ms), split into small
// collision-safe chunks only when a browser frame arrives late. This is not a
// 60 Hz game clock and it does not drop the normal elapsed time.
function loop(now){
  if(!lastTime)lastTime=now;
  const requestedCap=fpsMode==='auto'?0:Number(fpsMode)||0;
  if(requestedCap){
    const frameInterval=1000/requestedCap;
    if(lastRenderAt&&now-lastRenderAt<frameInterval-1){requestAnimationFrame(loop);return;}
  }
  const elapsedMs=Math.max(0,Math.floor(now-lastTime));
  lastTime=now;lastRenderAt=now;
  if(mode===S.play){
    for(const sliceMs of BounceGameTiming.splitElapsedMilliseconds(elapsedMs))update(sliceMs/1000);
  }
  draw();
  if(showFps){fpsFrames++;if(!fpsStamp)fpsStamp=now;if(now-fpsStamp>=500){displayFps=Math.round(fpsFrames*1000/(now-fpsStamp));fpsFrames=0;fpsStamp=now;const counter=document.getElementById('fps-counter');if(counter)counter.textContent=displayFps+' FPS';}}
  requestAnimationFrame(loop);
}
function openSettings(){settingsLayer.hidden=false;}
function closeSettings(){settingsLayer.hidden=true;}
function applyFpsMode(value){fpsMode=['auto','30','60'].includes(value)?value:'auto';localStorage.setItem('bounce-fps-mode',fpsMode);lastTime=0;lastRenderAt=0;}
function resetProgress(){
  if(!confirm('Reset Bounce Tales and restart '+currentLevel.name+'?'))return;
  unlockedForme=0;closeSettings();if(mode===S.pause)pauseLayer.hidden=true;startLevel();toast('Level reset');
}
async function shareSite(){
  const shareData={title:'Bounce Tales',text:'Play Bounce Tales, an HTML5 browser remaster.',url:'https://prasannaone.github.io/BounceTales/'};
  try{if(navigator.share){await navigator.share(shareData);}else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(shareData.url);toast('Site link copied');}else{prompt('Copy the Bounce Tales link',shareData.url);}}catch(e){if(e?.name!=='AbortError')console.warn('Share unavailable',e);}
}
function bindSettings(){
  const fps=document.getElementById('fps-mode'),fpsToggle=document.getElementById('show-fps'),counter=document.getElementById('fps-counter'),full=document.getElementById('fullscreen-btn');
  fps.value=['auto','30','60'].includes(fpsMode)?fpsMode:'auto';fps.addEventListener('change',()=>applyFpsMode(fps.value));
  fpsToggle.checked=showFps;counter.hidden=!showFps;fpsToggle.addEventListener('change',()=>{showFps=fpsToggle.checked;localStorage.setItem('bounce-show-fps',String(showFps));counter.hidden=!showFps;});
  document.getElementById('open-settings').addEventListener('click',openSettings);document.getElementById('close-settings').addEventListener('click',closeSettings);
  settingsLayer.addEventListener('click',e=>{if(e.target===settingsLayer)closeSettings();});
  document.getElementById('share-site').addEventListener('click',shareSite);
  document.getElementById('reset-game').addEventListener('click',resetProgress);
  full.addEventListener('click',async()=>{try{if(!document.fullscreenElement){await document.documentElement.requestFullscreen();full.textContent='Exit fullscreen';}else{await document.exitFullscreen();full.textContent='Enter fullscreen';}}catch{toast('Fullscreen unavailable in this browser');}});
  document.addEventListener('fullscreenchange',()=>{full.textContent=document.fullscreenElement?'Exit fullscreen':'Enter fullscreen';});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!settingsLayer.hidden){closeSettings();e.stopPropagation();}});
}
async function boot(){
  try{
    const [mapResp,langResp]=await Promise.all([fetch('src/image-map.json'),fetch('assets/original/lang.xx')]);
    if(!mapResp.ok||!langResp.ok)throw new Error('Could not load original JAR image or language resources');
    imageMaps=await mapResp.json();atlases=imageMaps.atlases;
    languageStrings=BounceEventEngine.parseLanguage(new Uint8Array(await langResp.arrayBuffer()));
    await loadLevel(0);
    document.getElementById('start').addEventListener('click',startLevel);
    document.getElementById('resume').addEventListener('click',resumeGame);
    document.getElementById('back-title').addEventListener('click',()=>{pauseLayer.hidden=true;menu.hidden=false;mode=S.title;input.clear();});
    document.getElementById('restart').addEventListener('click',startLevel);
    document.getElementById('level-select').addEventListener('change',async e=>{
      try{await loadLevel(Number(e.target.value));}
      catch(error){document.getElementById('level-detail').textContent='Could not load this level: '+error.message;document.getElementById('start').disabled=true;console.error(error);}
    });
    bindInputs();bindSettings();menu.hidden=false;requestAnimationFrame(loop);
  }catch(error){
    menu.hidden=false;menu.querySelector('p').textContent='Could not load the original level data: '+error.message;
    status.textContent='RESOURCE LOAD ERROR';console.error(error);
  }
}
boot();
})();