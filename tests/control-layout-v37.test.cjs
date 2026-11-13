"use strict";
const test=require('node:test');
const assert=require('node:assert/strict');
const layout=require('../src/control-layout.js');

test('hidden controls are not assigned zero-sized inline geometry',()=>{
  assert.equal(layout.metrics(0),null);
  assert.equal(layout.metrics(1),null);
  assert.equal(layout.placement('left',layout.DEFAULTS.left,0),null);
});

test('default thumb layout fits the 360-unit surface without overlap',()=>{
  const width=360;
  const boxes=Object.fromEntries(Object.keys(layout.DEFAULTS).map(id=>[id,layout.placement(id,layout.DEFAULTS[id],width)]));
  assert.ok(boxes.left.left+boxes.left.width<=boxes.right.left,'left and right controls have a gap');
  assert.ok(boxes.right.left+boxes.right.width<=boxes.jump.left,'right and jump controls have a gap');
  assert.ok(Math.abs((boxes.jump.left+boxes.jump.width)-(boxes.form.left+boxes.form.width))<2,'form aligns to the jump button right edge');
  assert.ok(boxes.form.top>=boxes.jump.top+boxes.jump.height,'form sits below the primary button row');
});

test('layout geometry scales to narrow and wide devices and stays in bounds',()=>{
  for(const width of [280,320,360,430,768]){
    const m=layout.metrics(width);assert.ok(m);
    for(const id of Object.keys(layout.DEFAULTS)){
      const box=layout.placement(id,layout.DEFAULTS[id],width);
      assert.ok(box.left>=0&&box.top>=0,`${id} starts inside ${width}px surface`);
      assert.ok(box.left+box.width<=width+0.01,`${id} fits horizontally at ${width}px`);
      assert.ok(box.top+box.height<=m.height+0.01,`${id} fits vertically at ${width}px`);
    }
  }
});

test('stored layouts are normalised and retain the version-stable storage schema',()=>{
  const custom=layout.normalize({
    left:{x:-5,y:120,size:150},right:{x:33,y:0,size:95},
    jump:{x:71,y:4,size:100},form:{x:80,y:82,size:90}
  });
  assert.equal(custom.left.x,0);assert.equal(custom.left.y,100);assert.equal(custom.left.size,125);
  assert.equal(custom.right.size,95);assert.equal(custom.form.size,90);
  assert.equal(layout.normalize({left:{x:1,y:2,size:3}}),null);
});
