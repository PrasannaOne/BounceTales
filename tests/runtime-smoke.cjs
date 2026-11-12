const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const listeners=new Map();
const raf=[];
const noop=()=>{};
const gradient={addColorStop:noop};
const ctx2d=new Proxy({
  createLinearGradient:()=>gradient,
  createRadialGradient:()=>gradient,
  measureText:()=>({width:0})
},{get(target,key){return key in target?target[key]:noop;},set(target,key,value){target[key]=value;return true;}});
function element(id){
  const handlers={};
  return {
    id,hidden:false,textContent:'',dataset:{keyId:id==='left'?3:id==='right'?4:id==='jump'?7:id==='star'?20:5},
    style:{},classList:{add:noop,remove:noop},
    addEventListener(name,fn){(handlers[name]??=[]).push(fn);},
    fire(name,event={}){for(const fn of handlers[name]||[])fn(event);},
    setPointerCapture:noop,
    querySelector(){return paragraph;},
    handlers
  };
}
const paragraph=element('menu-paragraph');
const ids=['game','menu','pause-layer','settings-layer','statusline','egg-hud','fps-counter','start','resume','restart','back-title','fps-mode','show-fps','fullscreen-btn','open-settings','close-settings','share-site','reset-game'];
const els=Object.fromEntries(ids.map(id=>[id,element(id)]));
els.game.getContext=()=>ctx2d;
const buttons=['left','right','jump','star','pause'].map(element);
const document={
  hidden:false,fullscreenElement:null,documentElement:{requestFullscreen:async()=>{document.fullscreenElement=document.documentElement;}},exitFullscreen:async()=>{document.fullscreenElement=null;},
  getElementById:id=>els[id],
  querySelectorAll:()=>buttons,
  addEventListener:(name,fn)=>{(listeners.get('document:'+name)||listeners.set('document:'+name,[]).get('document:'+name)).push(fn);}
};
const sandbox={
  document,window:null,console:{error:err=>{throw err;},log:noop},
  addEventListener:(name,fn)=>{(listeners.get(name)||listeners.set(name,[]).get(name)).push(fn);},
  requestAnimationFrame:fn=>raf.push(fn),
  CustomEvent:function(type,init){this.type=type;this.detail=init?.detail;},
  localStorage:{getItem:key=>key==='bounce-fps-mode'?'120':null,setItem:noop},navigator:{},confirm:()=>true,prompt:noop,
  dispatchEvent:noop,
  TextDecoder,TextEncoder,Image:class{constructor(){this.complete=true;this.naturalWidth=1;this.naturalHeight=1;}set src(v){this._src=v;}},
  fetch:async url=>{
    const bytes=fs.readFileSync(path.join(root,url));
    return {ok:true,json:async()=>JSON.parse(bytes.toString('utf8')),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
  }
};
sandbox.window=sandbox;
vm.createContext(sandbox);
for(const file of ['src/original-input-map.js','src/rlef-reader.js','src/bounce-physics.js','src/terrain-collision.js','src/game-timing.js','src/event-engine.js','src/original-sprite-animation.js','game.js']){
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});
}
(async()=>{
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(els.statusline.textContent,/ORIGINAL LEVEL DATA LOADED/);
  assert.equal(els['fps-mode'].value,'auto','outdated 90/120 FPS preferences should safely fall back to Auto');
  assert.equal(raf.length,1,'boot should start the animation loop');
  els.start.fire('click');
  let now=1000;
  for(let i=0;i<12;i++){
    const next=raf.shift();assert.equal(typeof next,'function');
    next(now);now+=1000/60;
  }
  assert.ok(raf.length>=1,'game loop should continue scheduling frames');
  document.hidden=true;for(const fn of listeners.get('document:visibilitychange')||[])fn();
  assert.equal(typeof listeners.get('document:visibilitychange')?.[0],'function','visibility handler should remain available');
  console.log('Runtime smoke: original level and event engine booted, Start activated, display-driven loop ran and visibility reset did not throw');
})().catch(err=>{console.error(err);process.exitCode=1;});
