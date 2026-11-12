# Bounce Tales · port status and build history

## Build 06 historical notes

### What changed in Build 06
- Replaced the dense 3×3 keypad with separate, larger touch controls: left, right, jump/action and `*` form change.
- Moved pause to a small in-game softkey button. The `#` control and unused directions are no longer shown on the touch pad; original keyboard/key IDs remain documented for reverse engineering.
- Added pointer tracking for simultaneous touches, pointer cancellation, focus loss and tab switching so a control cannot remain stuck after an interrupted touch.
- Changed simulation updates to a fixed 60 Hz step with a bounded frame accumulator. Rendering remains on `requestAnimationFrame`.
- Improved circle-vs-level-geometry resolution so a player starting or ending a step inside a solid polygon is expelled through the nearest contour instead of being allowed to remain embedded.
- Added the original Bounce glow image-map layers and source-derived idle/blink eye animation image IDs/timers from the public decompilation. The animation is an initial JavaScript translation; timing/random sequence and all player stretch details still need comparison against the exact 2.0.3 runtime.
- Replaced an obsolete input test with checks for the current input API and added focused terrain-collision tests.

### Still present from Build 05
- Original supplied 2.0.3 JAR assets are preserved under `assets/original/`.
- The first level, Misty Morning (`bf`), is parsed from the original RLEF resource.
- Original level object records, fixed-point transforms, atlas/image-map resources and 240×320 game viewport are used.
- The first-pass mole, trampoline, egg and enemy interactions remain provisional.

### Limitations known at Build 06
This was not yet a one-to-one port. In particular:
- The original `BounceObject.checkCollisions` swept-contact algorithm and full contact response are not yet fully translated. The browser solver is a more robust fallback, not a proven identical implementation.
- Player stretch/torque visuals are incomplete. Bounce's idle/blink eyes use the original image-map frames, but the complete actor render and state animation still need porting and comparison.
- Level event-command execution is not implemented, so event-driven gates, triggers and level completion are not complete.
- Cannon control, all enemy types, all special object interactions, title/chapter/results UI, RMS save/progression, MIDI music and sound effects remain incomplete.
- Only Misty Morning is currently playable. The other 15 RLEF level resources parse and validate but are not wired into playable chapter flow.
- Some scene layering, background/parallax and camera behaviour remain approximate.

### Build 06 validation
Run the included checks from this folder with Node.js:

```sh
node tests/input-map.test.cjs
node tests/original-input-map.test.cjs
node tests/physics.test.cjs
node tests/terrain-collision.test.cjs
node tests/rlef-validation.cjs
node tests/runtime-smoke.cjs
```

All 16 RLEF resources are checked for record counts and parent transforms by `rlef-validation.test.cjs`. A DOM/canvas-stub runtime smoke test verifies resource boot, Start activation and the fixed-step loop. A real browser screenshot and mobile touch feel still need real-device testing.


## Build 07 historical update
- Added the fixed top header, Share action and Settings panel.
- Added Auto and selectable 30/60/90/120 FPS render caps, plus the FPS counter, fullscreen and reset options. The 90/120 choices are superseded by Build 08.
- Added the initial About credit: Made by Prasanna ❤️. Telegram and repository links were added in Build 08.

---

# Build 08 status · 2026-11-12

## Implemented in Build 08
- Frame pacing options are now Auto, 30 FPS and 60 FPS. The 90/120 choices have been removed. Auto remains the default.
- Recovered timing behaviour from the supplied JAR's `o.class`: the original loop measures elapsed wall-clock milliseconds, divides by an internal update-pass count (default 1), and clamps the update delta to 500 ms. Build 08 applies the same 500 ms ceiling and conserves integer elapsed milliseconds across substeps of at most 33 ms. Browser drawing still follows `requestAnimationFrame`.
- Translated the player actor's directional stretch request, 16.16 stretch magnitude/result accumulation, damping and recovery from the supplied `c.class` bytecode.
- Replaced the generic gradient player body with a closer port of the original Bounce rendering: four directional stretched-circle quadrants, red/secondary-red layers, the original small highlight sprites, image-map 17/28 glow layers, and the original eye-expression maps.
- Added original Bumpy Cracks rotation sprite selection (image-map IDs 211–242) and the six-colour Wolly segmented renderer. These forms remain locked at the current initial progression state.
- Replaced end-position-only terrain handling with swept circle-vs-polygon-edge and circle-vs-vertex tests, then overlap recovery. This is a substantial collision improvement, but its floating-point response is not the original LP32/16.16 multi-contact implementation.
- Added About links for Telegram `@prasannaone` and the GitHub repository.
- Removed the undeclared `accumulator` reference from the visibility-change path; backgrounding resets frame timestamps and held inputs.

