#!/usr/bin/env node
'use strict';
// Compare original JVM playback and the browser port with the same scheduled
// Java ME key events. Events are applied AFTER each recorded frame because
// OriginalRecorder hooks GameCanvas.flushGraphics() after the world update.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..','..');
const FRAMES=Number(process.env.FRAMES||45);
const schedule=String(process.env.SCHEDULE||'20:-5:1,21:-5:0');
const probe=spawnSync('java',['--list-modules'],{encoding:'utf8'});
if(probe.error||probe.status!==0||!/jdk\.compiler/.test(probe.stdout)){console.log('SKIPPED: Java with jdk.compiler not available');process.exit(0);}
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bt-input-'));
const javaFiles=[];(function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(p.endsWith('.java'))javaFiles.push(p);}})(path.join(__dirname,'stubs'));
const cc=spawnSync('java',['-m','jdk.compiler/com.sun.tools.javac.Main','-nowarn','-d',path.join(tmp,'stubs'),...javaFiles],{encoding:'utf8'});
if(cc.status!==0){console.error(cc.stdout+cc.stderr);process.exit(1);}
const cp=[path.join(tmp,'rec'),path.join(tmp,'stubs'),path.join(root,'assets','original')].join(path.delimiter);
fs.mkdirSync(path.join(tmp,'rec'));
const rc=spawnSync('java',['-m','jdk.compiler/com.sun.tools.javac.Main','-nowarn','-cp',cp,'-d',path.join(tmp,'rec'),path.join(__dirname,'OriginalRecorder.java')],{encoding:'utf8'});
if(rc.status!==0){console.error(rc.stdout+rc.stderr);process.exit(1);}
const run=spawnSync('java',[`-Dsched=${schedule}`,'-Dmicroedition.locale=en-US','-Dmicroedition.platform=Nokia6300','-cp',cp,'OriginalRecorder',String(FRAMES)],{encoding:'utf8',timeout:120000});
if(run.status!==0){console.error(run.stdout+run.stderr);process.exit(1);}
const rows=run.stdout.trim().split('\n').slice(1).map(l=>l.split(' ').map(Number));
const events=schedule.split(',').filter(Boolean).map(s=>{const [frame,key,down]=s.split(':').map(Number);return {frame,key,down:!!down};});
function portKeyId(code){if(code===-7)return 5;if(code===-6)return 6;if(code===-5)return 7;if(code===-3||code===52)return 3;if(code===-4||code===54)return 4;if(code===-1||code===50)return 1;if(code===-2||code===56)return 2;if(code>=48&&code<=57)return code-38;if(code===42)return 20;if(code===35)return 21;return -1;}
const smoke=fs.readFileSync(path.join(root,'tests','runtime-smoke.cjs'),'utf8');
let head=smoke.split('const wait=()=>')[0].replace("const root=path.resolve(__dirname,'..');",`const root=${JSON.stringify(root)};`)
  .replace('window.__testGetElapsed=()=>elapsed;','window.__testInput=()=>input;window.__testUpdate=(dt,ms)=>update(dt,ms);window.__testBody=()=>body;window.__testMsg=()=>activeStoryMessage;window.__testGetElapsed=()=>elapsed;');
const code=head+`
const wait=()=>new Promise(r=>setImmediate(r));
(async()=>{await wait();await wait();
  const key=(n,k,c)=>{for(const fn of listeners.get(k)||[])fn({key:n,code:c,target:null,preventDefault:noop,stopPropagation:noop});};
  els['settings-layer'].hidden=true;els['control-editor-layer'].hidden=true;
  key('Enter','keydown','Enter');key('Enter','keyup','Enter');for(let i=0;i<30;i++)await wait();
  const rows=${JSON.stringify(rows)},events=${JSON.stringify(events)},keyId=${portKeyId.toString()};let worst=0,sum=0,n=0,msgFrame=-1;
  for(const r of rows){const [t,delta,j,mc,mf]=r;if(t>0&&delta>0)for(let s=0;s<j;s++)sandbox.__testUpdate(delta/1000,delta);
    if(msgFrame<0&&sandbox.__testMsg())msgFrame=t;const b=sandbox.__testBody();
    const d=Math.max(Math.abs(b.x-mc/65536),Math.abs(b.y-mf/65536));worst=Math.max(worst,d);sum+=d;n++;
    for(const ev of events)if(ev.frame===t){const id=keyId(ev.key);if(id>=0){if(ev.down)sandbox.__testInput().press(id);else sandbox.__testInput().release(id);}}
  }
  console.log(JSON.stringify({frames:n,worst,mean:sum/n,msgFrame,schedule:${JSON.stringify(schedule)}}));process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});`;
const f=path.join(tmp,'replay.cjs');fs.writeFileSync(f,code);
const out=spawnSync(process.execPath,[f],{encoding:'utf8'});if(out.status!==0){console.error(out.stdout+out.stderr);process.exit(1);}
const res=JSON.parse(out.stdout.trim().split('\n').pop());
console.log(`Original game (JVM, ${res.frames} frames, scheduled input ${res.schedule}) vs port: max position deviation ${res.worst.toFixed(4)} px, mean ${res.mean.toFixed(4)} px; port intro message frame ${res.msgFrame}`);
process.exit(res.worst<=0.01?0:1);
