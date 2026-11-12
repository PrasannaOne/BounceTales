(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalCamera=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class CameraSpring{
    constructor(x=0,y=0,options={}){
      this.x=x;this.y=y;this.vx=0;this.vy=0;this.timer=0;
      this.width=options.width||240;this.height=options.height||320;this.scale=options.scale||0.660187;
      this.bounceFactor=options.bounceFactor??90;this.stabilizeSpeed=options.stabilizeSpeed??140;
    }
    snap(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.timer=0;return this.position();}
    setParams(bounce,stabilize){
      this.bounceFactor=clamp(Number(bounce)||90,0,400);
      this.stabilizeSpeed=clamp(Number(stabilize)||140,0,400);
    }
    targetFromActor(actor,offsetY=this.height/(5*this.scale)){
      const sx=1/this.scale;
      // GameObject.updateCamera predicts the target using its recent velocity,
      // then offsets the camera so the actor sits about one-fifth down-screen.
      return {
        x:actor.x+(actor.vx||0)*0.128*(1+sx),
        y:actor.y+offsetY+(actor.vy||0)*0.128*(sx-1)
      };
    }
    update(dtSeconds,target,options={}){
      if(!target||!(dtSeconds>0))return this.position();
      const actor=options.actor||target;
      const desired=this.targetFromActor({...target,vx:actor.vx||0,vy:actor.vy||0},options.offsetY??this.height/(5*this.scale));
      if(options.snap){return this.snap(desired.x,desired.y);}
      this.timer+=Math.max(0,Math.min(500,dtSeconds*1000));
      // The original camera spring integrates in 15 ms quanta. Keep that
      // cadence even when the browser renders at a different refresh rate.
      let steps=0;
      while(this.timer>=15&&steps++<40){
        let dx=desired.x-this.x,dy=desired.y-this.y;
        if(Math.abs(dx)<5)dx=0;
        if(Math.abs(dy)<5)dy=0;
        this.vx+=(this.bounceFactor*15*(dx/64))/16384;
        this.vy+=(this.bounceFactor*15*(dy/64))/16384;
        this.vx-=(this.stabilizeSpeed*15*this.vx)/16384;
        this.vy-=(this.stabilizeSpeed*15*this.vy)/16384;
        this.x+=this.vx*15;this.y+=this.vy*15;this.timer-=15;
      }
      return this.position();
    }
    position(){return {x:this.x,y:this.y,vx:this.vx,vy:this.vy,timer:this.timer};}
  }
  return {CameraSpring};
});
