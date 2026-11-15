'use strict';
const assert = require('node:assert/strict');
const { AudioController, resourceForLevel, RESOURCE_FILES, SOURCE_MIDI_FILES } = require('../src/audio-controller.js');
assert.equal(RESOURCE_FILES[28], 'title.ogg');
assert.deepEqual(SOURCE_MIDI_FILES,{28:'aw.mid',29:'ax.mid',30:'ay.mid',31:'az.mid',32:'ba.mid',33:'bb.mid',34:'bc.mid',35:'bd.mid'});
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
  assert.equal(music.volume, 0.72, 'the existing browser master gain is retained until the pre-rendered audio can be compared perceptually');
  assert.equal(music.playTitle(), true);
  await wait(); await wait();
  assert.equal(music.currentResource, 28);
  assert.equal(music.currentSource.loop, true);
  assert.equal(music.currentSource.started, true);
  assert.equal(music.master.gain.value, 0.72, 'the pre-rendered Opus master gain is not attenuated a second time by an assumed MIDI volume conversion');
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
  const playingBeforeDeparture = music.currentSource;
  music.pause();
  assert.equal(playingBeforeDeparture.stopped, true, 'departure stops the active audio source, not just the AudioContext clock');
  assert.equal(music.currentSource, null);
  assert.equal(music.context.state, 'suspended');
  assert.equal(music.lifecyclePaused, true);
  assert.equal(await music.resume(), true, 'a previously unlocked and enabled track can resume after return');
  assert.equal(music.currentResource, 32);
  assert.notEqual(music.currentSource, playingBeforeDeparture, 'resume creates a fresh source rather than reusing a stopped node');
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

  // A decode/fetch still in flight must not start music after the page leaves.
  let releaseFetch;
  const delayed = new AudioController({
    ContextClass: FakeAudioContext,
    storage,
    fetcher: () => new Promise(resolve => { releaseFetch = resolve; })
  });
  delayed.playTitle();
  await wait();
  assert.equal(typeof releaseFetch, 'function');
  delayed.pause();
  releaseFetch({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  await wait(); await wait();
  assert.equal(delayed.currentSource, null, 'late audio load must not restart after lifecycle pause');
  assert.equal(delayed.lifecyclePaused, true);
  assert.equal(await delayed.resume(), false, 'return does not unlock audio before the first user gesture');
  assert.equal(delayed.lifecyclePaused, false);
  delayed.dispose();

  const gameSource = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'game.js'), 'utf8');
  assert.match(gameSource, /addEventListener\('pagehide',suspendForDeparture\)/);
  assert.match(gameSource, /addEventListener\('pageshow'/);
  assert.match(gameSource, /addEventListener\('freeze',suspendForDeparture\)/);
  console.log('Web Audio: routing, persistence, lifecycle suspension, late-load race protection and page lifecycle wiring verified');
})().catch(error => { console.error(error); process.exitCode = 1; });
