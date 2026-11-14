'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const listeners = new Map(), raf = [], noop = () => {};
const gradient = { addColorStop: noop };
const ctx2d = new Proxy({ createLinearGradient: () => gradient, createRadialGradient: () => gradient, measureText: () => ({ width: 0 }) }, {
  get(target, key) { return key in target ? target[key] : noop; },
  set(target, key, value) { target[key] = value; return true; }
});
function element(id) {
  const handlers = {};
  return {
    id, hidden: false, disabled: false, textContent: '', value: '', checked: false, dataset: {},
    style: { setProperty: noop, removeProperty: noop },
    classList: { add: noop, remove: noop, toggle: noop }, setAttribute: noop, focus: noop,
    width: 160, height: 104,
    addEventListener(name, fn) { (handlers[name] ??= []).push(fn); },
    fire(name, event = {}) { for (const fn of handlers[name] || []) fn(event); },
    getContext: () => ctx2d,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: id === 'game-controls' ? 320 : 240, height: id === 'game-controls' ? 320 * 140 / 360 : 320 }),
    setPointerCapture: noop, handlers
  };
}
const ids = ['app','game-controls','game-text','settings-game-tab','settings-about-tab','settings-game-pane','settings-about-pane','keyboard-hint','game','level-cover','menu','level-screen','pause-layer','complete-layer','guide-layer','settings-layer','control-editor-layer','control-editor-live-hint','open-control-editor','close-control-editor','cancel-control-editor','save-control-layout','reset-control-layout','control-size','control-size-value','statusline','egg-hud','fps-counter','pause-mini','continue-game','open-chapters','open-guide','level-prev','level-next','level-position','level-name','level-chapter','level-record','level-lock','play-level','back-title','resume','restart','pause-chapters','complete-title','complete-eggs','complete-stats','next-level','result-chapters','guide-back','fps-mode','smooth-motion','show-fps','fullscreen-btn','open-settings','close-settings','share-site','reset-game','game-hint','save-summary','music-enabled'];
const els = Object.fromEntries(ids.map(id => [id, element(id)]));
els.game.getContext = () => ctx2d;
const liveControls = ['left','right','jump','form'].map((name, index) => { const b = element(name); b.dataset.keyId = ['3','4','7','20'][index]; return b; });
els['game-controls'].querySelectorAll = () => liveControls;
const pickerButtons = ['left','right','jump','form'].map(name => { const b = element('pick-' + name); b.dataset.pickControl = name; return b; });
els['control-size'].value = '100';
const records = Array.from({ length: 15 }, () => ({ eggs: 0, clearTime: 9999, score: 0, globalScore: 0 }));
let saveData = JSON.stringify({ version: 1, records, selected: 0, totalGameTime: 0 });
const prefs = new Map();
const storage = { getItem: key => key === 'bounce-tales-original-save-v1' ? saveData : (prefs.get(key) ?? null), setItem: (key, value) => { if (key === 'bounce-tales-original-save-v1') saveData = String(value); else prefs.set(key, String(value)); }, removeItem: key => { if (key === 'bounce-tales-original-save-v1') saveData = null; else prefs.delete(key); } };
els['settings-game-tab'].dataset.settingsTab = 'game'; els['settings-about-tab'].dataset.settingsTab = 'about';
const tabs = [els['settings-game-tab'], els['settings-about-tab']];
const document = {
  hidden: false, fullscreenElement: null, activeElement: null,
  documentElement: { requestFullscreen: async () => { document.fullscreenElement = document.documentElement; } },
  getElementById: id => els[id] || element(id),
  querySelector: selector => selector.includes('about') ? els['settings-about-tab'] : els['settings-game-tab'],
  querySelectorAll: selector => selector === '[data-settings-tab]' ? tabs : selector === '[data-pick-control]' ? pickerButtons : liveControls,
  addEventListener(name, fn) { (listeners.get('document:' + name) || listeners.set('document:' + name, []).get('document:' + name)).push(fn); }
};
const sandbox = {
  document, window: null, console: { error: error => { throw error; }, warn: noop, log: noop },
  addEventListener(name, fn) { (listeners.get(name) || listeners.set(name, []).get(name)).push(fn); },
  requestAnimationFrame: fn => raf.push(fn), CustomEvent: function(type, init) { this.type = type; this.detail = init?.detail; },
  localStorage: storage, navigator: {}, confirm: () => true, prompt: noop, dispatchEvent: noop,
  TextDecoder, TextEncoder,
  Image: class { constructor() { this.complete = true; this.naturalWidth = 1; this.naturalHeight = 1; } set src(value) { this._src = value; } },
  fetch: async url => { const bytes = fs.readFileSync(path.join(root, url)); return { ok: true, json: async () => JSON.parse(bytes.toString('utf8')), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) }; }
};
sandbox.Element = class Element {}; sandbox.window = sandbox; vm.createContext(sandbox);
const sourceFiles = ['src/fixed-point.js','src/original-input-map.js','src/original-camera.js','src/rlef-reader.js','src/bounce-physics.js','src/terrain-collision.js','src/original-collision.js','src/game-timing.js','src/event-engine.js','src/original-sprite-animation.js','src/original-enemies.js','src/original-water.js','src/original-trampoline.js','src/midp-graphics.js','src/original-progression.js','src/game-particles.js','src/sprite-atlas.js','src/audio-controller.js','src/control-layout.js','src/original-hud.js','game.js'];
for (const file of sourceFiles) {
  let source = fs.readFileSync(path.join(root, file), 'utf8');
  if (file === 'game.js') source = source.replace('boot();', 'window.__gameLoopTest={get body(){return body;},get trampolines(){return trampolines;},get currentLevel(){return currentLevel;},get cameraY(){return cameraY;},screenPoint,loadLevel,update,input};boot();');
  vm.runInContext(source, sandbox, { filename: file });
}
const wait = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  await wait(); await wait();
  const game = sandbox.__gameLoopTest;
  await game.loadLevel(0, { start: true });
  assert.equal(game.currentLevel.resource, 'bf', 'the real game.js runtime loads Level 1 from RLEF');
  const spring = game.trampolines[0];
  assert.ok(spring, 'Level 1 runtime builds its RLEF trampoline');
  const body = game.body;
  let releaseImpulse = null;
  const originalTrampolineUpdate = sandbox.BounceOriginalTrampoline.update;
  sandbox.BounceOriginalTrampoline.update = function(state, actor, ...args) {
    const wasReleased = state.jumpFinished;
    const result = originalTrampolineUpdate(state, actor, ...args);
    if (!wasReleased && state.jumpFinished) { releaseImpulse = actor.vy; releaseYBeforeIntegration = actor.y; }
    return result;
  };
  // Place Bounce on a controlled descending path above the actual leaf launch line.
  body.reset(spring.x + 57, spring.y + 114);
  body.vx = 0; body.vy = -500; body.enabled = true; body.grounded = false; body.syncFixedPosition();
  game.input.clear();
  let contactTick = null, releaseTick = null, releaseVelocity = null, releaseY = null, releaseYBeforeIntegration = null;
  const trace = [];
  for (let tick = 1; tick <= 30; tick++) {
    game.update(1 / 60, 17);
    if (spring.active && contactTick === null) contactTick = tick;
    if (spring.jumpFinished && releaseTick === null) {
      releaseTick = tick; releaseVelocity = body.vy; releaseY = body.y;
    }
    trace.push({tick,enabled:body.enabled,y:Number(body.y.toFixed(3)),y16:body.y16,vy:Number(body.vy.toFixed(3)),active:spring.active,frame:spring.animFrame});
  }
  assert.ok(contactTick !== null, 'real game.js update() detects the spring contact');
  assert.equal(body.enabled, true, 'real game.js update() re-enables Bounce');
  assert.ok(releaseTick !== null, 'real game.js update() completes compression and launches');
  assert.equal(releaseImpulse, 600, 'source impulse is applied before same-tick player integration');
  assert.ok(releaseVelocity > 0 && releaseVelocity < releaseImpulse, 'the same update tick then applies gravity to the launch velocity');
  const springAnchorY = spring.y + 87; // frame 0 height 58 at the JAR's 43266/65536 scale.
  assert.ok(releaseY > springAnchorY, 'same-tick integration moves Bounce upward from the compressed anchor');
  assert.ok(trace.some(row => row.y > springAnchorY), 'Bounce rises above the compressed leaf anchor after release');
  const screenBefore = 160 - (releaseYBeforeIntegration - game.cameraY) * (43266 / 65536);
  const screenAfter = 160 - (body.y - game.cameraY) * (43266 / 65536);
  assert.ok(body.y > releaseYBeforeIntegration, 'world Y increases upward after release');
  assert.ok(screenAfter < screenBefore, 'screen Y decreases toward the top after release');
  assert.equal(spring.active, false, 'spring animation reaches its terminal state');
  const compression = trace.filter(row => row.active && row.tick < releaseTick);
  assert.ok(compression.length >= 10, 'trace captures the full compression window');
  assert.ok(compression.every(row => row.y >= 552 && row.y <= 585), 'Bounce remains on top of the leaf throughout compression');
  assert.ok(compression.every(row => row.y16 === Math.trunc(row.y * 65536)), 'fixed-point Y stays synchronized during compression');
  assert.ok(trace.some(row => row.y > 700), 'released Bounce rises beyond world Y 700 in the 30-tick trace');
  console.log(JSON.stringify({
    proof: 'real game.js Level 1 update loop passed in Node.js',
    level: game.currentLevel.resource,
    springObjectId: spring.object.id,
    contactTick,
    releaseTick,
    releaseImpulseBeforeSameTickIntegration: releaseImpulse,
    velocityAfterSameTickGravity: releaseVelocity,
    releaseWorldYBeforeSameTickIntegration: releaseYBeforeIntegration,
    releaseWorldYAfterSameTickIntegration: releaseY,
    screenYBeforeSameTickIntegration: screenBefore,
    screenYAfterSameTickIntegration: screenAfter,
    compressionRange: { minY: Math.min(...compression.map(row=>row.y)), maxY: Math.max(...compression.map(row=>row.y)), ticks: compression.length },
    trace,
    final: { x: body.x, y: body.y, vy: body.vy, enabled: body.enabled, springActive: spring.active }
  }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
