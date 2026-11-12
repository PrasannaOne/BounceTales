import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOriginalKey,
  normalizeBrowserKey,
  keyBit,
  isOriginalKeyHeld,
  getActiveGameplayInputState
} from '../src/original-input-map.js';

test('Nokia-specific keys use the exact original internal IDs', () => {
  assert.equal(normalizeOriginalKey(-7), 5);
  assert.equal(normalizeOriginalKey(-6), 6);
  assert.equal(normalizeOriginalKey(-5), 7);
});

test('ASCII digits and star/hash use the original internal IDs', () => {
  for (let digit = 0; digit <= 9; digit++) {
    assert.equal(normalizeOriginalKey(String(digit).charCodeAt(0)), digit + 10);
  }
  assert.equal(normalizeOriginalKey('*'.charCodeAt(0)), 20);
  assert.equal(normalizeOriginalKey('#'.charCodeAt(0)), 21);
});

test('MIDP directional game actions map exactly', () => {
  assert.equal(normalizeOriginalKey(-999, 1), 1); // UP
  assert.equal(normalizeOriginalKey(-999, 2), 3); // LEFT
  assert.equal(normalizeOriginalKey(-999, 5), 4); // RIGHT
  assert.equal(normalizeOriginalKey(-999, 6), 2); // DOWN
  assert.equal(normalizeOriginalKey(-999, 8), -1); // FIRE is not mapped by o.e(int)
});

test('mode 2 applies the original numeric-key remap', () => {
  assert.equal(normalizeOriginalKey('2'.charCodeAt(0), null, 2), 1);
  assert.equal(normalizeOriginalKey('4'.charCodeAt(0), null, 2), 3);
  assert.equal(normalizeOriginalKey('5'.charCodeAt(0), null, 2), 7);
  assert.equal(normalizeOriginalKey('6'.charCodeAt(0), null, 2), 4);
  assert.equal(normalizeOriginalKey('8'.charCodeAt(0), null, 2), 2);
});

test('browser arrows and held-key bitfields follow original IDs', () => {
  assert.equal(normalizeBrowserKey('ArrowUp'), 1);
  assert.equal(normalizeBrowserKey('ArrowLeft'), 3);
  assert.equal(normalizeBrowserKey('ArrowRight'), 4);
  assert.equal(normalizeBrowserKey('ArrowDown'), 2);
  const mask = (keyBit(3) | keyBit(15)) >>> 0;
  assert.equal(isOriginalKeyHeld(mask, 3), true);
  assert.equal(isOriginalKeyHeld(mask, 4), false);
  assert.deepEqual(getActiveGameplayInputState(mask), {
    left: true,
    right: false,
    primaryActorAction: true
  });
});
