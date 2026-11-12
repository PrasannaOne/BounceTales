const assert=require('node:assert/strict');
const T=require('../src/game-timing.js');
assert.deepEqual(T.splitElapsedMilliseconds(0),[]);
assert.deepEqual(T.splitElapsedMilliseconds(16),[16]);
assert.deepEqual(T.splitElapsedMilliseconds(34),[17,17]);
for(const sample of [35,66,101,250,500,900]){
  const result=T.splitElapsedMilliseconds(sample);
  const expected=Math.min(500,Math.floor(sample));
  assert.equal(result.reduce((a,b)=>a+b,0),expected,`elapsed time should be conserved for ${sample}ms`);
  assert.ok(result.every(n=>n>0&&n<=T.MAX_SUBSTEP_MS),'substeps should stay bounded');
}
assert.equal(T.splitElapsedMilliseconds(900).reduce((a,b)=>a+b,0),500,'match original 500ms update-delta ceiling');
console.log('Timing: elapsed milliseconds conserved in bounded substeps with original JAR 500ms ceiling');
