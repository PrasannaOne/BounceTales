(() => {
'use strict';
const W=240,H=320,canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const menu=document.getElementById('menu'),complete=document.getElementById('complete'),status=document.getElementById('statusline');
const saveKey='bounceTales.html.progress.v1';
let save={best:0,stars:0};try{save={...save,...JSON.parse(localStorage.getItem(saveKey)||'{}')}}catch{}
const images={};['ab.png','x.png','aa.png','j.png','p.png','q.png','v.png','w.png','ap.png'].forEach(n=>{const im=new Image();im.src='assets/original/'+n;images[n]=im});
const keys={LEFT:false,RIGHT:false,UP:false,FIRE:false};let mode='menu',camera=0,frame=0,score=0;
const originalStars=[[130,252],[300,230],[445,204],[610,230],[780,198],[950,236]];
const level={width:1040,platforms:[[0,286,230,34],[260,264,112,56],[405,238,116,82],[560,264,130,56],[735,232,110,88],[900,270,140,50],[190,230,42,12],[480,198,38,12],[670,218,40,12]],stars:[[130,252],[300,230],[445,204],[610,230],[780,198],[950,236]],goal:995,stars:originalStars.map(p=>p.slice())};
let player,particles=[];
function reset(){level.stars=originalStars.map(p=>p.slice());player={x:32,y:250,vx:0,vy:0,r:10,onGround:false,face:1,alive:true};camera=0;score=0;particles=[];frame=0;mode='play';menu.hidden=true;complete.hidden=true;status.textContent='WORLD 1 · TRAINING GROVE'}
function saveProgress(){try{localStorage.setItem(saveKey,JSON.stringify(save));document.getElementById('save-state').textContent='Progress saved · '+save.stars+' stars'}catch{}}
function input(k,down){if(k in keys)keys[k]=down;if(down&&(k==='SELECT'||k==='BACK')){if(mode==='menu')reset();else if(mode==='play'){mode='pause';menu.hidden=false;menu.querySelector('h1').textContent='Paused';menu.querySelector('p').textContent='Take a breather. Your run is waiting.';menu.querySelector('button').textContent='RESUME';}else if(mode==='pause'){mode='play';menu.hidden=true;}}if(down&&k==='SOFT_RIGHT')reset();if(down&&(k==='UP'||k==='FIRE')&&mode==='menu')reset();}
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);b.classList.add('pressed');input(k,true)});for(const t of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(t,()=>{b.classList.remove('pressed');input(k,false)});});
const map={ArrowLeft:'LEFT',ArrowRight:'RIGHT',ArrowUp:'UP',' ':'FIRE',Enter:'SELECT',Escape:'BACK',r:'SOFT_RIGHT',R:'SOFT_RIGHT'};
addEventListener('keydown',e=>{let k=map[e.key];if(k){e.preventDefault();if(!keys[k])input(k,true)}});addEventListener('keyup',e=>{let k=map[e.key];if(k){e.preventDefault();input(k,false)}});
document.getElementById('start').onclick=()=>{if(mode==='pause'){mode='play';menu.hidden=true;menu.querySelector('h1').textContent='Bounce Tales';menu.querySelector('p').textContent='Move, jump, collect the stars and reach the flag.';menu.querySelector('button').textContent='START GAME'}else reset()};
document.getElementById('again').onclick=reset;
document.getElementById('reset-save').onclick=()=>{if(confirm('Reset saved progress on this device?')){save={best:0,stars:0};saveProgress()}};
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x-camera),Math.round(y),w,h)}
function drawBackdrop(){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#162d35');g.addColorStop(.65,'#47715b');g.addColorStop(1,'#9b9b57');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(let i=0;i<8;i++){let x=((i*87-camera*.22)%340+340)%340-50;ctx.fillStyle=i%2?'#234c47':'#285b4c';ctx.beginPath();ctx.moveTo(x,240);ctx.lineTo(x+30,92+(i%3)*18);ctx.lineTo(x+72,240);ctx.fill();}
 if(images['v.png'].complete)for(let i=0;i<4;i++)ctx.drawImage(images['v.png'],((i*210-camera*.35)%500)-90,142,150,150);
}
function drawWorld(){for(const p of level.platforms){const [x,y,w,h]=p;rect(x,y,w,h,'#634b2e');rect(x,y,w,5,'#b1c85b');rect(x,y+5,w,3,'#577d35');for(let xx=x+7;xx<x+w-4;xx+=17)rect(xx,y+10,2,2,'#8a7041');}
 // exit marker
 rect(level.goal,190,4,80,'#e9e3d3');rect(level.goal+4,194,26,16,'#f1d06d');rect(level.goal+4,194,26,4,'#fff0b8');
}
function drawPlayer(){let x=player.x-camera,y=player.y;ctx.save();ctx.translate(x,y);ctx.scale(player.face,1);ctx.fillStyle='#f28a20';ctx.beginPath();ctx.ellipse(0,0,10,10,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffb83f';ctx.beginPath();ctx.ellipse(-2,-3,6,5,-.4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#272016';ctx.beginPath();ctx.arc(3,-3,1.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#305b25';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-9);ctx.quadraticCurveTo(3,-16,8,-13);ctx.stroke();ctx.restore();}
function draw(){drawBackdrop();drawWorld();for(const [x,y] of level.stars){if(x<0)continue;ctx.fillStyle='#ffe17a';ctx.beginPath();let sx=x-camera;for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,r=i%2?3:7;ctx.lineTo(sx+Math.cos(a)*r,y+Math.sin(a)*r)}ctx.closePath();ctx.fill();}
 drawPlayer();ctx.fillStyle='#fff0c9';ctx.font='bold 9px system-ui';ctx.fillText('★ '+score,8,18);ctx.fillText('BEST '+save.best,180,18);}
function update(){if(mode!=='play')return;frame++;let accel=.24;if(keys.LEFT){player.vx-=accel;player.face=-1}if(keys.RIGHT){player.vx+=accel;player.face=1}if(!keys.LEFT&&!keys.RIGHT)player.vx*=.82;player.vx=Math.max(-2.1,Math.min(2.1,player.vx));if((keys.UP||keys.FIRE)&&player.onGround){player.vy=-5.25;player.onGround=false}
 player.vy=Math.min(6,player.vy+.22);let nx=player.x+player.vx,ny=player.y+player.vy;player.onGround=false;
 for(const p of level.platforms){let [x,y,w,h]=p;if(nx+8>x&&nx-8<x+w&&ny+10>=y&&ny+10<=y+Math.max(8,player.vy+2)&&player.vy>=0){ny=y-10;player.vy=0;player.onGround=true;} }
 player.x=Math.max(8,Math.min(level.width-5,nx));player.y=ny;if(player.y>H+40){reset();return}
 level.stars=level.stars.filter(([x,y])=>{if(Math.hypot(player.x-x,player.y-y)<17){score++;save.stars=Math.max(save.stars,score);saveProgress();return false}return true});
 camera=Math.max(0,Math.min(level.width-W,player.x-90));if(player.x>=level.goal){mode='complete';complete.hidden=false;document.getElementById('result').textContent=`You collected ${score} star${score===1?'':'s'} on this run.`;save.best=Math.max(save.best,score);saveProgress();}
}
function loop(){update();draw();requestAnimationFrame(loop)}reset();mode='menu';menu.hidden=false;requestAnimationFrame(loop);
})();