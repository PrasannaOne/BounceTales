(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceFixed16=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const ONE=65536, HALF=32768, INT_MIN=-2147483648, INT_MAX=2147483647;
  const asI32=value=>value|0;
  const toFixed16=value=>{
    const n=Number(value);
    if(!Number.isFinite(n))return 0;
    return asI32(Math.trunc(n*ONE));
  };
  const fromFixed16=value=>(value|0)/ONE;
  const mul=(a,b)=>asI32(Number((BigInt(a|0)*BigInt(b|0))>>16n));
  const div=(a,b)=>{
    if(!(b|0))throw new RangeError('16.16 division by zero');
    return asI32(Number((BigInt(a|0)<<16n)/BigInt(b|0)));
  };
  const lerp=(a,b,t16)=>Number(BigInt(a|0)+((BigInt((b|0)-(a|0))*BigInt(t16|0))>>16n))|0;
  const sqrtBigInt=value=>{
    if(value<0n)throw new RangeError('square root of negative integer');
    if(value<2n)return value;
    let x=value,y=(x+1n)>>1n;
    const bitLength=value.toString(2).length;
    const iterationLimit=Math.min(512,bitLength*2+8);
    for(let i=0;i<iterationLimit&&y<x;i++){x=y;y=(x+value/x)>>1n;}
    return x;
  };
  const length16=(x,y)=>Number(sqrtBigInt(BigInt(x|0)*BigInt(x|0)+BigInt(y|0)*BigInt(y|0)));
  const dotShift16=(ax,ay,bx,by)=>(BigInt(ax|0)*BigInt(bx|0)+BigInt(ay|0)*BigInt(by|0))>>16n;
  const transformPoint=(m,x16,y16)=>{
    const x=Number((BigInt(m[0]|0)*BigInt(x16|0)+BigInt(m[1]|0)*BigInt(y16|0))>>16n)+(m[2]|0);
    const y=Number((BigInt(m[3]|0)*BigInt(x16|0)+BigInt(m[4]|0)*BigInt(y16|0))>>16n)+(m[5]|0);
    return {x:asI32(x),y:asI32(y)};
  };
  const toPair=value=>Array.isArray(value)?[value[0]|0,value[1]|0]:[value.x|0,value.y|0];
  return {ONE,HALF,INT_MIN,INT_MAX,asI32,toFixed16,fromFixed16,mul,div,lerp,sqrtBigInt,length16,dotShift16,transformPoint,toPair};
});
