/*
 * Bounce Tales module catalog built on the independent module-registry helper.
 * This is a discovery/composition surface, not a replacement game loop.
 */
(function (root, factory) {
  const commonJS = typeof module !== 'undefined' && module.exports;
  const moduleRegistry = commonJS ? require('./module-registry.js') : root.BounceModuleRegistry;
  const api = factory(root, moduleRegistry, commonJS);
  if (commonJS) module.exports = api;
  root.BouncePortEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, moduleRegistry, commonJS) {
  'use strict';

  if (!moduleRegistry || typeof moduleRegistry.createRegistry !== 'function') {
    throw new Error('Load src/module-registry.js before src/port-engine.js');
  }

  const catalog = Object.freeze([
    { name: 'fixedPoint', globalName: 'BounceFixed16', file: './fixed-point.js', group: 'foundation', description: 'Fixed-point arithmetic helpers.' },
    { name: 'timing', globalName: 'BounceGameTiming', file: './game-timing.js', group: 'foundation', description: 'Fixed-step simulation clock.' },
    { name: 'terrainCollision', globalName: 'BounceTerrainCollision', file: './terrain-collision.js', group: 'foundation', description: 'Polygon and circle collision primitives.' },
    { name: 'particles', globalName: 'BounceGameParticles', file: './game-particles.js', group: 'foundation', description: 'Small deterministic-friendly particle system.' },
    { name: 'audio', globalName: 'BounceAudioController', file: './audio-controller.js', group: 'platform', description: 'Browser audio controller with local preferences.' },
    { name: 'controlLayout', globalName: 'BounceControlLayout', file: './control-layout.js', group: 'platform', description: 'Normalized, persistent touch-control layout.' },
    { name: 'rlef', globalName: 'BounceRLEF', file: './rlef-reader.js', group: 'formats', description: 'RLEF binary resource parser and transform builder.' },
    { name: 'spriteAtlas', globalName: 'BounceSpriteAtlas', file: './sprite-atlas.js', group: 'formats', description: 'Validated original Bounce Tales sprite-atlas mapping.' },
    { name: 'midpGraphics', globalName: 'BounceMIDPGraphics', file: './midp-graphics.js', group: 'formats', description: 'MIDP-style graphics and anchor helpers.' },
    { name: 'eventEngine', globalName: 'BounceEventEngine', file: './event-engine.js', group: 'formats', description: 'Original resource script and localization helpers.' },
    { name: 'bouncePhysics', globalName: 'BouncePhysics', file: './bounce-physics.js', group: 'bounceCompatibility', description: 'Bounce Tales player motion and form behavior.' },
    { name: 'collision', globalName: 'BounceOriginalCollision', file: './original-collision.js', group: 'bounceCompatibility', description: 'Bounce Tales object/contact collision translation.' },
    { name: 'camera', globalName: 'BounceOriginalCamera', file: './original-camera.js', group: 'bounceCompatibility', description: 'Bounce Tales camera and world projection.' },
    { name: 'enemies', globalName: 'BounceOriginalEnemies', file: './original-enemies.js', group: 'bounceCompatibility', description: 'Bounce Tales enemy state and behavior.' },
    { name: 'water', globalName: 'BounceOriginalWater', file: './original-water.js', group: 'bounceCompatibility', description: 'Bounce Tales water zones and buoyancy.' },
    { name: 'trampoline', globalName: 'BounceOriginalTrampoline', file: './original-trampoline.js', group: 'bounceCompatibility', description: 'Bounce Tales springboard transform and launch lifecycle.' },
    { name: 'progression', globalName: 'BounceOriginalProgression', file: './original-progression.js', group: 'bounceCompatibility', description: 'Bounce Tales chapter, unlock and save progression.' },
    { name: 'inputMap', globalName: 'BounceOriginalInput', file: './original-input-map.js', group: 'bounceCompatibility', description: 'Original J2ME input-key normalization.' },
    { name: 'spriteAnimation', globalName: 'BounceOriginalSpriteAnimation', file: './original-sprite-animation.js', group: 'bounceCompatibility', description: 'Recovered Bounce Tales animation timing.' },
    { name: 'hud', globalName: 'BounceOriginalHud', file: './original-hud.js', group: 'bounceCompatibility', description: 'Original HUD sprite/digit and timer mapping.' }
  ]);

  // In Node/CommonJS, initialize the same modules that index.html loads first.
  if (commonJS) {
    for (const item of catalog) {
      if (!root[item.globalName]) require(item.file);
    }
  }

  const definitions = catalog.map(item => ({
    name: item.name,
    group: item.group,
    description: item.description,
    system: root[item.globalName] || null
  }));
  const registry = moduleRegistry.createRegistry(definitions, { name: 'Bounce Port Engine' });

  return Object.freeze({
    name: registry.name,
    apiVersion: registry.apiVersion,
    list: registry.list,
    get: registry.get,
    require: registry.require,
    diagnostics: registry.diagnostics,
    createRegistry: moduleRegistry.createRegistry
  });
});
