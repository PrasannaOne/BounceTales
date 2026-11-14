/* Bounce Tales V42 live-control geometry.
 * Positions are percentages of the available travel range, not viewport pixels.
 * This module is deliberately DOM-free so the exact same geometry is used by
 * gameplay, live touch editing, and the Node regression suite.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BounceControlLayout = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SURFACE = Object.freeze({ width: 360, height: 140 });
  const BASE = Object.freeze({
    left: Object.freeze({ width: 116, height: 84 }),
    right: Object.freeze({ width: 116, height: 84 }),
    jump: Object.freeze({ width: 116, height: 84 }),
    form: Object.freeze({ width: 48, height: 48 })
  });
  const DEFAULTS = Object.freeze({
    left: Object.freeze({ x: 0, y: 0, size: 100 }),
    right: Object.freeze({ x: 50, y: 0, size: 100 }),
    jump: Object.freeze({ x: 100, y: 0, size: 100 }),
    form: Object.freeze({ x: 100, y: 100, size: 100 })
  });
  const IDS = Object.freeze(['left', 'right', 'jump', 'form']);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function cloneDefaults() {
    return Object.fromEntries(IDS.map(id => [id, { ...DEFAULTS[id] }]));
  }

  function normalize(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const clean = {};
    for (const id of IDS) {
      const item = value[id];
      if (!item || !Number.isFinite(Number(item.x)) ||
          !Number.isFinite(Number(item.y)) || !Number.isFinite(Number(item.size))) return null;
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
    return {
      width: measuredWidth,
      height: SURFACE.height * scale,
      scale
    };
  }

  function placement(id, item, width) {
    const m = metrics(width);
    const base = BASE[id];
    if (!m || !base || !item) return null;
    const size = clamp(Number(item.size) || 100, 75, 125) / 100;
    const buttonWidth = base.width * m.scale * size;
    const buttonHeight = base.height * m.scale * size;
    const maxX = Math.max(0, m.width - buttonWidth);
    const maxY = Math.max(0, m.height - buttonHeight);
    const round = value => Math.round(value * 100) / 100;
    return {
      left: round(clamp(Number(item.x) || 0, 0, 100) * maxX / 100),
      top: round(clamp(Number(item.y) || 0, 0, 100) * maxY / 100),
      width: round(buttonWidth),
      height: round(buttonHeight),
      maxX: round(maxX),
      maxY: round(maxY)
    };
  }

  function moveFromDelta(item, box, dx, dy) {
    if (!item || !box) return null;
    return {
      x: clamp(item.x + (box.maxX > 0 ? dx / box.maxX * 100 : 0), 0, 100),
      y: clamp(item.y + (box.maxY > 0 ? dy / box.maxY * 100 : 0), 0, 100),
      size: item.size
    };
  }

  return Object.freeze({
    SURFACE, BASE, DEFAULTS, IDS, clamp, cloneDefaults, normalize,
    metrics, placement, moveFromDelta
  });
});
