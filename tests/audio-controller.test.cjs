'use strict';
const assert = require('node:assert/strict');
const { AudioController, resourceForLevel, RESOURCE_FILES } = require('../src/audio-controller.js');
assert.equal(RESOURCE_FILES[28], 'title.ogg');
assert.deepEqual([0,1,2,3,4,5,8,9,10,13,14].map(resourceForLevel), [29,29,29,32,35,30,32,35,31,32,35]);

class FakeAudioContext {
  constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; this.sources = []; }
  createGain() { return { gain: { value: 0, setTargetAtTime(value) { this.value = value; } }, connect() {} }; }
  createBufferSource() {
    const source = { buffer: null, loop: false, onended: null, started: false, stopped: false,
      connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
    this.sources.push(source); return source;
  }
  decodeAudioData() { return Promise.resolve({ decoded: true }); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
const wait = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const store = new Map(), urls = [];
  const storage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, String(value)) };
  const music = new AudioController({
    ContextClass: FakeAudioContext, storage, basePath: '/audio/',
    fetcher: async url => { urls.push(url); return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; }
  });
  assert.equal(music.enabled, true);
  assert.equal(music.playTitle(), true);
  await wait(); await wait();
  assert.equal(music.currentResource, 28);
  assert.equal(music.currentSource.loop, true);
  assert.equal(music.currentSource.started, true);
  assert.ok(urls.includes('/audio/title.ogg'));
  assert.equal(await music.unlock(), true, 'Web Audio unlocks through the user-gesture path');

  assert.equal(music.playLevel(4), true);
  await wait(); await wait();
  assert.equal(music.currentResource, 35);
  assert.equal(music.currentSource.loop, true);

  assert.equal(music.playCue(33), true);
  await wait(); await wait();
  const cue = music.currentSource;
  assert.equal(music.currentResource, 33);
  assert.equal(cue.loop, false);
  cue.onended();
  assert.equal(music.currentSource, null);

  assert.equal(music.playLevel(3), true);
  await wait(); await wait();
  assert.equal(music.currentResource, 32);
  music.setEnabled(false);
  assert.equal(store.get('bounce-music-enabled'), 'false');
  assert.equal(music.currentSource, null);
  assert.equal(music.playTitle(), false);
  music.setEnabled(true);
  await wait(); await wait();
  assert.equal(music.currentResource, 32, 're-enabling resumes the last music resource after audio unlock');
  music.playCue(34);
  await wait(); await wait();
  assert.equal(music.currentResource, 34);
  assert.equal(music.currentSource.loop, false);
  music.dispose();
  assert.equal(music.currentSource, null);
  console.log('Web Audio: title, act, boss, bonus, lose and win routing, loop/cue behaviour, persistence and resume verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
