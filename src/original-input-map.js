// Bounce Tales JAR input adapter, reconstructed from o.e(int), o.d(int,int), o.a(int), and m.b(int).
(() => {
'use strict';
const KEY=Object.freeze({UP:1,DOWN:2,LEFT:3,RIGHT:4,PAUSE_MENU:5,SOFTKEY_1:6,SELECT_ALIAS:7,STAR_MODE_CYCLE:20,HASH:21});
const GAME_ACTION={UP:1,DOWN:6,LEFT:2,RIGHT:5};
const MODE_2_REMAP=new Map([[15,7],[12,1],[14,3],[18,2],[16,4]]);
const GAME_ACTION_REMAP=new Map([[1,1],[2,3],[5,4],[6,2]]);
function normalizeJavaMEKey(keyCode,gameAction=null,inputMode=1){
 if(!Number.isInteger(keyCode))return -1;let id;
 if(keyCode===-7)id=5;else if(keyCode===-6)id=6;else if(keyCode===-5)id=7;
 else if(keyCode>=48&&keyCode<=57)id=keyCode-38;else if(keyCode===42)id=20;else if(keyCode===35)id=21;
 else id=GAME_ACTION_REMAP.get(gameAction)??-1;
 if(inputMode===2)id=MODE_2_REMAP.get(id)??id;return id;
}
function normalizeBrowserKey(key,inputMode=1){const actions={ArrowUp:1,ArrowDown:6,ArrowLeft:2,ArrowRight:5};
 if(Object.prototype.hasOwnProperty.call(actions,key))return normalizeJavaMEKey(-999,actions[key],inputMode);
 if(typeof key!=='string'||key.length!==1)return -1;return normalizeJavaMEKey(key.charCodeAt(0),null,inputMode);
}
class OriginalInputState{
 constructor(inputMode=1){this.inputMode=inputMode;this.heldMask=0;this.pressedEdges=[];}
 press(id){if(!Number.isInteger(id)||id<0||id>=32)return;const bit=(1<<id)>>>0;if((this.heldMask&bit)===0)this.pressedEdges.push(id);this.heldMask=(this.heldMask|bit)>>>0;}
 release(id){if(!Number.isInteger(id)||id<0||id>=32)return;this.heldMask=(this.heldMask&(~(1<<id)))>>>0;}
 isHeld(id){return id>=0&&id<32&&((this.heldMask&(1<<id))>>>0)!==0;}
 drainPressedEdges(){const edges=this.pressedEdges;this.pressedEdges=[];return edges;}
 gameplayState(){return{left:this.isHeld(3),right:this.isHeld(4),primaryActorAction:[15,12,1,7].some(id=>this.isHeld(id))};}
 clear(){this.heldMask=0;this.pressedEdges=[];}
}
window.BounceOriginalInput=Object.freeze({KEY,normalizeJavaMEKey,normalizeBrowserKey,OriginalInputState});
})();
