# Bounce Tales V47: Full visual-parity audit

**Build base:** V46  
**Reference:** `BounceTales_Decompiled_Ref(2).zip` supplied for this audit  
**Target:** restore the original J2ME menu/HUD presentation while retaining the browser game's controls and added site features.

## Reference material inspected

The audit compared the browser source with the decompiled Java draw/input paths and the retained original sprite data:

- `src_decompiled/m.java`: original title-menu construction (screen 17), book/title drawing, pause/menu draw paths, and the gameplay HUD draw block.
- `src_decompiled/h.java`: MIDP list positioning, selected-row layout and focus rendering.
- `src_decompiled/o.java`: sprite-origin and MIDP anchor calculations used by the original renderer.
- `src/image-map.json` and `src/sprite-atlas.json`: original sprite IDs, crops, dimensions and draw offsets.
- Original RLEF stage resources `bf` through `bt` (the 15 playable chapters).

## Findings and V47 corrections

### 1. The PWA icon had leaked into the game

V46 special-cased atlas slot 7 and loaded `assets/logo-transparent.png`. That is the modern browser/PWA icon, not the original game art. V47 removes that substitution and loads the original atlas image for every in-game sprite slot. The title screen now draws original dynamic sprite **332**, the closed book with its sepia Bounce Tales logo. The modern PWA icon files are left untouched for browser and home-screen use.

### 2. The title book and selected row were not using the original geometry

V47 reconstructs the original two-tone menu backdrop, closed-book sprite, source border colours, upper-right rotated metal corner, lower-right corner and left hinge anchors. The selected title row uses the original left and right arrow sprites (**2** and **326**) placed relative to the actual label width, with a small opposing focus movement. Sprite 10 remains an ornamental strip and is not used as a focus/highlight graphic.

When progress exists, the title list now exposes both **Continue** and **New Game**. New Game opens an in-game confirmation panel and resets progress only after confirmation. The original title-screen route to chapter selection, scores, options and instructions remains available.

### 3. The HUD was showing the wrong values and typography

The old V46 HUD drew a synthetic score where the J2ME HUD draws the total stage collectible count. V47 uses the original bitmap sprite family:

| Sprite ID | Original HUD role |
|---|---|
| 90–99 | Outlined digits 0–9 |
| 100 | Colon |
| 101 | Slash |
| 102 | Egg icon |
| 103 | Clock |

The left counter now follows the original draw order: egg icon, collected count, slash, and total count. The total is derived from the original RLEF egg and enemy object records, matching the J2ME counter logic. All 15 playable stage files parse to a total of 30 such records; Level 1 (`bf`) contains 29 eggs and one enemy, producing the reference denominator of 30.

The right-hand timer uses the original clock and digit sprites, with the colon's original right-anchor and vertical offset. V46 also had a separate timer defect: `elapsed` was read by the HUD and animation code but never incremented. V47 advances it from the fixed-step simulation update. It pauses naturally with gameplay and does not continue during the victory transition.

### 4. The persistent “FORM BOUNCE” label was not part of the original HUD

The browser-only form badge is now empty and hidden. Form changes still produce a brief contextual toast, but there is no permanent label occupying the lower gameplay area.

### 5. The quit-confirmation panel leaked pause-menu text

The game uses separate gameplay and high-DPI text canvases. V46 redrew the pause scene on the image canvas but left its old labels on the text canvas; the confirmation panel therefore appeared over the previous Continue/Restart/Options/Main Menu text. V47 clears the text canvas before rendering the confirmation content and does not redraw the pause menu underneath it. The confirmation panel uses its own clean spacing and no decorative strip through the body text.

### 6. Instructions now describe the browser game

The Instructions screen is rewritten for this site: touch controls, keyboard movement, jump, form switching, collectibles/checkpoints, cannons and the live Touch Controls editor. It no longer tells players to use phone number keys from the old J2ME handset. Original in-game story and event dialogue are not rewritten by this change.

## Non-regression checks

The following files/data were compared against V46 and remain byte-identical:

- `style.css` (no rules removed or modified)
- `src/bounce-physics.js`
- `src/original-trampoline.js`
- `src/game-timing.js`
- `src/original-camera.js`
- `src/control-layout.js`
- `src/original-input-map.js`
- `src/rlef-reader.js`
- All 16 bundled RLEF resources (`bf` through `bu`)
- `favicon.png`, `icon-192.png`, `icon-512.png`, and `apple-touch-icon.png`

The existing reference/reverse-engineering folders, repository workflow, documentation, original audio and sprite assets, and test suite are retained. Cache identifiers and application asset references are updated to V47.

## Verification performed

- All 60 Node.js test files passed.
- `node --check` passed for every project JavaScript file.
- Runtime smoke test passed: title boot, keyboard start/pause/resume, live touch-editor drag/resize/save/reset, and boot/play/pause flow for all 15 chapters.
- Level 1 springboard proof passed against the actual `game.js` update loop and RLEF data.
- HUD parity tests assert original sprite usage, timer placement, collectible totals for all 15 playable levels, no PWA icon substitution, no persistent form label, and a clean confirmation render path.
- Runtime smoke additionally verifies that the level timer advances on fixed simulation time and freezes while paused, and that a saved title screen retains both Continue and New Game.

## Verification limitation

The source, assets and runtime paths were checked in Node.js. A physical Android browser was not available for a final pixel-for-pixel screenshot comparison. Browser font rasterization, device scaling and the final on-phone composition therefore remain to be checked on the deployed PWA. V47 is a source-grounded restoration pass, not a claim of handset-certified pixel identity.