## Verified from the supplied JAR
- The JAR contains the game classes and all 16 RLEF level resources used by this port.
- In `o.class`, `updateDelta` is derived from `System.currentTimeMillis() - previousTime`, divided by the internal update-pass count. Its default update-pass count is 1 and the default upper bound is 500 ms. A separate method can set the pass count to 2.
- In `c.class`, the original movement/jump constants, the actor update's elapsed-time conversion, stretch arrays, eye animation timing, form cycling and form sprite IDs are present. The JavaScript implementation translates these systems where documented, but does not claim byte-for-byte runtime equivalence.

## Remaining major gaps
- The original swept collision solver's LP32 fixed-point calculations, multi-contact selection, full torque/friction response and all geometry/object type interactions are not completely ported. Build 08's swept solver is a browser-side approximation.
- Event-command execution is not implemented. Event-driven gates, switches, triggers and stage-completion logic are therefore incomplete.
- Enemy state machines and collision interactions are still provisional; all enemy types are not faithful.
- Cannon, water/swimming, companion/friend, trampoline and other special-object behaviour are incomplete or approximated.
- The title/chapter/results UI, full chapter selection, progression/save storage, particles, MIDI music and sound effects remain outstanding.
- Only Misty Morning is playable. The remaining 15 RLEF resources are parsed and validated, not playable chapters.
- Camera smoothing, parallax/background layering and some animation timing still need comparison against the original runtime.

## Build 08 validation
Run from this folder with Node.js:

```sh
node tests/input-map.test.cjs
node tests/original-input-map.test.cjs
node tests/physics.test.cjs
node tests/terrain-collision.test.cjs
node tests/timing.test.cjs
node tests/settings.test.cjs
node tests/rlef-validation.cjs
node tests/runtime-smoke.cjs
```

All eight test scripts pass in the local Node runtime. The runtime smoke test boots the original Misty Morning resources, starts the game loop and exercises the visibility reset. Real-device browser playtesting is still required to validate touch feel, rendering performance and actual collision behaviour.


---

# Build 09 status · 2026-11-12

## Implemented in Build 09
- Added a JavaScript event interpreter for the original RLEF event records. The interpreter implements the 0–32 opcode dispatch represented in the supplied `g.class` bytecode: messages, sprite animation requests, event-state transitions, waits, integer/float variables, conditional/unconditional branches, object movement/rotation/position, attach/detach, checkpoints, actor forces, object flags and camera settings.
- Parsed the original `lang.xx` offset table at runtime. The 91 indexed strings now provide Misty Morning's authored story messages instead of hard-coded replacement dialogue.
- Wired the six Misty Morning (`bf`) event records into the game. Its autostart event plays scenario messages 58–60 and animates the original object 76. Its area event runs the original messages 65–67 and performs its authored object/visibility changes.
- Translated the sprite event animation mapping from `g.class` and the sprite timing/render paths in `r.class`: image 118 → animation map 485, 334 → 474, 342 → 480. The source's 150 ms animation frame interval and the 750 ms plus 1500 ms fade timing for map 474 are represented in `src/original-sprite-animation.js`.
- Corrected object detach semantics: the original dummy-root detach changes the parent without first preserving the object's world transform. The JavaScript event engine now keeps the local matrix unchanged.
- Corrected checkpoint storage to use the event object's world transform, matching the original event handler rather than the player's current position.
- Added real-resource event tests for the Misty Morning autostart script, reset/replay, event 94's trigger and localized messages, sprite detachment/flags, variable commands, timed rotation and checkpoint position.

