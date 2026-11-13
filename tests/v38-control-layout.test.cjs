const test = require('node:test');
const assert = require('node:assert/strict');
const Layout = require('../src/control-layout.js');

test('all four controls have bounded, complete defaults', () => {
  const layout = Layout.cloneDefaults();
  assert.deepEqual(Object.keys(layout), ['left','right','jump','form']);
  for (const id of Layout.IDS) {
    assert.ok(layout[id].x >= 0 && layout[id].x <= 100);
    assert.ok(layout[id].y >= 0 && layout[id].y <= 100);
    assert.equal(layout[id].size, 100);
  }
});

test('normalization rejects incomplete layouts and clamps imported values', () => {
  assert.equal(Layout.normalize({left:{x:0,y:0,size:100}}), null);
  const source = Layout.cloneDefaults();
  source.left = {x:-20,y:140,size:300};
  const normalized = Layout.normalize(source);
  assert.deepEqual(normalized.left,{x:0,y:100,size:125});
});

test('zero and hidden measurements never produce invalid geometry', () => {
  assert.equal(Layout.metrics(0), null);
  assert.equal(Layout.metrics(1), null);
  assert.equal(Layout.placement('left', Layout.DEFAULTS.left, 0), null);
});

test('live and editor placement share identical coordinates at every tested width', () => {
  for (const width of [280,320,360,390,430]) {
    const layout = Layout.cloneDefaults();
    for (const id of Layout.IDS) {
      const live = Layout.placement(id,layout[id],width);
      const editor = Layout.placement(id,layout[id],width);
      assert.deepEqual(editor,live);
      assert.ok(live.left >= 0 && live.top >= 0);
      assert.ok(live.left + live.width <= width + .01);
      assert.ok(live.top + live.height <= Layout.metrics(width).height + .01);
    }
  }
});

test('drag delta updates percentages without changing button size', () => {
  const item = {x:50,y:50,size:110};
  const moved = Layout.moveFromDelta(item,{maxX:100,maxY:80},25,-20);
  assert.deepEqual(moved,{x:75,y:25,size:110});
});

test('surface height scales proportionally with available width', () => {
  const small = Layout.metrics(320);
  const large = Layout.metrics(400);
  assert.equal(Math.round(small.height*100)/100,112);
  assert.equal(Math.round(large.height*100)/100,140);
});
