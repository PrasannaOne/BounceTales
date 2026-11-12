const assert=require('node:assert/strict');
const {AudioController,resourceForLevel,RESOURCE_FILES}=require('../src/audio-controller.js');
assert.equal(RESOURCE_FILES[28],'title.ogg');
assert.deepEqual([0,1,2,3,4,5,8,9,10,13,14].map(resourceForLevel),[29,29,29,32,35,30,32,35,31,32,35]);
class FakeAudio{
  constructor(src){this.src=src;this.loop=false;this.volume=0;this.paused=true;this.listeners={};this.playCount=0;}
  play(){this.paused=false;this.playCount++;return Promise.resolve();}
  pause(){this.paused=true;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  end(){this.listeners.ended?.();}
}
const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
const music=new AudioController({AudioClass:FakeAudio,storage,basePath:'/audio/'});
assert.equal(music.enabled,true);
assert.equal(music.playTitle(),true);
assert.equal(music.currentAudio.src,'/audio/title.ogg');
assert.equal(music.currentAudio.loop,true);
assert.equal(music.playLevel(4),true);
assert.equal(music.currentAudio.src,'/audio/bonus.ogg');
assert.equal(music.currentAudio.paused,false);
assert.equal(music.playCue(33),true);
const cue=music.currentAudio;
assert.equal(cue.src,'/audio/lose.ogg');assert.equal(cue.loop,false);
cue.end();assert.equal(music.currentAudio,null);
assert.equal(music.playLevel(3),true);
assert.equal(music.currentAudio.src,'/audio/boss.ogg');
music.setEnabled(false);assert.equal(store.get('bounce-music-enabled'),'false');
assert.equal(music.currentAudio,null);
assert.equal(music.playTitle(),false);
music.setEnabled(true);assert.equal(music.currentAudio.src,'/audio/boss.ogg');
music.playCue(34);assert.equal(music.currentAudio.src,'/audio/win.ogg');
music.dispose();assert.equal(music.currentAudio,null);
console.log('V18 soundtrack: title, act, boss, bonus, lose and win resource routing, loop/cue behaviour and music setting verified');
