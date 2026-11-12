(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BounceTerrainCollision=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  function pointInside(x,y,vertices){
    let inside=false;
    for(let i=0,j=vertices.length-2;i<vertices.length-1;j=i++){
      const a=vertices[i],b=vertices[j];
      if(((a.y>y)!==(b.y>y))&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y+1e-12)+a.x)inside=!inside;
    }
    return inside;
  }

  function edgeNormal(poly,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    // Same winding-dependent normal orientation used by the original geometry pass.
    return poly.area<0?{x:-dy/len,y:dx/len}:{x:dy/len,y:-dx/len};
  }

  function nearestExit(body,poly,radius){
    const v=poly.vertices;let best=null;
    for(let i=0;i<v.length-1;i++){
      const a=v[i],b=v[i+1],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
      if(len2<1e-10)continue;
      const t=Math.max(0,Math.min(1,((body.x-a.x)*dx+(body.y-a.y)*dy)/len2));
      const qx=a.x+t*dx,qy=a.y+t*dy,n=edgeNormal(poly,a,b);
      const signed=(body.x-qx)*n.x+(body.y-qy)*n.y;
      const d2=(body.x-qx)**2+(body.y-qy)**2;
      const candidate={x:qx+n.x*(radius+.015),y:qy+n.y*(radius+.015),nx:n.x,ny:n.y,penetration:radius-signed,d2};
      if(!best||d2<best.d2)best=candidate;
    }
    return best;
  }

  function sweepAgainstPolygon(sx,sy,ex,ey,poly,radius){
    const v=poly.vertices,dx=ex-sx,dy=ey-sy;
    if(Math.abs(dx)+Math.abs(dy)<1e-10)return null;
    let best=null;
    const accept=(t,nx,ny)=>{
      if(t<0||t>1||dx*nx+dy*ny>=-1e-8)return;
      if(!best||t<best.t)best={t,nx,ny};
    };
    for(let i=0;i<v.length-1;i++){
      const a=v[i],b=v[i+1],exx=b.x-a.x,eyy=b.y-a.y,len=Math.hypot(exx,eyy);
      if(len<1e-8)continue;
      const n=edgeNormal(poly,a,b);
      const d0=(sx-a.x)*n.x+(sy-a.y)*n.y;
      const d1=(ex-a.x)*n.x+(ey-a.y)*n.y;
      if(d0>=radius-1e-8&&d1<radius&&d1<d0){
        const t=(d0-radius)/(d0-d1),hx=sx+dx*t,hy=sy+dy*t;
        const projection=(hx-a.x)*(exx/len)+(hy-a.y)*(eyy/len);
        if(projection>=-1e-5&&projection<=len+1e-5)accept(t,n.x,n.y);
      }
      // Rounded contour ends: sweep the player centre against each vertex circle.
      for(const point of [a,b]){
        const mx=sx-point.x,my=sy-point.y;
        const aa=dx*dx+dy*dy,bb=2*(mx*dx+my*dy),cc=mx*mx+my*my-radius*radius;
        const disc=bb*bb-4*aa*cc;
        if(disc<0||aa<1e-12)continue;
        const t=(-bb-Math.sqrt(disc))/(2*aa);
        if(t<0||t>1)continue;
        const hx=sx+dx*t,hy=sy+dy*t,nlen=Math.hypot(hx-point.x,hy-point.y)||1;
        accept(t,(hx-point.x)/nlen,(hy-point.y)/nlen);
      }
    }
    return best;
  }

  function resolveOverlaps(body,polygons,radius,passes){
    let resolved=0;
    for(let pass=0;pass<passes;pass++){
      let best=null;
      for(const poly of polygons){
        if(poly.nocollide||poly.vertices.length<4)continue;
        if(pointInside(body.x,body.y,poly.vertices)){
          const exit=nearestExit(body,poly,radius);
          if(exit&&(!best||exit.penetration>best.penetration))best=exit;
          continue;
        }
        const v=poly.vertices;
        for(let i=0;i<v.length-1;i++){
          const a=v[i],b=v[i+1],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
          if(len2<1e-10)continue;
          const t=Math.max(0,Math.min(1,((body.x-a.x)*dx+(body.y-a.y)*dy)/len2));
          const qx=a.x+t*dx,qy=a.y+t*dy,ddx=body.x-qx,ddy=body.y-qy;
          const distance=Math.hypot(ddx,ddy);if(distance>=radius)continue;
          const n=edgeNormal(poly,a,b),signed=ddx*n.x+ddy*n.y;
          if(signed>0&&body.vx*n.x+body.vy*n.y>=0)continue;
          const candidate={nx:n.x,ny:n.y,penetration:radius-signed};
          if(!best||candidate.penetration>best.penetration)best=candidate;
        }
      }
      if(!best||best.penetration<=0)break;
      if(best.x!==undefined){body.x=best.x;body.y=best.y;}
      else{body.x+=best.nx*(best.penetration+.015);body.y+=best.ny*(best.penetration+.015);}
      body.land(best.nx,best.ny,0);resolved++;
    }
    return resolved;
  }

  // Swept circle vs. polygon edges/endpoints, followed by overlap recovery.
  // This is closer to BounceObject.checkCollisions than the earlier end-position
  // only resolver, but its floating-point response is still an approximation of
  // the original LP32/16.16 multi-contact solver.
  function resolveCirclePolygons(body,polygons,dt,passes=4,previous=null){
    const radius=body.radius;if(!(radius>0))return 0;
    let resolved=0;
    const start=previous?{x:previous.x,y:previous.y}:{x:body.x,y:body.y};
    let sx=start.x,sy=start.y,remaining=Math.max(0,dt);
    let ex=body.x,ey=body.y;

    // If a frame begins with the centre embedded, eject it before the swept pass.
    for(const poly of polygons){
      if(!poly.nocollide&&poly.vertices.length>=4&&pointInside(sx,sy,poly.vertices)){
        const exit=nearestExit({x:sx,y:sy},poly,radius);
        if(exit){sx=exit.x;sy=exit.y;resolved++;}
      }
    }

    for(let pass=0;pass<passes&&remaining>1e-5;pass++){
      let hit=null;
      for(const poly of polygons){
        if(poly.nocollide||poly.vertices.length<4)continue;
        const candidate=sweepAgainstPolygon(sx,sy,ex,ey,poly,radius);
        if(candidate&&(!hit||candidate.t<hit.t))hit=candidate;
      }
      if(!hit){sx=ex;sy=ey;remaining=0;break;}
      const travel=Math.max(0,Math.min(1,hit.t));
      sx=sx+(ex-sx)*travel+hit.nx*.015;
      sy=sy+(ey-sy)*travel+hit.ny*.015;
      remaining*=1-travel;
      body.x=sx;body.y=sy;
      body.land(hit.nx,hit.ny,remaining);
      ex=sx+body.vx*remaining;ey=sy+body.vy*remaining;
      resolved++;
    }
    body.x=sx;body.y=sy;
    resolved+=resolveOverlaps(body,polygons,radius,passes);
    return resolved;
  }

  return {pointInside,sweepAgainstPolygon,resolveCirclePolygons};
});
