/* Responsive touch-control geometry shared by the game and its tests. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BounceControlLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const SURFACE = Object.freeze({ width: 360, height: 108 });
  const BASE = Object.freeze({
    left: Object.freeze({ width: 84, height: 52 }),
    right: Object.freeze({ width: 84, height: 52 }),
    jump: Object.freeze({ width: 104, height: 52 }),
    form: Object.freeze({ width: 42, height: 42 })
  });
  const DEFAULTS = Object.freeze({
    left: Object.freeze({ x: 0, y: 0, size: 100 }),
    right: Object.freeze({ x: 35, y: 0, size: 100 }),
    jump: Object.freeze({ x: 73, y: 0, size: 100 }),
    form: Object.freeze({ x: 78, y: 80, size: 100 })
  });
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function cloneDefaults() { return JSON.parse(JSON.stringify(DEFAULTS)); }
  function normalize(value) {
    if (!value || typeof value !== 'object') return null;
    const clean = {};
    for (const id of Object.keys(DEFAULTS)) {
      const item = value[id];
      if (!item || !Number.isFinite(Number(item.x)) || !Number.isFinite(Number(item.y)) || !Number.isFinite(Number(item.size))) return null;
      clean[id] = {
        x: clamp(Number(item.x), 0, 100),
        y: clamp(Number(item.y), 0, 100),
        size: clamp(Number(item.size), 75, 125)
      };
    }
    return clean;
  }
  function metrics(width) {
    const measuredWidth = Number(width);
    if (!Number.isFinite(measuredWidth) || measuredWidth <= 1) return null;
    const scale = measuredWidth / SURFACE.width;
    return { width: measuredWidth, height: SURFACE.height * scale, scale };
  }
  function placement(id, item, width) {
    const m = metrics(width), base = BASE[id];
    if (!m || !base || !item) return null;
    const size = clamp(Number(item.size) || 100, 75, 125) / 100;
    const buttonWidth = base.width * m.scale * size;
    const buttonHeight = base.height * m.scale * size;
    const maxX = Math.max(0, m.width - buttonWidth);
    const maxY = Math.max(0, m.height - buttonHeight);
    const round = n => Math.round(n * 100) / 100;
    return {
      left: round(clamp(Number(item.x) || 0, 0, 100) * maxX / 100),
      top: round(clamp(Number(item.y) || 0, 0, 100) * maxY / 100),
      width: round(buttonWidth),
      height: round(buttonHeight)
    };
  }
  return Object.freeze({ SURFACE, BASE, DEFAULTS, clamp, cloneDefaults, normalize, metrics, placement });
});
