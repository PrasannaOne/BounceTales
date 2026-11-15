(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceGameParticles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const PALETTES={
    egg:['#fff4c9','#ffcf70','#f28b37'],
    landing:['#d8ef9a','#79bf4f','#f4e3a2'],
    transform:['#fff0bf','#ffcf68','#f08b59','#c8ecff'],
    splash:['#e8fbff','#a9e7ff','#6bbfe6'],
    checkpoint:['#f8e3a1','#d8ef9a','#9bdc8d'],
    burst:['#fff1c7','#ffc66f','#f28b37','#ee6d5a']
  };
  class ParticleSystem{
    constructor(random=Math.random){this.items=[];this.random=random;}
    push(p){
      this.items.push(p);
      if(this.items.length>120)this.items.splice(0,this.items.length-120);
    }
    emitEgg(x,y,count=9){
      for(let i=0;i<count;i++){
        const angle=(Math.PI*2*i/count)+(this.random()-.5)*.22,speed=48+this.random()*115;
        this.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed+40,age:0,life:.38+this.random()*.24,size:1+this.random()*1.5,palette:'egg',kind:i%3,shape:'dot'});
      }
    }
    emitLanding(x,y,power=1){
      const count=Math.max(3,Math.min(12,Math.round(4+power*4)));
      for(let i=0;i<count;i++){
        const angle=Math.PI+(this.random()-.5)*Math.PI,speed=25+this.random()*75*power;
        this.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:.25+this.random()*.22,size:.8+this.random()*1.1,palette:'landing',kind:0,shape:'dot'});
      }
    }
    emitTransform(x,y,fromForm=0,toForm=1){
      const count=14;
      for(let i=0;i<count;i++){
        const angle=(Math.PI*2*i/count)+(this.random()-.5)*.09;
        const speed=32+this.random()*54;
        this.push({x:x+Math.cos(angle)*8,y:y+Math.sin(angle)*8,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
          age:0,life:.42+this.random()*.2,size:1.4+this.random()*1.3,palette:'transform',kind:(i+fromForm+toForm)%4,shape:'spark'});
      }
    }
    emitSplash(x,y,power=1){
      const count=Math.max(5,Math.min(16,Math.round(6+power*5)));
      for(let i=0;i<count;i++){
        const angle=(Math.PI*.08)+(Math.PI*.84*(i/Math.max(1,count-1)))+(this.random()-.5)*.1;
        const speed=38+this.random()*85*power;
        this.push({x,y,vx:Math.cos(angle)*speed*(this.random()<.5?-1:1),vy:32+Math.sin(angle)*speed,age:0,
          life:.45+this.random()*.35,size:1+this.random()*1.5,palette:'splash',kind:i%3,shape:'drop'});
      }
    }
    emitCheckpoint(x,y){
      const count=12;
      for(let i=0;i<count;i++){
        const angle=(Math.PI*2*i/count)+(this.random()-.5)*.15,speed=38+this.random()*58;
        this.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:.55+this.random()*.2,
          size:1.2+this.random()*1.4,palette:'checkpoint',kind:i%3,shape:'spark'});
      }
    }
    emitBurst(x,y,count=12){
      count=Math.max(4,Math.min(24,count|0));
      for(let i=0;i<count;i++){
        const angle=(Math.PI*2*i/count)+(this.random()-.5)*.18,speed=45+this.random()*110;
        this.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:.35+this.random()*.3,
          size:1+this.random()*2,palette:'burst',kind:i%4,shape:'spark'});
      }
    }
    emitOriginalSpriteFragments(minX,maxX,minY,maxY,count=24){
      // Source crosswalk: m.h is configured with 24 particles, image IDs
      // [390,414,396], speed 840, mode 4, lifetime 2040 +/- 510 ms.
      const sprites=[390,414,396];
      // Preserve the original endpoint order. In the JAR, the Y endpoints are
      // inverted after the 60-unit inset; Math.abs(nextInt() % span) then samples
      // upward from the first endpoint instead of normalising the rectangle.
      const xSamples=Math.max(1,Math.abs(Math.trunc(maxX-minX+1)));
      const ySamples=Math.max(1,Math.abs(Math.trunc(maxY-minY+1)));
      for(let i=0;i<count;i++){
        const angle=(this.random()*2-1)*Math.PI;
        // JAR trig values are scaled by 360 and positions are 16.16 fixed point;
        // map its 840 speed argument through the original 16 ms delta unit.
        const speed=840*360*1000/(65536*16);
        const life=(2040+Math.floor(this.random()*1019)-509)/1000;
        const spriteId=sprites[Math.min(2,Math.floor(this.random()*sprites.length))];
        this.push({x:minX+Math.floor(this.random()*xSamples),y:minY+Math.floor(this.random()*ySamples),
          vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life,remaining:life,
          turnIn:.3+this.random()*.2,turnDirection:Math.floor(this.random()*4),
          spriteId,shape:'original-sprite'});
      }
    }
    update(dt){
      if(!(dt>0))return;
      for(let i=this.items.length-1;i>=0;i--){
        const p=this.items[i];p.age+=dt;
        if(p.age>=p.life){this.items.splice(i,1);continue;}
        if(p.shape==='original-sprite'){
          p.remaining=Math.max(0,p.life-p.age);
          p.turnIn-=dt;
          if(p.turnIn<=0){p.turnIn=.3+this.random()*.2;p.turnDirection=Math.floor(this.random()*4);}
          if(p.turnDirection===1||p.turnDirection===2){
            const angle=(p.turnDirection===1?1:-1)*dt*(500*Math.PI/180),c=Math.cos(angle),s=Math.sin(angle),vx=p.vx,vy=p.vy;
            p.vx=vx*c-vy*s;p.vy=vx*s+vy*c;
          }
          const drag=Math.max(0,1-dt*(35*1000/16384));
          p.vx*=drag;p.vy*=drag;p.x+=p.vx*dt;p.y+=p.vy*dt;
          p.frame=Math.max(0,Math.min(4,4-Math.min(4,Math.floor(p.remaining*5/2.04))));
          continue;
        }
        p.vy-=(p.shape==='drop'?330:250)*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.max(0,1-dt*(p.shape==='drop'?1.8:2.5));
      }
    }
    draw(ctx,screenPoint,scale,drawSprite=null){
      for(const p of this.items){
        const q=screenPoint({x:p.x,y:p.y}),alpha=Math.max(0,1-p.age/p.life);
        if(p.shape==='original-sprite'&&drawSprite){ctx.save();ctx.globalAlpha=alpha;drawSprite(p.spriteId,q.x,q.y,p.frame||0);ctx.restore();continue;}
        const palette=PALETTES[p.palette]||PALETTES.egg;
        ctx.globalAlpha=alpha;ctx.fillStyle=palette[p.kind%palette.length];
        const r=Math.max(.45,p.size*scale);
        if(p.shape==='spark'){
          ctx.save();ctx.translate(q.x,q.y);ctx.rotate((p.age*8)+(p.kind*.4));ctx.beginPath();ctx.moveTo(0,-r*1.7);ctx.lineTo(r*.65,0);ctx.lineTo(0,r*1.7);ctx.lineTo(-r*.65,0);ctx.closePath();ctx.fill();ctx.restore();
        }else if(p.shape==='drop'){
          ctx.beginPath();ctx.ellipse(q.x,q.y,r*.65,r*1.35,0,0,Math.PI*2);ctx.fill();
        }else{
          ctx.beginPath();ctx.arc(q.x,q.y,r,0,Math.PI*2);ctx.fill();
        }
      }
      ctx.globalAlpha=1;
    }
    clear(){this.items.length=0;}
  }
  return {ParticleSystem,PALETTES};
});