## V9 accuracy boundary
The event opcode switch and object/message resource formats are grounded in the supplied 2.0.3 bytecode and exact `bf`/`lang.xx` resources. Complex interpreter details were cross-checked against the readable public decompilation, which is version 2.0.25, so the public source is corroboration rather than proof of byte-for-byte equivalence. The tested Misty Morning paths work in the local runtime; not every opcode or every stage event has been compared with a live original-JAR execution. Dialogue is currently shown in a simple browser overlay, not the original Java ME message UI. Event-area collision, some camera response and several object callbacks remain approximations.

Only Misty Morning is playable. The other 15 RLEF resources still parse and validate but have not been connected to playable chapter flow. The original multi-contact terrain solver, complete enemy and special-object state machines, title/chapter/results UI, RMS save/progression, particles, MIDI music and sound effects remain incomplete. Real phone gameplay has not yet been verified.

## Build 09 validation
Run every test from the project root with Node.js:

```sh
for test in tests/*.cjs; do node "$test" || exit 1; done
```

The suite covers original input mapping, physics, elapsed-time pacing, settings, all 16 RLEF resources, terrain collisions, browser runtime boot, original RLEF event scripts and sprite animation timing. Passing tests validate the covered paths, not full-game equivalence.


---

# Build 10 status · 2026-11-12

## Implemented in Build 10
- Added an original-resource level selector for all 15 campaign/bonus stages. The catalogue follows the original `BounceGame.LEVEL_RESIDS` and `LEVEL_NAME_MESSAGE_IDS` ordering from the readable reference decompilation, cross-checked against the 2.0.3 JAR resource table and the already decoded RLEF resource-to-name map.
- All 15 selected level files are fetched from `assets/original/`, parsed by the same RLEF reader and passed through the shared scene builder. Every one has a player start record. The separate `bu` cannon-object test resource is deliberately excluded because it has no player start and is not a campaign level.
- Fixed enemy patrol-point decoding in `src/rlef-reader.js`. The two local movement points are now retained on each enemy record and transformed through the level's parent matrix by the runtime.
- Corrected the player's stretch spring recovery to use full-precision wide products for the original `long` calculations in `c.class`, instead of incorrectly overflowing 32-bit multiplication. Added a convergence/bounds regression test to catch extreme visual deformation.
- Added initial CannonObject interactions based on the original class: contact entry uses its ±40 world-unit load box expanded by Bounce's 20-unit radius; Bounce is hidden/disabled while loaded; Left/Right aim the cannon; Jump starts the authored 900 ms firing cycle; launch occurs when the countdown enters the final 300 ms, using the resource's power and transform.
- Cannon visuals now use original image-map 48 and rotate with the cannon's aim state. The mobile hint changes while loaded.
- Updated mobile layout to three primary touch buttons (Left, Right, Jump) with a smaller, lower-positioned `*` form button. The share header action is icon-only; Settings retains its styled icon and label.
- Existing creator links, Auto/30/60 rendering caps, the elapsed-time simulation timing, and original stage event support are retained.

## Validation
- All 15 campaign/bonus RLEF resources load through the browser runtime smoke harness, start, and advance the display loop without throwing.
- All 16 RLEF files still parse, validate object/event counts and resolve their parent transforms.
- Enemy patrol-point fields are checked in the RLEF validation test.
- Stretch spring recovery test covers the corrected wide multiplication path.
- Cannon functionality is source-derived and included in runtime; detailed on-device aiming, entry, and firing still needs real-phone playtesting.
- The browser port is still not a finished one-to-one implementation. Enemy/object-specific behaviour, full collision response, water/swimming effects, camera/parallax, full save/progression, win/lose/results UI, particle simulation and MIDI/audio remain incomplete or approximate. The all-level selector exposes the original stages for preview/testing; it does not mean every chapter's mechanics are fully complete.

The full local Node test suite passes. Real Android browser playtesting is still needed to validate touch feel, cannon aim direction, stage transitions and performance.


