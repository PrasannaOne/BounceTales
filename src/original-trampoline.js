(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalTrampoline=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_SPRING_DURATION_MS=2000;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function imageForLevel(levelIndex){
    // m.b(levelType): hill (0-4), spooky (5-9), bonus (10-14).
    return levelIndex<=4?497:(levelIndex<=9?509:490);
  }
  function frameCount(imageMaps,imageId){
    const n=Number(imageMaps?.maps?.[String(imageId)]?.frames?.length||1);
    return clamp(Number.isFinite(n)?Math.trunc(n):1,1,64);
  }
  function frameOriginY(imageMaps,imageId,frame){
    const map=imageMaps?.maps?.[String(imageId)];
    if(!map)return 0;
    const frames=Array.isArray(map.frames)?map.frames:[];
    const frameIndex=clamp(Math.trunc(frame)||0,0,Math.max(0,frames.length-1));
    const selected=map.type==='animated'&&frames.length?imageMaps.maps[String(frames[frameIndex])]:map;
    // JAR o.b(frameId, 0): first composite part's local Y offset.
    // This is not the sprite draw-origin (originY), which shifts the actor
    // incorrectly during the trampoline compression animation.
    const offset=Number(selected?.parts?.[0]?.[1] ?? 0);
    return Number.isFinite(offset)?offset:0;
  }
  function crossesLaunchLine(previous,current){
    if(!previous||!current)return false;
    const values=[previous.x,previous.y,current.x,current.y];
    if(!values.every(Number.isFinite))return false;
    const dy=current.y-previous.y;
    // Exact JAR centre-path trigger: descending world-Y path crosses the
    // local segment x=-70..70 at y=95. Do not expand it by player radius.
    if(dy>=-1e-9)return false;
    const fraction=(95-previous.y)/dy;
    if(fraction<0||fraction>1)return false;
    const x=previous.x+(current.x-previous.x)*fraction;
    return x>=-70&&x<=70;
  }
  function clearState(t){
    t.active=false;t.progress=0;t.period=0;t.frameStep=0;t.animFrame=0;
    t.jumpFinished=false;t.elapsedMs=0;
  }
  function releaseBody(t,body,failSafe=false){
    // The original object releases Bounce at period - frameDuration. The
    // fail-safe path is only for corrupted/non-finite state or a stalled timer.
    if(!body)return;
    body.enabled=true;
    if(!Number.isFinite(body.vy)||body.vy===0)body.vy=Math.max(1,Math.abs(Number(t.calcPush)||180));
    body.torqueX=0;body.torqueY=0;body.skipAccelStretch=true;
    body.grounded=false;body.airTime=0;
  }
  function begin(t,body,imageMaps){
    if(!t||!body||!body.enabled||!Number.isFinite(body.vy)||body.vy>=0)return false;
    const incomingRaw=-body.vy;
    const basePush=Number(t.basePush);
    if(!Number.isFinite(incomingRaw)||!Number.isFinite(basePush)||basePush<=0)return false;
    const incomingLimit=clamp(Math.trunc(incomingRaw),100,1000);
    const count=frameCount(imageMaps,t.imageId);
    const pushFactor=(basePush*2)/100;
    const period=((1100-incomingLimit)>>1)+20;
    const frameStep=Math.floor(period/count); // Java int / int division in e.d()
    const push=Math.min(incomingRaw*pushFactor,400*pushFactor);
    if(!Number.isFinite(period)||period<1||!Number.isFinite(frameStep)||frameStep<=0||!Number.isFinite(push))return false;

    t.period=period;
    t.frameStep=frameStep; // e.a:F in the JAR, not a truncated integer.
    t.progress=frameStep;
    t.elapsedMs=0;
    t.animFrame=0;
    t.calcPush=push;
    t.active=true;
    t.jumpFinished=false;
    body.enabled=false;body.vx=0;body.vy=0;body.grounded=true;
    const anchorY=Number(t.y);
    body.y=Number.isFinite(anchorY)?anchorY-frameOriginY(imageMaps,t.imageId,0)/.660187:body.y;
    return true;
  }
  function update(t,body,imageMaps,dt){
    if(!t?.active)return false;
    const ms=clamp(Math.round((Number(dt)||0)*1000),1,100);
    const count=frameCount(imageMaps,t.imageId);
    if(!Number.isFinite(t.progress)||!Number.isFinite(t.period)||t.period<=0||
       !Number.isFinite(t.frameStep)||t.frameStep<=0||!Number.isFinite(t.calcPush)){
      releaseBody(t,body,true);clearState(t);return false;
    }
    t.elapsedMs=(Number(t.elapsedMs)||0)+ms;
    if(t.elapsedMs>MAX_SPRING_DURATION_MS){
      // A damaged animation/resource must never leave the player disabled.
      releaseBody(t,body,true);clearState(t);return false;
    }
    if(t.progress<t.period){
      t.progress+=ms;
      t.animFrame=clamp(Math.floor((count*t.progress)/t.period),0,count-1);
      if(t.progress>=t.period-t.frameStep){
        if(!t.jumpFinished){
          t.jumpFinished=true;
          body.vy=Math.abs(t.calcPush); // positive world Y is upward; screenPoint negates it.
          body.enabled=true;
          body.torqueX=0;body.torqueY=0;body.skipAccelStretch=true;
          body.grounded=false;body.airTime=0;
        }
      }else{
        const anchorY=Number(t.y);
        if(Number.isFinite(anchorY))body.y=anchorY-frameOriginY(imageMaps,t.imageId,t.animFrame)/.660187;
      }
      if(t.progress>=t.period)clearState(t);
      return true;
    }
    // Defensive normalization for a state restored after an interrupted frame.
    if(!t.jumpFinished)releaseBody(t,body,true);
    clearState(t);
    return true;
  }
  function reset(t){if(t)clearState(t);}
  return {imageForLevel,frameCount,frameOriginY,crossesLaunchLine,begin,update,reset,MAX_SPRING_DURATION_MS};
});
