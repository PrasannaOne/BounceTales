(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BouncePhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  // Actor constants verified against c.class in the supplied Bounce Tales 2.0.3 JAR.
  // The public BounceObject decompilation is used only to make the obfuscated
  // stretch-rendering state readable; the supplied JAR remains the authority.
  const P=Object.freeze({
    radius:[20,20,20],
    gravity:[1.0,1.4,0.5],
    friction:[0.6,0.3,0.6],
    ricochet:[0.1,0.1,0.1],
    movementAcceleration:[500,350,312.5],
    maximumMovementSpeed:[280,350,150],
    midairSuppression:[1.5,2.5,1.2],
    jumpAcceleration:[288,255,162.5],
    maxJumpSlope:Math.cos(0.9599310755729675),
    baseGravityY:-400,
    maxVelocity:999,
    stretchLimit:70
  });

  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const trunc32=v=>v|0;

  class BounceBody{
    constructor(x=0,y=0,unlockedForme=0){
      this.x=x;this.y=y;this.vx=0;this.vy=0;this.lastVx=0;this.lastVy=0;
      this.gravityX=0;this.gravityY=0;this.pushX=0;this.pushY=0;
      this.torqueX=0;this.torqueY=0;this.forme=0;this.unlockedForme=unlockedForme;
      this.grounded=false;this.slopeSinAbs=0;this.slopeCosAbs=1;this.airTime=0;
      this.enabled=true;this.rotation=0;this.curVelocity=0;
      this.radius=P.radius[0];
      // These are the four directional spring/stretch accumulators in c.class.
      this.reqStretch=[0,0,0,0];
      this.stretchMagnitude=[0,0,0,0];
      this.stretchResult=[0,0,0,0];
      this.stretchResultAbs=[0,0,0,0];
      this.stretchDirBalance=[0,0,0,0];
      this.stretchBuffer=[999,999,999,999];
      this.eyeFrame=0;this.idleAnimTimer=0;this.idleAnimStartTimer=3000;
      this.skipAccelStretch=false;
    }
    reset(x,y){
      this.x=x;this.y=y;this.vx=0;this.vy=0;this.lastVx=0;this.lastVy=0;
      this.gravityX=0;this.gravityY=0;this.pushX=0;this.pushY=0;
      this.torqueX=0;this.torqueY=0;this.grounded=false;this.airTime=0;
      this.curVelocity=0;this.rotation=0;this.eyeFrame=0;this.idleAnimTimer=0;
      this.idleAnimStartTimer=3000;this.skipAccelStretch=true;
      this.reqStretch.fill(0);this.stretchMagnitude.fill(0);
      this.stretchResult.fill(0);this.stretchResultAbs.fill(0);
      this.stretchDirBalance.fill(0);this.stretchBuffer.fill(999);
    }
    requestStretch(dir,magnitude){
      magnitude=clamp(Math.trunc(magnitude),-P.stretchLimit,P.stretchLimit);
      if(magnitude)this.reqStretch[dir]+=magnitude;
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
        this.requestStretch(0,small?-27:-53);
        this.requestStretch(1,small?-27:-53);
      }
    }
    cycleForme(){
      this.forme++;
      if(this.forme>2)this.forme=0;
      if(this.forme>this.unlockedForme)this.forme=0;
      this.radius=P.radius[this.forme];
      return this.forme;
    }
    update(dt,screenScale=0.660187){
      if(!this.enabled||!(dt>0))return;
      const updateDelta=Math.max(1,Math.round(dt*1000));
      const mode=this.forme,g=P.gravity[mode],invGravity=1/g;

      // Exact acceleration-to-stretch request mapping from the JAR's update method.
      if(!this.skipAccelStretch){
        const xaccel=this.vx-this.lastVx,yaccel=this.vy-this.lastVy;
        if(xaccel>0)this.requestStretch(3,(((Math.trunc(xaccel)>>2)<<1)/3)|0);
        else this.requestStretch(2,((((-Math.trunc(xaccel))>>2)<<1)/3)|0);
        if(yaccel>0)this.requestStretch(1,(((Math.trunc(yaccel)>>2)<<1)/3)|0);
        else this.requestStretch(0,((((-Math.trunc(yaccel))>>2)<<1)/3)|0);
      }
      this.skipAccelStretch=false;

      // BounceObject.updatePhysics uses elapsed milliseconds converted to seconds.
      const motionDelta=dt;
      this.lastVx=this.vx;this.lastVy=this.vy;
      this.gravityX+=0*P.gravity[mode];
      this.gravityY+=P.baseGravityY*g;
      this.vx+=this.gravityX*invGravity*motionDelta;
      this.vy+=this.gravityY*invGravity*motionDelta;
      this.vx+=this.pushX*invGravity;
      this.vy+=this.pushY*invGravity;
      this.x+=this.vx*motionDelta;
      this.y+=this.vy*motionDelta;
      this.gravityX=0;this.gravityY=0;this.pushX=0;this.pushY=0;

      // The original uses collision-produced torque projected onto the current surface slope.
      const f7=this.torqueX*this.slopeSinAbs+this.torqueY*this.slopeCosAbs;
      let f=this.torqueX-this.slopeSinAbs*f7;
      let f2=this.torqueY-this.slopeCosAbs*f7;
      if(this.slopeSinAbs*this.torqueX+this.slopeCosAbs*this.torqueY<0){
        f=this.torqueX+this.slopeSinAbs*f7;
        f2=this.torqueY+this.slopeCosAbs*f7;
      }
      const turn=motionDelta*(Math.hypot(f,f2)/P.radius[mode]);
      this.rotation+=((f2*this.slopeSinAbs)-(f*this.slopeCosAbs)>0?-turn:turn);

      this.airTime+=motionDelta;
      if(this.airTime>0.25)this.grounded=false;
      this.curVelocity=Math.hypot(this.vx,this.vy);
      if(this.curVelocity>P.maxVelocity){
        const inv=P.maxVelocity/this.curVelocity;this.vx*=inv;this.vy*=inv;this.curVelocity=P.maxVelocity;
      }

      // Source-faithful 16.16 spring calculations from the original actor update.
      const scale16=Math.round(screenScale*65536);
      for(let axis=0;axis<4;axis++){
        this.stretchMagnitude[axis]=trunc32(this.stretchMagnitude[axis]+this.reqStretch[axis]*65536);
        this.reqStretch[axis]=0;
        this.stretchMagnitude[axis]=clamp(this.stretchMagnitude[axis],-70*65536,70*65536)|0;
        this.stretchResult[axis]=Math.imul(1,this.stretchResult[axis]+Math.imul(this.stretchMagnitude[axis],updateDelta));
        this.stretchResultAbs[axis]=Math.imul((this.stretchResult[axis]>>16),scale16)>>16;
        // The original class promotes these products to Java long before shifting.
        // Keep the products in JS Number precision, then apply a signed arithmetic
        // shift equivalent (floor division by 2^16). Math.imul here would overflow.
        const restoring=Math.floor((updateDelta*7*(-this.stretchResult[axis]))/65536);
        const damping=Math.floor((updateDelta*120*this.stretchMagnitude[axis])/65536);
        this.stretchMagnitude[axis]=trunc32(this.stretchMagnitude[axis]+restoring-damping);
      }
    }
    land(nx,ny,dt){
      const n=Math.hypot(nx,ny)||1;nx/=n;ny/=n;
      this.slopeSinAbs=nx;this.slopeCosAbs=ny;this.airTime=0;this.grounded=true;
      // BounceObject.checkCollisions reflects the normal velocity with the
      // per-form ricochet factor, then applies friction as a gravity force for
      // the next elapsed-time update. This keeps contact handling from being
      // dependent on the browser's display refresh rate.
      const vn=this.vx*nx+this.vy*ny;
      if(vn<0){const e=P.ricochet[this.forme];this.vx-=(1+e)*vn*nx;this.vy-=(1+e)*vn*ny;}
      const speed=Math.hypot(this.vx,this.vy);
      if(speed>1e-7&&dt>1e-6){
        const gravity=P.gravity[this.forme],force=(-P.baseGravityY*ny)*P.friction[this.forme]*gravity;
        const fx=(this.vx/speed)*force,fy=(this.vy/speed)*force;
        const invDelta=gravity/dt,ax=this.vx*invDelta,ay=this.vy*invDelta;
        if(ax*ax+ay*ay<fx*fx+fy*fy){this.gravityX-=ax;this.gravityY-=ay;}
        else{this.gravityX-=fx;this.gravityY-=fy;}
      }
      this.torqueX=this.torqueX*.5+this.vx*.5;
      this.torqueY=this.torqueY*.5+this.vy*.5;
    }
    resetPhysics(){
      this.vx=this.vy=this.gravityX=this.gravityY=this.pushX=this.pushY=this.torqueX=this.torqueY=0;
      this.curVelocity=0;this.airTime=0;this.grounded=false;
    }
    get stretch(){
      const balance=[0,0,0,0];
      for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a!==b)balance[a]-=this.stretchResultAbs[b]>>1;
      this.stretchDirBalance=balance;
      return {resultAbs:this.stretchResultAbs,balance,buffer:this.stretchBuffer};
    }
    static get parameters(){return P;}
  }
  return {BounceBody,parameters:P};
});
