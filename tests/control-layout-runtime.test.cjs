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
    style: { setProperty(key, value, priority) { this[key] = value; if (priority) this['priority:' + key] = priority; }, removeProperty(key) { delete this[key]; } },
    classList: { add: noop, remove: noop, toggle: noop }, setAttribute: noop, removeAttribute: noop, focus: noop,
    width: 160, height: 104,
    addEventListener(name, fn) { (handlers[name] ??= []).push(fn); },
    fire(name, event = {}) { for (const fn of handlers[name] || []) fn(event); },
    getContext: () => ctx2d,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: id === 'game-controls' ? 320 : 240, height: id === 'game-controls' ? (320 * 140 / 360) : 136 }),
    setPointerCapture: noop, handlers,
    closest(selector) { return selector.includes('data-key-id') && this.dataset.keyId ? this : null; }
  };
}
const ids = ['app','game-controls','game-text','settings-game-tab','settings-about-tab','settings-game-pane','settings-about-pane','keyboard-hint','game','level-cover','menu','level-screen','pause-layer','complete-layer','guide-layer','settings-layer','control-editor-layer','open-control-editor','close-control-editor','cancel-control-editor','save-control-layout','reset-control-layout','control-size','control-size-value','statusline','egg-hud','fps-counter','pause-mini','continue-game','open-chapters','open-guide','level-prev','level-next','level-position','level-name','level-chapter','level-record','level-lock','play-level','back-title','resume','restart','pause-chapters','complete-title','complete-eggs','complete-stats','next-level','result-chapters','guide-back','fps-mode','smooth-motion','show-fps','fullscreen-btn','open-settings','close-settings','share-site','reset-game','game-hint','save-summary','music-enabled'];
const els = Object.fromEntries(ids.map(id => [id, element(id)]));
const liveButtons = ['left','right','jump','form'].map((name, index) => {
  const button = element(name); button.dataset.keyId = ['3','4','7','20'][index]; return button;
});
els['game-controls'].querySelectorAll = () => liveButtons;
const pickerButtons = ['left','right','jump','form'].map(name => { const b = element('pick-' + name); b.dataset.pickControl = name; return b; });
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
  hidden: false, fullscreenElement: null, activeElement: els['open-settings'],
  documentElement: { requestFullscreen: async () => { document.fullscreenElement = document.documentElement; } },
  getElementById: id => els[id] || element(id),
  querySelector: selector => selector.includes('about') ? els['settings-about-tab'] : els['settings-game-tab'],
  querySelectorAll: selector => selector === '[data-settings-tab]' ? tabs : selector === '[data-pick-control]' ? pickerButtons : selector === '[data-key-id]' ? liveButtons : [],
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
for (const file of ['src/control-layout.js','src/fixed-point.js','src/original-input-map.js','src/original-camera.js','src/rlef-reader.js','src/bounce-physics.js','src/terrain-collision.js','src/original-collision.js','src/game-timing.js','src/event-engine.js','src/original-sprite-animation.js','src/original-enemies.js','src/original-water.js','src/original-trampoline.js','src/midp-graphics.js','src/original-progression.js','src/game-particles.js','src/sprite-atlas.js','src/audio-controller.js','src/original-hud.js','game.js']) {
  let source = fs.readFileSync(path.join(root, file), 'utf8');
  if (file === 'game.js') source = source.replace('boot();', 'window.__controlTest={applyLiveControlLayout,startLevel,input};boot();');
  vm.runInContext(source, sandbox, { filename: file });
}
const wait = () => new Promise(resolve => setImmediate(resolve));
const pointerEvent = (extra = {}) => ({
  pointerId: 3, clientX: 20, clientY: 20, button: 0,
  preventDefault: noop, stopPropagation: noop, stopImmediatePropagation: noop, ...extra
});
(async () => {
  await wait(); await wait();
  assert.equal(els.app.dataset.mode, 'title');
  assert.ok(Number.parseFloat(liveButtons[0].style.width) > 90, 'live controls are measured and visible on the title screen');
  assert.ok(liveButtons.every(button => button.style.left !== undefined && button.style.top !== undefined), 'all four real controls receive positioned geometry in the title scene');

  // Open the editor from Settings. It switches to direct editing of the real controls.
  els['open-settings'].fire('click');
  els['open-control-editor'].fire('click');
  assert.equal(els['settings-layer'].hidden, true, 'settings closes so the game remains visible while editing');
  assert.equal(els['control-editor-layer'].hidden, false);
  const initialLeft = { left: liveButtons[0].style.left, top: liveButtons[0].style.top, width: liveButtons[0].style.width };

  els['game-controls'].fire('pointerdown', pointerEvent({ target: liveButtons[0] }));
  els['game-controls'].fire('pointermove', pointerEvent({ target: liveButtons[0], clientX: 60, clientY: 40 }));
  els['game-controls'].fire('pointerup', pointerEvent());
  assert.notEqual(liveButtons[0].style.left, initialLeft.left, 'dragging on the game screen moves the actual left control');
  assert.notEqual(liveButtons[0].style.top, initialLeft.top, 'dragging on the game screen changes its vertical position');

  const beforeResize = Number.parseFloat(liveButtons[0].style.width);
  els['control-size'].fire('input', { target: { value: '120' } });
  assert.ok(Number.parseFloat(liveButtons[0].style.width) > beforeResize, 'the selected live control resizes immediately');
  els['save-control-layout'].fire('click');
  const saved = JSON.parse(prefs.get('bounce-control-layout-v1'));
  assert.equal(saved.left.size, 120);
  assert.ok(saved.left.x > 0 && saved.left.y > 0, 'the directly dragged position persists');
  assert.equal(els['control-editor-layer'].hidden, true);

  // The same control remains a working game input when edit mode is closed.
  sandbox.__controlTest.startLevel();
  liveButtons[0].fire('pointerdown', pointerEvent({ pointerId: 9 }));
  assert.equal(sandbox.__controlTest.input.isHeld(3), true, 'normal pointerdown still presses the gameplay input');
  liveButtons[0].fire('pointerup', pointerEvent({ pointerId: 9 }));
  assert.equal(sandbox.__controlTest.input.isHeld(3), false, 'normal pointerup releases the gameplay input');

  // Cancel restores the last saved layout, including coordinates and size.
  els['open-settings'].fire('click');
  els['open-control-editor'].fire('click');
  const savedStyle = { left: liveButtons[0].style.left, top: liveButtons[0].style.top, width: liveButtons[0].style.width, height: liveButtons[0].style.height };
  els['game-controls'].fire('pointerdown', pointerEvent({ pointerId: 4, target: liveButtons[0] }));
  els['game-controls'].fire('pointermove', pointerEvent({ pointerId: 4, target: liveButtons[0], clientX: 36, clientY: 52 }));
  els['game-controls'].fire('pointerup', pointerEvent({ pointerId: 4 }));
  els['control-size'].fire('input', { target: { value: '80' } });
  els['cancel-control-editor'].fire('click');
  assert.equal(els['control-editor-layer'].hidden, true);
  assert.deepEqual({ left: liveButtons[0].style.left, top: liveButtons[0].style.top, width: liveButtons[0].style.width, height: liveButtons[0].style.height }, savedStyle, 'Cancel restores the saved live control geometry');

  // Controls retain measurable geometry when gameplay starts as well.
  sandbox.__controlTest.startLevel();
  assert.ok(Number.parseFloat(liveButtons[0].style.width) > 90, 'controls stay correctly sized after transition into gameplay');
  console.log('Control runtime: all-scene visibility, live drag/resize, save, cancel, and working gameplay pointer input passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
