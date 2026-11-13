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
      this.storage=options.storage||(typeof localStorage!=='undefined'?localStorage:null);
      this.fetcher=options.fetcher||(typeof fetch==='function'?fetch.bind(globalThis):null);
      this.ContextClass=options.ContextClass||(typeof globalThis!=='undefined'?(globalThis.AudioContext||globalThis.webkitAudioContext):null);
      this.enabled=options.enabled!==undefined?!!options.enabled:this.readEnabled();
      this.volume=options.volume===undefined?0.72:Math.max(0,Math.min(1,Number(options.volume)||0));
      this.context=null;this.master=null;this.buffers=new Map();this.pending=new Map();
      this.currentSource=null;this.currentResource=null;this.currentCue=false;
      this.lastMusicResource=null;this.unlocked=false;this.disposed=false;this.generation=0;
    }
    readEnabled(){try{return !this.storage||this.storage.getItem('bounce-music-enabled')!=='false';}catch{return true;}}
    ensureContext(){
      if(this.context)return this.context;
      if(typeof this.ContextClass!=='function')return null;
      try{
        this.context=new this.ContextClass();
        this.master=this.context.createGain();this.master.gain.value=this.volume;
        this.master.connect(this.context.destination);
        return this.context;
      }catch{return null;}
    }
    async load(resource){
      if(this.buffers.has(resource))return this.buffers.get(resource);
      if(this.pending.has(resource))return this.pending.get(resource);
      const file=RESOURCE_FILES[resource],ctx=this.ensureContext();
      if(!file||!ctx||!this.fetcher)return null;
      const task=(async()=>{
        const response=await this.fetcher(this.basePath+file,{cache:'force-cache'});
        if(!response||!response.ok)throw new Error('Audio fetch failed: '+file);
        const data=await response.arrayBuffer();
        const buffer=await ctx.decodeAudioData(data.slice(0));
        this.buffers.set(resource,buffer);return buffer;
      })().catch(()=>null).finally(()=>this.pending.delete(resource));
      this.pending.set(resource,task);return task;
    }
    async unlock(){
      if(this.disposed)return false;
      const ctx=this.ensureContext();if(!ctx)return false;
      this.unlocked=true;
      try{if(ctx.state!=='running')await ctx.resume();}catch{return false;}
      if(this.enabled&&this.lastMusicResource!==null&&!this.currentSource){
        await this.start(this.lastMusicResource,true);
      }
      return ctx.state==='running';
    }
    stopCurrent(){
      const source=this.currentSource;this.currentSource=null;this.currentResource=null;this.currentCue=false;
      if(source){source.onended=null;try{source.stop(0);}catch{}try{source.disconnect();}catch{}}
    }
    async start(resource,loop){
      if(!this.enabled||this.disposed)return false;
      const ctx=this.ensureContext();if(!ctx)return false;
      const token=++this.generation;
      const buffer=await this.load(resource);
      if(!buffer||token!==this.generation||!this.enabled||this.disposed)return false;
      if(ctx.state!=='running'&&this.unlocked){try{await ctx.resume();}catch{return false;}}
      this.stopCurrent();
      const source=ctx.createBufferSource();source.buffer=buffer;source.loop=!!loop;
      source.connect(this.master);this.currentSource=source;this.currentResource=resource;this.currentCue=!loop;
      source.onended=()=>{if(this.currentSource===source){this.currentSource=null;this.currentResource=null;this.currentCue=false;}try{source.disconnect();}catch{}};
      try{source.start(0);return true;}catch{this.stopCurrent();return false;}
    }
    playMusic(resource){
      if(!RESOURCE_FILES[resource]||!this.enabled)return false;
      this.lastMusicResource=resource;this.start(resource,true);return true;
    }
    playTitle(){return this.playMusic(28);}
    playLevel(levelIndex){return this.playMusic(resourceForLevel(levelIndex));}
    playCue(resource){
      if(![33,34].includes(resource)||!this.enabled)return false;
      this.start(resource,false);return true;
    }
    pause(){
      const ctx=this.context;if(ctx&&ctx.state==='running'){try{ctx.suspend();}catch{}}
    }
    resume(){
      if(!this.enabled||this.disposed)return false;
      const ctx=this.ensureContext();if(!ctx)return false;
      if(ctx.state!=='running'&&this.unlocked){ctx.resume().catch(()=>{});}
      if(!this.currentSource&&this.lastMusicResource!==null)this.start(this.lastMusicResource,true);
      return true;
    }
    setEnabled(enabled){
      this.enabled=!!enabled;
      try{this.storage?.setItem('bounce-music-enabled',String(this.enabled));}catch{}
      if(!this.enabled){this.generation++;this.stopCurrent();}
      else if(this.unlocked)this.resume();
      return this.enabled;
    }
    setVolume(volume){
      this.volume=Math.max(0,Math.min(1,Number(volume)||0));
      if(this.master)this.master.gain.setTargetAtTime(this.volume,this.context.currentTime,0.015);
      return this.volume;
    }
    dispose(){
      this.generation++;this.stopCurrent();this.disposed=true;
      const ctx=this.context;this.context=null;this.master=null;
      if(ctx&&ctx.state!=='closed'){try{ctx.close();}catch{}}
    }
  }
  return {AudioController,RESOURCE_FILES,resourceForLevel};
});
