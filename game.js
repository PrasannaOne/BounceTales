(() => {
'use strict';
const W=240,H=320,SCALE=0.660187;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const menu=document.getElementById('menu'),pauseLayer=document.getElementById('pause-layer'),settingsLayer=document.getElementById('settings-layer');
const status=document.getElementById('statusline'),eggHud=document.getElementById('egg-hud');
const input=new BounceOriginalInput.OriginalInputState();
let levelData=null,world=null,body=null,worldGeometry=[],renderObjects=[],eggs=[],enemies=[],trampolines=[],bonusEggs=[];
let atlases=[],imageMaps=null,loadedImages=new Map(),collected=0,elapsed=0,mode='title';
let eventEngine=null,playerObjectId=-1,fieldMessage='',fieldMessageTimer=0,languageStrings=[],checkpointPosition=null;
let spriteAnimations=new Map(),cameraFollowSpeed=5,cameraSnap=false;
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
  worldGeometry=[];renderObjects=[];eggs=[];enemies=[];trampolines=[];bonusEggs=[];
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
      const e={...o,object:o,x:p.x,y:p.y,initialX:p.x,initialY:p.y,matrix:m,dead:false,moveWorld:mp,state:1,propelType:1,waitTimer:2000,peekTimer:0,peekPeriod:800,vulnerable:false,rechargeTimer:0,curMovePoint:0,facingLeft:(o.movePoints?.[0]?.[0]||0)<(o.movePoints?.[1]?.[0]||0)};
      enemies.push(e);renderObjects.push({type:'enemy',enemy:e});
    }else if(o.type==='water'){
      const p=getWorldPos(o);renderObjects.push({type:'water',object:o,point:p});
    }else if(o.type==='trampoline'){
      const p=getWorldPos(o);const t={object:o,x:p.x,y:p.y,active:false,progress:0,period:0,animFrame:0,calcPush:0};trampolines.push(t);renderObjects.push({type:'trampoline',trampoline:t});
    }else if(o.type==='cannon'){
      const p=getWorldPos(o);renderObjects.push({type:'cannon',object:o,point:p});
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
function collideEnemies(){
  const r=BouncePhysics.parameters.radius[body.forme];
  for(const e of enemies){
    if(e.dead||((e.object?.runtimeFlags??e.object?.flags??0)&0x20))continue;
    const width=e.enemyType===0?50:(e.enemyType===2?100:100);
    const height=e.enemyType===0?100:(e.enemyType===2?80:50);
    const dx=body.x-e.x,dy=body.y-e.y;
    if(Math.abs(dx)<width/2+r&&dy>-r&&dy<height+r){
      if(body.vy<0&&dy>height*.62){
        e.dead=true;body.vy=Math.abs(body.vy)*.5;body.vx*=.7;
        bonusEggs.push({id:'enemy-egg-'+e.id,x:e.x,y:e.y+30,collected:false});
      }else if(e.enemyType===2){
        if(e.rechargeTimer<=0&&e.propelType===0&&e.state===0){e.state=1;e.peekTimer=0;e.peekPeriod=200;e.rechargeTimer=500;}
      }else{
        body.vx=0;body.vy=0;body.pushX=(dx<0?100:-100);
      }
    }
  }
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
  const ms=dt*1000;
  for(const e of enemies){
    if(e.dead)continue;
    if(e.rechargeTimer>0)e.rechargeTimer=Math.max(0,e.rechargeTimer-ms);
    if(e.enemyType!==2)continue;
    if(e.waitTimer>0){
      e.waitTimer-=ms;
      if(e.waitTimer<=0){
        if(e.propelType===0){e.propelType=1;e.waitTimer=2000;e.state=1;e.peekPeriod=800;}
        else{e.propelType=0;e.waitTimer=5000;e.state=2;e.peekPeriod=800;e.vulnerable=true;}
      }
    }
    if(e.state===1){
      e.peekTimer+=ms;
      if(e.peekTimer>=e.peekPeriod){
        if(e.propelType===0){e.state=2;e.peekPeriod=200;}
        e.peekTimer=e.peekPeriod;
      }
    }else if(e.state===2){
      e.peekTimer-=ms;
      if(e.peekTimer<=0){e.state=0;e.peekTimer=0;e.vulnerable=false;}
    }
    if(e.propelType===0&&e.state===0&&e.moveWorld?.length===2){
      const target=e.moveWorld[e.curMovePoint],dx=target.x-e.x,dy=target.y-e.y,dist=Math.hypot(dx,dy),step=4000*dt;
      if(dist<=step||dist===0){e.x=target.x;e.y=target.y;e.curMovePoint=1-e.curMovePoint;}
      else{e.x+=dx/dist*step;e.y+=dy/dist*step;}
      e.facingLeft=dx<0;
    }
  }
}
function updateTrampolines(dt,previousY){
  for(const t of trampolines){
    const wp=getWorldPos(t.object);t.x=wp.x;t.y=wp.y;
    if((t.object.runtimeFlags??t.object.flags??0)&0x20)continue;
    if(t.active){
      t.progress+=dt*1000;
      const count=imageMaps.maps[String(t.object.imageId)]?.frames?.length||6;
      t.animFrame=Math.min(count-1,Math.floor((count*t.progress)/t.period));
      if(t.progress>=t.period){
        t.active=false;t.progress=0;t.animFrame=0;
        body.enabled=true;body.vx=0;body.vy=t.calcPush;body.grounded=false;body.airTime=0;
      }
      continue;
    }
    const surface=t.y+95,r=BouncePhysics.parameters.radius[body.forme];
    if(body.vy<0&&Math.abs(body.x-t.x)<70+r&&previousY-r>=surface&&body.y-r<=surface){
      const incoming=Math.max(100,Math.min(1000,-body.vy));
      const basePush=(t.object.basePush*2)/100;
      t.calcPush=Math.min(incoming*basePush,400*basePush);
      t.period=((1100-incoming)>>1)+20;
      t.progress=0;t.animFrame=0;t.active=true;
      body.y=surface+r;body.vx=0;body.vy=0;body.enabled=false;body.grounded=true;
    }
  }
}
function update(dt){
  if(mode!==S.play||!body)return;
  elapsed+=dt;
  const held=input.gameHeld();
  if(held.left)body.moveLeft(false);
  if(held.right)body.moveRight(false);
  if(held.jump)body.jump(false);
  const previousPosition={x:body.x,y:body.y};
  const previousY=body.y;
  body.update(dt,SCALE);
  // Rolling orientation remains a provisional contact approximation until the
  // original swept-contact torque solver is translated in full.
  if(body.grounded)body.rotation+=body.vx*dt/20;
  updatePlayerEyes(dt);
  resolveTerrain(dt,previousPosition);
  updateTrampolines(dt,previousY);
  updateEnemies(dt);
  collectEggs();
  collideEnemies();
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
    const start=axis*Math.PI/2,end=start+Math.PI/2;
    ctx.beginPath();ctx.moveTo(cx,cy+offsetY);
    ctx.ellipse(cx,cy+offsetY,w,h,0,start,end);
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
    const start=(i*60-body.rotation*180/Math.PI)*Math.PI/180;
    ctx.fillStyle=colors[i];ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r,start,start+Math.PI/3);ctx.closePath();ctx.fill();
  }
  const center=Math.floor(r)>>2;ctx.fillStyle=colors[0];ctx.beginPath();ctx.arc(x,y,center,0,Math.PI*2);ctx.fill();
  drawImageMap(5,x,y);
}
function drawPlayer(){
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
      const peekY=(e.peekTimer*61)/Math.max(1,e.peekPeriod);
      drawImageMap(e.facingLeft?189:194,screen.x,screen.y+61-peekY);
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
      const t=item.trampoline,p=screenPoint(t);drawImageMap(t.object.imageId,p.x,p.y,new Set(),t.active?t.animFrame:0);
    }else if(item.type==='water'){
      const o=item.object,p=getWorldPos(o);
      const a=screenPoint({x:p.x+o.areaMinX,y:p.y+o.areaMinY}),b=screenPoint({x:p.x+o.areaMaxX,y:p.y+o.areaMaxY});
      ctx.fillStyle='rgba(65,166,208,.42)';ctx.fillRect(a.x,b.y,b.x-a.x,a.y-b.y);
    }else if(item.type==='friend'){
      const p=screenPoint(getWorldPos(item.object));ctx.fillStyle='#d84b44';ctx.beginPath();ctx.arc(p.x,p.y,12,0,7);ctx.fill();
    }else if(item.type==='cannon'){
      const p=screenPoint(getWorldPos(item.object));drawImageMap(342,p.x,p.y);
    }
  }
  for(const e of bonusEggs){if(!e.collected){const p=screenPoint(e);drawImageMap(208,p.x,p.y);}}
  drawFieldMessage();
  if(toastTimer>0){ctx.fillStyle='#06121dcc';ctx.fillRect(34,276,172,22);ctx.fillStyle='#fff';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(toastText,120,290);}
}
function refreshHud(){
  const total=eggs.length+enemies.length;status.textContent='MISTY MORNING  ·  '+collected+'/'+total+' EGGS';
  eggHud.textContent='FORM '+['BOUNCE','BUMPY','WOLLY'][body?.forme||0];
}
function startLevel(){
  mode=S.play;menu.hidden=true;pauseLayer.hidden=true;input.clear();lastTime=0;
  if(eventEngine){eventEngine.reset();world=eventEngine.world;refreshGeometryWorld(world);}
  spriteAnimations.clear();fieldMessage='';fieldMessageTimer=0;cameraFollowSpeed=5;cameraSnap=false;
  body.reset(spawn.x,spawn.y);body.enabled=true;body.rotation=0;body.unlockedForme=unlockedForme;body.forme=0;body.slopeCosAbs=1;
  eggs.forEach(e=>e.collected=false);bonusEggs=[];collected=0;elapsed=0;checkpointPosition={x:spawn.x,y:spawn.y};
  trampolines.forEach(t=>{t.active=false;t.progress=0;t.period=0;t.animFrame=0;});
  enemies.forEach(e=>{e.x=e.initialX;e.y=e.initialY;e.dead=false;e.state=1;e.propelType=1;e.waitTimer=2000;e.peekTimer=0;e.peekPeriod=800;e.vulnerable=false;e.rechargeTimer=0;e.curMovePoint=0;});cameraX=body.x;cameraY=body.y+96;refreshHud();
}
let spawn={x:0,y:0};
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
  if(!confirm('Reset Bounce Tales and restart Misty Morning?'))return;
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
    const [mapResp,levelResp,langResp]=await Promise.all([
      fetch('src/image-map.json'),fetch('assets/original/bf'),fetch('assets/original/lang.xx')
    ]);
    if(!mapResp.ok||!levelResp.ok||!langResp.ok)throw new Error('Could not load original JAR resources');
    imageMaps=await mapResp.json();atlases=imageMaps.atlases;
    languageStrings=BounceEventEngine.parseLanguage(new Uint8Array(await langResp.arrayBuffer()));
    const bytes=new Uint8Array(await levelResp.arrayBuffer());
    const parsed=BounceRLEF.parse(bytes);
    buildRuntime(parsed);
    spawn={x:body.x,y:body.y};
    document.getElementById('start').addEventListener('click',startLevel);
    document.getElementById('resume').addEventListener('click',resumeGame);
    document.getElementById('back-title').addEventListener('click',()=>{pauseLayer.hidden=true;menu.hidden=false;mode=S.title;});
    document.getElementById('restart').addEventListener('click',startLevel);
    bindInputs();bindSettings();menu.hidden=false;status.textContent='MISTY MORNING · ORIGINAL LEVEL DATA LOADED';requestAnimationFrame(loop);
  }catch(error){
    menu.hidden=false;menu.querySelector('p').textContent='Could not load the original first-level data: '+error.message;
    status.textContent='RESOURCE LOAD ERROR';console.error(error);
  }
}
boot();
})();