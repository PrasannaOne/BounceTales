(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BounceEventEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const STATE={WAITING:0,TERMINATED:1,ACTIVE:2,PAUSED:3};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const readI16=(a,p)=>((a[p]<<8)|a[p+1])<<16>>16;
  const readI32=(a,p)=>(a[p]*0x1000000+(a[p+1]<<16)+(a[p+2]<<8)+a[p+3])|0;
  const writeI16=(a,p,v)=>{a[p]=(v>>8)&255;a[p+1]=v&255;};
  const writeI32=(a,p,v)=>{v|=0;a[p]=(v>>>24)&255;a[p+1]=(v>>>16)&255;a[p+2]=(v>>>8)&255;a[p+3]=v&255;};
  const toFloat=bits=>{const b=new ArrayBuffer(4),d=new DataView(b);d.setInt32(0,bits|0,false);return d.getFloat32(0,false);};
  const fromFloat=value=>{const b=new ArrayBuffer(4),d=new DataView(b);d.setFloat32(0,value,false);return d.getInt32(0,false);};

  function parseLanguage(input){
    const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
    if(bytes.length<2)throw new Error('Language resource is truncated');
    const first=(bytes[0]<<8)|bytes[1],count=Math.floor(first/2),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const strings=[];
    for(let id=0;id<count;id++){
      const offset=view.getUint16(id*2,false);
      if(offset+2>bytes.length)throw new Error('Language string offset out of range: '+id);
      const length=view.getUint16(offset,false);
      if(offset+2+length>bytes.length)throw new Error('Language string truncated: '+id);
      strings[id]=new TextDecoder('utf-8').decode(bytes.subarray(offset+2,offset+2+length));
    }
    return strings;
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
  function point(m,x,y){return {x:(m[0]*x+m[1]*y)/65536+m[2]/65536,y:(m[3]*x+m[4]*y)/65536+m[5]/65536};}
  function inversePoint(m,x,y){
    const a=m[0]/65536,b=m[1]/65536,c=m[3]/65536,d=m[4]/65536,det=a*d-b*c;
    if(Math.abs(det)<1e-9)return {x,y};
    const px=x-m[2]/65536,py=y-m[5]/65536;
    return {x:(d*px-b*py)/det,y:(a*py-c*px)/det};
  }
  function segmentTouchesRect(ax,ay,bx,by,r){
    let lo=0,hi=1,dx=bx-ax,dy=by-ay;
    const tests=[[-dx,ax-r.minX],[dx,r.maxX-ax],[-dy,ay-r.minY],[dy,r.maxY-ay]];
    for(const [p,q] of tests){
      if(Math.abs(p)<1e-12){if(q<0)return false;continue;}
      const t=q/p;
      if(p<0){if(t>hi)return false;if(t>lo)lo=t;}
      else{if(t<lo)return false;if(t<hi)hi=t;}
    }
    return true;
  }

  class EventEngine{
    constructor(objects,options={}){
      this.objects=objects;
      this.byId=new Map(objects.map(o=>[o.id,o]));
      this.events=objects.filter(o=>o.type==='event').map((o,index)=>({
        id:o.id,index,object:o,state:o.eventType|0,pc:(o.eventType|0)===STATE.ACTIVE?0:-1,
        triggerByLeave:!!o.triggerByLeave,repeatable:!!o.repeatable,triggerObjId:o.triggerObjId|0,
        wasTouching:false,commands:o.commands.map(c=>Uint8Array.from(c)),initialCommands:o.commands.map(c=>Uint8Array.from(c)),
        lastTouched:false,waitingForMessage:false
      }));
      this.eventByIndex=this.events;
      this.vars=new Int32Array(256);
      this.strings=options.strings||[];
      this.callbacks=options;
      this.initialObjects=objects.map(o=>({id:o.id,parent:o.parent,matrix:o.matrix.slice(),flags:o.flags}));
      this.world=new Map();
      this.cameraTargetId=options.playerObjectId??-1;
      this.cameraBounceFactor=90;this.cameraStabilizeSpeed=140;this.cameraSnap=false;
      this.checkpoint=null;
      this.executed=0;this.unsupported=new Set();
      this.rebuildWorld();
    }
    rebuildWorld(){
      const cache=new Map(),busy=new Set(),byId=this.byId;
      const get=id=>{
        if(cache.has(id))return cache.get(id);
        if(busy.has(id))throw new Error('Event transform parent cycle at object '+id);
        const o=byId.get(id);if(!o)throw new Error('Event references missing object '+id);
        busy.add(id);
        const parent=(o.parent>=0&&byId.has(o.parent))?get(o.parent):[65536,0,0,0,65536,0];
        const result=compose(parent,o.matrix);busy.delete(id);cache.set(id,result);return result;
      };
      for(const o of this.objects)get(o.id);
      this.world=cache;
      if(this.callbacks.onWorldChanged)this.callbacks.onWorldChanged(cache);
      return cache;
    }
    reset(){
      for(const initial of this.initialObjects){
        const obj=this.byId.get(initial.id);if(!obj)continue;
        obj.parent=initial.parent;obj.matrix=initial.matrix.slice();obj.runtimeFlags=initial.flags;delete obj.__eventRotateBase;
      }
      for(const event of this.events){
        event.state=event.object.eventType|0;event.pc=event.state===STATE.ACTIVE?0:-1;
        event.wasTouching=false;event.waitingForMessage=false;event.commands=event.initialCommands.map(c=>c.slice());
      }
      this.vars.fill(0);this.cameraTargetId=this.callbacks.playerObjectId??-1;
      this.cameraBounceFactor=90;this.cameraStabilizeSpeed=140;this.cameraSnap=false;this.checkpoint=null;
      this.executed=0;this.unsupported.clear();this.rebuildWorld();
    }
    setState(event,state){
      if(event.state===STATE.WAITING){
        if(state===STATE.ACTIVE){event.state=STATE.ACTIVE;event.pc=0;}
        else if(state===STATE.TERMINATED)event.state=STATE.TERMINATED;
      }else if(event.state===STATE.TERMINATED){
        if(state===STATE.WAITING){event.state=STATE.WAITING;this.resetCommands(event);}
      }else if(event.state===STATE.ACTIVE){
        if(state===STATE.TERMINATED||state===STATE.PAUSED)event.state=state;
      }else if(event.state===STATE.PAUSED&&state===STATE.ACTIVE)event.state=STATE.ACTIVE;
    }
    resetCommands(event){
      event.pc=-1;event.waitingForMessage=false;event.commands=event.initialCommands.map(c=>c.slice());
    }
    resumeMessages(eventId=null){
      let resumed=0;
      for(const event of this.events){
        if(!event.waitingForMessage||(eventId!==null&&event.id!==eventId))continue;
        event.waitingForMessage=false;event.pc++;resumed++;
        if(event.pc>=event.commands.length){
          if(event.repeatable){event.state=STATE.WAITING;this.resetCommands(event);}
          else event.state=STATE.TERMINATED;
        }
      }
      return resumed;
    }
    eventRect(event){
      const b=event.object.bbox,m=this.world.get(event.id);
      const corners=[point(m,b[0],b[3]),point(m,b[0],b[1]),point(m,b[2],b[3]),point(m,b[2],b[1])];
      const radius=20;
      return {minX:Math.min(...corners.map(p=>p.x))-radius,maxX:Math.max(...corners.map(p=>p.x))+radius,minY:Math.min(...corners.map(p=>p.y))-radius,maxY:Math.max(...corners.map(p=>p.y))+radius};
    }
    operand(cmd,offset){
      const type=cmd[offset];
      if(type===1)return {value:toFloat(this.vars[cmd[offset+1]]),next:offset+2,float:true};
      if(type===2)return {value:this.vars[cmd[offset+1]]|0,next:offset+2,float:false};
      if(type===16)return {value:new DataView(cmd.buffer,cmd.byteOffset,cmd.byteLength).getFloat32(offset+1,false),next:offset+5,float:true};
      if(type===32)return {value:readI32(cmd,offset+1),next:offset+5,float:false};
      return {value:0,next:offset+1,float:false};
    }
    integerOperand(cmd,offset){
      const type=cmd[offset];
      if(type===2)return {value:this.vars[cmd[offset+1]]|0,next:offset+2};
      if(type===32)return {value:readI32(cmd,offset+1),next:offset+5};
      return {value:0,next:offset+1};
    }
    getObject(id){return this.byId.get(id);}
    objectWorld(id){return this.world.get(id)||null;}
    runCommand(event,cmd,deltaMs,body,playerObjectId){
      const op=cmd[0],get=id=>this.getObject(id),dirty=()=>{this.rebuildWorld();return true;};
      this.executed++;
      switch(op){
        case 0:{
          const messageIndex=readI16(cmd,1),text=this.strings[messageIndex];
          if(typeof text==='string'&&text){
            event.waitingForMessage=true;
            this.callbacks.onMessage?.(messageIndex,text,event.id);
            return {done:false,message:true};
          }
          return {done:true};
        }
        case 1:{const id=readI16(cmd,1);this.callbacks.onAnimate?.(id);return {done:true};}
        case 2:{const target=this.eventByIndex[cmd[1]];if(target)this.setState(target,STATE.TERMINATED);return {done:true};}
        case 3:{const target=this.eventByIndex[cmd[1]];if(target)this.setState(target,STATE.WAITING);return {done:true};}
        case 4:{const target=this.eventByIndex[cmd[1]];if(target)this.setState(target,STATE.ACTIVE);return {done:true};}
        case 5:{const target=this.eventByIndex[cmd[1]];if(target)this.setState(target,STATE.PAUSED);return {done:true};}
        case 6:{
          let remaining=readI16(cmd,3);
          if(remaining<0){writeI16(cmd,3,readI16(cmd,1));return {done:true};}
          remaining-=deltaMs;writeI16(cmd,3,remaining);return {done:false};
        }
        case 7:case 8:case 9:case 10:case 11:{
          const destType=cmd[1],dest=cmd[2],opnd=destType===1?this.operand(cmd,3):this.integerOperand(cmd,3),old=destType===1?toFloat(this.vars[dest]):this.vars[dest]|0;
          let value=opnd.value;
          if(op===8)value=old+value;else if(op===9)value=old-value;else if(op===10)value=old*value;else if(op===11)value=old/value;
          this.vars[dest]=destType===1?fromFloat(value):value|0;return {done:true};
        }
        case 12:case 13:case 14:case 15:{
          const type=cmd[1],idx=cmd[2],opnd=type===1?this.operand(cmd,3):this.integerOperand(cmd,3),value=type===1?toFloat(this.vars[idx]):this.vars[idx]|0;
          let branch=false;
          if(op===12)branch=value!==opnd.value;
          else if(op===13)branch=value===opnd.value;
          else if(op===14)branch=value>=opnd.value;
          else branch=value<=opnd.value;
          // The source interpreter's early-return conditions make the branch names
          // look inverted. These are the effective branch conditions.
          const target=cmd[opnd.next];
          return {done:true,branchTo:branch?Math.max(0,target-1):null};
        }
        case 16:{
          const obj=get(readI16(cmd,1));if(!obj)return {done:true};
          let remaining=readI32(cmd,15),step=deltaMs;
          if(step>=remaining){writeI32(cmd,15,readI32(cmd,11));step=remaining;}
          obj.matrix[2]=(obj.matrix[2]+Math.imul(readI32(cmd,3),step))|0;
          obj.matrix[5]=(obj.matrix[5]+Math.imul(readI32(cmd,7),step))|0;
          const next=remaining-step;
          if(next<=0)return {done:true,worldChanged:true};
          writeI32(cmd,15,next);return {done:false,worldChanged:true};
        }
        case 17:{
          const obj=get(readI16(cmd,1));if(!obj)return {done:true};
          const angle=readI32(cmd,3)/65536,duration=Math.max(1,readI32(cmd,7));let remaining=readI32(cmd,11);
          if(remaining===duration){obj.__eventRotateBase=[obj.matrix[0],obj.matrix[1],obj.matrix[3],obj.matrix[4]];}
          const base=obj.__eventRotateBase||[obj.matrix[0],obj.matrix[1],obj.matrix[3],obj.matrix[4]];
          const finished=remaining-deltaMs<=0;
          const used=finished?duration:clamp(duration-remaining,0,duration);
          const r=angle*(used/duration),co=Math.cos(r),si=Math.sin(r);
          obj.matrix[0]=Math.trunc(base[0]*co+base[1]*si)|0;obj.matrix[1]=Math.trunc(-base[0]*si+base[1]*co)|0;
          obj.matrix[3]=Math.trunc(base[2]*co+base[3]*si)|0;obj.matrix[4]=Math.trunc(-base[2]*si+base[3]*co)|0;
          remaining=finished?0:Math.max(0,remaining-deltaMs);writeI32(cmd,11,remaining);
          if(remaining===0){delete obj.__eventRotateBase;return {done:true,worldChanged:true};}
          return {done:false,worldChanged:true};
        }
        case 18:{
          const dest=get(readI16(cmd,1));if(!dest)return {done:true};const source=readI16(cmd,3);
          if(source<0){dest.matrix[2]=readI32(cmd,5);dest.matrix[5]=readI32(cmd,9);}
          else{
            const src=this.objectWorld(source);if(!src)return {done:true};
            const worldX=src[2]/65536,worldY=src[5]/65536,parent=dest.parent>=0?this.objectWorld(dest.parent):[65536,0,0,0,65536,0];
            const noTranslation=compose(parent,[dest.matrix[0],dest.matrix[1],0,dest.matrix[3],dest.matrix[4],0]);
            const local=inversePoint(noTranslation,worldX,worldY);dest.matrix[2]=Math.round(local.x*65536)|0;dest.matrix[5]=Math.round(local.y*65536)|0;
          }
          return {done:true,worldChanged:true};
        }
        case 19:{const child=get(readI16(cmd,1)),parent=get(readI16(cmd,3));if(child&&parent){child.parent=parent.id;return {done:true,worldChanged:true};}return {done:true};}
        case 20:{const obj=get(readI16(cmd,1));if(obj){obj.parent=-1;return {done:true,worldChanged:true};}return {done:true};}
        case 21:return {done:true,branchTo:Math.max(0,cmd[1]-1)};
        case 22:return {done:true};
        case 23:event.state=event.repeatable?STATE.WAITING:STATE.TERMINATED;return {done:true};
        case 24:{const rect=this.eventRect(event),inside=body.x>=rect.minX&&body.x<=rect.maxX&&body.y>=rect.minY&&body.y<=rect.maxY;return {done:!inside};}
        case 25:{const matrix=this.objectWorld(event.id);this.checkpoint={x:matrix?matrix[2]/65536:body.x,y:matrix?matrix[5]/65536:body.y,eventId:event.id};this.callbacks.onCheckpoint?.(this.checkpoint);return {done:true};}
        case 26:case 27:case 28:{
          const target=readI16(cmd,1);if(target===playerObjectId||target===-1){const x=readI16(cmd,3),y=readI16(cmd,5);
            if(op===26){body.pushX+=x;body.pushY+=y;}else if(op===27){body.gravityX+=x;body.gravityY+=y;}else{body.vx+=x;body.vy+=y;}}
          return {done:true};
        }
        case 29:{
          const obj=get(readI16(cmd,1));if(!obj)return {done:true};
          const mask=readI32(cmd,3),values=readI32(cmd,7);let flags=obj.runtimeFlags??obj.flags??0;
          flags=(flags&~mask)|(values&mask);obj.runtimeFlags=flags;
          this.callbacks.onFlagsChanged?.(obj,flags,mask);return {done:true};
        }
        case 30:this.cameraTargetId=readI16(cmd,1);this.callbacks.onCameraTarget?.(this.cameraTargetId);return {done:true};
        case 31:this.cameraSnap=cmd[1]===1;this.cameraBounceFactor=readI16(cmd,2);this.cameraStabilizeSpeed=readI16(cmd,4);this.callbacks.onCameraParams?.(this.cameraBounceFactor,this.cameraStabilizeSpeed,this.cameraSnap);return {done:true};
        case 32:this.cameraSnap=false;this.cameraBounceFactor=90;this.cameraStabilizeSpeed=140;this.callbacks.onCameraParams?.(90,140,false);return {done:true};
        default:this.unsupported.add(op);return {done:true};
      }
    }
    update(body,previous,dt,playerObjectId){
      const deltaMs=Math.max(1,Math.min(500,Math.round(dt*1000)));
      // Event collision checks use the player's previous and current positions in world space.
      let dirty=false;
      for(const event of this.events){
        if(event.state===STATE.TERMINATED)continue;
        const rect=this.eventRect(event),touching=segmentTouchesRect(previous.x,previous.y,body.x,body.y,rect);
        const matches=event.triggerObjId<0||event.triggerObjId===playerObjectId;
        if(matches){
          if(!event.triggerByLeave&&touching&&!event.wasTouching)this.setState(event,STATE.ACTIVE);
          if(event.triggerByLeave&&!touching&&event.wasTouching)this.setState(event,STATE.ACTIVE);
        }
        event.wasTouching=touching;
      }
      for(const event of this.events){
        let safety=0;
        while(event.state===STATE.ACTIVE&&!event.waitingForMessage&&event.pc>=0&&event.pc<event.commands.length&&safety++<128){
          const result=this.runCommand(event,event.commands[event.pc],deltaMs,body,playerObjectId);
          if(result.worldChanged)dirty=true;
          if(!result.done)break;
          if(result.branchTo!==undefined&&result.branchTo!==null)event.pc=result.branchTo;
          else event.pc++;
          if(event.pc>=event.commands.length){
            if(event.repeatable){event.state=STATE.WAITING;this.resetCommands(event);}
            else event.state=STATE.TERMINATED;
          }
        }
        if(safety>=128&&event.state===STATE.ACTIVE)this.unsupported.add('event-loop-guard-'+event.id);
      }
      if(dirty)this.rebuildWorld();
      return {world:this.world,worldChanged:dirty,executed:this.executed};
    }
  }

  return {EventEngine,parseLanguage,states:STATE};
});
