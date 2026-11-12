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
  return {MAX_UPDATE_DELTA_MS,MAX_SUBSTEP_MS,splitElapsedMilliseconds};
});
