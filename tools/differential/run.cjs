#!/usr/bin/env node
'use strict';
// Differential check: the ORIGINAL Bounce Tales math (decompiled class `d` + a transcription of
// g.java case 17) generates seeded reference results in a real JVM; the browser port's JavaScript
// is then scored against them. Needs a JDK/JRE 21 with the jdk.compiler module (no javac binary
// required). Exits 0 with "SKIPPED" when Java is unavailable. Usage: node tools/differential/run.cjs
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const here=__dirname,src=path.resolve(here,'..','..','src')+path.sep;
const sh=(args,opts={})=>spawnSync('java',args,{encoding:'utf8',maxBuffer:1<<28,...opts});
const probe=sh(['--list-modules']);
if(probe.error||probe.status!==0||!/jdk\.compiler/.test(probe.stdout)){console.log('SKIPPED: Java with jdk.compiler not available');process.exit(0);}
const out=fs.mkdtempSync(path.join(os.tmpdir(),'bt-diff-'));
const comp=sh(['-m','jdk.compiler/com.sun.tools.javac.Main','-d',out,...['d','Gen','Op17','Ops','Op18'].map(n=>path.join(here,n+'.java'))]);
if(comp.status!==0){console.error(comp.stdout+comp.stderr);process.exit(1);}
const gen=cls=>{const r=sh(['-cp',out,cls]);if(r.status!==0){console.error(r.stderr);process.exit(1);}return r.stdout.trim().split('\n');};
const F=require(src+'fixed-point.js'),RLEF=require(src+'rlef-reader.js'),{EventEngine}=require(src+'event-engine.js');
const evSrc=fs.readFileSync(src+'event-engine.js','utf8');
const evCompose=new Function(evSrc.match(/const mulAdd16=[^\n]*\n/)[0]+evSrc.match(/function compose\(a,b\)\{[\s\S]*?\n  \}/)[0]+';return compose;')();
const results=[];const add=(name,n,exact,maxDev)=>results.push({name,n,exact,maxDev});
const eq=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);const dev=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
const acc={};const rec=(k,ok,d)=>{const s=acc[k]||(acc[k]={n:0,exact:0,max:0});s.n++;if(ok)s.exact++;else s.max=Math.max(s.max,d);};
for(const line of gen('Gen')){
  const [lhs,rhs]=line.slice(2).split(' > ');const L=lhs.split(' ').map(Number),R=rhs.split(' ').map(Number),k=line[0];
  if(k==='T'){const p=F.toPair(F.transformPoint(L.slice(0,6),L[6],L[7]));rec('d.a(x,y) point transform  <- fixed-point.js',eq(p,R),dev(p,R));}
  else if(k==='V'){const m=L.slice(0,6);m[2]=0;m[5]=0;const p=F.toPair(F.transformPoint(m,L[6],L[7]));rec('d.b(x,y) vector transform <- fixed-point.js',eq(p,R),dev(p,R));}
  else if(k==='C'){const a=L.slice(0,6),b=L.slice(6,12);const r1=RLEF.compose(a,b),r2=evCompose(a,b);
    rec('d.b(d) matrix compose    <- rlef-reader.js',eq(r1,R),dev(r1,R));rec('d.b(d) matrix compose    <- event-engine.js',eq(r2,R),dev(r2,R));}
  else if(k==='R'){const ang=new Float32Array(new Int32Array([L[0]]).buffer)[0],f=Math.fround;
    const c=Math.trunc(f(f(Math.cos(ang))*65536)),s=Math.trunc(f(f(Math.sin(ang))*65536));rec('d.a(float) rotation       <- float32 recipe',eq([c,-s,s,c],R),dev([c,-s,s,c],R));}
}
for(const [k,s] of Object.entries(acc))add(k,s.n,s.exact,s.max);
// opcode 17 whole-command replay
const i16=n=>{const b=Buffer.alloc(2);b.writeInt16BE(n);return [...b];},i32=n=>{const b=Buffer.alloc(4);b.writeInt32BE(n);return [...b];};
let steps=0,exact=0,maxDev=0,engine,ev,cmd,obj,runs=0,runsOk=0,cur=true;
for(const line of gen('Op17')){const t=line.split(' ');
  if(t[0]==='A'||t[0]==='B')continue;
  if(t[0]==='P'){if(runs++&&cur)runsOk++;cur=true;const [angle,dur,a,b,d,e,c,f]=t.slice(1).map(Number);
    obj={id:201,type:'sprite',parent:-1,matrix:[a,b,c,d,e,f],flags:0};
    engine=new EventEngine([{id:100,type:'player',parent:-1,matrix:[65536,0,0,0,65536,0],flags:0},{id:1,type:'event',parent:-1,matrix:[65536,0,0,0,65536,0],flags:0,bbox:[-10,10,10,-10],eventType:0,triggerByLeave:0,repeatable:0,triggerObjId:100,commands:[]},obj],{strings:[],playerObjectId:100});
    ev=engine.events[0];cmd=Uint8Array.from([17,...i16(201),...i32(angle),...i32(dur),...i32(dur),...new Array(16).fill(0)]);}
  else{const [delta,a,b,d,e,c,f,rem,done]=t.slice(1).map(Number);
    const r=engine.runCommand(ev,cmd,delta,{x:0,y:0,vx:0,vy:0,pushX:0,pushY:0,gravityX:0,gravityY:0},100),m=obj.matrix,mine=[m[0],m[1],m[3],m[4],m[2],m[5]],ref=[a,b,d,e,c,f];
    const dv=dev(mine,ref),dv2=new DataView(cmd.buffer);steps++;if(dv===0)exact++;else cur=false;maxDev=Math.max(maxDev,dv);
    if(!!r.done!==!!done)cur=false;if(!done&&dv2.getInt32(11)!==rem)cur=false;if(done&&dv2.getInt32(11)!==dv2.getInt32(7))cur=false;}}
