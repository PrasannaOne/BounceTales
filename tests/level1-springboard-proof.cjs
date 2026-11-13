'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const RLEF = require('../src/rlef-reader.js');
const Fixed = require('../src/fixed-point.js');
const Physics = require('../src/bounce-physics.js');
const Trampoline = require('../src/original-trampoline.js');
const Collision = require('../src/original-collision.js');

const root = path.resolve(__dirname, '..');
const levelBytes = fs.readFileSync(path.join(root, 'assets/original/bf'));
const parsed = RLEF.parse(levelBytes);
const world = RLEF.buildWorld(parsed.objects);
const imageMaps = JSON.parse(fs.readFileSync(path.join(root, 'src/image-map.json'), 'utf8'));
const spring = parsed.objects.find(object => object.type === 'trampoline');
const player = parsed.objects.find(object => object.type === 'player');
assert.ok(spring && player, 'Level 1 must contain the source springboard and player start');
assert.equal(spring.cmd, 12, 'RLEF command 12 maps to the JAR trampoline object');
assert.equal(spring.id, 2);
assert.equal(spring.parent, 1);
assert.equal(spring.previous, -1);
assert.equal(spring.transformFlags, 1, 'spring uses translation-only identity rotation/scale');
assert.deepEqual(spring.matrix, [65536, 0, 14942208, 0, 65536, -28311552]);
assert.equal(spring.flags, 15);
assert.equal(spring.imageId, 497);
assert.equal(spring.basePush, 75);

const parentGeometry = parsed.objects.find(object => object.id === spring.parent);
assert.equal(parentGeometry.type, 'geometry', 'Level 1 spring is a child of its polygon geometry object');
assert.ok(spring.id < player.id, 'the spring object is visited before the player in the source scene tree');
const springMatrix = world.get(spring.id);
const playerMatrix = world.get(player.id);
const springX = springMatrix[2] / 65536;
const springY = springMatrix[5] / 65536;
const spawnX = playerMatrix[2] / 65536;
const spawnY = playerMatrix[5] / 65536;
assert.deepEqual(springMatrix, [65536, 0, -117768192, 0, 65536, 31850496]);
assert.deepEqual([springX, springY], [-1797, 486]);
assert.deepEqual([spawnX, spawnY], [-1740, 918]);

// Recreate the game.js order: body integration, JAR spring collision, then
// terrain collision only if the spring has not disabled Bounce.
const polygons = parsed.objects.filter(object => object.type === 'geometry').map(object => {
  const matrix = world.get(object.id);
  const vertices16 = object.vertices16.map(vertex => Fixed.transformPoint(matrix, vertex[0], vertex[1]));
  return { id: object.id, vertices16, prevVertices16: vertices16, nocollide: (object.flags & 0x20) !== 0 };
});
const body = new Physics.BounceBody(spawnX, spawnY);
const trampoline = {
  object: spring, imageId: spring.imageId, basePush: spring.basePush,
  x: springX, y: springY, active: false, progress: 0, period: 0,
  frameStep: 0, elapsedMs: 0, animFrame: 0, calcPush: 0, jumpFinished: false
};
let contact = null;
let release = null;
let releaseAfterIntegration = null;
let capturedPeriod = 0;
let capturedFrameStep = 0;
let capturedPush = 0;
let previousWorldY = body.y;
const seenFrames = new Set([0]);
let completedAnimation = false;

