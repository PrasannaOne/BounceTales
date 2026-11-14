const assert = require('node:assert/strict');
const Registry = require('../src/module-registry.js');
assert.equal(Registry.apiVersion, 1);
const clock = { step() { return 1; } };
const game = Registry.createRegistry([
  { name: 'clock', group: 'foundation', description: 'Clock service', system: clock },
  { name: 'renderer', group: 'platform', system: { draw() { return true; } } },
  { name: 'storage', group: 'platform', system: null }
], { name: 'Example Game Registry' });
assert.equal(game.name, 'Example Game Registry');
assert.equal(game.require('clock'), clock);
assert.equal(game.list('platform').length, 2);
assert.equal(game.get('storage'), null);
assert.deepEqual(game.diagnostics().missing, ['storage']);
assert.equal(game.diagnostics().ready, false);
assert.throws(() => game.require('storage'), /unavailable/);
assert.throws(() => Registry.createRegistry({}), /array/);
assert.throws(() => Registry.createRegistry([{ name: '' , system: {} }]), /non-empty name/);
assert.throws(() => Registry.createRegistry([{ name: 'bad', system: 42 }]), /object, function, or null/);
assert.throws(() => Registry.createRegistry([{ name: 'x', system: {} }, { name: 'x', system: {} }]), /unique/);
assert.ok(Object.isFrozen(game));
assert.ok(Object.isFrozen(Registry));
console.log('Standalone module registry: independent modules, unavailable systems, validation and diagnostics passed');
