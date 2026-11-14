(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BounceOriginalHud = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const digitSprite = digit => 90 + Math.max(0, Math.min(9, Number(digit) | 0));
  function digits(value, pad = 0) { return String(Math.max(0, Math.floor(Number(value) || 0))).padStart(pad, '0').split('').map(Number); }
  function timerParts(elapsedSeconds) {
    const value = Math.max(0, Math.floor(Number(elapsedSeconds) || 0));
    return Object.freeze({ minutes: digits(Math.floor(value / 60)), seconds: digits(value % 60, 2) });
  }
  function collectibleTotal(eggs, enemies) { return Math.max(0, (Number(eggs) || 0) + (Number(enemies) || 0)); }
  return Object.freeze({ digitSprite, digits, timerParts, collectibleTotal });
});