---

# Build 11 status · 2026-11-12

## Implemented in Build 11
- Added `src/original-enemies.js`: LP32-aware movement speed conversion; Candle patrol/avoidance; Mole wait/peek/vulnerability and patrol phases; enemy bounds and swept segment contact; Candle/Mole stomp and egg-drop handling; Bumper form interaction; Stalker movement and reset-on-hit path. Enemy types marked unused by the original class retain the original invalid-resource visual fallback.
- Added `src/original-water.js`: transformed local-space tests for original water/air-tunnel zones; source-style un-clamped gravity interpolation; gravity contribution, torque damping and water-only velocity drag; surface crossing ripples and browser-side bubble effects. Surface-wave/particle details are approximations, not the complete original splash mesh and particle engine.
- Added `src/original-trampoline.js`: original level-zone sprite selection (image 497 for levels 0–4, 509 for 5–9, 490 for 10–14), clamped launch-period calculation, integer `period/frameCount` threshold, body freeze and release velocity. The compound-sprite anchor is mapped through the browser's 240×320 scale; transformed-parent trampoline positioning still needs comparison with the original runtime.
- Refined `BounceBody.land()` with original per-form ricochet, gravity/friction force comparison and torque blending. The swept browser polygon collision remains an approximation of the original LP32 multi-contact solver.
- Added `src/midp-graphics.js` to translate MIDP's positive counter-clockwise arc convention to Canvas. Bounce's stretch quadrants and Wolly form segments now use the same arc orientation as the original MIDP drawing calls.
- Added a regression gate so player idle-eye timing advances only while the actor's physics is enabled, matching the original actor update path.

## Build 11 validation
- Enemy movement speed conversion and selected collision/state paths are covered by `tests/enemies.test.cjs`.
- Water/air-tunnel force, drag and surface crossing are covered by `tests/water.test.cjs`.
- Trampoline stage image, integer frame threshold and launch behaviour are covered by `tests/trampoline.test.cjs`.
- MIDP-to-Canvas counter-clockwise arc mapping is covered by `tests/midp-graphics.test.cjs`.
- Runtime smoke still loads each of the 15 original stage resources, starts each preview and runs the browser loop.

## Remaining one-to-one gaps
- The original LP32 swept collision/contact collection and multi-contact solver is not fully translated; current terrain response remains a browser implementation with source-derived response terms.
- Enemy handling is still partial: Candle/Mole and selected unused types are implemented from class behaviour, but not every enemy state/animation/collision interaction has been validated against a live JAR.
- Water rendering, splash deformation, particle systems and air-tunnel particles are simplified. Cannon geometry morphing/aim response, friend/companion logic, all stage event triggers, level completion, boss systems and exact camera/parallax remain incomplete.
- Title/chapter/results UI, persistent save/progression, all MIDI tracks and sound effects remain outstanding. All 15 scenes are selectable previews; they are not yet 15 fully playable chapters.
- No real-phone Android browser playtest has been performed in this build.

---

# Build 13 status · 2026-11-12

## Implemented

