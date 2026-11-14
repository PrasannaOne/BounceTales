'use strict';
const assert = require('node:assert/strict');
const Engine = require('../src/port-engine.js');

assert.equal(Engine.name, 'Bounce Port Engine');
assert.equal(Engine.apiVersion, 1);
const report = Engine.diagnostics();
assert.equal(report.ready, true, `missing systems: ${report.missing.join(', ')}`);
assert.equal(report.total, 20);
assert.equal(report.available.length, 20);
assert.equal(Engine.list('foundation').length, 4);
assert.equal(Engine.list('formats').length, 4);
assert.equal(Engine.list('bounceCompatibility').length, 10);
assert.equal(Engine.list('platform').length, 2);
assert.equal(typeof Engine.require('fixedPoint').mul, 'function');
assert.equal(typeof Engine.require('rlef').parse, 'function');
assert.equal(Engine.get('not-a-system'), null);
assert.throws(() => Engine.require('not-a-system'), /system is unavailable/);
assert.ok(Object.isFrozen(Engine));
assert.ok(Object.isFrozen(Engine.diagnostics()));
console.log('Port Engine registry: CommonJS discovery, system groups, required access and diagnostics passed');

const sharedClock={tick(){return 1;}};
const custom=Engine.createRegistry([
  {name:'clock',group:'foundation',description:'A sample port clock',system:sharedClock},
  {name:'renderer',group:'platform',system:{draw(){return true;}}}
]);
assert.equal(custom.name,'Game Port Registry');
assert.equal(custom.apiVersion,1);
assert.equal(custom.require('clock'),sharedClock);
const customRequire=custom.require;assert.equal(customRequire('clock'),sharedClock,'registry require stays safe when passed as a callback');
assert.equal(custom.list('foundation').length,1);
assert.equal(custom.diagnostics().ready,true);
assert.equal(custom.get('missing'),null);
assert.throws(()=>custom.require('missing'),/unavailable/);
assert.throws(()=>Engine.createRegistry([{name:'same',system:{}},{name:'same',system:{}}]),/unique/);
assert.throws(()=>Engine.createRegistry([{name:'bad',system:42}]),/object, function, or null/);
console.log('Generic port registry factory: isolated systems, metadata, diagnostics and validation passed');
