(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalEnemies=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // EnemyObject stores these speeds in LP32 (16.16) units per millisecond.
  // Convert once to world units per second for the browser's seconds-based loop.
  const SPEED=[6000,4000,4000,10000];
  const worldSpeed=type=>SPEED[type]*1000/65536;
  const toLP=value=>(Math.trunc(Number(value)*65536)|0);
  const fromLP=value=>(value|0)/65536;
  const WIDTH=[50,100,100,150];
  const HEIGHT=[100,50,80,150];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function reset(e){
    e.dead=false;e.state=1;e.propelType=1;e.curMovePoint=0;e.rechargeTimer=e.enemyType===3?2000:0;
    e.moleWaitTimer=2000;e.molePeekTimer=0;e.molePeekPeriod=800;e.moleIsVulnerable=false;
    e.facingLeft=(e.moveWorld?.[0]?.x??0)<(e.moveWorld?.[1]?.x??0);
    e.stalkerInitX=e.initialX;e.stalkerInitY=e.initialY;
    e.x16=toLP(e.x);e.y16=toLP(e.y);
    if(e.enemyType===3){e.moveWorld=[{x:e.initialX,y:e.initialY},{x:e.initialX,y:e.initialY}];}
    return e;
  }

  function moveTowards(e,target,speed,dt){
    const dx=target.x-e.x,dy=target.y-e.y,dist=Math.hypot(dx,dy);
    if(dist>1e-8){
      const step=speed*dt;
      const scale=Math.min(1,step/dist);
      const oldX=e.x;e.x+=dx*scale;e.y+=dy*scale;
      if(scale>=1-1e-9){e.x=target.x;e.y=target.y;e.x16=toLP(e.x);e.y16=toLP(e.y);return true;}
      e.facingLeft=oldX>e.x;
      e.x16=toLP(e.x);e.y16=toLP(e.y);
      return false;
    }
    return true;
  }
  // Direct translation of l.d(): enemy path coordinates and current transforms
  // are LP32 (16.16). The distance estimate intentionally truncates each delta
  // to whole world units before the square root, matching the original float casts.
  function movePathLP32(e,target,deltaMs,speed){
    let x=Number.isInteger(e.x16)?e.x16:toLP(e.x),y=Number.isInteger(e.y16)?e.y16:toLP(e.y);
    const tx=toLP(target.x),ty=toLP(target.y),dx=(tx-x)|0,dy=(ty-y)|0;
    const wholeX=dx>>16,wholeY=dy>>16;
    const length=Math.trunc(Math.sqrt(Math.fround(Math.fround(wholeX*wholeX)+Math.fround(wholeY*wholeY)))*65536);
    if(!length){e.x=fromLP(x);e.y=fromLP(y);return true;}
    const factor=(deltaMs*speed)/length;
    const stepX=Math.trunc(dx*factor)|0,stepY=Math.trunc(dy*factor)|0;
    const oldX=x;
    x=(x+stepX)|0;y=(y+stepY)|0;
    let reachedX=false,reachedY=false;
    if(stepX>=0&&x>=tx||stepX<=0&&x<=tx){x=tx;reachedX=true;}
    if(stepY>=0&&y>=ty||stepY<=0&&y<=ty){y=ty;reachedY=true;}
    e.x16=x;e.y16=y;e.x=fromLP(x);e.y=fromLP(y);
    if(x!==oldX)e.facingLeft=oldX>x;
    if(reachedX&&reachedY){e.x=target.x;e.y=target.y;e.x16=tx;e.y16=ty;return true;}
    return false;
  }

  function update(e,body,dt){
    if(e.dead||!(dt>0))return;
    const ms=Math.max(1,Math.round(dt*1000));
    if(e.rechargeTimer>0)e.rechargeTimer=Math.max(0,e.rechargeTimer-ms);

    if(e.enemyType===2){
      if(e.moleWaitTimer>0){
        e.moleWaitTimer-=ms;
        if(e.moleWaitTimer<=0){
          if(e.propelType===0){
            e.propelType=1;e.moleWaitTimer=2000;e.state=1;e.molePeekPeriod=800;
          }else{
            e.propelType=0;e.moleWaitTimer=5000;e.state=2;e.molePeekPeriod=800;e.moleIsVulnerable=true;
          }
        }
      }
      if(e.state===1){
        e.molePeekTimer+=ms;
        if(e.molePeekTimer>=e.molePeekPeriod){
          if(e.propelType===0){e.state=2;e.molePeekPeriod=200;}
          e.molePeekTimer=e.molePeekPeriod;
        }
      }else if(e.state===2){
        e.molePeekTimer-=ms;
        if(e.molePeekTimer<=0){e.state=0;e.molePeekTimer=0;e.moleIsVulnerable=false;}
      }
      if(e.propelType===0&&e.state===0&&e.moveWorld?.length===2){
        const target=e.moveWorld[e.curMovePoint];
        if(movePathLP32(e,target,ms,SPEED[2]))e.curMovePoint=1-e.curMovePoint;
      }
      return;
    }

    if(e.enemyType===3){
      if(e.rechargeTimer<=0){
        e.rechargeTimer=2000;
        // l.d() extends the previous destination (r/s), not the previous
        // player sample (c/d), then stores the player's current position as c/d.
        const oldTarget=e.moveWorld[1]||{x:e.stalkerInitX,y:e.stalkerInitY};
        const dx16=(toLP(oldTarget.x)-e.x16)|0,dy16=(toLP(oldTarget.y)-e.y16)|0;
        const wholeX=dx16>>16,wholeY=dy16>>16;
        const dist16=Math.trunc(Math.sqrt(Math.fround(Math.fround(wholeX*wholeX)+Math.fround(wholeY*wholeY)))*65536);
        const maxDistance=(2000<<1)*SPEED[3];
        let next={x:oldTarget.x,y:oldTarget.y};
        if(dist16>0&&maxDistance>dist16){
          const extra=maxDistance/dist16-1;
          next={x:fromLP((toLP(oldTarget.x)+Math.trunc(dx16*extra))|0),y:fromLP((toLP(oldTarget.y)+Math.trunc(dy16*extra))|0)};
        }
        e.moveWorld=[{x:body.x,y:body.y},next];
      }
      movePathLP32(e,e.moveWorld[1],ms,SPEED[3]);
      return;
    }

    if(e.enemyType===0&&e.moveWorld?.length===2){
      let target=e.moveWorld[e.curMovePoint],other=e.moveWorld[1-e.curMovePoint];
      // Source thresholds are LP32 constants: 70 units from either endpoint,
      // and 120 units from Bounce before the Candle reverses its patrol.
      if(Math.abs(e.x-target.x)>70&&Math.abs(e.x-other.x)>70&&Math.abs(body.x-e.x)<120&&
        ((e.x<body.x&&target.x<e.x)||(e.x>body.x&&target.x>e.x))){
        e.curMovePoint=1-e.curMovePoint;target=e.moveWorld[e.curMovePoint];
      }
    }

    // l.d() moves every non-stalker enemy along its two fixed-point endpoints.
    // Type 1 (the bumper) was previously left stationary in the browser port.
    if(e.enemyType!==2||(e.propelType===0&&e.state===0)){
      if(e.moveWorld?.length===2){
        const target=e.moveWorld[e.curMovePoint];
        if(movePathLP32(e,target,ms,SPEED[clamp(e.enemyType|0,0,3)]))e.curMovePoint=1-e.curMovePoint;
      }
    }
  }

  function segmentIntersectsAabb(a,b,minX,minY,maxX,maxY){
    let lo=0,hi=1;const dx=b.x-a.x,dy=b.y-a.y;
    for(const [p,q] of [[-dx,a.x-minX],[dx,maxX-a.x],[-dy,a.y-minY],[dy,maxY-a.y]]){
      if(Math.abs(p)<1e-12){if(q<0)return false;continue;}
      const t=q/p;
      if(p<0){if(t>hi)return false;if(t>lo)lo=t;}
      else{if(t<lo)return false;if(t<hi)hi=t;}
    }
    return true;
  }
  function bounds(e){
    const i=clamp(e.enemyType|0,0,3),half=WIDTH[i]/2;
    return {minX:e.x-half,maxX:e.x+half,minY:e.y,maxY:e.y+HEIGHT[i]};
  }
  function bounceAway(body){
    if(body.vy<0){body.vy=-body.vy*.5;body.vx*=.7;}
    else{body.vx=-body.vx*.5;body.vy*=.7;}
  }
  function kill(e){
    e.dead=true;
    return {x:e.x,y:e.y+30,id:'enemy-egg-'+e.id};
  }
  function collision(e,body,previous){
    if(e.dead)return null;
    const b=bounds(e),now={x:body.x,y:body.y},canStomp=e.enemyType===0||(e.enemyType===2&&(e.propelType===1||e.moleIsVulnerable));
    if(canStomp&&segmentIntersectsAabb(previous,now,b.minX,b.minY+(b.maxY-b.minY)*2/3,b.maxX,b.maxY)){
      bounceAway(body);return {type:'stomp',egg:kill(e)};
    }
    if(segmentIntersectsAabb(previous,now,b.minX,b.minY,b.maxX,b.maxY)){
      if(e.enemyType===0){
        if(e.rechargeTimer<=0){body.pushX+=e.x<body.x?500:-500;body.vx=0;body.vy=0;e.rechargeTimer=500;}
      }else if(e.enemyType===1){
        if(body.forme===1)return {type:'stomp',egg:kill(e)};
        return {type:'player-hit',enemy:e};
      }else if(e.enemyType===2){
        if(e.rechargeTimer<=0&&e.propelType===0&&e.state===0){e.molePeekTimer=0;e.state=1;e.molePeekPeriod=200;}
        const visibleTop=b.minY+(e.molePeekTimer*100/Math.max(1,e.molePeekPeriod))*(b.maxY-b.minY)/100;
        if(segmentIntersectsAabb(previous,now,b.minX,b.minY,b.maxX,visibleTop)){
          if(e.rechargeTimer<=0&&e.propelType===0&&e.state===1){
            e.rechargeTimer=500;body.pushX+=e.x<body.x?200:-200;body.pushY+=400;body.vx=0;body.vy=0;
          }else if(e.propelType===1){body.pushX+=e.x<body.x?100:-100;body.vx=0;body.vy=0;}
        }
      }else if(e.enemyType===3){
        // EnemyObject.onPlayerHit resets the unused stalker and both patrol
        // targets to its original spawn before triggering player death.
        e.x=e.stalkerInitX;e.y=e.stalkerInitY;e.x16=toLP(e.x);e.y16=toLP(e.y);
        e.moveWorld=[{x:e.stalkerInitX,y:e.stalkerInitY},{x:e.stalkerInitX,y:e.stalkerInitY}];
        e.curMovePoint=0;e.rechargeTimer=2000;
        return {type:'player-hit',enemy:e};
      }
    }
    return null;
  }
  return {SPEED,worldSpeed,WIDTH,HEIGHT,reset,update,bounds,segmentIntersectsAabb,collision,movePathLP32,toLP,fromLP};
});
