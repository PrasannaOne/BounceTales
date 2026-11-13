(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalTrampoline=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_SPRING_DURATION_MS=2000;
  const SPRING_SCALE16=43266; // j.g.a for the original 240-pixel logical viewport.
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function imageForLevel(levelIndex){
    // m.b(levelType): hill (0-4), spooky (5-9), bonus (10-14).
    return levelIndex<=4?497:(levelIndex<=9?509:490);
  }
  function frameCount(imageMaps,imageId){
    const n=Number(imageMaps?.maps?.[String(imageId)]?.frames?.length||1);
    return clamp(Number.isFinite(n)?Math.trunc(n):1,1,64);
  }
  function frameHeight(imageMaps,imageId,frame){
    const map=imageMaps?.maps?.[String(imageId)];
    if(!map)return 0;
    const frames=Array.isArray(map.frames)?map.frames:[];
    const frameIndex=clamp(Math.trunc(frame)||0,0,Math.max(0,frames.length-1));
    const frameId=map.type==='animated'&&frames.length?frames[frameIndex]:imageId;
    const selected=imageMaps.maps[String(frameId)]||map;
    // Exact e.b(): o.c(animationId, frameIndex) selects the concrete frame,
    // then (short)o.b(frameId, 0) supplies that frame's height. It is NOT
    // the first compound-part Y offset and NOT originY.
    const height=Number(selected?.height ?? 0);
    return Number.isFinite(height)?height:0;
  }
  function frameOffset(imageMaps,imageId,frame){
    // Exact e.b(): (65536 * frameHeight) / j.g.a uses Java int division.
    return Math.trunc((65536*frameHeight(imageMaps,imageId,frame))/SPRING_SCALE16);
  }
  const i32=value=>value|0;
  const divJava=(a,b)=>a/b; // BigInt division truncates toward zero, like Java long division.
  function inverseMatrixFixed(m){
    // Direct port of d.c(d): invert the 16.16 world matrix using Java-long
    // products, arithmetic shifts and Java integer division.
    const a=BigInt(m[0]|0),b=BigInt(m[1]|0),c=BigInt(m[2]|0);
    const d=BigInt(m[3]|0),e=BigInt(m[4]|0),f=BigInt(m[5]|0);
    const det=((a*e-b*d)>>16n);
    if(det===0n)throw new RangeError('Non-invertible trampoline transform');
    const ia=i32(Number(divJava(e<<16n,det)));
    const ib=i32(Number(divJava(d<<16n,det)));
    const id=i32(Number(divJava(b<<16n,det)));
    const ie=i32(Number(divJava(a<<16n,det)));
    const ic=i32(-Number((c*BigInt(ia)+f*BigInt(ib))>>16n));
    const iff=i32(-Number((c*BigInt(id)+f*BigInt(ie))>>16n));
    return [ia,ib,ic,id,ie,iff];
  }
  function transformPointFixed(m,x16,y16){
    const x=i32(Number((BigInt(m[0]|0)*BigInt(x16|0)+BigInt(m[1]|0)*BigInt(y16|0))>>16n)+(m[2]|0));
    const y=i32(Number((BigInt(m[3]|0)*BigInt(x16|0)+BigInt(m[4]|0)*BigInt(y16|0))>>16n)+(m[5]|0));
    return {x,y};
  }
  function worldToLocalFixed(worldMatrix,x16,y16){
    return transformPointFixed(inverseMatrixFixed(worldMatrix),x16,y16);
  }
  function sourceSegmentHit(x0,y0,x1,y1){
    // Exact port of c.a(-70<<16, 95<<16, 140<<16, 0,
    //                    previousX, previousY, currentX, currentY, 0).
    // The source helper uses Java long arithmetic throughout.
    const x0l=-70n*65536n,y0l=95n*65536n,dx=140n*65536n,dy=0n;
    const px0=BigInt(x0|0),py0=BigInt(y0|0),px1=BigInt(x1|0),py1=BigInt(y1|0);
    const v9=(px0*dy)>>16n;
    const v11=(py0*dx)>>16n;
    const v13=(px1*dy)>>16n;
    const v15=(py1*dx)>>16n;
    const v17=v9-v11-v13+v15;
    if(v17===0n)return false;
    const v19=((v9-v11+((dx*y0l)>>16n)-((dy*x0l)>>16n))<<16n)/v17;
    if(v19<0n||v19>65536n)return false;
    const v21=(px0*(py1-y0l)+py0*(x0l-px1)+px1*y0l-py1*x0l)/v17;
    if(v21>=0n&&v21<=65536n)return true;
    if(v21<0n){
      const ex=px1-px0,ey=py1-py0,rx=x0l-px0,ry=y0l-py0;
      let along=(rx*ex+ry*ey)>>16n;
      if(along<=0n)return false;
      const length=(ex*ex+ey*ey)>>16n;
      if(along>=length)return false;
      along=(along<<16n)/length;
      const hx=px0+((along*ex)>>16n),hy=py0+((along*ey)>>16n);
      const ox=hx-x0l,oy=hy-y0l;
      return ((ox*ox+oy*oy)>>16n)<=0n;
    }
    return false;
  }
  function crossesLaunchLine(previous,current){
    if(!previous||!current)return false;
    const values=[previous.x,previous.y,current.x,current.y];
    if(!values.every(Number.isFinite))return false;
    const fixed=v=>i32(Math.trunc(v*65536));
    return sourceSegmentHit(fixed(previous.x),fixed(previous.y),fixed(current.x),fixed(current.y));
  }
  function crossesLaunchLineFixed(previous,current){
    if(!previous||!current)return false;
    return sourceSegmentHit(previous.x,previous.y,current.x,current.y);
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
    // c.a(root), case 8: Java first casts the incoming float to int for
    // animation timing, but uses the original float for the impulse formula.
    const incomingRaw=Math.fround(-Math.fround(body.vy));
    const basePush=Math.fround(Number(t.basePush));
    if(!Number.isFinite(incomingRaw)||!Number.isFinite(basePush)||basePush<=0)return false;
    const incomingLimit=clamp(Math.trunc(incomingRaw),100,1000);
    const count=frameCount(imageMaps,t.imageId);
    const basePushFloat=Math.fround(basePush);
    const period=((1100-incomingLimit)>>1)+20;
    const frameStep=Math.floor(period/count); // Java int / int division in e.d()
    // Exact Java left-to-right float evaluation:
    // -vy * (float)basePush * 2.0F / 100.0F; cap at 400*basePush*2/100.
    const impulse=Math.fround(Math.fround(Math.fround(incomingRaw*basePushFloat)*2.0)/100.0);
    const impulseCap=Math.fround(Math.fround(Math.fround(400.0*basePushFloat)*2.0)/100.0);
    const push=impulse>impulseCap?impulseCap:impulse;
    if(!Number.isFinite(period)||period<1||!Number.isFinite(frameStep)||frameStep<=0||!Number.isFinite(push))return false;

    t.period=period;
    t.frameStep=frameStep; // e.a:F in the JAR, not a truncated integer.
    t.progress=frameStep;
    t.elapsedMs=0;
    t.animFrame=0;
    t.calcPush=push;
    t.active=true;
    t.jumpFinished=false;
    body.enabled=false;body.vx=0;body.vy=0;
    const anchorY=Number(t.y);
    body.y=Number.isFinite(anchorY)?anchorY+frameOffset(imageMaps,t.imageId,0):body.y;
    return true;
  }
  function update(t,body,imageMaps,dt,sourceDeltaMs=null){
    if(!t?.active)return false;
    const ms=clamp(Math.trunc(Number(sourceDeltaMs)||Math.round((Number(dt)||0)*1000)),1,100);
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
          // e.d(): restore the actor first, then assign the already-positive
          // Java float impulse (`actor.b = spring.a`). Do not abs() it: the
          // sign is guaranteed by the descending-contact guard and source formula.
          body.enabled=true;
          body.vy=t.calcPush;
          body.torqueX=0;body.torqueY=0;body.skipAccelStretch=true;
        }
      }else{
        const anchorY=Number(t.y);
        if(Number.isFinite(anchorY)){body.y=anchorY+frameOffset(imageMaps,t.imageId,t.animFrame);body.syncFixedPosition?.();}
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
  return {imageForLevel,frameCount,frameHeight,frameOffset,inverseMatrixFixed,transformPointFixed,worldToLocalFixed,crossesLaunchLine,crossesLaunchLineFixed,begin,update,reset,MAX_SPRING_DURATION_MS};
});
