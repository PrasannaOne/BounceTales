(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalTrampoline=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function imageForLevel(levelIndex){
    // BounceGame.getLevelType: hill (0-4), spooky (5-9), bonus (10-14).
    return levelIndex<=4?497:(levelIndex<=9?509:490);
  }
  function frameCount(imageMaps,imageId){return Math.max(1,imageMaps?.maps?.[String(imageId)]?.frames?.length||1);}
  function frameOriginY(imageMaps,imageId,frame){
    const map=imageMaps?.maps?.[String(imageId)];
    if(!map)return 0;
    const selected=map.type==='animated'?imageMaps.maps[String(map.frames[Math.min(frame,map.frames.length-1)])]:map;
    return selected?.originY||0;
  }
  function begin(t,body,imageMaps){
    const incomingRaw=-body.vy;
    const incomingLimit=Math.max(100,Math.min(1000,Math.trunc(incomingRaw)));
    const count=frameCount(imageMaps,t.imageId);
    const basePush=(t.basePush*2)/100;
    t.period=((1100-incomingLimit)>>1)+20;
    t.frameStep=Math.floor(t.period/count);
    t.progress=t.frameStep;
    t.animFrame=0;t.calcPush=Math.min(incomingRaw*basePush,400*basePush);
    t.active=true;t.jumpFinished=false;
    body.enabled=false;body.vx=0;body.vy=0;body.grounded=true;
    body.y=t.y-frameOriginY(imageMaps,t.imageId,0)/.660187;
    return true;
  }
  function update(t,body,imageMaps,dt){
    if(!t.active)return false;
    const count=frameCount(imageMaps,t.imageId),ms=Math.max(1,Math.round(dt*1000));
    if(t.progress<t.period){
      t.progress+=ms;
      t.animFrame=Math.min(count-1,Math.floor((count*t.progress)/t.period));
      if(t.progress>=t.period-t.frameStep){
        if(!t.jumpFinished){
          t.jumpFinished=true;body.vy=t.calcPush;body.enabled=true;body.torqueX=0;body.torqueY=0;body.skipAccelStretch=true;body.grounded=false;body.airTime=0;
        }
      }else{
        body.y=t.y-frameOriginY(imageMaps,t.imageId,t.animFrame)/.660187;
      }
      if(t.progress>=t.period){t.active=false;t.progress=0;t.period=0;t.animFrame=0;t.jumpFinished=false;}
      return true;
    }
    return true;
  }
  return {imageForLevel,frameCount,frameOriginY,begin,update};
});
