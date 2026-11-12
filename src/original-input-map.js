(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BounceOriginalInput=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY=Object.freeze({
    UP:1,DOWN:2,LEFT:3,RIGHT:4,
    SOFTKEY_RIGHT:5,SOFTKEY_LEFT:6,SOFTKEY_MIDDLE:7,
    NUM0:10,NUM1:11,NUM2:12,NUM3:13,NUM4:14,NUM5:15,NUM6:16,NUM7:17,NUM8:18,NUM9:19,
    STAR:20,POUND:21
  });
  const ACTION=Object.freeze({UP:1,DOWN:6,LEFT:2,RIGHT:5});
  const MODE2=new Map([[12,1],[14,3],[15,7],[16,4],[18,2]]);
  function normalizeJavaMEKey(keyCode,gameAction=null,inputMode=1){
    let id=-1;
    if(keyCode===-7)id=5;else if(keyCode===-6)id=6;else if(keyCode===-5)id=7;
    else if(Number.isInteger(keyCode)&&keyCode>=48&&keyCode<=57)id=keyCode-38;
    else if(keyCode===42)id=20;else if(keyCode===35)id=21;
    else if(ACTION[gameAction]!==undefined)id=ACTION[gameAction];
    if(inputMode===2)id=MODE2.get(id)??id;
    return id;
  }
  function browserKeyId(key){
    const lower=String(key).toLowerCase();
    const directional={ArrowUp:1,w:1,ArrowDown:2,s:2,ArrowLeft:3,a:3,ArrowRight:4,d:4};
    if(directional[key]!==undefined)return directional[key];
    if(directional[lower]!==undefined)return directional[lower];
    if(key==='Enter'||key===' ')return 7;
    if(key==='Escape')return 5;
    if(key==='Backspace')return 6;
    if(key==='Shift'||key==='*'||lower==='q')return 20;
    if(key==='#')return 21;
    return -1;
  }
  class OriginalInputState{
    constructor(){this.held=new Set();this.edges=[];}
    press(id){if(!Number.isInteger(id)||id<0)return;if(!this.held.has(id))this.edges.push(id);this.held.add(id);}
    release(id){this.held.delete(id);}
    isHeld(id){return this.held.has(id);}
    drainEdges(){const a=this.edges;this.edges=[];return a;}
    clear(){this.held.clear();this.edges=[];}
    gameHeld(){return {
      left:this.isHeld(3),right:this.isHeld(4),
      jump:this.isHeld(1)||this.isHeld(7),
      up:this.isHeld(1),down:this.isHeld(2)
    };}
  }
  return {KEY,ACTION,normalizeJavaMEKey,browserKeyId,OriginalInputState};
});
