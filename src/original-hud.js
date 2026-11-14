(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BounceOriginalHud = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Coordinate contract transcribed from the original J2ME m.java HUD path.
  // Sprite 102's origin is the top-left; sprite 101 follows the measured egg
  // count; sprite 103 is right-anchored because its native draw offset is 28px.
  function layout(screenWidth, eggTextWidth) {
    const width = Math.max(1, Number(screenWidth) || 240);
    const measuredEggWidth = Math.max(0, Number(eggTextWidth) || 0);
    const eggCounterX = 32;
    const dividerX = Math.round(eggCounterX + measuredEggWidth + 7);
    return Object.freeze({
      eggIcon: Object.freeze({ x: 0, y: 0 }),
      eggCounter: Object.freeze({ x: eggCounterX, y: 8 }),
      eggDivider: Object.freeze({ x: dividerX, y: 7 }),
      score: Object.freeze({ x: dividerX + 9, y: 8 }),
      clock: Object.freeze({ x: width, y: 0 }),
      timer: Object.freeze({ right: width - 32, y: 8 })
    });
  }

  return { layout };
});
