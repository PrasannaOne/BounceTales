/*
 * Minimal game-port module registry.
 * This file has no Bounce Tales, browser DOM, or filesystem dependencies and
 * can be carried into another game port as a standalone utility.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BounceModuleRegistry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createRegistry(definitions, options = {}) {
    if (!Array.isArray(definitions)) throw new TypeError('Registry definitions must be an array');
    const entries = definitions.map((definition, index) => {
      if (!definition || typeof definition.name !== 'string' || !definition.name.trim()) {
        throw new TypeError(`Registry entry ${index} requires a non-empty name`);
      }
      const system = definition.system == null ? null : definition.system;
      if (system !== null && typeof system !== 'object' && typeof system !== 'function') {
        throw new TypeError(`Registry entry ${definition.name} system must be an object, function, or null`);
      }
      return Object.freeze({
        name: definition.name.trim(),
        group: typeof definition.group === 'string' && definition.group ? definition.group : 'custom',
        description: typeof definition.description === 'string' ? definition.description : '',
        system
      });
    });
    const names = new Set(entries.map(entry => entry.name));
    if (names.size !== entries.length) throw new Error('Registry system names must be unique');

    const registered = Object.create(null);
    for (const entry of entries) registered[entry.name] = entry.system;
    Object.freeze(registered);

    const metadata = Object.freeze(entries.map(({ name, group, description, system }) => Object.freeze({
      name, group, description, available: system !== null
    })));
    const registryName = typeof options.name === 'string' && options.name.trim()
      ? options.name.trim()
      : 'Game Port Registry';

    function get(name) {
      return Object.prototype.hasOwnProperty.call(registered, name) ? registered[name] : null;
    }
    function requireSystem(name) {
      const system = get(name);
      if (system === null) throw new Error(`${registryName} system is unavailable: ${String(name)}`);
      return system;
    }
    function diagnostics() {
      const available = metadata.filter(item => item.available).map(item => item.name);
      const missing = metadata.filter(item => !item.available).map(item => item.name);
      return Object.freeze({
        apiVersion: 1,
        total: metadata.length,
        available: Object.freeze(available),
        missing: Object.freeze(missing),
        ready: missing.length === 0
      });
    }

    return Object.freeze({
      name: registryName,
      apiVersion: 1,
      list(group = 'all') { return metadata.filter(item => group === 'all' || item.group === group).slice(); },
      get,
      require: requireSystem,
      diagnostics
    });
  }

  return Object.freeze({ apiVersion: 1, createRegistry });
});