if(cur)runsOk++;
let s16=0,e16=0,runs16=0,ok16=0,cur16=true,o16,en16,ev16,cm16;
for(const line of gen('Op17')){const t=line.split(' ');
  if(t[0]==='A'){if(runs16++&&cur16)ok16++;cur16=true;const [vx,vy,dur,c,f]=t.slice(1).map(Number);
    o16={id:201,type:'sprite',parent:-1,matrix:[65536,0,c,0,65536,f],flags:0};
    en16=new EventEngine([{id:100,type:'player',parent:-1,matrix:[65536,0,0,0,65536,0],flags:0},{id:1,type:'event',parent:-1,matrix:[65536,0,0,0,65536,0],flags:0,bbox:[-10,10,10,-10],eventType:0,triggerByLeave:0,repeatable:0,triggerObjId:100,commands:[]},o16],{strings:[],playerObjectId:100});
    ev16=en16.events[0];cm16=Uint8Array.from([16,...i16(201),...i32(vx),...i32(vy),...i32(dur),...i32(dur)]);}
  else if(t[0]==='B'){const [delta,c,f,rem,done]=t.slice(1).map(Number);
    const r=en16.runCommand(ev16,cm16,delta,{x:0,y:0,vx:0,vy:0,pushX:0,pushY:0,gravityX:0,gravityY:0},100);
    const ok=o16.matrix[2]===c&&o16.matrix[5]===f&&!!r.done===!!done&&new DataView(cm16.buffer).getInt32(15)===(done?new DataView(cm16.buffer).getInt32(11):rem);
    s16++;if(ok)e16++;else cur16=false;}}
