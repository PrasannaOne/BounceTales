(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BounceTerrainCollision=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const EPS=1e-5,SKIN=0.02;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dot=(ax,ay,bx,by)=>ax*bx+ay*by;

  function signedArea(vertices){
    let area=0;
    for(let i=0;i<vertices.length-1;i++){
      const a=vertices[i],b=vertices[i+1];area+=a.x*b.y-b.x*a.y;
    }
    return area*.5;
  }
  function pointInside(x,y,vertices){
    let inside=false;
    // RLEF geometry stores a closed contour: the last point repeats the first.
    const count=vertices.length>1&&Math.hypot(vertices[0].x-vertices.at(-1).x,vertices[0].y-vertices.at(-1).y)<EPS?vertices.length-1:vertices.length;
    for(let i=0,j=count-1;i<count;j=i++){
      const a=vertices[i],b=vertices[j];
      if(((a.y>y)!==(b.y>y))&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
    }
    return inside;
  }
  function edgeNormal(poly,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
    const area=Number.isFinite(poly.area)?poly.area:signedArea(poly.vertices);
    // RLEF geometry contours are wound. The left normal is outward for a
    // clockwise contour; the right normal is outward for a counter-clockwise one.
    return area<0?{x:-dy/len,y:dx/len}:{x:dy/len,y:-dx/len};
  }
  function closestPoint(body,a,b){
    const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
    const t=len2>EPS?clamp(((body.x-a.x)*dx+(body.y-a.y)*dy)/len2,0,1):0;
    return {x:a.x+t*dx,y:a.y+t*dy,t};
  }
  function nearestExit(body,poly,radius){
    const v=poly.vertices;let best=null;
    for(let i=0;i<v.length-1;i++){
      const a=v[i],b=v[i+1],dx=b.x-a.x,dy=b.y-a.y;
      if(dx*dx+dy*dy<EPS*EPS)continue;
      const q=closestPoint(body,a,b),n=edgeNormal(poly,a,b);
      const signed=dot(body.x-q.x,body.y-q.y,n.x,n.y);
      const push=Math.max(0,radius+SKIN-signed);
      const candidate={x:body.x+n.x*push,y:body.y+n.y*push,nx:n.x,ny:n.y,
        correction:push,boundaryDistance:Math.hypot(body.x-q.x,body.y-q.y),penetration:radius-signed};
      // Choose the smallest actual correction. The previous version selected
      // the deepest overlap across all meshes, which could eject Bounce through
      // the underside of a broad terrain mesh instead of the nearby grass top.
      if(!best||candidate.correction<best.correction)best=candidate;
    }
    return best;
  }
  function nearestOverlap(body,poly,radius){
    if(poly.nocollide||poly.vertices.length<4)return null;
    const v=poly.vertices;
    if(pointInside(body.x,body.y,v))return nearestExit(body,poly,radius);
    let best=null;
    for(let i=0;i<v.length-1;i++){
      const a=v[i],b=v[i+1],dx=b.x-a.x,dy=b.y-a.y;
      if(dx*dx+dy*dy<EPS*EPS)continue;
      const q=closestPoint(body,a,b),n=edgeNormal(poly,a,b);
      const ox=body.x-q.x,oy=body.y-q.y,distance=Math.hypot(ox,oy);
      if(distance>=radius+SKIN)continue;
      const signed=dot(ox,oy,n.x,n.y);
      const vn=dot(body.vx||0,body.vy||0,n.x,n.y);
      // A centre on the solid side is handled by the polygon containment path.
      // Outside the contour, only correct motion which is pressing into it.
      if(signed<-EPS||vn>EPS)continue;
      const push=Math.max(0,radius+SKIN-signed);
      const candidate={x:body.x+n.x*push,y:body.y+n.y*push,nx:n.x,ny:n.y,
        correction:push,boundaryDistance:distance,penetration:radius-signed};
      if(!best||candidate.correction<best.correction)best=candidate;
    }
    return best;
  }
  function resolveOverlaps(body,polygons,radius,passes=6){
    passes=Math.max(1,Math.min(8,Math.trunc(Number(passes)||6)));
    let resolved=0;
    for(let pass=0;pass<passes;pass++){
      let best=null;
      for(const poly of polygons){
        const candidate=nearestOverlap(body,poly,radius);
        if(candidate&&candidate.correction>EPS&&(!best||candidate.correction<best.correction))best=candidate;
      }
      if(!best)break;
      body.x=best.x;body.y=best.y;
      if(typeof body.land==='function')body.land(best.nx,best.ny,0);
      resolved++;
    }
    return resolved;
  }
  function raySegment(sx,sy,dx,dy,a,b){
    const ex=b.x-a.x,ey=b.y-a.y,den=dx*ey-dy*ex;
    if(Math.abs(den)<EPS)return null;
    const ax=a.x-sx,ay=a.y-sy;
    const t=(ax*ey-ay*ex)/den,u=(ax*dy-ay*dx)/den;
    if(t<-EPS||t>1+EPS||u<-EPS||u>1+EPS)return null;
    return {t:clamp(t,0,1),u:clamp(u,0,1)};
  }
  function sweepAgainstPolygon(sx,sy,ex,ey,poly,radius){
    const v=poly.vertices,dx=ex-sx,dy=ey-sy;
    if(Math.abs(dx)+Math.abs(dy)<EPS)return null;
    let best=null;
    const accept=(t,nx,ny,kind)=>{
      if(t<-EPS||t>1+EPS||dot(dx,dy,nx,ny)>=-EPS)return;
      if(!best||t<best.t)best={t:clamp(t,0,1),nx,ny,kind};
    };
    for(let i=0;i<v.length-1;i++){
      const a=v[i],b=v[i+1],exx=b.x-a.x,eyy=b.y-a.y;
      if(exx*exx+eyy*eyy<EPS*EPS)continue;
      const n=edgeNormal(poly,a,b),d0=dot(sx-a.x,sy-a.y,n.x,n.y),d1=dot(ex-a.x,ey-a.y,n.x,n.y);
      // Sweep the circle centre against the contour translated outward by r.
      // This is the line-contact construction used by BounceObject.checkCollisions.
      if(d0>=radius-EPS&&d1<radius&&d1<d0){
        const t=(d0-radius)/(d0-d1),hx=sx+dx*t,hy=sy+dy*t;
        const along=dot(hx-a.x,hy-a.y,exx,eyy)/(exx*exx+eyy*eyy);
        if(along>=-EPS&&along<=1+EPS)accept(t,n.x,n.y,'edge');
      }
      // Endpoint circles reproduce the original vertex contact test.
      for(const point of [a,b]){
        const mx=sx-point.x,my=sy-point.y,aa=dx*dx+dy*dy;
        const bb=2*(mx*dx+my*dy),cc=mx*mx+my*my-radius*radius,disc=bb*bb-4*aa*cc;
        if(disc<0||aa<EPS)continue;
        const t=(-bb-Math.sqrt(disc))/(2*aa);
        if(t<-EPS||t>1+EPS)continue;
        const hx=sx+dx*t,hy=sy+dy*t,len=Math.hypot(hx-point.x,hy-point.y)||1;
        accept(t,(hx-point.x)/len,(hy-point.y)/len,'vertex');
      }
    }
    return best;
  }
  function resolveCirclePolygons(body,polygons,dt,passes=6,previous=null){
    passes=Math.max(1,Math.min(8,Math.trunc(Number(passes)||6)));
    const radius=body.radius;if(!(radius>0)||!Number.isFinite(body.x)||!Number.isFinite(body.y))return 0;
    const start=previous?{x:previous.x,y:previous.y}:{x:body.x,y:body.y};
    let sx=start.x,sy=start.y,ex=body.x,ey=body.y,remaining=Math.max(0,dt),resolved=0;

    // Recover pre-existing penetration first. This also protects against a
    // previous frame being interrupted by tab suspension or a long render stall.
    const startBody={x:sx,y:sy,vx:body.vx,vy:body.vy,land:body.land?.bind(body)};
    resolved+=resolveOverlaps(startBody,polygons,radius,passes);
    sx=startBody.x;sy=startBody.y;

    // A swept pass is important on touch devices: a fast jump can cross a thin
    // edge between two display frames even though neither end point overlaps it.
    for(let pass=0;pass<passes&&remaining>1e-6;pass++){
      let hit=null;
      for(const poly of polygons){
        if(poly.nocollide||poly.vertices.length<4)continue;
        const candidate=sweepAgainstPolygon(sx,sy,ex,ey,poly,radius);
        if(candidate&&(!hit||candidate.t<hit.t))hit=candidate;
      }
      if(!hit){sx=ex;sy=ey;remaining=0;break;}
      const travel=hit.t;
      sx+= (ex-sx)*travel + hit.nx*SKIN;
      sy+= (ey-sy)*travel + hit.ny*SKIN;
      remaining*=1-travel;
      body.x=sx;body.y=sy;
      if(typeof body.land==='function')body.land(hit.nx,hit.ny,remaining);
      ex=sx+body.vx*remaining;ey=sy+body.vy*remaining;
      resolved++;
      if(travel>=1-EPS)break;
    }
    body.x=sx;body.y=sy;
    resolved+=resolveOverlaps(body,polygons,radius,passes);
    return resolved;
  }
  return {pointInside,signedArea,edgeNormal,nearestExit,sweepAgainstPolygon,resolveOverlaps,resolveCirclePolygons};
});
