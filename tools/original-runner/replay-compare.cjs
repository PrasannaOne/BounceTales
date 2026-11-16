#!/usr/bin/env node
'use strict';
// Records the real original game (JVM) and replays the same per-frame deltas through the port.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..','..');
const FRAMES=Number(process.env.FRAMES||40);
const probe=spawnSync('java',['--list-modules'],{encoding:'utf8'});
if(probe.error||probe.status!==0||!/jdk\.compiler/.test(probe.stdout)){console.log('SKIPPED: Java with jdk.compiler not available');process.exit(0);}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bt-orig-'));
const javaFiles=[];(function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(p.endsWith('.java'))javaFiles.push(p);}})(path.join(__dirname,'stubs'));
const cc=spawnSync('java',['-m','jdk.compiler/com.sun.tools.javac.Main','-nowarn','-d',path.join(tmp,'stubs'),...javaFiles],{encoding:'utf8'});
if(cc.status!==0){console.error(cc.stdout+cc.stderr);process.exit(1);}
const cp=[path.join(tmp,'rec'),path.join(tmp,'stubs'),path.join(root,'assets','original')].join(path.delimiter);
fs.mkdirSync(path.join(tmp,'rec'));
const rc=spawnSync('java',['-m','jdk.compiler/com.sun.tools.javac.Main','-nowarn','-cp',cp,'-d',path.join(tmp,'rec'),path.join(__dirname,'OriginalRecorder.java')],{encoding:'utf8'});
if(rc.status!==0){console.error(rc.stdout+rc.stderr);process.exit(1);}
const run=spawnSync('java',['-Dmicroedition.locale=en-US','-Dmicroedition.platform=Nokia6300','-cp',cp,'OriginalRecorder',String(FRAMES)],{encoding:'utf8',timeout:120000});
if(run.status!==0){console.error(run.stdout+run.stderr);process.exit(1);}
const rows=run.stdout.trim().split('\n').slice(1).map(l=>l.split(' ').map(Number));
// ---- port side: reuse the smoke-test vm harness (everything before its async body)
const smoke=fs.readFileSync(path.join(root,'tests','runtime-smoke.cjs'),'utf8');
let head=smoke.split('const wait=()=>')[0].replace("const root=path.resolve(__dirname,'..');",`const root=${JSON.stringify(root)};`)
  .replace('window.__testGetElapsed=()=>elapsed;','window.__testUpdate=(dt,ms)=>update(dt,ms);window.__testBody=()=>body;window.__testMsg=()=>activeStoryMessage;window.__testGetElapsed=()=>elapsed;');
const code=head+`
const wait=()=>new Promise(r=>setImmediate(r));
(async()=>{await wait();await wait();
  const key=(n,k,c)=>{for(const fn of listeners.get(k)||[])fn({key:n,code:c,target:null,preventDefault:noop,stopPropagation:noop});};
  els['settings-layer'].hidden=true;els['control-editor-layer'].hidden=true;
  key('Enter','keydown','Enter');key('Enter','keyup','Enter');for(let i=0;i<30;i++)await wait();
  const rows=${JSON.stringify(rows)};let worst=0,sum=0,n=0,msgFrame=-1;
  for(const r of rows){const [t,delta,j,mc,mf]=r;if(t>0&&delta>0)for(let s=0;s<j;s++)sandbox.__testUpdate(delta/1000,delta);
    if(msgFrame<0&&sandbox.__testMsg())msgFrame=t;const b=sandbox.__testBody();
    const d=Math.max(Math.abs(b.x-mc/65536),Math.abs(b.y-mf/65536));worst=Math.max(worst,d);sum+=d;n++;}
  console.log(JSON.stringify({frames:n,worst,mean:sum/n,msgFrame}));process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});`;
const f=path.join(tmp,'replay.cjs');fs.writeFileSync(f,code);
const out=spawnSync(process.execPath,[f],{encoding:'utf8'});if(out.status!==0){console.error(out.stdout+out.stderr);process.exit(1);}
const res=JSON.parse(out.stdout.trim().split('\n').pop());
console.log(`Original game (JVM, ${res.frames} frames, level 1 opening, no input) vs port update(): max position deviation ${res.worst.toFixed(4)} px, mean ${res.mean.toFixed(4)} px; intro message raised on frame ${res.msgFrame} in the port`);
process.exit(res.worst<=0.01?0:1);
