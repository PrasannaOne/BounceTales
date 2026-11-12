(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BouncePhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Values transcribed from BounceObject in the public 2.0.25 decompilation;
  // the key movement/physics routines are cross-checked against the supplied 2.0.3 JAR.
  const P=Object.freeze({
    radius:[20,20,20],
    gravity:[1.0,1.4,0.5],
    friction:[0.6,0.3,0.6],
    ricochet:[0.1,0.1,0.1],
    movementAcceleration:[500,350,312.5],
    maximumMovementSpeed:[280,350,150],
    midairSuppression:[1.5,2.5,1.2],
    jumpAcceleration:[288,255,162.5],
    maxJumpSlope:Math.cos(55*Math.PI/180),
    baseGravityY:-400,
    maxVelocity:999
  });
  class BounceBody{
    constructor(x=0,y=0,unlockedForme=0){
      this.x=x;this.y=y;this.vx=0;this.vy=0;this.gravityX=0;this.gravityY=0;
      this.pushX=0;this.pushY=0;this.forme=0;this.unlockedForme=unlockedForme;
      this.grounded=false;this.slopeSinAbs=0;this.slopeCosAbs=1;this.airTime=0;
      this.enabled=true;this.rotation=0;
    }
    reset(x,y){
      this.x=x;this.y=y;this.vx=0;this.vy=0;this.gravityX=0;this.gravityY=0;
      this.pushX=0;this.pushY=0;this.grounded=false;this.airTime=0;
    }
    moveLeft(superBounce=false){
      const mode=this.forme,speedBoost=superBounce&&mode===0?50:0;
      if(this.grounded){
        if(this.vx>(-P.maximumMovementSpeed[mode])-speedBoost)this.gravityX-=speedBoost+P.movementAcceleration[mode];
      }else if(this.vx>(-P.maximumMovementSpeed[mode])-speedBoost){
        this.gravityX-=(speedBoost+P.movementAcceleration[mode])/P.midairSuppression[mode];
      }
    }
    moveRight(superBounce=false){
      const mode=this.forme,speedBoost=superBounce&&mode===0?50:0;
      if(this.grounded){
        if(this.vx<P.maximumMovementSpeed[mode]+speedBoost)this.gravityX+=speedBoost+P.movementAcceleration[mode];
      }else if(this.vx<P.maximumMovementSpeed[mode]+speedBoost){
        this.gravityX+=(speedBoost+P.movementAcceleration[mode])/P.midairSuppression[mode];
      }
    }
    jump(small=false){
      if(this.slopeCosAbs>P.maxJumpSlope&&this.grounded){
        this.pushY+=small?P.jumpAcceleration[this.forme]/2:P.jumpAcceleration[this.forme];
        this.grounded=false;
      }
    }
    cycleForme(){
      this.forme++;
      if(this.forme>2)this.forme=0;
      if(this.forme>this.unlockedForme)this.forme=0;
      return this.forme;
    }
    update(dt){
      if(!this.enabled)return;
      const g=P.gravity[this.forme],motionDelta=dt,invGravity=1/g;
      this.gravityX+=0*g;
      this.gravityY+=P.baseGravityY*g;
      this.vx+=this.gravityX*invGravity*motionDelta;
      this.vy+=this.gravityY*invGravity*motionDelta;
      this.vx+=this.pushX*invGravity;
      this.vy+=this.pushY*invGravity;
      this.x+=this.vx*motionDelta;
      this.y+=this.vy*motionDelta;
      this.gravityX=this.gravityY=this.pushX=this.pushY=0;
      this.airTime+=dt;
      if(this.airTime>0.25)this.grounded=false;
      const speed=Math.hypot(this.vx,this.vy);
      if(speed>P.maxVelocity){const k=P.maxVelocity/speed;this.vx*=k;this.vy*=k;}
    }
    land(nx,ny,dt){
      this.slopeSinAbs=nx;this.slopeCosAbs=ny;this.airTime=0;this.grounded=true;
      const vn=this.vx*nx+this.vy*ny;
      if(vn<0){
        const e=P.ricochet[this.forme];
        this.vx-=(1+e)*vn*nx;this.vy-=(1+e)*vn*ny;
      }
      // The original applies a gravity/normal-dependent friction impulse during collision.
      // This stable first-pass translation approximates that contact friction.
      const vn2=this.vx*nx+this.vy*ny;
      const tx=this.vx-vn2*nx,ty=this.vy-vn2*ny,tm=Math.hypot(tx,ty);
      const maxF=P.friction[this.forme]*400*dt;
      if(tm>0){const reduction=Math.min(tm,maxF);this.vx-=tx/tm*reduction;this.vy-=ty/tm*reduction;}
    }
    static get parameters(){return P;}
  }
  return {BounceBody,parameters:P};
});
