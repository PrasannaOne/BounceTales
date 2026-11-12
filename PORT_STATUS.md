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
