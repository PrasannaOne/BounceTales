'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const RLEF = require('../src/rlef-reader.js');
const Fixed = require('../src/fixed-point.js');
const Physics = require('../src/bounce-physics.js');
const Trampoline = require('../src/original-trampoline.js');

const root = path.resolve(__dirname, '..');
const LEVELS = ['bf','bg','bh','bi','bj','bk','bl','bm','bn','bo','bp','bq','br','bs','bt','bu'];
const imageMaps = JSON.parse(fs.readFileSync(path.join(root, 'src/image-map.json'), 'utf8'));
const report = [];
let totalSprings = 0;

for (const level of LEVELS) {
  const raw = RLEF.parse(fs.readFileSync(path.join(root, 'assets/original', level)));
  const decoded = JSON.parse(fs.readFileSync(path.join(root, 'reference/decoded-levels', level + '.json'), 'utf8'));
  const springs = raw.objects.filter(object => object.type === 'trampoline');
  const decodedSprings = decoded.objects.filter(object => object.type_code === 12);

  assert.equal(springs.length, decodedSprings.length, `${level}: raw RLEF and decoded JSON spring counts agree`);
  assert.deepEqual(springs.map(s => s.id), decodedSprings.map(s => s.index), `${level}: decoded spring object IDs agree`);
  if (!springs.length) {
    report.push({ level, springs: 0, status: 'no springboard object in this RLEF level' });
    continue;
  }

  const world = RLEF.buildWorld(raw.objects);
  const levelResults = [];
  for (const spring of springs) {
    const matrix = world.get(spring.id);
    const frameTotal = Trampoline.frameCount(imageMaps, spring.imageId);
    assert.ok(frameTotal > 1, `${level}/${spring.id}: animated spring frames are present`);
    assert.ok(spring.basePush > 0, `${level}/${spring.id}: source basePush is positive`);

    // Build a descending world-space sweep through the JAR's exact local
    // launch segment, then run the same fixed-point inverse transform.
    const previous = Trampoline.transformPointFixed(matrix, 0, 110 * 65536);
    const current = Trampoline.transformPointFixed(matrix, 0, 90 * 65536);
    const localPrevious = Trampoline.worldToLocalFixed(matrix, previous.x, previous.y);
    const localCurrent = Trampoline.worldToLocalFixed(matrix, current.x, current.y);
    assert.ok(current.y < previous.y, `${level}/${spring.id}: sweep is downward in world coordinates`);
    assert.equal(
      Trampoline.crossesLaunchLineFixed(localPrevious, localCurrent),
      true,
      `${level}/${spring.id}: source collision sweep crosses the launch segment`
    );

    const body = new Physics.BounceBody(current.x / 65536, current.y / 65536);
    body.x16 = current.x; body.y16 = current.y;
    body.vx = 0; body.vy = -500; body.enabled = true;
    const state = {
      imageId: spring.imageId, basePush: spring.basePush,
      x: matrix[2] / 65536, y: matrix[5] / 65536,
      active: false, progress: 0, period: 0, frameStep: 0,
      elapsedMs: 0, animFrame: 0, calcPush: 0, jumpFinished: false
    };

    assert.equal(Trampoline.begin(state, body, imageMaps), true, `${level}/${spring.id}: descending contact starts compression`);
    const frames = new Set([0]);
    let releaseYBeforeIntegration = null;
    let releaseVelocity = null;
    let releaseYAfterIntegration = null;
    let ticks = 0;
    while (state.active && ticks < 200) {
      const wasFinished = state.jumpFinished;
      Trampoline.update(state, body, imageMaps, 0.017, 17);
      frames.add(state.animFrame);
      if (!wasFinished && state.jumpFinished) {
        releaseYBeforeIntegration = body.y;
        releaseVelocity = body.vy;
      }
      if (body.enabled) {
        body.update(0.017, 43266 / 65536, 17);
        if (state.jumpFinished && releaseYAfterIntegration === null) {
          releaseYAfterIntegration = body.y;
        }
      }
      ticks++;
    }

    assert.deepEqual([...frames].sort((a,b) => a-b), Array.from({length: frameTotal}, (_,i) => i),
      `${level}/${spring.id}: every compression frame is displayed`);
    assert.equal(body.enabled, true, `${level}/${spring.id}: Bounce is re-enabled`);
    assert.ok(releaseVelocity > 0, `${level}/${spring.id}: Java-positive world-Y impulse is assigned`);
    assert.ok(releaseYAfterIntegration > releaseYBeforeIntegration,
      `${level}/${spring.id}: world Y rises on the release tick`);

    // J2ME logical viewport projection: screenY = 160 - (worldY-cameraY)*scale.
    // Use the same camera origin for both samples to isolate physical movement.
    const cameraY = 0, scale = 43266 / 65536;
    const screenYBefore = 160 - (releaseYBeforeIntegration - cameraY) * scale;
    const screenYAfter = 160 - (releaseYAfterIntegration - cameraY) * scale;
    assert.ok(screenYAfter < screenYBefore, `${level}/${spring.id}: screen Y moves upward`);

    levelResults.push({
      id: spring.id, imageId: spring.imageId, basePush: spring.basePush,
      compressionFrames: [...frames].sort((a,b) => a-b),
      releaseVelocity, worldYBefore: releaseYBeforeIntegration,
      worldYAfter: releaseYAfterIntegration, screenYBefore, screenYAfter
    });
    totalSprings++;
  }
  report.push({ level, springs: levelResults.length, status: 'all passed', results: levelResults });
}

assert.equal(totalSprings, 13, 'the 16 supplied RLEF levels contain 13 springboard objects');
console.log(JSON.stringify({
  proof: 'all actual spring objects from all 16 raw RLEF levels, cross-checked against decoded JSON',
  levelsChecked: LEVELS.length,
  levelsWithSprings: report.filter(r => r.springs > 0).map(r => r.level),
  springObjectsVerified: totalSprings,
  levels: report
}, null, 2));
