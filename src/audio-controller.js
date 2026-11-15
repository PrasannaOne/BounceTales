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
  const SOURCE_MIDI_FILES=Object.freeze({
    28:'aw.mid',29:'ax.mid',30:'ay.mid',31:'az.mid',
    32:'ba.mid',33:'bb.mid',34:'bc.mid',35:'bd.mid'
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
      this.lastMusicResource=null;this.unlocked=false;this.disposed=false;this.generation=0;this.lifecyclePaused=false;
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
      // A lifecycle transition may happen while the gesture-unlock promise is
      // pending. Never start a source after the document has been suspended.
      if(this.lifecyclePaused||this.disposed||!this.enabled){
        try{await ctx.suspend();}catch{}
        return false;
      }
      if(this.lastMusicResource!==null&&!this.currentSource){
        await this.start(this.lastMusicResource,true);
      }
      return ctx.state==='running'&&!this.lifecyclePaused;
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
      if(!buffer||token!==this.generation||!this.enabled||this.disposed||this.lifecyclePaused)return false;
      if(ctx.state!=='running'&&this.unlocked){try{await ctx.resume();}catch{return false;}}
      // A page may be backgrounded while decodeAudioData/resume is pending.
      // Re-check immediately before creating a source so late async work
      // cannot restart music after pagehide or visibility loss.
      if(token!==this.generation||!this.enabled||this.disposed||this.lifecyclePaused)return false;
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
      // Stop the source as well as suspending the context. This is deliberately
      // synchronous so pagehide/freeze cannot leave a playing source behind.
      this.lifecyclePaused=true;
      this.generation++;
      this.stopCurrent();
      const ctx=this.context;
      if(ctx&&ctx.state==='running'){
        try{Promise.resolve(ctx.suspend()).catch(()=>{});}catch{}
      }
      return true;
    }
    async resume(){
      if(!this.enabled||this.disposed)return false;
      this.lifecyclePaused=false;
      const ctx=this.context;
      // Returning to a page is not itself an audio-unlock gesture. Wait for a
      // prior unlock instead of creating/resuming audio on a locked browser.
      if(!ctx||!this.unlocked)return false;
      if(ctx.state!=='running'){
        try{await ctx.resume();}catch{return false;}
      }
      if(this.lifecyclePaused||this.disposed||!this.enabled)return false;
      if(!this.currentSource&&this.lastMusicResource!==null){
        return this.start(this.lastMusicResource,true);
      }
      return ctx.state==='running';
    }
    setEnabled(enabled){
      this.enabled=!!enabled;
      try{this.storage?.setItem('bounce-music-enabled',String(this.enabled));}catch{}
      if(!this.enabled){this.pause();}
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
  return {AudioController,RESOURCE_FILES,SOURCE_MIDI_FILES,resourceForLevel};
});
