const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const listeners=new Map(),raf=[];const noop=()=>{};const gradient={addColorStop:noop};
const ctx2d=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,measureText:()=>({width:0})},{get(t,k){return k in t?t[k]:noop;},set(t,k,v){t[k]=v;return true;}});
function element(id){const handlers={};return {id,hidden:false,disabled:false,textContent:'',value:'',checked:false,dataset:{},style:{setProperty:noop,removeProperty:noop},classList:{add:noop,remove:noop,toggle:noop},setAttribute:noop,focus:noop,width:160,height:104,addEventListener(n,f){(handlers[n]??=[]).push(f);},fire(n,event={}){for(const f of handlers[n]||[])f(event);},getContext:()=>ctx2d,getBoundingClientRect:()=>({left:0,top:0,width:id==='game-controls'?320:240,height:id==='game-controls'?320*140/360:320}),setPointerCapture:noop,handlers};}
const ids=['app','game-controls','game-text','settings-game-tab','settings-about-tab','settings-game-pane','settings-about-pane','keyboard-hint','game','level-cover','menu','level-screen','pause-layer','complete-layer','guide-layer','settings-layer','control-editor-layer','control-editor-live-hint','open-control-editor','close-control-editor','cancel-control-editor','save-control-layout','reset-control-layout','control-size','control-size-value','statusline','egg-hud','fps-counter','pause-mini','continue-game','open-chapters','open-guide','level-prev','level-next','level-position','level-name','level-chapter','level-record','level-lock','play-level','back-title','resume','restart','pause-chapters','complete-title','complete-eggs','complete-stats','next-level','result-chapters','guide-back','fps-mode','smooth-motion','show-fps','fullscreen-btn','open-settings','close-settings','share-site','reset-game','game-hint','music-enabled'];
const els=Object.fromEntries(ids.map(id=>[id,element(id)]));
els.game.getContext=()=>ctx2d;
const controls=['left','right','jump','star'].map((name,i)=>{const b=element(name);b.dataset.keyId=[3,4,7,20][i];b.closest=selector=>selector.includes('data-key-id')?b:null;return b;});
els['game-controls'].querySelectorAll=()=>controls;
const pickerButtons=['left','right','jump','form'].map(name=>{const b=element('pick-'+name);b.dataset.pickControl=name;return b;});
els['control-size'].value='100';
const records=Array.from({length:15},()=>({eggs:0,clearTime:9999,score:0,globalScore:0}));
let storageValue=JSON.stringify({version:1,records,selected:0,totalGameTime:0});
const prefStore=new Map();
const storage={getItem:k=>k==='bounce-tales-original-save-v1'?storageValue:(prefStore.get(k)??null),setItem:(k,v)=>{if(k==='bounce-tales-original-save-v1')storageValue=v;else prefStore.set(k,String(v));},removeItem:k=>{if(k==='bounce-tales-original-save-v1')storageValue=null;else prefStore.delete(k);}};
els['settings-game-tab'].dataset.settingsTab='game';els['settings-about-tab'].dataset.settingsTab='about';
const tabs=[els['settings-game-tab'],els['settings-about-tab']];
const document={hidden:false,fullscreenElement:null,activeElement:null,documentElement:{requestFullscreen:async()=>{document.fullscreenElement=document.documentElement;}},getElementById:id=>els[id]||element(id),querySelector:selector=>selector.includes('about')?els['settings-about-tab']:els['settings-game-tab'],querySelectorAll:selector=>selector==='[data-settings-tab]'?tabs:selector==='[data-pick-control]'?pickerButtons:controls,addEventListener(n,f){(listeners.get('document:'+n)||listeners.set('document:'+n,[]).get('document:'+n)).push(f);}};
const sandbox={document,window:null,console:{error:e=>{throw e;},warn:noop,log:noop},addEventListener(n,f){(listeners.get(n)||listeners.set(n,[]).get(n)).push(f);},requestAnimationFrame:f=>raf.push(f),CustomEvent:function(type,init){this.type=type;this.detail=init?.detail;},localStorage:storage,navigator:{},confirm:()=>true,prompt:noop,dispatchEvent:noop,TextDecoder,TextEncoder,Image:class{constructor(){this.complete=true;this.naturalWidth=1;this.naturalHeight=1;}set src(v){this._src=v;}},fetch:async url=>{const bytes=fs.readFileSync(path.join(root,url));return {ok:true,json:async()=>JSON.parse(bytes.toString('utf8')),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}};
sandbox.Element=class Element{};sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['src/fixed-point.js','src/original-input-map.js','src/original-camera.js','src/rlef-reader.js','src/bounce-physics.js','src/terrain-collision.js','src/original-collision.js','src/game-timing.js','src/event-engine.js','src/original-sprite-animation.js','src/original-enemies.js','src/original-water.js','src/original-trampoline.js','src/midp-graphics.js','src/original-progression.js','src/game-particles.js','src/sprite-atlas.js','src/audio-controller.js','src/control-layout.js','src/original-hud.js','game.js']){
  let source=fs.readFileSync(path.join(root,file),'utf8');
  if(file==='game.js') source=source.replace('boot();',`window.__btTest={get mode(){return mode;},get body(){return body;},get currentLevel(){return currentLevel;},get eventEngine(){return eventEngine;},get enemies(){return enemies;},get eggs(){return eggs;},get trampolines(){return trampolines;},get waters(){return waters;},input,loadLevel,startLevel,update,onEdge,beginVictory,completeCurrentChapter};boot();`);
  vm.runInContext(source,sandbox,{filename:file});
}
const wait=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  await wait();await wait();
  assert.match(els.statusline.textContent,/ORIGINAL LEVEL DATA LOADED/);
  assert.equal(els.menu.hidden,false,'boot should land on the in-game title scene');
  assert.equal(els['pause-mini'].hidden,true,'pause control is hidden outside gameplay');
  assert.equal(els['fps-mode'].value,'auto','FPS pacing defaults to Auto');
  assert.equal(els['smooth-motion'].checked,false,'smooth motion defaults OFF for discrete JAR-style rendering');
  assert.equal(raf.length,1,'boot should start the animation loop');
  assert.equal(els['level-select'],undefined,'no external HTML dropdown selector');
  assert.equal(els.app.dataset.mode,'title','scene chrome starts in title mode');
  els['open-settings'].fire('click');
  assert.equal(els['settings-layer'].hidden,false,'options dialog opens');
  els['smooth-motion'].checked=true;els['smooth-motion'].fire('change');
  assert.equal(prefStore.get('bounce-smooth-motion'),'true','Smooth Motion ON persists independently');
  els['fps-mode'].value='120';els['fps-mode'].fire('change');
  assert.equal(prefStore.get('bounce-fps-mode'),'120','120 FPS display cap preference persists');
  els['smooth-motion'].checked=false;els['smooth-motion'].fire('change');
  assert.equal(prefStore.get('bounce-smooth-motion'),'false','Smooth Motion can be returned to discrete mode');
  els['settings-about-tab'].fire('click');
  assert.equal(els['settings-game-pane'].hidden,true,'About tab switches without scrolling');
  assert.equal(els['settings-about-pane'].hidden,false,'About tab is directly displayed');
  els['close-settings'].fire('click');
  // Exercise the custom touch-control editor, drag/resize path, local save and reset.
  els['open-settings'].fire('click');els['open-control-editor'].fire('click');
  assert.equal(els['control-editor-layer'].hidden,false,'touch control editor opens from Settings');
  els['game-controls'].fire('pointerdown',{target:controls[0],pointerId:7,clientX:20,clientY:20,preventDefault:noop,stopPropagation:noop,stopImmediatePropagation:noop});
  els['game-controls'].fire('pointermove',{target:controls[0],pointerId:7,clientX:52,clientY:42,preventDefault:noop,stopPropagation:noop});
  els['game-controls'].fire('pointerup',{pointerId:7,stopPropagation:noop});
  els['control-size'].fire('input',{target:{value:'120'}});
  els['save-control-layout'].fire('click');
  const customLayout=JSON.parse(prefStore.get('bounce-control-layout-v1'));
  assert.equal(customLayout.left.size,120,'selected control size can be changed');
  assert.ok(customLayout.left.x>0&&customLayout.left.y>0,'dragging changes the selected control position');
  assert.equal(els['control-editor-layer'].hidden,true,'Save closes the editor');
  els['open-control-editor'].fire('click');
  els['game-controls'].fire('pointerdown',{target:controls[0],pointerId:8,clientX:20,clientY:20,preventDefault:noop,stopPropagation:noop,stopImmediatePropagation:noop});
  els['reset-control-layout'].fire('click');els['save-control-layout'].fire('click');
  assert.equal(prefStore.has('bounce-control-layout-v1'),false,'Reset restores the original CSS control layout');
  els['close-settings'].fire('click');
  const key=(name,kind)=>{for(const fn of listeners.get(kind)||[])fn({key:name,target:null,preventDefault:noop,stopPropagation:noop});};
  key('Enter','keydown');assert.equal(els.app.dataset.mode,'play','PC Enter starts the adventure');key('Enter','keyup');
  key('Escape','keydown');assert.equal(els.app.dataset.mode,'pause','PC Escape opens pause');key('Escape','keyup');
  key('Escape','keydown');assert.equal(els.app.dataset.mode,'play','PC Escape resumes from pause');key('Escape','keyup');
  els['open-chapters'].fire('click');
  assert.equal(els['level-screen'].hidden,false,'chapter book opens inside the game viewport');
  els['level-next'].fire('click');
  assert.equal(JSON.parse(storageValue).selected,0,'browsing the book must not overwrite Continue progress');
  els['level-prev'].fire('click');
  let now=1000;
  const stageNames=['Misty Morning','Unfriendly Friends','Seeking Answers','Bumpy Cracks','Secret Stalkway','Into the Mines','A Gloomy Path','Rumbling Sounds','Trapped in Machine','Tunnel of Treasures','Wicked Circus','Hunting Colours','Almost There','Final Ride','Fantastic Fair'];
  const tick=frames=>{for(let i=0;i<frames;i++){const next=raf.shift();assert.equal(typeof next,'function');next(now);now+=1000/60;}};
  for(let i=0;i<stageNames.length;i++){
    if(i>0)els['level-next'].fire('click');
    assert.equal(els['level-position'].textContent,String(i+1).padStart(2,'0')+' / 15');
    assert.match(els['level-name'].textContent,new RegExp(stageNames[i].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),'chapter title');
    els['play-level'].fire('click');await wait();await wait();
    assert.equal(els['pause-mini'].hidden,false,'gameplay pause control visible for '+stageNames[i]);
    tick(4);
    els['pause-mini'].fire('click');
    assert.equal(els['pause-layer'].hidden,false,'pause screen opens in-game');
    els['pause-chapters'].fire('click');
    assert.equal(els['level-screen'].hidden,false,'chapter book returns from pause');
  }

  // End-to-end live update loop: actual game.js update() runs against every decoded campaign scene.
  const dbg=sandbox.__btTest;
  const liveSummary=[];
  for(let levelIndex=0;levelIndex<15;levelIndex++){
    await dbg.loadLevel(levelIndex,{start:true});
    const start={x:dbg.body.x,y:dbg.body.y};
    let moved=false, maxAbsSpeed=0, deathResets=0, priorDeath=0;
    for(let frame=0;frame<720;frame++){
      const phase=frame%240;
      dbg.input.clear();
      if(phase<90)dbg.input.press(4);
      else if(phase<180)dbg.input.press(3);
      if(phase%80<28)dbg.input.press(7);
      if(phase===0)dbg.onEdge(20);
      const ms=(frame%3===0)?17:16;
      dbg.update(1/60,ms);
      const b=dbg.body;
      assert.ok(Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isFinite(b.vx)&&Number.isFinite(b.vy),
        `level ${levelIndex+1} body remains finite at frame ${frame}`);
      assert.ok(Math.abs(b.x)<1e7&&Math.abs(b.y)<1e7,`level ${levelIndex+1} body remains bounded`);
      maxAbsSpeed=Math.max(maxAbsSpeed,Math.hypot(b.vx,b.vy));
      if(Math.abs(b.x-start.x)>1||Math.abs(b.y-start.y)>1)moved=true;
      assert.ok(dbg.eventEngine.unsupported.size===0,`level ${levelIndex+1} has no unsupported event opcodes`);
      for(const enemy of dbg.enemies){
        assert.ok(Number.isFinite(enemy.x)&&Number.isFinite(enemy.y),`level ${levelIndex+1} enemy ${enemy.id} finite`);
      }
      if(priorDeath>0&&sandbox.__btTest.body.enabled)deathResets++;
      priorDeath=0;
    }
    assert.ok(moved,`level ${levelIndex+1} real input/update loop moves Bounce`);
    liveSummary.push({level:levelIndex+1,moved,maxAbsSpeed:+maxAbsSpeed.toFixed(1),enemies:dbg.enemies.length,
      eggs:dbg.eggs.length,events:dbg.eventEngine.events.length,commands:dbg.eventEngine.executed});
  }

  assert.ok(raf.length>=1,'game loop keeps scheduling frames');
  document.hidden=true;for(const fn of listeners.get('document:visibilitychange')||[])fn();
  console.log('Live campaign audit summary:',JSON.stringify(liveSummary));
  console.log('Runtime + live-loop audit: all 15 stages booted and ran 720 live simulation/input frames with finite player/enemy state and no unsupported event opcodes');
})().catch(err=>{console.error(err);process.exitCode=1;});
