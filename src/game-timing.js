(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BounceGameTiming=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // The supplied 2.0.3 runtime caps one elapsed update delta at 500 ms.
  // Browser frames are split only to keep the first-pass collision code stable;
  // the integer milliseconds are conserved across all generated substeps.
  const MAX_UPDATE_DELTA_MS=500;
  const MAX_SUBSTEP_MS=33;
  function splitElapsedMilliseconds(deltaMs){
    const total=Math.min(MAX_UPDATE_DELTA_MS,Math.max(0,Math.floor(Number(deltaMs)||0)));
    if(total===0)return [];
    const steps=Math.ceil(total/MAX_SUBSTEP_MS),slices=[];
    let remaining=total;
    for(let i=0;i<steps;i++){
      const slice=Math.ceil(remaining/(steps-i));
      slices.push(slice);remaining-=slice;
    }
    return slices;
  }
  const FIXED_TICK_RATE=60;
  const FIXED_STEP_MS=1000/FIXED_TICK_RATE;
  class FixedStepClock{
    constructor(){this.accumulatorMs=0;this.tickIndex=0;this.alpha=0;}
    reset(){this.accumulatorMs=0;this.tickIndex=0;this.alpha=0;}
    advance(elapsedMs,callback){
      const incoming=Math.min(MAX_UPDATE_DELTA_MS,Math.max(0,Number(elapsedMs)||0));
      this.accumulatorMs=Math.min(MAX_UPDATE_DELTA_MS,this.accumulatorMs+incoming);
      let steps=0;
      while(this.accumulatorMs+1e-7>=FIXED_STEP_MS&&steps<30){
        // Integer millisecond deltas follow the source runtime's integer clock,
        // while the scheduler remains locked to a nominal 60 Hz cadence.
        const start=Math.floor(this.tickIndex*1000/FIXED_TICK_RATE);
        const end=Math.floor((this.tickIndex+1)*1000/FIXED_TICK_RATE);
        const deltaMs=end-start;
        callback(deltaMs/1000,deltaMs,this.tickIndex);
        this.tickIndex++;
        this.accumulatorMs-=FIXED_STEP_MS;
        steps++;
      }
      this.alpha=Math.max(0,Math.min(1,this.accumulatorMs/FIXED_STEP_MS));
      return {steps,alpha:this.alpha,accumulatorMs:this.accumulatorMs};
    }
  }
  return {MAX_UPDATE_DELTA_MS,MAX_SUBSTEP_MS,splitElapsedMilliseconds,FIXED_TICK_RATE,FIXED_STEP_MS,FixedStepClock};
});
