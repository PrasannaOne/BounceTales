'use strict';
const assert = require('node:assert/strict');
const { EventEngine, states } = require('../src/event-engine.js');

const identity = [65536, 0, 0, 0, 65536, 0];
const event = (id, repeatable = 0) => ({
  id, type: 'event', parent: -1, matrix: identity.slice(), flags: 0,
  bbox: [-10, 10, 10, -10], eventType: 0, triggerByLeave: 0,
  repeatable, triggerObjId: 100, commands: []
});
const objects = [
  { id: 100, type: 'player', parent: -1, matrix: identity.slice(), flags: 0 },
  event(1, 0), event(2, 1),
  { id: 200, type: 'sprite', parent: -1, matrix: [65536, 0, 40 * 65536, 0, 65536, 50 * 65536], flags: 0, sprites: [[0, 0, 358]] },
  { id: 201, type: 'sprite', parent: -1, matrix: [65536, 0, 5 * 65536, 0, 65536, 6 * 65536], flags: 0 },
  { id: 202, type: 'root', parent: -1, matrix: [65536, 0, 20 * 65536, 0, 65536, 30 * 65536], flags: 0 }
];
const messages = [], animations = [], flags = [], effects = [], camera = [];
const engine = new EventEngine(objects, {
  strings: ['Source dialogue'], playerObjectId: 100,
  onMessage: (...args) => messages.push(args),
  onAnimate: id => animations.push(id),
  onFlagsChanged: (...args) => flags.push(args),
  onOriginalSpriteEffect: obj => effects.push(obj.id),
  onCameraTarget: id => camera.push(['target', id]),
  onCameraParams: (...args) => camera.push(['params', ...args])
});
const activeEvent = engine.events[0];
const body = { x: 0, y: 0, vx: 0, vy: 0, pushX: 0, pushY: 0, gravityX: 0, gravityY: 0 };
const i16 = (n) => { const b = Buffer.alloc(2); b.writeInt16BE(n); return [...b]; };
const i32 = (n) => { const b = Buffer.alloc(4); b.writeInt32BE(n); return [...b]; };
const run = (bytes, deltaMs = 16, targetEvent = activeEvent) => engine.runCommand(targetEvent, bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes), deltaMs, body, 100);

// 0–1: dialogue suspension and authored sprite-animation callback.
let result = run([0, ...i16(0)]);
assert.deepEqual(result, { done: false, message: true });
assert.equal(activeEvent.waitingForMessage, true);
assert.deepEqual(messages, [[0, 'Source dialogue', 1]]);
assert.equal(engine.resumeMessages(1), 1);
assert.equal(activeEvent.waitingForMessage, false);
run([1, ...i16(76)]);
assert.deepEqual(animations, [76]);

// 2–5: event state transition commands use the original event-index table.
const target = engine.events[1];
run([4, 1]); assert.equal(target.state, states.ACTIVE);
run([5, 1]); assert.equal(target.state, states.PAUSED);
run([4, 1]); assert.equal(target.state, states.ACTIVE);
run([2, 1]); assert.equal(target.state, states.TERMINATED);
run([3, 1]); assert.equal(target.state, states.WAITING);

// 6: delay keeps its initial interval and subtracts elapsed milliseconds.
const delay = Uint8Array.from([6, ...i16(100), ...i16(100)]);
assert.equal(run(delay, 25).done, false);
assert.deepEqual([...delay.slice(3, 5)], i16(75));
assert.equal(run(delay, 75).done, false);
assert.equal(run(delay, 1).done, false);
assert.equal(run(delay, 1).done, true);

// 7–11: integer variable set/add/subtract/multiply/divide.
run([7, 2, 0, 32, ...i32(20)]);
assert.equal(engine.vars[0], 20);
run([8, 2, 0, 32, ...i32(5)]); assert.equal(engine.vars[0], 25);
run([9, 2, 0, 32, ...i32(3)]); assert.equal(engine.vars[0], 22);
run([10, 2, 0, 32, ...i32(2)]); assert.equal(engine.vars[0], 44);
run([11, 2, 0, 32, ...i32(4)]); assert.equal(engine.vars[0], 11);
// Float register assignment is stored as IEEE-754 bits, as in the original interpreter.
const floatBits = Buffer.alloc(4); floatBits.writeFloatBE(1.25);
run([7, 1, 1, 16, ...floatBits]);
assert.equal(engine.vars[1], new DataView(floatBits.buffer, floatBits.byteOffset, floatBits.byteLength).getInt32(0, false));

// 12–15: comparisons preserve the original conditional branch polarity.
engine.vars[0] = 11;
assert.equal(run([12, 2, 0, 32, ...i32(11), 3]).branchTo, null); // jump if not equal
assert.equal(run([12, 2, 0, 32, ...i32(12), 3]).branchTo, 2);
assert.equal(run([13, 2, 0, 32, ...i32(11), 4]).branchTo, 3); // jump if equal
assert.equal(run([14, 2, 0, 32, ...i32(10), 5]).branchTo, 4); // >=
assert.equal(run([15, 2, 0, 32, ...i32(12), 6]).branchTo, 5); // <=