for (let tick = 1; tick <= 180; tick++) {
  // Match m.i(): active scene objects update before the actor's physics tick.
  if (trampoline.active) {
    Trampoline.update(trampoline, body, imageMaps, 1 / 60, 17);
    seenFrames.add(trampoline.animFrame);
    if (trampoline.jumpFinished && !release) {
      release = { tick, vy: body.vy, frame: trampoline.animFrame, progress: trampoline.progress };
    }
  }
  const previous = {
    x: body.x, y: body.y,
    x16: Fixed.toFixed16(body.x), y16: Fixed.toFixed16(body.y)
  };
  if (body.enabled) body.update(1 / 60, 43266 / 65536, 17);
  if (release && releaseAfterIntegration === null && tick === release.tick) releaseAfterIntegration = body.y;

  // Match c.a(root): Level 1's geometry parent is checked before its child
  // trampoline. A terrain response therefore precedes the spring interaction.
  if (body.enabled) Collision.resolve(body, polygons, 1 / 60, previous, 8);
  if (!trampoline.active && body.enabled && body.vy < 0) {
    const localPrevious = Trampoline.worldToLocalFixed(springMatrix, previous.x16, previous.y16);
    const localCurrent = Trampoline.worldToLocalFixed(springMatrix, body.x16, body.y16);
    if (Trampoline.crossesLaunchLineFixed(localPrevious, localCurrent)) {
      contact = {
        tick, localPrevious, localCurrent, incomingVy: body.vy,
        incomingWorldY: body.y
      };
      assert.equal(Trampoline.begin(trampoline, body, imageMaps), true);
      capturedPeriod = trampoline.period;
      capturedFrameStep = trampoline.frameStep;
      capturedPush = trampoline.calcPush;
    }
  }
  if (!body.enabled) body.syncFixedPosition();
  if (trampoline.active === false && release && body.enabled && tick > release.tick) {
    completedAnimation = true;
    break;
  }
  previousWorldY = body.y;
}

assert.ok(contact, 'Bounce must intersect the actual Level 1 spring launch segment');
assert.ok(contact.tick > 0 && contact.tick < 180, 'contact occurs in the source-millisecond update sequence');
assert.equal(contact.localPrevious.x, 57 * 65536);
assert.ok(contact.localPrevious.y > 95 * 65536 && contact.localCurrent.y < 95 * 65536);
assert.ok(contact.incomingVy < 0, 'Bounce is descending in world Y at contact');
assert.ok(release, 'The spring animation must release Bounce');
assert.ok(releaseAfterIntegration > springY - Trampoline.frameOffset(imageMaps, spring.imageId, 4), 'the newly released Bounce is integrated upward in that same JAR-ordered tick');
assert.equal(release.vy, 600, 'JAR spring impulse is capped at 400 * (basePush * 2 / 100)');
assert.equal(release.frame, 5, 'All six spring frames are traversed before launch');
assert.deepEqual([...seenFrames].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5]);
assert.ok(completedAnimation, 'The spring animation must complete without leaving Bounce disabled');
assert.ok(body.y > previousWorldY, 'Positive world-Y launch produces upward world displacement');
assert.ok(body.vy > 0, 'Bounce must be moving upward after the springboard');

console.log(JSON.stringify({
  proof: 'Level 1 RLEF springboard lifecycle passed in Node.js',
  rlef: { objectId: spring.id, command: spring.cmd, parent: spring.parent, localTranslation: [228, -432], worldMatrix: springMatrix, worldPosition: [springX, springY], imageId: spring.imageId, basePush: spring.basePush },
  launchSegmentLocal: { from: [-70, 95], to: [70, 95], actorBounds: [-70, 0, 70, 95] },
  playerSpawn: [spawnX, spawnY],
  contact: { tick: contact.tick, previousLocal: [contact.localPrevious.x / 65536, contact.localPrevious.y / 65536], currentLocal: [contact.localCurrent.x / 65536, contact.localCurrent.y / 65536], incomingVy: contact.incomingVy },
  compression: { periodMs: capturedPeriod, frameStepMs: capturedFrameStep, calculatedPush: capturedPush, frames: [...seenFrames].sort((a, b) => a - b) },
  launch: { ...release, yAfterSameTickIntegration: releaseAfterIntegration },
  final: { x: body.x, y: body.y, vy: body.vy, enabled: body.enabled, animationFinished: completedAnimation }
}, null, 2));
