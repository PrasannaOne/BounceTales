(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BounceRLEF=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  class Reader{
    constructor(bytes){this.b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);this.v=new DataView(this.b.buffer,this.b.byteOffset,this.b.byteLength);this.p=0;}
    need(n){if(this.p+n>this.b.length)throw new Error('RLEF truncated at '+this.p+' (need '+n+')');}
    u8(){this.need(1);return this.v.getUint8(this.p++);}
    i8(){this.need(1);return this.v.getInt8(this.p++);}
    u16(){this.need(2);const x=this.v.getUint16(this.p,false);this.p+=2;return x;}
    i16(){this.need(2);const x=this.v.getInt16(this.p,false);this.p+=2;return x;}
    u32(){this.need(4);const x=this.v.getUint32(this.p,false);this.p+=4;return x;}
    i32(){this.need(4);const x=this.v.getInt32(this.p,false);this.p+=4;return x;}
    f32(){this.need(4);const x=this.v.getFloat32(this.p,false);this.p+=4;return x;}
    bytes(n){this.need(n);const x=this.b.slice(this.p,this.p+n);this.p+=n;return x;}
  }
  class BitReader{
    constructor(bytes){this.bytes=bytes;this.bit=0;}
    signed(bits){
      if(bits<=0||bits>32)throw new Error('invalid packed bit width '+bits);
      let value=0;
      for(let i=0;i<bits;i++){
        const byteIndex=this.bit>>3, bitIndex=this.bit&7;
        if(byteIndex>=this.bytes.length)throw new Error('packed data truncated');
        value|=((this.bytes[byteIndex]>>bitIndex)&1)<<i;
        this.bit++;
      }
      if(bits<32){const sign=1<<(bits-1);if(value&sign)value|=(-1<<bits);}
      return value|0;
    }
    values(count,bits,base=0,shift=0){
      const arr=new Array(count);
      for(let i=0;i<count;i++)arr[i]=(base+this.signed(bits))*(shift?65536:1);
      return arr;
    }
    consumedBytes(){return Math.ceil(this.bit/8);}
  }
  function parseCommon(r){
    const parent=r.i16(),previous=r.i16(),transformFlags=r.i8();
    let m=[65536,0,0,0,65536,0];
    if((transformFlags&7)===7)m=[r.i32(),r.i32(),r.i32(),r.i32(),r.i32(),r.i32()];
    else{
      if(transformFlags&1){m[2]=r.i16()*65536;m[5]=r.i16()*65536;}
      if(transformFlags&2){const a=r.i32()/65536,co=Math.cos(a),si=Math.sin(a);m[0]=Math.trunc(co*65536);m[1]=Math.trunc(-si*65536);m[3]=Math.trunc(si*65536);m[4]=Math.trunc(co*65536);}
      if(transformFlags&4){m[0]=r.i32();m[4]=r.i32();}
    }
    const flags=r.i32();
    return {parent,previous,transformFlags,matrix:m,flags};
  }
  function parsePayload(cmd,data,id){
    const r=new Reader(data);
    const base=parseCommon(r);
    const o={id,cmd,...base};
    if(cmd===4){
      const vertexCount=r.i16(),faceCount=r.i16(),color=r.u32(),bits=r.i8(),baseX=r.i16();
      const restX=r.bytes(Math.ceil(vertexCount*bits/8));const xr=new BitReader(restX);
      const xs=xr.values(vertexCount,bits,baseX,true);
      const baseY=r.i16();const restY=r.bytes(Math.ceil(vertexCount*bits/8));const yr=new BitReader(restY);
      const ys=yr.values(vertexCount,bits,baseY,true);
      const faceBits=r.i8();const restF=r.bytes(Math.ceil(faceCount*faceBits/8));const fr=new BitReader(restF);
      const faces=fr.values(faceCount,faceBits,0,false);
      const eventId=r.i16();
      const vertices16=xs.map((x,i)=>[x|0,ys[i]|0]);vertices16.push(vertices16[0].slice());
      const vertices=vertices16.map(v=>[v[0]/65536,v[1]/65536]);
      o.type='geometry';o.vertices=vertices;o.vertices16=vertices16;o.faces=faces;o.color=color&0xffffff;o.eventId=eventId;
    }else if(cmd===6){
      o.type='event';o.bbox=[r.i16(),r.i16(),r.i16(),r.i16()];o.eventType=r.i8();o.triggerByLeave=r.i8();o.repeatable=r.i8();o.triggerObjId=r.i16();
      const count=r.i8();o.commands=[];
      for(let i=0;i<count;i++){const size=r.i8();o.commands.push(Array.from(r.bytes(size)));}
    }else if(cmd===8){o.type='player';}
    else if(cmd===9){
      o.type='sprite';const count=r.u8();o.sprites=[];
      if(count){const bits=r.u8(),bx=r.i16(),by=r.i16();let xs,ys;
        if(bits){const xdata=r.bytes(Math.ceil(count*bits/8));xs=new BitReader(xdata).values(count,bits,bx,false);const ydata=r.bytes(Math.ceil(count*bits/8));ys=new BitReader(ydata).values(count,bits,by,false);}
        else{xs=Array(count).fill(bx);ys=Array(count).fill(by);}
        const idata=r.bytes(count*2),ir=new BitReader(idata);for(let i=0;i<count;i++)o.sprites.push([xs[i],ys[i],ir.signed(16)]);
      }
    }else if(cmd===10){
      o.type='water';o.areaMinX=r.i16();o.areaMaxY=r.i16();o.areaMaxX=r.i16();o.areaMinY=r.i16();o.gravityYTop=r.i8();o.gravityXRight=r.i8();o.gravityYBottom=r.i8();o.gravityXLeft=r.i8();o.color=r.u32()&0xffffff;o.region=(o.color&255)===16?1:0;o.isAirTunnel=o.color===0;
    }else if(cmd===11){o.type='cannon';o.targetObject=r.i16();o.power=r.i8();}
    else if(cmd===12){o.type='trampoline';o.imageId=r.i16();o.basePush=r.i8();}
    else if(cmd===13){o.type='egg';}
    else if(cmd===14){o.type='friend';}
    else if(cmd===15){o.type='enemy';o.movePoint1X=r.i16();o.movePoint1Y=r.i16();o.movePoint2X=r.i16();o.movePoint2Y=r.i16();o.movePoints=[[o.movePoint1X,o.movePoint1Y],[o.movePoint2X,o.movePoint2Y]];o.enemyType=r.i8();}
    else{o.type='root';}
    if(r.p!==r.b.length)throw new Error('record '+id+' cmd '+cmd+' consumed '+r.p+'/'+r.b.length);
    return o;
  }
  function parse(bytes){
    const r=new Reader(bytes),magic=r.u32(),version=r.u32();
    if(magic!==0x524c4546)throw new Error('not an RLEF file');
    const objectCount=r.u16();r.u16();const eventCount=r.u16(),objects=[];
    let terminated=false,recordGuard=0;
    while(r.p<r.b.length&&recordGuard++<r.b.length){
      const recordStart=r.p;
      const cmd=r.i8();
      if(cmd===127){terminated=true;break;}
      const size=r.i16();if(size<0)throw new Error('negative record size');
      const payload=r.bytes(size);objects.push(parsePayload(cmd,payload,objects.length));
      if(r.p<=recordStart)throw new Error('RLEF parser made no forward progress at '+recordStart);
    }
    if(!terminated)throw new Error('RLEF terminator missing');
    const actualEvents=objects.filter(x=>x.type==='event').length;
    if(objects.length!==objectCount)throw new Error('object count mismatch '+objects.length+'/'+objectCount);
    if(actualEvents!==eventCount)throw new Error('event count mismatch '+actualEvents+'/'+eventCount);
    return {version,objectCount,eventCount,objects};
  }
  function compose(a,b){
    return [
      (a[0]*b[0]+a[1]*b[3])/65536,
      (a[0]*b[1]+a[1]*b[4])/65536,
      (a[0]*b[2]+a[1]*b[5])/65536+a[2],
      (a[3]*b[0]+a[4]*b[3])/65536,
      (a[3]*b[1]+a[4]*b[4])/65536,
      (a[3]*b[2]+a[4]*b[5])/65536+a[5]
    ];
  }
  function buildWorld(objects){
    const byId=new Map(objects.map(o=>[o.id,o])),cache=new Map(),busy=new Set();
    function get(id){
      if(cache.has(id))return cache.get(id);
      if(busy.has(id))throw new Error('RLEF parent cycle at '+id);
      busy.add(id);const o=byId.get(id);if(!o)throw new Error('missing parent '+id);
      const parent=o.parent>=0?get(o.parent):[65536,0,0,0,65536,0];
      const result=compose(parent,o.matrix);busy.delete(id);cache.set(id,result);return result;
    }
    for(const o of objects)get(o.id);
    return cache;
  }
  return {parse,buildWorld,compose};
});
