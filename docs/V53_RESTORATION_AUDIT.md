# Bounce Tales V53 · restoration audit

**Release:** 53.0.0  
**Runtime/cache identity:** V53 (`v=53`, `bounce-tales-v53`)  
**Base:** V52 source archive

## Changes

- Restored the title menu to the original command family and order: Continue (only when a valid persisted save exists), New Game, High Scores and Instructions.
- Removed web-only Chapter Selection and Options rows from the title menu. Chapter Selection remains available through its dedicated chapter-book scene; browser settings remain available from the site header.
- Restored the pause menu to three actions: Resume, Restart Chapter and Chapter Selection. Chapter selection continues through the existing confirmation flow.
- Reintroduced the original Exit softkey label. Because browsers generally prohibit closing tabs that were not opened by the page, the action attempts `window.close()` and displays a message when the browser keeps the tab open.
- Bumped the package, HTML asset URLs and service-worker cache identity to V53.
- Raised the runtime ZIP import minimum to V53 so an older uploaded archive cannot silently roll the site backwards.
- Replaced the previous menu-flow assertions with tests for the restored title/pause structure.

## Verification

- `npm run check`: 87 JavaScript files, zero syntax failures.
- `npm test`: 61/61 test files passed.
- `npm run smoke`: original title, control editor drag/resize/save/reset, all 15 RLEF stages boot/play/pause, FPS defaults and visibility reset passed.
- `npm run proof:springboard`: Level 1 RLEF springboard lifecycle passed in Node.js.
- ZIP importer validation is run against the final release archive before delivery.

## Scope and limitations

The gameplay simulation, original binary resource archive, decoded RLEF level data, 15 playable stages, existing physics and touch-layout persistence were retained from V52. This audit does not claim pixel-perfect verification on every browser or a physical-device test. The CSS still contains historical repeated selectors; V53 does not claim a full stylesheet cascade rewrite. That requires a separate visual regression baseline to avoid changing established layout behaviour accidentally.
