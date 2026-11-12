(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceGameParticles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  class ParticleSystem{
    constructor(random=Math.random){this.items=[];this.random=random;}
    emitEgg(x,y,count=9){
      for(let i=0;i<count;i++){
        const angle=(Math.PI*2*i/count)+(this.random()-.5)*.22,speed=48+this.random()*115;
        this.items.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed+40,age:0,life:.38+this.random()*.24,size:1+this.random()*1.5,kind:i%3});
      }
    }
    emitLanding(x,y,power=1){
      const count=Math.max(3,Math.min(12,Math.round(4+power*4)));
      for(let i=0;i<count;i++){
        const angle=Math.PI+(this.random()-.5)*Math.PI,speed=25+this.random()*75*power;
        this.items.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,age:0,life:.25+this.random()*.22,size:.8+this.random()*1.1,kind:3});
      }
    }
    update(dt){
      for(let i=this.items.length-1;i>=0;i--){const p=this.items[i];p.age+=dt;if(p.age>=p.life){this.items.splice(i,1);continue;}p.vy-=250*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.max(0,1-dt*2.5);}
    }
    draw(ctx,screenPoint,scale){
      for(const p of this.items){const q=screenPoint({x:p.x,y:p.y});ctx.globalAlpha=Math.max(0,1-p.age/p.life);ctx.fillStyle=p.kind===0?'#fff4c9':p.kind===1?'#ffcf70':p.kind===2?'#f28b37': '#d8ef9a';ctx.beginPath();ctx.arc(q.x,q.y,Math.max(.45,p.size*scale),0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;
    }
    clear(){this.items.length=0;}
  }
  return {ParticleSystem};
});
