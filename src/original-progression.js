(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.BounceOriginalProgression=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SAVE_KEY='bounce-tales-original-save-v1';
  const BONUS_LEVELS=[{level:4,eggs:60},{level:9,eggs:200},{level:14,eggs:400}];
  const FORM_UNLOCK_LEVELS=[3,8];
  const EGG_SCORE_MULTIPLIERS=[0.937,0.969,0.659,0.937,1.412,0.969,2.121,1.298,1.298,1.011,1.298,1.921,1.298,0.712,1.195];
  const EGG_TROPHY_REQUIREMENTS=[30,29,26,30,28,26,30,25,21,30,25,20,30,30,30,30,28,25,30,28,22,30,27,20,30,27,24,30,30,30,30,29,27,30,28,19,30,25,20,30,25,20,30,30,30];
  const TIMER_TROPHY_REQUIREMENTS=[30,40,50,36,45,55,35,40,48,32,42,50,9999,9999,9999,34,45,60,75,85,95,42,46,55,45,55,65,9999,9999,9999,45,50,58,60,70,80,48,54,60,24,34,44,9999,9999,9999];
  const fresh=()=>Array.from({length:15},(_,i)=>({eggs:0,clearTime:i===0?9999:0,score:0,globalScore:0}));
  function normalize(records){
    const defaults=fresh();
    if(!Array.isArray(records))return defaults;
    return defaults.map((d,i)=>{
      const r=records[i]||{};
      return {eggs:Math.max(0,Math.min(30,Number(r.eggs)||0)),clearTime:Math.max(0,Math.min(9999,Number(r.clearTime)||0)),score:Math.max(0,Number(r.score)||0),globalScore:Math.max(0,Number(r.globalScore)||0)};
    });
  }
  function create(){return {version:1,records:fresh(),selected:0,unlockedForme:0,totalGameTime:0};}
  function totalEggs(save){return save.records.reduce((sum,r)=>sum+r.eggs,0);}
  function unlockBonuses(save){
    const total=totalEggs(save);let unlocked=[];
    for(const item of BONUS_LEVELS){if(total>=item.eggs&&save.records[item.level].clearTime===0){save.records[item.level].clearTime=9999;unlocked.push(item.level);}}
    return unlocked;
  }
  function isUnlocked(save,level){return !!save.records[level]&&save.records[level].clearTime>0;}
  function unlockedForme(save){return (save.records[8].clearTime>0&&save.records[8].clearTime<9999)?2:(save.records[3].clearTime>0&&save.records[3].clearTime<9999)?1:0;}
  function nextRegular(level){let next=level+1;if(next===4||next===9||next===14)next++;return next<15?next:-1;}
  function complete(save,level,eggs,timeMs){
    if(!Number.isInteger(level)||level<0||level>=15)throw new RangeError('Invalid level index');
    const r=save.records[level],safeEggs=Math.max(0,Math.min(30,Math.floor(eggs||0))),seconds=Math.max(1,Math.floor((timeMs||0)/1000));
    const score=Math.min(32767,Math.floor((safeEggs*10000*EGG_SCORE_MULTIPLIERS[level])/seconds));
    const wasBeaten=r.clearTime>0&&r.clearTime<9999;
    r.eggs=Math.max(r.eggs,safeEggs);r.clearTime=wasBeaten?Math.min(r.clearTime,seconds):seconds;r.score=Math.max(r.score,score);
    const unlocked=[];const isBonus=BONUS_LEVELS.some(item=>item.level===level);const next=isBonus?-1:nextRegular(level);
    if(next>=0&&save.records[next].clearTime===0){save.records[next].clearTime=9999;unlocked.push(next);}
    unlocked.push(...unlockBonuses(save));save.unlockedForme=unlockedForme(save);
    return {eggs:safeEggs,seconds,score,unlocked,nextLevel:next,unlockedForme:save.unlockedForme};
  }
  function load(storage){
    try{const raw=storage?.getItem(SAVE_KEY);if(!raw)return create();const parsed=JSON.parse(raw);const records=normalize(parsed.records);const state={version:1,records,selected:Number.isInteger(parsed.selected)&&parsed.selected>=0&&parsed.selected<15?parsed.selected:0,unlockedForme:0,totalGameTime:Math.max(0,Number(parsed.totalGameTime)||0)};state.unlockedForme=unlockedForme(state);return state;}
    catch{return create();}
  }
  function save(storage,state){
    const normalized={version:1,records:normalize(state.records),selected:Math.max(0,Math.min(14,Math.floor(state.selected||0))),unlockedForme:unlockedForme(state),totalGameTime:Math.max(0,Number(state.totalGameTime)||0)};
    try{storage?.setItem(SAVE_KEY,JSON.stringify(normalized));}catch{}
    Object.assign(state,normalized);return normalized;
  }
  function reset(storage){try{storage?.removeItem(SAVE_KEY);}catch{}return create();}
  function chapterGroup(level){return level<=4?0:level<=9?1:2;}
  function unlockedCount(save){return save.records.filter(r=>r.clearTime>0).length;}
  return {SAVE_KEY,BONUS_LEVELS,FORM_UNLOCK_LEVELS,EGG_SCORE_MULTIPLIERS,EGG_TROPHY_REQUIREMENTS,TIMER_TROPHY_REQUIREMENTS,create,load,save,reset,totalEggs,unlockBonuses,isUnlocked,unlockedForme,nextRegular,complete,chapterGroup,unlockedCount};
});
