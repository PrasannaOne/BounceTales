// Bounce Tales original JAR input normalization, reconstructed from o.e(int), o.d(int,int).
// The original game stores normalized key IDs in a bit mask and polls held inputs each frame.
export const ORIGINAL_GAME_KEYS = Object.freeze({
  UP: 1,
  DOWN: 2,
  LEFT: 3,
  RIGHT: 4,
  PAUSE_MENU: 5,       // Original hardware key code -7
  SOFTKEY_1: 6,        // Original hardware key code -6
  SELECT_ALIAS: 7,     // Original hardware key code -5
  STAR_MODE_CYCLE: 20, // ASCII '*'
  HASH: 21             // ASCII '#'
});

export const ACTIVE_GAMEPLAY_INPUTS = Object.freeze({
  left: Object.freeze([3]),
  right: Object.freeze([4]),
  primaryActorAction: Object.freeze([15, 12, 1, 7]),
  cycleActorMode: 20,
  pauseMenu: 5
});

const MODE_2_REMAP = new Map([[15, 7], [12, 1], [14, 3], [18, 2], [16, 4]]);
const GAME_ACTION_REMAP = new Map([[1, 1], [2, 3], [5, 4], [6, 2]]);

/**
 * Convert a Java ME key code to the integer ID used by the original game.
 * `gameAction` is the value returned by GameCanvas.getGameAction(keyCode), when applicable.
 * `inputMode` defaults to the original startup mode (1); mode 2 applies the exact numeric remap.
 */
export function normalizeOriginalKey(keyCode, gameAction = null, inputMode = 1) {
  if (!Number.isInteger(keyCode)) return -1;

  let normalized;
  if (keyCode === -7) normalized = 5;
  else if (keyCode === -6) normalized = 6;
  else if (keyCode === -5) normalized = 7;
  else if (keyCode >= 48 && keyCode <= 57) normalized = keyCode - 38;
  else if (keyCode === 42) normalized = 20; // '*'
  else if (keyCode === 35) normalized = 21; // '#'
  else normalized = GAME_ACTION_REMAP.get(gameAction) ?? -1;

  if (inputMode === 2) normalized = MODE_2_REMAP.get(normalized) ?? normalized;
  return normalized;
}

/** Browser-arrow adapter. FIRE is intentionally not substituted: the original code maps UP/LEFT/RIGHT/DOWN only. */
export function normalizeBrowserKey(key, inputMode = 1) {
  const gameActions = {
    ArrowUp: 1,
    ArrowLeft: 2,
    ArrowRight: 5,
    ArrowDown: 6
  };
  if (Object.hasOwn(gameActions, key)) return normalizeOriginalKey(-999, gameActions[key], inputMode);
  if (typeof key !== 'string' || key.length !== 1) return -1;
  return normalizeOriginalKey(key.charCodeAt(0), null, inputMode);
}

export function keyBit(code) {
  return Number.isInteger(code) && code >= 0 && code < 32 ? (1 << code) >>> 0 : 0;
}

export function isOriginalKeyHeld(mask, code) {
  return (((mask >>> 0) & keyBit(code)) >>> 0) !== 0;
}

export function getActiveGameplayInputState(mask) {
  const held = code => isOriginalKeyHeld(mask, code);
  return {
    left: held(3),
    right: held(4),
    primaryActorAction: [15, 12, 1, 7].some(held)
  };
}
