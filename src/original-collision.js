(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalCollision=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const FP=typeof BounceFixed16!=='undefined'?BounceFixed16:null;
  const ONE=65536n, ZERO=0n;
  const i32=n=>Number(n)|0;
  const B=n=>BigInt(n|0);
  const sqrt=n=>FP?FP.sqrtBigInt(n):sqrtFallback(n);
  function sqrtFallback(n){if(n<0n)throw new RangeError('sqrt');if(n<2n)return n;let x=n,y=(x+1n)>>1n;while(y<x){x=y;y=(x+n/x)>>1n;}return x;}
  const wrap=(n)=>Number(BigInt.asIntN(32,BigInt(n)))|0;
  const toFixed=value=>FP?FP.toFixed16(value):wrap(Math.trunc(value*65536));
  const fromFixed=value=>(value|0)/65536;
  const shift16=n=>n>>16n;

  // Exact integer translation of c.class's swept edge/endpoint intersection helpers.
  function sweptOffsetEdge(x0,y0,dx,dy,x1,y1,x2,y2,radiusSquared16){
    const X0=B(x0),Y0=B(y0),DX=B(dx),DY=B(dy),X1=B(x1),Y1=B(y1),X2=B(x2),Y2=B(y2);
    const a=(X1*DY)>>16n,b=(Y1*DX)>>16n,c=(X2*DY)>>16n,d=(Y2*DX)>>16n;
    const den=a-b-c+d;
    if(den===0n)return null;
    const t=(((a-b+((DX*Y0)>>16n)-((DY*X0)>>16n))<<16n)/den);
    if(t<0n||t>ONE)return null;
    const u=((X1*(Y2-Y0)+Y1*(X0-X2)+X2*Y0-Y2*X0)/den);
    if(u>=0n&&u<=ONE){
      return {t:i32(u),edgeT:i32(t),x:wrap(X0+((u*DX)>>16n)),y:wrap(Y0+((u*DY)>>16n)),vertex:false};
    }
    if(u<0n){
      const ex=X2-X1,ey=Y2-Y1,px=X0-X1,py=Y0-Y1;
      let along=(px*ex+py*ey)>>16n;
      if(along<=0n)return null;
      const lenSq=(ex*ex+ey*ey)>>16n;
      if(along>=lenSq||lenSq===0n)return null;
      along=(along<<16n)/lenSq;
      const qx=X1+((along*ex)>>16n),qy=Y1+((along*ey)>>16n);
      const rx=qx-X0,ry=qy-Y0;
      if(((rx*rx+ry*ry)>>16n)>B(radiusSquared16))return null;
      return {t:0,x:wrap(qx),y:wrap(qy),vertex:true};
    }
    return null;
  }

  function sweptCircleEndpoint(x0,y0,dirX,dirY,distance,centerX,centerY,radius){
    const px=B(x0)-B(centerX),py=B(y0)-B(centerY),DX=B(dirX),DY=B(dirY),R=B(radius);
    const along=(px*DX+py*DY)>>16n;
    if(along>=0n)return null;
    const distanceSquared=(px*px+py*py)>>16n;
    const radiusSquared=(R*R)<<16n;
    const diff=distanceSquared-radiusSquared;
    if(diff<=0n){
      const length=sqrt(px*px+py*py);
      const ox=length===0n?0n:((px*R)<<16n)/length;
      const oy=length===0n?0n:((py*R)<<16n)/length;
      return {t:0,x:wrap(B(centerX)+ox),y:wrap(B(centerY)+oy),vertex:true,
        normalX:wrap(ox),normalY:wrap(oy)};
    }
    const discriminant=((along*along)>>16n)-diff;
    if(discriminant<0n)return null;
    const root=sqrt(discriminant<<16n);
    const travel=-along-root;
    if(travel<0n||travel>B(distance))return null;
    const t=(travel<<16n)/B(distance);
    return {t:i32(t),x:wrap(B(x0)+((travel*DX)>>16n)),y:wrap(B(y0)+((travel*DY)>>16n)),
      vertex:true,normalX:0,normalY:0};
  }

  function worldVertices(poly){
    if(Array.isArray(poly.vertices16))return poly.vertices16;
    return (poly.vertices||[]).map(p=>[toFixed(p.x),toFixed(p.y)]);
  }
  function edgeSurfaceDelta(poly,index,edgeT,currentVertices){
    const previous=Array.isArray(poly.prevVertices16)?poly.prevVertices16:currentVertices;
    const a=currentVertices[index],b=currentVertices[index+1];
    const pa=previous[index]||a,pb=previous[index+1]||b;
    const t=B(edgeT|0),inv=ONE-t;
    const dx=(((B(a[0])-B(pa[0]))*inv+(B(b[0])-B(pb[0]))*t)>>16n);
    const dy=(((B(a[1])-B(pa[1]))*inv+(B(b[1])-B(pb[1]))*t)>>16n);
    return {surfaceDX:fromFixed(wrap(dx)),surfaceDY:fromFixed(wrap(dy))};
  }
  function vertexSurfaceDelta(poly,index,currentVertices){
    const previous=Array.isArray(poly.prevVertices16)?poly.prevVertices16:currentVertices;
    const now=currentVertices[index],was=previous[index]||now;
    return {surfaceDX:fromFixed(wrap(B(now[0])-B(was[0]))),surfaceDY:fromFixed(wrap(B(now[1])-B(was[1])))};
  }
  function chooseContact(candidates,startX,startY){
    let selected=null,selectedDistance=null;
    for(const hit of candidates){
      const dx=B(hit.x)-B(startX),dy=B(hit.y)-B(startY);
      let d=dx*dx+dy*dy;
      if(hit.vertex)d=-d;
      if(d>42949672960000n)continue;
      if(selected===null||d<selectedDistance){selected=hit;selectedDistance=d;}
    }
    return selected;
  }

  function applySourceResponse(body,hit,dtMs){
    const mode=Math.max(0,Math.min(2,body.forme|0));
    const nxRaw=hit.normalX,nyRaw=hit.normalY;
    const length=Math.hypot(nxRaw,nyRaw);
    if(!(length>0))return false;
    const nx=nxRaw/length,ny=nyRaw/length;
    const restitution=[0.1,0.1,0.1][mode];
    const contactX=fromFixed(hit.x),contactY=fromFixed(hit.y);
    const currentX=fromFixed(body.x16),currentY=fromFixed(body.y16);
    // The contact arrays in c.class also retain the contacted surface's frame
    // displacement. Static level geometry naturally supplies zero here.
    const surfaceDX=Number(hit.surfaceDX||0),surfaceDY=Number(hit.surfaceDY||0);
    const surfaceVX=surfaceDX*1000/Math.max(1,dtMs);
    const surfaceVY=surfaceDY*1000/Math.max(1,dtMs);
    let offsetX=currentX-contactX,offsetY=currentY-contactY;
    const offsetDot=offsetX*nx+offsetY*ny;
    const normalOffsetX=offsetDot*nx,normalOffsetY=offsetDot*ny;
    offsetX=offsetX-normalOffsetX-normalOffsetX*restitution;
    offsetY=offsetY-normalOffsetY-normalOffsetY*restitution;
    const surfaceNormal=(surfaceVX*nx+surfaceVY*ny);
    // c.class reconstructs the actor transform from the moving contact point,
    // retained tangent offset, surface-normal motion and a 0.01-unit skin.
    body.x16=toFixed(contactX+surfaceDX+offsetX+surfaceNormal*nx*dtMs/1000+nx*0.01);
    body.y16=toFixed(contactY+surfaceDY+offsetY+surfaceNormal*ny*dtMs/1000+ny*0.01);
    body.x=fromFixed(body.x16);body.y=fromFixed(body.y16);

    // Exact c.class response: reflect the actor's normal velocity with form
    // restitution, then inherit the contacted surface's normal velocity.
    const normalVelocity=body.vx*nx+body.vy*ny;
    const normalVX=normalVelocity*nx,normalVY=normalVelocity*ny;
    const tangentialVX=body.vx-normalVX-normalVX*restitution;
    const tangentialVY=body.vy-normalVY-normalVY*restitution;
    const nextVX=surfaceNormal*nx+tangentialVX;
    const nextVY=surfaceNormal*ny+tangentialVY;
    const relativeVX=nextVX-surfaceVX,relativeVY=nextVY-surfaceVY;

    // c.class compares the acceleration required to stop relative motion
    // against friction from gravity along the contact normal. Note that the
    // source formula has no actor-radius multiplier.
    const gravityFactor=[1,1.4,0.5][mode];
    const frictionCoefficient=[0.6,0.3,0.6][mode];
    const scale=1000/Math.max(1,dtMs);
    const requiredX=relativeVX*gravityFactor*scale;
    const requiredY=relativeVY*gravityFactor*scale;
    const relativeSpeed=Math.hypot(relativeVX,relativeVY);
    const frictionMagnitude=frictionCoefficient*gravityFactor*400*ny;
    const frictionX=relativeSpeed>1e-8?relativeVX/relativeSpeed*frictionMagnitude:0;
    const frictionY=relativeSpeed>1e-8?relativeVY/relativeSpeed*frictionMagnitude:0;
    if(requiredX*requiredX+requiredY*requiredY<frictionX*frictionX+frictionY*frictionY){
      body.gravityX-=requiredX;body.gravityY-=requiredY;
    }else{
      body.gravityX-=frictionX;body.gravityY-=frictionY;
    }
    body.vx=nextVX;body.vy=nextVY;
    body.torqueX=body.torqueX*(1-0.5)+relativeVX*0.5;
    body.torqueY=body.torqueY*(1-0.5)+relativeVY*0.5;
    body.slopeSinAbs=nx;body.slopeCosAbs=ny;
    body.airTime=0;body.grounded=true;body.curVelocity=Math.hypot(body.vx,body.vy);
    return true;
  }

  function resolve(body,polygons,dt,previous,maxPasses=8){
    if(!body||!Array.isArray(polygons)||!previous)return {contacts:0,iterations:0};
    body.x16=Number.isInteger(body.x16)?body.x16:toFixed(body.x);
    body.y16=Number.isInteger(body.y16)?body.y16:toFixed(body.y);
    let startX=toFixed(previous.x),startY=toFixed(previous.y),contacts=0,iterations=0;
    const radiusWorld=Math.trunc(Number(body.radius??20)),radius=radiusWorld|0;
    const radiusFixed=radius*65536;
    const radiusSquared16=radiusWorld*radiusWorld*65536;
    const dx0=wrap(body.x16-startX),dy0=wrap(body.y16-startY);
    const movementLength=Number(sqrt(B(dx0)*B(dx0)+B(dy0)*B(dy0)));
    const dirX=movementLength?wrap((B(dx0)<<16n)/B(movementLength)):0;
    const dirY=movementLength?wrap((B(dy0)<<16n)/B(movementLength)):0;
    if(!movementLength)return {contacts:0,iterations:0};
    const dtMs=Math.max(1,Math.round(dt*1000));

    for(let pass=0;pass<maxPasses;pass++){
      iterations++;
      const endX=body.x16|0,endY=body.y16|0;
      const moveX=wrap(endX-startX),moveY=wrap(endY-startY);
      const moveLength=Number(sqrt(B(moveX)*B(moveX)+B(moveY)*B(moveY)));
      if(!moveLength)break;
      const dX=wrap((B(moveX)<<16n)/B(moveLength));
      const dY=wrap((B(moveY)<<16n)/B(moveLength));
      const candidates=[];
      const minX=Math.min(startX,endX)-radiusFixed,maxX=Math.max(startX,endX)+radiusFixed;
      const minY=Math.min(startY,endY)-radiusFixed,maxY=Math.max(startY,endY)+radiusFixed;
      for(const poly of polygons){
        if(!poly||poly.nocollide)continue;
        const vertices=worldVertices(poly);
        if(vertices.length<4)continue;
        for(let i=0;i<vertices.length-1;i++){
          const a=vertices[i],b=vertices[i+1];
          const ax=a[0]|0,ay=a[1]|0,bx=b[0]|0,by=b[1]|0;
          if(Math.max(ax,bx)<minX||Math.min(ax,bx)>maxX||
             Math.max(ay,by)<minY||Math.min(ay,by)>maxY)continue;
          const normalX=wrap(ay-by),normalY=wrap(bx-ax);
          const approach=B(moveX)*B(normalX)+B(moveY)*B(normalY);
          if(approach>=0n)continue;
          const edgeLength=Number(sqrt(B(normalX)*B(normalX)+B(normalY)*B(normalY)));
          if(!edgeLength)continue;
          const offX=wrap((B(normalX)*BigInt(radius)<<16n)/B(edgeLength));
          const offY=wrap((B(normalY)*BigInt(radius)<<16n)/B(edgeLength));
          const hit=sweptOffsetEdge(startX,startY,moveX,moveY,
            wrap(ax+offX),wrap(ay+offY),wrap(bx+offX),wrap(by+offY),Math.trunc(radiusSquared16));
          // c.class stores at most sixteen contact candidates before selecting
          // the nearest one. Keep the same bounded working set as the J2ME actor.
          if(hit&&candidates.length<16){
            const surface=edgeSurfaceDelta(poly,i,hit.edgeT,vertices);
            candidates.push({...hit,...surface,normalX,normalY,polyId:poly.id});
          }
          for(let vi=0;vi<2&&candidates.length<16;vi++){
            const vertex=vi===0?a:b,vertexIndex=i+vi;
            const vhit=sweptCircleEndpoint(startX,startY,dX,dY,moveLength,
              vertex[0]|0,vertex[1]|0,radius);
            if(vhit){
              const nx=wrap(vhit.x-(vertex[0]|0)),ny=wrap(vhit.y-(vertex[1]|0));
              const surface=vertexSurfaceDelta(poly,vertexIndex,vertices);
              candidates.push({...vhit,...surface,normalX:nx,normalY:ny,polyId:poly.id});
            }
          }
        }
      }
      const hit=chooseContact(candidates,startX,startY);
      if(!hit)break;
      if(!applySourceResponse(body,hit,dtMs))break;
      contacts++;
      // Match c.class's next contact pass: the previous actor transform advances
      // to the selected contact point before the corrected current transform.
      startX=hit.x|0;startY=hit.y|0;
    }
    body.x=fromFixed(body.x16);body.y=fromFixed(body.y16);
    return {contacts,iterations};
  }

  return {resolve,sweptOffsetEdge,sweptCircleEndpoint,applySourceResponse,edgeSurfaceDelta,vertexSurfaceDelta,toFixed,fromFixed};
});
