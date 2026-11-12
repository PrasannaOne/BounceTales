const assert=require('node:assert/strict');
const G=require('../src/midp-graphics.js');
const radians=Math.PI/180;
for(let axis=0;axis<4;axis++){
  const arc=G.arcAngles(axis*90,90);
  assert.ok(Math.abs(arc.start-(-axis*90*radians))<1e-12);
  assert.ok(Math.abs(arc.end-(-(axis+1)*90*radians))<1e-12);
  assert.equal(arc.anticlockwise,true);
}
const wolly=G.arcAngles(300,60);
assert.ok(Math.abs(wolly.start+300*radians)<1e-12);
assert.ok(Math.abs(wolly.end+360*radians)<1e-12);
console.log('MIDP rendering: original counter-clockwise fillArc quadrants and Wolly segments map correctly to Canvas');
