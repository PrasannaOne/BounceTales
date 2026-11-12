(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.BounceAudioController=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const RESOURCE_FILES=Object.freeze({
    28:'title.ogg',29:'act1.ogg',30:'act2.ogg',31:'act3.ogg',
    32:'boss.ogg',33:'lose.ogg',34:'win.ogg',35:'bonus.ogg'
  });
  function resourceForLevel(index){
    if([4,9,14].includes(index))return 35;
    if([3,8,13].includes(index))return 32;
    if(index<=4)return 29;
    if(index<=9)return 30;
    return 31;
  }
  class AudioController{
    constructor(options={}){
      this.basePath=options.basePath||'assets/audio/';
      this.AudioClass=options.AudioClass||null;
      this.storage=options.storage||(typeof localStorage!=='undefined'?localStorage:null);
      this.enabled=options.enabled!==undefined?!!options.enabled:this.readEnabled();
      this.volume=options.volume===undefined?0.72:Math.max(0,Math.min(1,options.volume));
      this.currentAudio=null;this.currentResource=null;this.lastMusicResource=null;
      this.unlocked=false;this.disposed=false;
    }
    readEnabled(){
      try{return !this.storage||this.storage.getItem('bounce-music-enabled')!=='false';}
      catch{return true;}
    }
    create(resource,loop){
      const Ctor=this.AudioClass||(typeof globalThis!=='undefined'?globalThis.Audio:null);
      if(typeof Ctor!=='function')return null;
      const file=RESOURCE_FILES[resource];if(!file)return null;
      const audio=new Ctor(this.basePath+file);
      audio.preload='auto';audio.loop=!!loop;audio.volume=this.volume;
      return audio;
    }
    stopCurrent(){
      const old=this.currentAudio;
      this.currentAudio=null;this.currentResource=null;
      if(old){try{old.pause();old.currentTime=0;}catch{}}
    }
    start(resource,loop){
      if(!this.enabled||this.disposed)return false;
      const audio=this.create(resource,loop);if(!audio)return false;
      this.stopCurrent();this.currentAudio=audio;this.currentResource=resource;
      try{
        const result=audio.play();
        if(result&&typeof result.catch==='function')result.catch(()=>{});
      }catch{}
      return true;
    }
    playMusic(resource){
      if(!RESOURCE_FILES[resource]||!this.enabled)return false;
      this.lastMusicResource=resource;
      return this.start(resource,true);
    }
    playTitle(){return this.playMusic(28);}
    playLevel(levelIndex){return this.playMusic(resourceForLevel(levelIndex));}
    playCue(resource){
      if(![33,34].includes(resource)||!this.enabled)return false;
      const audio=this.create(resource,false);if(!audio)return false;
      this.stopCurrent();this.currentAudio=audio;this.currentResource=resource;
      const clear=()=>{
        if(this.currentAudio===audio){this.currentAudio=null;this.currentResource=null;}
      };
      if(typeof audio.addEventListener==='function')audio.addEventListener('ended',clear,{once:true});
      else audio.onended=clear;
      try{
        const result=audio.play();
        if(result&&typeof result.catch==='function')result.catch(()=>{});
      }catch{}
      return true;
    }
    unlock(){
      this.unlocked=true;
      if(!this.enabled)return false;
      if(this.currentAudio){
        try{
          const result=this.currentAudio.play();
          if(result&&typeof result.catch==='function')result.catch(()=>{});
          return true;
        }catch{return false;}
      }
      if(this.lastMusicResource)return this.playMusic(this.lastMusicResource);
      return false;
    }
    pause(){
      if(this.currentAudio){try{this.currentAudio.pause();}catch{}}
    }
    resume(){
      if(!this.enabled)return false;
      if(this.currentAudio){
        try{
          const result=this.currentAudio.play();
          if(result&&typeof result.catch==='function')result.catch(()=>{});
          return true;
        }catch{return false;}
      }
      return this.lastMusicResource?this.playMusic(this.lastMusicResource):false;
    }
    setEnabled(enabled){
      this.enabled=!!enabled;
      try{this.storage?.setItem('bounce-music-enabled',String(this.enabled));}catch{}
      if(!this.enabled)this.stopCurrent();
      else this.resume();
      return this.enabled;
    }
    dispose(){this.stopCurrent();this.disposed=true;}
  }
  return {AudioController,RESOURCE_FILES,resourceForLevel};
});
