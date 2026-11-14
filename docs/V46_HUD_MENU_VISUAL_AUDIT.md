# Bounce Tales V46 · HUD and pause-menu visual audit

## Why V46 was needed

The supplied mobile screenshots exposed two defects in V45 that the previous source-level tests did not catch:

1. The egg separator and score were placed at fixed coordinates, causing the separator to collide with the egg count and leaving excessive, unexplained space before the score. The clock was also drawn in the middle of the game viewport instead of beside the right edge.
2. The focused pause row used static sprite 10 as a selection background. The atlas descriptor confirms that sprite 10 is a 239 × 29 striped decorative graphic, not a menu-row highlight. Clipping it into a 172 × 22 button created the visible black-and-white streaks in the screenshot.

## J2ME reference cross-check

The supplied decompiled reference is retained in `reverse-engineering/bytecode/` and its atlas metadata is retained in `src/sprite-atlas.json`.

- The `m.java` gameplay draw routine draws sprite 102 at the top-left, renders the live egg count, places sprite 101 after the measured counter width, then renders the score after that separator.
- The same routine draws sprite 103 with its origin anchored to the screen width. Its native descriptor has a 28-pixel horizontal draw offset, which places the 25-pixel clock sprite near the right edge. The elapsed-time text is laid out relative to that edge.
- The original `h.java` list widget uses a filled rectangular selection area with a border. It does not use sprite 10 as the selected-row graphic.

The new `src/original-hud.js` isolates the 240 × 320 HUD coordinate calculation so its placement can be tested independently of the browser renderer.

## V46 corrections

- Egg icon sprite 102 now uses its original top-left anchor `(0, 0)`.
- The egg counter starts at x=32. The slash sprite 101 is positioned using the measured counter width plus the original spacing; the score follows the separator.
- Clock sprite 103 is anchored at x=240, allowing its original `draw_offset` to position it near the right edge. The timer text is right-aligned at x=208.
- Menu focus no longer uses sprite 10. The selected row uses a solid MIDP-style fill and border, with the other row backgrounds retained.
- Added targeted regression checks for source sprite offsets, dynamic counter spacing, right-anchored clock placement, menu focus rendering, script loading, and V46 cache references.
- Updated the service-worker cache name and resource query strings to V46 so older cached rendering code is not reused.

## Non-regression boundaries

V46 is based directly on the V45 package. It does not change `style.css`, game physics, trampoline logic, fixed-step timing, camera interpolation, RLEF parsing/data, level assets, touch-control geometry, or the live touch-layout editor. The original sprite assets, audio, PWA icons, project documentation, LICENSE, README, ARCHITECTURE, `.github` workflows, and existing source/reference directories are retained.

## Verification

- `node --test tests/*.test.cjs`: **60 passed, 0 failed**.
- The separate runtime smoke and Level 1 springboard proof are run as additional checks during packaging.
- JavaScript syntax checks are run across the project.
- Exact file-hash comparisons are made against V45 for the protected gameplay, controls, stylesheet, level data, and original asset files.

These are automated source/runtime checks. They do not substitute for a physical-phone visual check in the same browser that produced the supplied screenshots.
