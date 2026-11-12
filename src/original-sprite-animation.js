(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalSpriteAnimation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // Direct translation of command 1 in the supplied 2.0.3 g.class bytecode
  // and the corresponding r.class sprite timing/update paths.
  const ANIMATIONS={
    118:{imageId:485,duration:9999,frameCount:4},
    334:{imageId:474,duration:750,frameCount:5},
    342:{imageId:480,duration:9999,frameCount:4}
  };
  const FRAME_MS=150;

  function start(sprites){
    return {slots:(sprites||[]).map(sprite=>{
      const sourceId=Array.isArray(sprite)?sprite[2]:sprite?.imageId;
      const data=ANIMATIONS[sourceId];
      return data?{...data,remaining:data.duration}:null;
    })};
  }
  function update(state,deltaMs){
    if(!state?.slots)return false;
    for(let i=0;i<state.slots.length;i++){
      const slot=state.slots[i];
      if(!slot||slot.remaining===9999)continue;
      slot.remaining-=Math.max(0,deltaMs);
      if(slot.remaining < -1500)state.slots[i]=null;
    }
    return state.slots.some(Boolean);
  }
  function frame(state,index,globalElapsedMs=0){
    const slot=state?.slots?.[index];
    if(!slot)return null;
    const elapsed=slot.remaining===9999?globalElapsedMs:slot.duration-slot.remaining;
    const frameIndex=Math.max(0,Math.min(slot.frameCount-1,Math.floor(elapsed/FRAME_MS)%slot.frameCount));
    const alpha=slot.imageId===474&&slot.remaining<=0?Math.max(0,Math.min(1,-slot.remaining/1500)):1;
    return {imageId:slot.imageId,frame:frameIndex,alpha};
  }
  return {start,update,frame,frameDurationMs:FRAME_MS};
});
