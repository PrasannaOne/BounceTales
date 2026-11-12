(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalWater=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function inversePoint(m,x,y){
    const a=m[0]/65536,b=m[1]/65536,c=m[3]/65536,d=m[4]/65536,tx=m[2]/65536,ty=m[5]/65536;
    const dx=x-tx,dy=y-ty,det=a*d-b*c;
    if(Math.abs(det)<1e-10)return {x:dx,y:dy};
    return {x:(d*dx-b*dy)/det,y:(a*dy-c*dx)/det};
  }
  function worldPoint(m,x,y){return {x:(m[0]*x+m[1]*y)/65536+m[2]/65536,y:(m[3]*x+m[4]*y)/65536+m[5]/65536};}
  function createZone(object,matrix){
    return {object,matrix,isAirTunnel:(object.color>>>0)===0,region:((object.color&255)===16)?1:0,ripples:[],bubbles:[],ambientTimer:0,swimTimer:0};
  }
  function interpolate(a,b,t){return Math.trunc(a+(b-a)*t);}
  function updateZone(zone,body,previous,dt){
    const o=zone.object,m=zone.matrix;
    if(!m)return false;
    const radius=body.radius||20,old=inversePoint(m,previous.x,previous.y),now=inversePoint(m,body.x,body.y);
    const minX=o.areaMinX,maxX=o.areaMaxX,surface=o.areaMinY,bottom=o.areaMaxY;
    const broadMinY=bottom-30,broadMaxY=surface+30;
    const inBroad=(p)=>p.x>=minX-radius&&p.x<=maxX+radius&&p.y>=broadMinY-radius&&p.y<=broadMaxY+radius;
    const segmentBounds={minX:Math.min(old.x,now.x),maxX:Math.max(old.x,now.x),minY:Math.min(old.y,now.y),maxY:Math.max(old.y,now.y)};
    if(!inBroad(old)&&!inBroad(now)&&!(segmentBounds.maxX>=minX-radius&&segmentBounds.minX<=maxX+radius&&segmentBounds.maxY>=broadMinY-radius&&segmentBounds.minY<=broadMaxY+radius))return false;

    // WaterObject.onBounceSurfaceContact: detect the swept crossing of the
    // horizontal surface, attenuate torque, and create a damped surface ripple.
    const dy=now.y-old.y;
    if(!zone.isAirTunnel&&zone.region===0&&Math.abs(dy)>1e-9){
      const t=(surface-old.y)/dy;
      if(t>=0&&t<=1){
        const x=old.x+(now.x-old.x)*t;
        if(x>=minX&&x<=maxX){
          const intensity=clamp(body.vy,-230,230);
          zone.ripples.push({x,amplitude:Math.abs(intensity)*.035,age:0,life:.95});
          if(zone.ripples.length>12)zone.ripples.shift();
          body.torqueX/=3;body.torqueY/=3;
        }
      }
    }

    // Source passes the ball's lower edge (y - radius) into updateBounceSwim.
    const swimY=now.y-radius;
    const swimming=now.x>=minX-radius&&now.x<=maxX+radius&&swimY<surface&&now.y>=broadMinY&&now.y<=broadMaxY;
    if(!swimming)return false;
    const xWeight=(now.x-minX)/Math.max(1,maxX-minX);
    const yWeight=(swimY-broadMinY)/Math.max(1,broadMaxY-broadMinY);
    const gx=interpolate(o.gravityXLeft,o.gravityXRight,xWeight);
    const gy=interpolate(o.gravityYBottom,o.gravityYTop,yWeight);
    body.gravityX+=gx<<5;body.gravityY+=gy<<5;
    const torqueFactor=Math.max(0,1-(dt*1000)/400);
    body.torqueX*=torqueFactor;body.torqueY*=torqueFactor;
    if(!zone.isAirTunnel){
      zone.swimTimer+=dt;
      const invGravity=1/([1,1.4,.5][body.forme]||1),slowdown=dt*1.4;
      body.vx*=Math.max(0,1-invGravity*slowdown);body.vy*=Math.max(0,1-invGravity*slowdown);
      if(zone.swimTimer>0.15){zone.bubbles.push({x:now.x,y:now.y,age:0,life:2.2});zone.swimTimer=0;}
    }
    return true;
  }
  function update(zones,body,previous,dt){
    let applied=false;
    for(const zone of zones){
      zone.ambientTimer+=dt;
      zone.ripples=zone.ripples.filter(r=>(r.age+=dt)<r.life);
      zone.bubbles=zone.bubbles.filter(b=>(b.age+=dt)<b.life);
      if(applied)continue;
      if(updateZone(zone,body,previous,dt))applied=true;
    }
    return applied;
  }
  return {inversePoint,worldPoint,createZone,updateZone,update};
});