- Reworked the responsive shell for portrait phones, landscape phones, tablets and desktop. The original game canvas retains its 240×320 logical viewport and 3:4 aspect ratio.
- Removed the gameplay control pad from all non-gameplay scenes. Title, chapter book, guide, pause and chapter-completion menu buttons remain real touch/mouse targets inside the game viewport.
- Added swipe/trackpad chapter-book paging in addition to visible page-arrow buttons.
- Added desktop keyboard aliases (A/D or arrows, Space/Enter, Shift/Q/*, Escape) and standard-mapping gamepad polling. Existing original Java ME key IDs and mobile touch controls remain intact.
- Rebuilt Options/About as two tabs in a compact, fixed, non-scrolling panel. Added the original project creator text, Telegram link and full GitHub repository URL.
- Added `src/original-camera.js`, a source-shaped camera spring using the recovered 15 ms integration quantum, velocity anticipation, 90/140 default spring parameters, configurable event parameters and snap support.
- Added camera spring, responsive UI and expanded PC input regression tests.

## Validation

- The full Node.js suite passes, including the 15-stage runtime smoke test.
- RLEF files and the 105 non-manifest original JAR game resources are checked separately against the supplied JAR.
- Runtime smoke confirms each original stage resource can load, start and enter its pause flow. It does not establish that every chapter's mechanics are complete.
- A headless Chromium screenshot attempt did not complete reliably in this environment, so the responsive layout still needs review on actual Android and desktop browsers.

## Remaining fidelity work

- Complete original LP32 collision/contact solver and contact ordering.
- Full scene/menu art and layout reproduction from the original MIDP UI resources rather than the current HTML overlay implementation.
- Every enemy, friend, object, boss and event command edge case, plus full chapter progression/records.
- Exact water mesh and particle systems, audio playback/mix, camera/parallax visual tuning and side-by-side JAR comparison.
- Real Android touch feel and desktop/gamepad testing.


# Build 14 status · 2026-11-12

## Changes
- Standard connected-node Share icon plus readable Share text.
- Increased breathing room between the game viewport and touch controls on portrait phones; controls remain beside the canvas on wider and landscape layouts.
- Terrain collision now follows the original JAR's key contact construction: sweep the ball centre against the radius-offset polygon edges, test rounded vertices, then resolve remaining overlap.
- Multi-mesh recovery chooses the smallest correction first instead of preferring the deepest overlap. This targets the reported case where Bounce appears embedded in grass.
- Added an all-15-stage spawn/fall/landing regression check in addition to synthetic grass and overlapping-mesh tests.

## Accuracy boundary
The edge/vertex approach is translated from the original `c.class` collision method and cross-checked against the readable `BounceObject` reference. The exact JAR uses LP32 fixed-point transforms, a 16-point contact buffer, nearest-contact selection, and a multi-pass collision response. Build 14 improves the browser implementation but does not yet reproduce every fixed-point rounding and multiple-contact detail.

## Validation
- All local Node validation scripts pass, including all 15 RLEF player-start fall/landing paths.
- All 105 non-manifest JAR resources remain byte-for-byte identical to the freshly uploaded 2.0.3 archive.
- No reliable real-phone/PC visual test was performed in this build.

# Build 15 status · 2026-11-12

- Removed the visible “Share” text; the header now shows only the conventional share icon while preserving its accessible label and native-share/copy-link behaviour.
- Retained the previously implemented Build 14 swept edge/vertex collision and terrain-overlap recovery code without changing its solver behaviour in this handoff.
- All 105 non-manifest files from the newly supplied Bounce Tales 2.0.3 JAR match `assets/original/` byte-for-byte.
- This package does not claim to have fixed the specific grass fall-through shown in the user's latest screenshot. The existing synthetic grass and 15-stage spawn regression tests pass, but the reported real-phone case still needs a targeted reproduction and on-device verification.


# Build 17 status · 2026-11-12

## Implemented

- Loaded the Phase 2 decoded static sprite atlas into the browser runtime. Static IDs 0–325 now draw through the extracted 326-entry descriptor table, with exact PNG slot, crop rectangle and draw offset checked against the existing image map at startup.
- Included decoded reference fixtures for all 16 original RLEF resources and all 316 type-6 animation records. The runtime still parses the original binary level files; the fixture copies are used for regression parity.
- Verified the parser against all 16 original resources: 2,240 object headers, 490 polygon records, 5,776 polygon vertices, 4,306 triangles, and 316 animated objects containing 1,143 exact command sequences.
- Kept the recovered opcode timing model: elapsed milliseconds, one update pass, 500 ms maximum elapsed per update. Duration operands for opcodes 6, 16 and 17 are retained in the decoded atlas timing annotations.
- Wired title, three act themes, boss, bonus, lose and win tracks to browser audio playback using the source resource IDs. Added a persisted music toggle, pause/resume on tab visibility, and user-gesture unlock for browser autoplay restrictions.
- Corrected the Mole peek face clipping and restored the source friend object's red fill and radius.
- Removed title-page explanatory/version/build text and the footer. The page now uses a fixed, non-scrolling viewport with safe-area handling.

## Validation

- All 105 original extracted JAR resources match the supplied reference archive byte-for-byte using SHA-256.
- **25/25 Node.js regression tests pass.**
- New V17 tests validate all 326 static sprite descriptors against the runtime image map, compare all 16 decoded level resources against the parser, check exact type-6 command streams, and verify soundtrack routing and no-scroll UI rules.
- The 15 selectable campaign levels still load and enter gameplay/pause flows; the 16th RLEF file remains a non-campaign cannon test resource.

## Accuracy boundary

This is not yet a fully verified one-to-one port. The test suite demonstrates exact parity for the extracted static sprites, tested RLEF object headers, polygon geometry, and type-6 animation streams. Gameplay equivalence is still incomplete: the original LP32 fixed-point contact solver and contact ordering are not fully reproduced; not every event branch, enemy/friend/boss state, water/particle effect, progression edge case, camera/parallax layer or MIDP-rendered menu has been compared against a live original JAR session. The soundtrack is browser-playable audio rendered from the original MIDI resources, rather than native MIDP MIDI playback. Real Android and desktop side-by-side testing remains outstanding.


# Build 18 status · 2026-11-12

## Implemented

- Preserved the V17 326-entry static sprite atlas, 16 decoded RLEF resources, 316 animated records / 1,143 exact type-6 animation streams, original resource set and eight soundtrack routes.
- Kept source-accurate 16.16 transform coordinates distinct from Java-float velocity and acceleration values in the player actor. The actor uses a nominal 60 Hz fixed-step browser scheduler with integer 16/17 ms deltas and `requestAnimationFrame` interpolation. This is a requested browser adaptation; the original JAR itself uses elapsed wall-clock milliseconds.
- Added the original swept edge/vertex collision path in `src/original-collision.js`: 16.16 intersection calculations, nearest contact selection, a bounded 16-contact buffer, form restitution, source gravity/friction choice and torque smoothing. Contact points interpolate previous/current polygon vertices to account for moving-surface displacement. Spawn/event-teleport penetration recovery remains as a fallback.
- Corrected collision response to use the original form friction × gravity factor × surface-normal gravity expression, without an actor-radius multiplier, and to smooth torque from velocity relative to the contacted surface. Added focused regression cases for this response and translating surfaces.
- Ported enemy LP32 patrol stepping across the four enemy types, restored Bumper path movement, corrected Stalker look-ahead from its previous destination, and corrected the left-facing flag during patrol. Candle reversal and Mole timer/peek states remain included.
- Kept the event interpreter's 0–32 opcode dispatch and added a static coverage scan across the 15 playable stage scripts: 316 event records and 1,143 event command instances use the supported opcode range.
- Added/retained egg, landing, transformation, splash, checkpoint, death and victory burst hooks. Water ripple/bubble presentation and particles are reconstructed browser effects, not proven pixel-identical MIDP rendering.
- Increased the star/form button to 42×42 px inside its existing 39 px row, so the layout below it does not reflow. Added a 5–8 px viewport-to-controls gap on short portrait screens, recalculating the canvas size to keep the page fixed and unscrollable.

## Validation

- **29/29 Node.js regression scripts pass** in the build runtime. This includes the 15-stage resource boot/play/pause smoke, atlas/reference parity, all-stage spawn/terrain regression, event opcode coverage, source collision response, moving-surface contact, enemy movement/facing, particles and responsive UI.
- JavaScript source files pass `node --check`.
- ZIP packaging must retain `index.html` at archive root.

## Accuracy boundary

V18 is a substantial source-driven step, but not a certified one-to-one game recreation. The actor transforms/contact arithmetic are closer to the original source and the tested enemy/event paths are implemented, but special collision/object edge cases still require live 2.0.3 comparison. The title/chapter/pause/results UI remains HTML overlay UI rather than a pixel-identical port of the MIDP menu renderer. Particle and splash effects are reconstructed. Browser audio uses the extracted rendered soundtrack rather than native MIDP MIDI. Real Android/desktop playtesting against the original JAR remains outstanding.
