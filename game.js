(() => {
'use strict';
const W=240,H=320,SCALE=0.660187;
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const menu=document.getElementById('menu'),pauseLayer=document.getElementById('pause-layer');
const status=document.getElementById('statusline'),eggHud=document.getElementById('egg-hud');
const input=new BounceOriginalInput.OriginalInputState();
let levelData=null,world=null,body=null,worldGeometry=[],renderObjects=[],eggs=[],enemies=[],trampolines=[],bonusEggs=[];
let atlases=[],imageMaps=null,loadedImages=new Map(),collected=0,elapsed=0,mode='title';
let lastTime=0,cameraX=0,cameraY=0,unlockedForme=0,toastTimer=0,toastText='';
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
  const m=world.get(o.id);return m;
}
function buildRuntime(parsed){
  world=BounceRLEF.buildWorld(parsed.objects);
  levelData=parsed;
  const player=parsed.objects.find(o=>o.type==='player');
  if(!player)throw new Error('The first level has no player start record');
  const spawn=getWorldPos(player);
  body=new BouncePhysics.BounceBody(spawn.x,spawn.y,unlockedForme);
  body.slopeCosAbs=1;
  worldGeometry=[];renderObjects=[];eggs=[];enemies=[];trampolines=[];bonusEggs=[];
  for(const o of parsed.objects){
    if(o.type==='geometry'){
      const m=transformObject(o);
      const verts=o.vertices.map(v=>fixedPoint(m,v[0],v[1]));
      const area=verts.slice(0,-1).reduce((a,p,i)=>a+p.x*verts[i+1].y-verts[i+1].x*p.y,0)/2;
      const nocollide=(o.flags&0x20)!==0;
      const poly={id:o.id,vertices:verts,faces:o.faces,color:o.color,area,nocollide};
      worldGeometry.push(poly);renderObjects.push({type:'geometry',object:o,poly});
    }else if(o.type==='sprite'){
      const m=transformObject(o);renderObjects.push({type:'sprite',object:o,matrix:m});
    }else if(o.type==='egg'){
      const p=getWorldPos(o);eggs.push({id:o.id,x:p.x,y:p.y,collected:false});renderObjects.push({type:'egg',object:o,point:p});
    }else if(o.type==='enemy'){
      const p=getWorldPos(o);const m=transformObject(o);
      const parentM=o.parent>=0?(world.get(o.parent)||[65536,0,0,0,65536,0]):[65536,0,0,0,65536,0];
      const localX=o.matrix[2]/65536,localY=o.matrix[5]/65536;
      const mp=(o.movePoints||[[0,0],[0,0]]).map(q=>fixedPoint(parentM,localX+q[0],localY+q[1]));
      const e={...o,x:p.x,y:p.y,initialX:p.x,initialY:p.y,matrix:m,dead:false,moveWorld:mp,state:1,propelType:1,waitTimer:2000,peekTimer:0,peekPeriod:800,vulnerable:false,rechargeTimer:0,curMovePoint:0,facingLeft:(o.movePoints?.[0]?.[0]||0)<(o.movePoints?.[1]?.[0]||0)};
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
  cameraX=body.x;cameraY=body.y+96;
  refreshHud();
}
function screenPoint(p){return {x:W/2+(p.x-cameraX)*SCALE,y:H/2-(p.y-cameraY)*SCALE};}
function insidePolygon(x,y,poly){
  let inside=false,vs=poly.vertices;
  for(let i=0,j=vs.length-2;i<vs.length-1;j=i++){
    const a=vs[i],b=vs[j];
    if(((a.y>y)!==(b.y>y))&&(x<(b.x-a.x)*(y-a.y)/(b.y-a.y+1e-12)+a.x))inside=!inside;
  }
  return inside;
}
function resolveTerrain(dt){
  const r=BouncePhysics.parameters.radius[body.forme];
  for(let pass=0;pass<3;pass++){
    let best=null;
    for(const poly of worldGeometry){
      if(poly.nocollide||poly.vertices.length<3)continue;
      const vs=poly.vertices,area=poly.area;
      for(let i=0;i<vs.length-1;i++){
        const a=vs[i],b=vs[i+1],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
        if(len2<1e-6)continue;
        const t=Math.max(0,Math.min(1,((body.x-a.x)*dx+(body.y-a.y)*dy)/len2));
        const qx=a.x+t*dx,qy=a.y+t*dy;
        const d2=(body.x-qx)**2+(body.y-qy)**2;
        if(d2>(r+2)**2)continue;
        const len=Math.sqrt(len2);
        // RLEF contours are ordered. This selects the polygon's outward normal.
        const nx=(area<0?-dy:dy)/len,ny=(area<0?dx:-dx)/len;
        const signed=(body.x-qx)*nx+(body.y-qy)*ny;
        if(signed>=r)continue;
        const approaching=body.vx*nx+body.vy*ny<0;
        if(signed>0&&!approaching)continue;
        const penetration=r-signed;
        if(!best||penetration>best.penetration)best={nx,ny,penetration};
      }
    }
    if(!best)break;
    body.x+=best.nx*best.penetration;body.y+=best.ny*best.penetration;
    body.land(best.nx,best.ny,dt);
  }
}
function collectEggs(){
  for(const e of eggs.concat(bonusEggs)){
    if(e.collected)continue;
    const dx=body.x-e.x,dy=body.y-e.y;
    if(dx*dx+dy*dy<2025){e.collected=true;collected++;}
  }
  refreshHud();
}
function collideEnemies(){
  const r=BouncePhysics.parameters.radius[body.forme];
  for(const e of enemies){
    if(e.dead)continue;
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
  const previousY=body.y;
  body.update(dt);
  body.rotation+=body.vx*dt/20;
  resolveTerrain(dt);
  updateTrampolines(dt,previousY);
  updateEnemies(dt);
  collectEggs();
  collideEnemies();
  const targetX=body.x,targetY=body.y+96;
  cameraX+=(targetX-cameraX)*Math.min(1,dt*5);
  cameraY+=(targetY-cameraY)*Math.min(1,dt*5);
  if(toastTimer>0)toastTimer-=dt;
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
  for(const s of o.sprites||[]){
    const p=fixedPoint(m,s[0],s[1]),screen=screenPoint(p);
    drawImageMap(s[2],screen.x,screen.y,new Set(),Math.floor(elapsed*6));
  }
}
function drawPlayer(){
  const p=screenPoint(body),r=21*SCALE;
  ctx.save();
  ctx.translate(p.x,p.y);
  ctx.rotate(body.rotation);
  const g=ctx.createRadialGradient(-r*.34,-r*.42,1,r*.12,r*.14,r*1.18);
  g.addColorStop(0,'#ff534d');g.addColorStop(.45,'#ed1c24');g.addColorStop(1,'#af1100');
  ctx.fillStyle='#100d0a';ctx.beginPath();ctx.arc(0,0,r+1.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#af1100';ctx.beginPath();ctx.ellipse(0,r*.18,r*.88,r*.74,0,0,Math.PI);ctx.fill();
  ctx.fillStyle='#ed1c24';ctx.beginPath();ctx.ellipse(r*.04,-r*.08,r*.88,r*.75,-.08,Math.PI,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffffffb8';ctx.beginPath();ctx.ellipse(-r*.28,-r*.45,r*.22,r*.10,-.35,0,Math.PI*2);ctx.fill();
  ctx.restore();
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
function draw(){
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#73b8df');bg.addColorStop(.7,'#b7d9e0');bg.addColorStop(1,'#dce4d1');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // Draw order follows level-record order so terrain, scenery, eggs and actors retain scene layering.
  for(const item of renderObjects){
    if(item.type==='geometry')drawGeometry(item.poly);
    else if(item.type==='sprite')drawSprite(item.object,item.matrix);
    else if(item.type==='egg'){
      const p=screenPoint(item.point);const e=eggs.find(x=>x.id===item.object.id);
      if(e&&!e.collected)drawImageMap(208,p.x,p.y);
    }else if(item.type==='enemy'){
      if(!item.enemy.dead)drawEnemy(item.enemy);
    }else if(item.type==='trampoline'){
      const t=item.trampoline,p=screenPoint(t);drawImageMap(t.object.imageId,p.x,p.y,new Set(),t.active?t.animFrame:0);
    }else if(item.type==='water'){
      const o=item.object,p=item.point;
      const a=screenPoint({x:p.x+o.areaMinX,y:p.y+o.areaMinY}),b=screenPoint({x:p.x+o.areaMaxX,y:p.y+o.areaMaxY});
      ctx.fillStyle='rgba(65,166,208,.42)';ctx.fillRect(a.x,b.y,b.x-a.x,a.y-b.y);
    }else if(item.type==='friend'){
      const p=screenPoint(item.point);ctx.fillStyle='#d84b44';ctx.beginPath();ctx.arc(p.x,p.y,12,0,7);ctx.fill();
    }else if(item.type==='cannon'){
      const p=screenPoint(item.point);drawImageMap(342,p.x,p.y);
    }
  }
  for(const e of bonusEggs){if(!e.collected){const p=screenPoint(e);drawImageMap(208,p.x,p.y);}}
  if(body)drawPlayer();
  if(toastTimer>0){ctx.fillStyle='#06121dcc';ctx.fillRect(34,276,172,22);ctx.fillStyle='#fff';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(toastText,120,290);}
}
function refreshHud(){
  const total=eggs.length+enemies.length;status.textContent='MISTY MORNING  ·  '+collected+'/'+total+' EGGS';
  eggHud.textContent='FORM '+['BOUNCE','BUMPY','WOLLY'][body?.forme||0];
}
function startLevel(){
  mode=S.play;menu.hidden=true;pauseLayer.hidden=true;input.clear();
  body.reset(spawn.x,spawn.y);body.enabled=true;body.rotation=0;body.unlockedForme=unlockedForme;body.forme=0;body.slopeCosAbs=1;
  eggs.forEach(e=>e.collected=false);bonusEggs=[];collected=0;elapsed=0;
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
    const id=Number(btn.dataset.keyId);
    btn.addEventListener('contextmenu',e=>e.preventDefault());
    btn.addEventListener('pointerdown',e=>{e.preventDefault();btn.setPointerCapture?.(e.pointerId);btn.classList.add('pressed');const was=input.isHeld(id);input.press(id);if(!was)onEdge(id);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(event,()=>{btn.classList.remove('pressed');input.release(id);});
  });
  const keys=new Set();
  addEventListener('keydown',e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape','Backspace','q','Q','*','#'].includes(e.key)){
      if(e.key.startsWith('Arrow')||e.key===' ')e.preventDefault();
      const id=BounceOriginalInput.browserKeyId(e.key);
      if(id>=0&&!keys.has(e.key)){keys.add(e.key);const was=input.isHeld(id);input.press(id);if(!was)onEdge(id);}
    }
  });
  addEventListener('keyup',e=>{const id=BounceOriginalInput.browserKeyId(e.key);if(id>=0){keys.delete(e.key);input.release(id);}});
  addEventListener('blur',()=>{keys.clear();input.clear();});
}
function loop(now){
  if(!lastTime)lastTime=now;
  const dt=Math.min(.05,Math.max(0,(now-lastTime)/1000));lastTime=now;
  update(dt);draw();requestAnimationFrame(loop);
}
async function boot(){
  try{
    const [mapResp,levelResp]=await Promise.all([
      fetch('src/image-map.json'),fetch('assets/original/bf')
    ]);
    if(!mapResp.ok||!levelResp.ok)throw new Error('Could not load original JAR resources');
    imageMaps=await mapResp.json();atlases=imageMaps.atlases;
    const bytes=new Uint8Array(await levelResp.arrayBuffer());
    const parsed=BounceRLEF.parse(bytes);
    buildRuntime(parsed);
    spawn={x:body.x,y:body.y};
    document.getElementById('start').addEventListener('click',startLevel);
    document.getElementById('resume').addEventListener('click',resumeGame);
    document.getElementById('back-title').addEventListener('click',()=>{pauseLayer.hidden=true;menu.hidden=false;mode=S.title;});
    document.getElementById('restart').addEventListener('click',startLevel);
    bindInputs();menu.hidden=false;status.textContent='MISTY MORNING · ORIGINAL LEVEL DATA LOADED';requestAnimationFrame(loop);
  }catch(error){
    menu.hidden=false;menu.querySelector('p').textContent='Could not load the original first-level data: '+error.message;
    status.textContent='RESOURCE LOAD ERROR';console.error(error);
  }
}
boot();
})();