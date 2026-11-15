# Bounce Tales V51.1 · responsive shell correction audit

**Release family:** V51  
**Patch revision:** 51.0.1  
**Base:** V51.0.0  
**Gameplay scope:** presentation and cache correction only. No intentional changes to player physics, simulation timing, original RLEF resources, sprites, scripted events, or stage progression.

## 1. Screenshot finding

The user-provided mobile screenshot showed the pause control still covering the upper-right area of the playfield. The HTML had already moved the button into a `.pause-toolbar` sibling before `#game-wrap`, but the layout depended on the toolbar being a 28px flow row above the canvas. That did not match the requested side-gutter location, and the previous regression test asserted the wrong placement.

V51.1 changes the layout contract:

- `.game-stage` is the positioning context.
- `.pause-toolbar` is absolutely anchored at the stage's right edge, 48 CSS pixels outward, 40 CSS pixels below the stage top.
- The toolbar is 32 × 29 CSS pixels and does not occupy space above or inside the canvas.
- The pause button itself explicitly uses `position: static !important` with `inset`, `top`, `right`, `bottom` and `left` reset. This prevents an old absolute-position rule from moving it back into the game.
- The button appears only while `mode` is active play. Its hidden state is explicitly enforced.
- Compact portrait stage sizing preserves the right-side gutter. Wide landscape two-column layouts use the clear strip above the game column instead of intruding into the neighbouring controls column.

The side-gutter position is designed for the portrait layout shown in the screenshot. Compact portrait layouts reserve 56 CSS pixels on each side of the game stage so the 32px control can sit outside the canvas with a small screen-edge margin. The document continues to suppress horizontal page overflow.

## 2. First-paint touch controls

The saved layout, or canonical defaults on a new device, is synchronously applied before the first asynchronous game-resource fetch. The control surface remains visually hidden until the shared geometry module has measured the surface and assigned final positions and dimensions. The existing resize observer and control editor behavior are retained.

## 3. CSS cascade review

The stylesheet retains historical responsive rules where they contribute to portrait, compact, landscape, desktop and accessibility behavior. Repeated selector names are not automatically redundant because media-query context and cascade order matter.

At the V51.1 checkpoint, a structural CSS parse reported no parser errors and an exact duplicate-rule scan found no repeated selector/declaration/media-context blocks. This note records the V51.1 state; the V52 release audit describes the later stylesheet consolidation. The V51.1 pause behavior is defined in one clearly labeled release block; the old flow-row model is removed from that block rather than being counteracted by another later patch.

## 4. Cache and release identity

- HTML asset query strings: `v=52`.
- Service-worker cache: `bounce-tales-v52`.
- Service-worker app-shell asset paths use matching `v=52` query strings.
- Package version: `51.0.1` (the V51.1 maintenance correction).
- Persistent touch-layout storage key: `bounce-control-layout-v1` (unchanged).

The cache bump is required so a device that previously installed V51 does not keep serving the earlier shell/CSS after the correction is deployed.

## 5. Protected behavior

The patch does not intentionally modify:

- the 240 × 320 game coordinate system;
- fixed-step simulation, movement or physics constants;
- original RLEF resources and all 15 playable stages;
- springboard/trampoline behavior;
- original sprite maps, dialogue resources, menu rendering or HUD drawing;
- progression storage or touch-control editor storage format;
- audio lifecycle handling already included in V51.

## 6. Automated verification

`npm run verify` runs:

- JavaScript syntax checks;
- all Node.js regression tests;
- runtime smoke checks covering title/menu, editor interactions and all 15 stages' load/play/pause routes;
- the dedicated Level 1 springboard lifecycle proof.

The V51.1 pause regression asserts the toolbar's external right-gutter coordinates, the explicit static positioning reset on the button, compact-portrait clearance, desktop landscape fallback and hidden-state behavior.

A structural parse of `style.css` was also run with `tinycss2`; the stylesheet parsed without errors. These checks do not replace real rendering tests.

## 7. Compatibility boundary

The page uses Canvas, Fetch, Pointer Events, Web Audio, localStorage and service workers. The service worker requires HTTPS or localhost. Audio continues to depend on browser user-gesture/autoplay rules.

This environment did not run Chromium, Safari, Firefox, Brave or Android WebView, and did not physically test a phone. Therefore this audit does not claim cross-browser certification. After deployment, inspect first load and update from the previous V51 cache on an Android Chromium-based browser and Firefox, and on iOS Safari where available. Check portrait, landscape and the shortest target viewport.

## 8. Result

V51.1 corrects the pause-control placement contract exposed by the screenshot: the control is now positioned outside the game canvas in the right-side gutter on compact portrait layouts. The V51 first-paint fix, gameplay runtime, original campaign resources and springboard lifecycle remain covered by the existing automated checks.
