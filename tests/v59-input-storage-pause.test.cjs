'use strict';
// V59 regressions: stuck keys with Shift, shared-action release, blocked browser
// storage at startup, and auto-pause when the page is backgrounded mid-level.
// Reuses the vm harness from runtime-smoke.cjs (everything before its async body).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const smoke = fs.readFileSync(path.join(__dirname, 'runtime-smoke.cjs'), 'utf8');
const marker = 'const wait=()=>';
assert.ok(smoke.includes(marker), 'runtime-smoke harness marker present');
let harness = smoke.split(marker)[0]
  .replace("const root=path.resolve(__dirname,'..');", `const root=${JSON.stringify(root)};`)
  .replace('window.__testGetElapsed=()=>elapsed;', 'window.__testHeld=id=>input.isHeld(id);window.__testGetElapsed=()=>elapsed;');
assert.ok(harness.includes('__testHeld'), 'harness hook injected');

function run(name, body, { blockStorage = false } = {}) {
  let h = harness;
  if (blockStorage) {
    assert.ok(h.includes('localStorage:storage,'), 'sandbox storage hook present');
    h = h.replace('localStorage:storage,', "get localStorage(){throw new Error('SecurityError: The operation is insecure.');},");
  }
  const code = h + `
const wait=()=>new Promise(r=>setImmediate(r));
(async()=>{
  await wait();await wait();
  const key=(name,kind,extra={})=>{for(const fn of listeners.get(kind)||[])fn({key:name,target:null,preventDefault:noop,stopPropagation:noop,...extra});};
  els['settings-layer'].hidden=true;els['control-editor-layer'].hidden=true;
${body}
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
`;
  const file = path.join(os.tmpdir(), `bt-v59-${name}-${process.pid}.cjs`);
  fs.writeFileSync(file, code);
  const r = spawnSync(process.execPath, [file], { encoding: 'utf8' });
  fs.unlinkSync(file);
  assert.equal(r.status, 0, `${name} failed:\n${r.stdout}\n${r.stderr}`);
}

run('shift-stuck-key', `
  key('Enter','keydown');key('Enter','keyup');
  key('d','keydown',{code:'KeyD'});assert.equal(sandbox.__testHeld(4),true);
  key('Shift','keydown',{code:'ShiftLeft'});
  key('D','keyup',{code:'KeyD'});assert.equal(sandbox.__testHeld(4),false,'release works when Shift changes the reported key');
  key('Shift','keyup',{code:'ShiftLeft'});
  key('d','keydown',{code:'KeyD'});assert.equal(sandbox.__testHeld(4),true,'D registers again after the Shift sequence');
  key('d','keyup',{code:'KeyD'});
  // fallback path when a synthetic event carries no code
  key('a','keydown');key('A','keyup');key('a','keydown');assert.equal(sandbox.__testHeld(3),true,'case-folded fallback token');
`);
run('shared-action', `
  key('Enter','keydown');key('Enter','keyup');
  key('a','keydown',{code:'KeyA'});key('ArrowLeft','keydown',{code:'ArrowLeft'});
  key('a','keyup',{code:'KeyA'});assert.equal(sandbox.__testHeld(3),true,'ArrowLeft still holds LEFT after A is released');
  key('ArrowLeft','keyup',{code:'ArrowLeft'});assert.equal(sandbox.__testHeld(3),false,'LEFT released when the last source is released');
`);
run('blocked-storage', `
  assert.match(els.statusline.textContent,/ORIGINAL LEVEL DATA LOADED/,'game boots with unavailable localStorage');
  assert.equal(els.menu.hidden,false,'title scene shown');
`, { blockStorage: true });
run('auto-pause', `
  key('Enter','keydown');key('Enter','keyup');
  assert.equal(els.app.dataset.mode,'play');
  document.hidden=true;for(const fn of listeners.get('document:visibilitychange')||[])fn();
  assert.equal(els.app.dataset.mode,'pause','backgrounding during play pauses the level');
`);
console.log('V59: Shift/stuck-key, shared-action release, blocked-storage boot and background auto-pause verified');