if(cur16)ok16++;
add('g.java case 16 timed translation (per step) <- event-engine.js',s16,e16,0);add('g.java case 16 timed translation (whole runs incl. timer)',runs16,ok16,0);
add('g.java case 17 timed rotation (per step)  <- event-engine.js',steps,exact,maxDev);add('g.java case 17 timed rotation (whole runs incl. timer state)',runs,runsOk,0);
// opcodes 7-15: variable set/arith (7-11) and conditional-branch decisions (12-15)
{
  const mk=()=>new EventEngine([{id:100,type:'player',parent:-1,matrix:[65536,0,0,0,65536,0],flags:0},{id:1,type:'event',parent:-1,matrix:[65536,0,0,0,65536,0],flags:0,bbox:[-10,10,10,-10],eventType:0,triggerByLeave:0,repeatable:0,triggerObjId:100,commands:[]}],{strings:[],playerObjectId:100});
  const eng=mk(),ev=eng.events[0],body={x:0,y:0,vx:0,vy:0,pushX:0,pushY:0,gravityX:0,gravityY:0},g={arith:{n:0,ok:0},branch:{n:0,ok:0}};
  for(const line of gen('Ops')){
    const [l,rr]=line.slice(2).split(' > ');const [dt,op,slot,ot,payload,init]=l.split(' ');const vals=init.split(',').map(Number),kind=line[0]==='K'?'branch':'arith';
    for(let i=0;i<8;i++)eng.vars[i]=vals[i];
    const bytes=[+op,+dt,+slot,+ot];if(ot==1||ot==2)bytes.push(+payload);else{const b4=Buffer.alloc(4);b4.writeInt32BE(+payload);bytes.push(...b4);}
    if(kind==='branch')bytes.push(9,0,0,0);
    let res;try{res=eng.runCommand(ev,Uint8Array.from(bytes),16,body,100);}catch(e){res={threw:true};}
    let ok;
    if(kind==='branch')ok=(res.branchTo!=null?1:0)===+rr;
    else if(rr==='EXC')ok=!!(res.threw||res.done===false)&&(eng.vars[+slot]|0)===vals[+slot];
    else ok=res.done===true&&(eng.vars[+slot]|0)===+rr;
    g[kind].n++;if(ok)g[kind].ok++;
  }
  add('g.java cases 7-11 variable set/add/sub/mul/div (float32 + int)',g.arith.n,g.arith.ok,0);
  add('g.java cases 12-15 conditional branch decisions',g.branch.n,g.branch.ok,0);
}
// opcode 18: move object onto another object's world position (fixed-point matrix inverse)
{
  let n=0,ok=0,exc=0;
  for(const line of gen('Op18')){
    const [l,rr]=line.slice(2).split(' > ');const t=l.trim().split(' ').map(Number);const P=t.slice(0,6),L=t.slice(6,12),sx=t[12],sy=t[13];
    const mkO=(id,parent,m)=>({id,type:'sprite',parent,matrix:m,flags:0});
    const objs=[{id:100,type:'player',parent:-1,matrix:[65536,0,0,0,65536,0],flags:0},{id:1,type:'event',parent:-1,matrix:[65536,0,0,0,65536,0],flags:0,bbox:[-10,10,10,-10],eventType:0,triggerByLeave:0,repeatable:0,triggerObjId:100,commands:[]},mkO(300,-1,P.slice()),mkO(301,300,L.slice()),mkO(302,-1,[65536,0,sx,0,65536,sy])];
    const eng=new EventEngine(objs,{strings:[],playerObjectId:100}),ev=eng.events[0];
    const cmd=Uint8Array.from([18,...i16(301),...i16(302),0,0,0,0,0,0,0,0]);
    let res;try{res=eng.runCommand(ev,cmd,16,{x:0,y:0,vx:0,vy:0,pushX:0,pushY:0,gravityX:0,gravityY:0},100);}catch(e){res={threw:true};}
    const d=objs[3].matrix;n++;
    if(rr==='EXC'){exc++;if((res.threw||res.done===false)&&d[2]===0&&d[5]===0)ok++;}
    else{const [g,h]=rr.split(' ').map(Number);if(res.done===true&&d[2]===g&&d[5]===h)ok++;}
  }
  add('g.java case 18 move-to-world-position (incl. '+exc+' singular -> exception)',n,ok,0);
}
let bad=0;console.log('Differential check against the original Bounce Tales code (JVM reference)\n');
for(const r of results){const pct=(100*r.exact/r.n).toFixed(2);if(r.exact!==r.n)bad++;console.log(`${r.name.padEnd(62)} n=${String(r.n).padStart(7)}  exact ${pct.padStart(6)}%  max dev ${r.maxDev}`);}
console.log(bad?`\nFAILED: ${bad} comparison(s) deviate from the original`:'\nAll comparisons bit-exact.');process.exit(bad?1:0);
