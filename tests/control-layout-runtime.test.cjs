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
    style: { setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; } },
    classList: { add: noop, remove: noop, toggle: noop }, setAttribute: noop, focus: noop,
    width: 160, height: 104,
    addEventListener(name, fn) { (handlers[name] ??= []).push(fn); },
    fire(name, event = {}) { for (const fn of handlers[name] || []) fn(event); },
    getContext: () => ctx2d,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: id === 'control-editor-stage' ? 320 : 240, height: id === 'control-editor-stage' ? 164 : 136 }),
    setPointerCapture: noop, handlers
  };
}
const ids = ['app','game-controls','game-text','settings-game-tab','settings-about-tab','settings-game-pane','settings-about-pane','keyboard-hint','game','level-cover','menu','level-screen','pause-layer','complete-layer','guide-layer','settings-layer','control-editor-layer','control-editor-stage','open-control-editor','close-control-editor','cancel-control-editor','save-control-layout','reset-control-layout','control-size','control-size-value','statusline','egg-hud','fps-counter','pause-mini','continue-game','open-chapters','open-guide','level-prev','level-next','level-position','level-name','level-chapter','level-record','level-lock','play-level','back-title','resume','restart','pause-chapters','complete-title','complete-eggs','complete-stats','next-level','result-chapters','guide-back','fps-mode','smooth-motion','show-fps','fullscreen-btn','open-settings','close-settings','share-site','reset-game','game-hint','save-summary','music-enabled'];
const els = Object.fromEntries(ids.map(id => [id, element(id)]));
const liveButtons = ['left','right','jump','form'].map((name, index) => { const button = element(name); button.dataset.keyId = ['3','4','7','20'][index]; return button; });
els['game-controls'].querySelectorAll = () => liveButtons;
const editorButtons = Object.fromEntries(['left','right','jump','form'].map(id => {
  const button = element('editor-' + id); button.dataset.editorId = id; button.closest = () => button; return [id, button];
}));
els['control-editor-stage'].querySelector = selector => editorButtons[selector.match(/data-editor-id="([^"]+)/)?.[1]];
els['control-size'].value = '100';
const records = Array.from({ length: 15 }, () => ({ eggs: 0, clearTime: 9999, score: 0, globalScore: 0 }));
let saveData = JSON.stringify({ version: 1, records, selected: 0, totalGameTime: 0 });
const prefs = new Map();
const storage = {
  getItem(key) { return key === 'bounce-tales-original-save-v1' ? saveData : (prefs.get(key) ?? null); },
  setItem(key, value) { if (key === 'bounce-tales-original-save-v1') saveData = String(value); else prefs.set(key, String(value)); },
  removeItem(key) { if (key === 'bounce-tales-original-save-v1') saveData = null; else prefs.delete(key); }
};
els['settings-game-tab'].dataset.settingsTab = 'game'; els['settings-about-tab'].dataset.settingsTab = 'about';
const tabs = [els['settings-game-tab'], els['settings-about-tab']];
const document = {
  hidden: false, fullscreenElement: null, activeElement: null,
  documentElement: { requestFullscreen: async () => { document.fullscreenElement = document.documentElement; } },
  getElementById: id => els[id] || element(id),
  querySelector: selector => selector.includes('about') ? els['settings-about-tab'] : els['settings-game-tab'],
  querySelectorAll: selector => selector === '[data-settings-tab]' ? tabs : liveButtons,
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
for (const file of ['src/fixed-point.js','src/original-input-map.js','src/original-camera.js','src/rlef-reader.js','src/bounce-physics.js','src/terrain-collision.js','src/original-collision.js','src/game-timing.js','src/event-engine.js','src/original-sprite-animation.js','src/original-enemies.js','src/original-water.js','src/original-trampoline.js','src/midp-graphics.js','src/original-progression.js','src/game-particles.js','src/sprite-atlas.js','src/audio-controller.js','game.js']) {
  let source = fs.readFileSync(path.join(root, file), 'utf8');
  if (file === 'game.js') source = source.replace('boot();', 'window.__controlTest={applyLiveControlLayout};boot();');
  vm.runInContext(source, sandbox, { filename: file });
}
const wait = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  await wait(); await wait();
  els['open-settings'].fire('click');
  els['open-control-editor'].fire('click');
  assert.equal(els['control-editor-layer'].hidden, false);
  raf.shift()();
  const initialLeft = { left: liveButtons[0].style.left, top: liveButtons[0].style.top, width: liveButtons[0].style.width, height: liveButtons[0].style.height };
  els['control-editor-stage'].fire('pointerdown', { target: editorButtons.left, pointerId: 3, clientX: 20, clientY: 20, preventDefault: noop });
  els['control-editor-stage'].fire('pointermove', { target: editorButtons.left, pointerId: 3, clientX: 60, clientY: 40, preventDefault: noop });
  els['control-editor-stage'].fire('pointerup', { pointerId: 3 });
  assert.notEqual(liveButtons[0].style.left, initialLeft.left, 'drag immediately changes the active left button position');
  assert.notEqual(liveButtons[0].style.top, initialLeft.top, 'drag immediately changes the active left button vertical position');
  els['control-size'].fire('input', { target: { value: '120' } });
  assert.equal(liveButtons[0].style.width, '86.39999999999999px', 'size slider immediately resizes the active button');
  assert.equal(liveButtons[0].style.height, '48px');
  els['save-control-layout'].fire('click');
  const saved = JSON.parse(prefs.get('bounce-control-layout-v1'));
  assert.equal(saved.left.size, 120);
  const savedLeft = { left: liveButtons[0].style.left, top: liveButtons[0].style.top, width: liveButtons[0].style.width, height: liveButtons[0].style.height };
  // Simulate a fresh page boot's layout hydration from the persisted storage value.
  for (const key of ['left','top','width','height','min-height']) liveButtons[0].style[key] = '';
  sandbox.__controlTest.applyLiveControlLayout();
  assert.deepEqual({ left: liveButtons[0].style.left, top: liveButtons[0].style.top, width: liveButtons[0].style.width, height: liveButtons[0].style.height }, savedLeft, 'saved layout is rehydrated from localStorage on boot/reload');
  els['open-control-editor'].fire('click'); raf.shift()();
  els['control-editor-stage'].fire('pointerdown', { target: editorButtons.left, pointerId: 4, clientX: 20, clientY: 20, preventDefault: noop });
  els['control-editor-stage'].fire('pointermove', { target: editorButtons.left, pointerId: 4, clientX: 36, clientY: 52, preventDefault: noop });
  els['control-editor-stage'].fire('pointerup', { pointerId: 4 });
  els['control-size'].fire('input', { target: { value: '80' } });
  assert.notEqual(liveButtons[0].style.width, savedLeft.width, 'unsaved preview changes active size');
  els['cancel-control-editor'].fire('click');
  assert.equal(els['control-editor-layer'].hidden, true);
  assert.deepEqual({ left: liveButtons[0].style.left, top: liveButtons[0].style.top, width: liveButtons[0].style.width, height: liveButtons[0].style.height }, savedLeft, 'Cancel restores saved positions and sizes on active controls');
  console.log('Control runtime: drag/resize updates active buttons immediately and saved positions/sizes reload from localStorage');
})().catch(error => { console.error(error); process.exitCode = 1; });