// 16–17: timed translation and rotation update the scene object's fixed-point matrix.
const moving = engine.getObject(201);
const translate = Uint8Array.from([16, ...i16(201), ...i32(65536), ...i32(131072), ...i32(20), ...i32(20)]);
assert.equal(run(translate, 5).done, false);
assert.equal(moving.matrix[2], 10 * 65536);
assert.equal(moving.matrix[5], 16 * 65536);
assert.equal(run(translate, 15).done, true);
assert.equal(moving.matrix[2], 25 * 65536);
assert.equal(moving.matrix[5], 46 * 65536);
const rotate = Uint8Array.from([17, ...i16(201), ...i32(Math.round(Math.PI / 2 * 65536)), ...i32(1000), ...i32(1000)]);
assert.equal(run(rotate, 250).done, false);
assert.equal(run(rotate, 250).done, false);
assert.ok(moving.matrix[0] < 65536 && moving.matrix[3] > 0);

// 18–20: absolute/source positioning, parenting and detaching.
const place = [18, ...i16(201), ...i16(-1), ...i32(7 * 65536), ...i32(9 * 65536)];
run(place); assert.equal(moving.matrix[2], 7 * 65536); assert.equal(moving.matrix[5], 9 * 65536);
const follow = [18, ...i16(201), ...i16(200), ...i32(0), ...i32(0)];
run(follow); engine.rebuildWorld();
// Opcode 18 stores the source world point transformed through the inverse of
// the destination's translation-free basis, matching the original d.c(d.a)
// then d.a(sourceX, sourceY) sequence.
const a=moving.matrix[0]/65536,b=moving.matrix[1]/65536,c=moving.matrix[3]/65536,d=moving.matrix[4]/65536;
const det=a*d-b*c;
const expectedLocalX=Math.round(((d*40-b*50)/det)*65536);
const expectedLocalY=Math.round(((a*50-c*40)/det)*65536);
// V60: opcode 18 is now a bit-exact port of the original fixed-point d.c(d) inverse (truncating
// long division, 32-bit narrowing), proven against the real class in tools/differential. The
// exact-real-number result above is only a sanity bound: the original's fixed-point rounding
// legitimately differs from it by a few dozen 1/65536 units.
assert.ok(Math.abs(moving.matrix[2] - expectedLocalX) <= 64, `x ${moving.matrix[2]} vs ${expectedLocalX}`);
assert.ok(Math.abs(moving.matrix[5] - expectedLocalY) <= 64, `y ${moving.matrix[5]} vs ${expectedLocalY}`);
assert.deepEqual(engine.world.get(201), moving.matrix);
run([19, ...i16(201), ...i16(202)]); engine.rebuildWorld();
assert.equal(moving.parent, 202);
assert.equal(engine.world.get(201)[2], moving.matrix[2] + 20 * 65536);
assert.equal(engine.world.get(201)[5], moving.matrix[5] + 30 * 65536);
run([20, ...i16(201)]); engine.rebuildWorld();
assert.equal(moving.parent, -1);
assert.deepEqual(engine.world.get(201), moving.matrix);

// 21–25: jumps, no-op, end state, leave-area wait and checkpoint.
assert.equal(run([21, 4]).branchTo, 3);
assert.deepEqual(run([22]), { done: true });
run([23], 16, engine.events[1]); assert.equal(engine.events[1].state, states.WAITING);
assert.equal(run([24], 16).done, false);
assert.equal(run([24], 16, activeEvent).done, false);
const checkpoint = engine.getObject(1);
checkpoint.matrix[2] = 12 * 65536; checkpoint.matrix[5] = 34 * 65536; engine.rebuildWorld();
run([25]); assert.deepEqual(engine.checkpoint, { x: 12, y: 34, eventId: 1 });

// 26–28: player-only push, gravity and velocity impulses.
run([26, ...i16(100), ...i16(3), ...i16(-4)]);
assert.deepEqual([body.pushX, body.pushY], [3, -4]);
run([27, ...i16(100), ...i16(-5), ...i16(6)]);
assert.deepEqual([body.gravityX, body.gravityY], [-5, 6]);
run([28, ...i16(100), ...i16(7), ...i16(8)]);
assert.deepEqual([body.vx, body.vy], [7, 8]);
run([26, ...i16(200), ...i16(99), ...i16(99)]);
assert.deepEqual([body.pushX, body.pushY], [3, -4], 'non-player object targets must not alter Bounce');

// 29–32: packed flags/depth and camera settings.
const sprite = engine.getObject(200);
run([29, ...i16(200), ...i32(1 | 32 | 128 | 256), ...i32(4 | 32 | 256)]);
assert.equal(sprite.renderDepth, -12);
assert.equal(sprite.runtimeFlags & 31, 4);
assert.equal(sprite.runtimeFlags & 32, 32);
assert.equal(sprite.runtimeFlags & 128, 0);
assert.equal(sprite.runtimeFlags & 256, 256);
assert.deepEqual(flags.at(-1).slice(1), [sprite.runtimeFlags, 1 | 32 | 128 | 256, 4 | 32 | 256]);
assert.deepEqual(effects, [200], 'touching selector 0x80 invokes the source image-358 effect even when clearing the bit');
run([30, ...i16(200)]); assert.equal(engine.cameraTargetId, 200);
run([31, 1, ...i16(25), ...i16(40)]);
assert.equal(engine.cameraSnap, true); assert.equal(engine.cameraBounceFactor, 25); assert.equal(engine.cameraStabilizeSpeed, 40);
run([32]);
assert.equal(engine.cameraSnap, false); assert.equal(engine.cameraBounceFactor, 90); assert.equal(engine.cameraStabilizeSpeed, 140);
assert.equal(engine.unsupported.size, 0);
console.log('Event interpreter: synthetic behavioral checks passed for every opcode 0–32, including all 26 campaign-used opcodes and reserved cases');
