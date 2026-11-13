# Bounce Tales V21 · source and live-loop audit

## What was audited

The supplied `Bounce.zip` was unpacked and compared with the Phase 2 reference archive. The review traced the browser update path and the corresponding decompiled classes, especially `c.java` (player physics/collision), `j.java` (scene objects), `l.java` (enemy state), `o.java` (runtime/rendering), and `p.java` (polygon data).

The 15 campaign resources are `bf` through `bt`. The sixteenth RLEF resource, `bu`, is a separate cannon/object test scene, not a campaign stage.

### Runtime order reviewed

The live `game.js` update path runs input → player movement/physics → trampoline contacts → terrain collision → water forces → cannon contact/aim/fire → enemy movement → egg collection → enemy collision → event scripts → death/victory transitions → camera → particles and sprite animation.

The source-level review also checked the RLEF parser, fixed-point transforms, original collision path, terrain recovery fallback, trampoline animation/watchdog, water force path, enemy state updates, cannon state, progression, and event command interpreter.

## V21 changes

- Fixed the About support card layout. The requested sentence is now a readable, stacked description inside a full-width tap target: “Enjoying Bounce Tales? If you'd like to support this independent project, you can buy me a coffee.”
- Rebuilt the favicon, PWA icons and Apple touch icon from the original 46×48 JAR icon using exact nearest-neighbour pixel-art scaling. No new character details, text, badges or alternate character design were added. The original `assets/original/icon.png` remains unchanged.
- Replaced the text-heavy social preview with an image-only, dark forest-toned composition using the same original Bounce icon artwork. The 1200×630 preview contains no promotional copy or labels.
- Bumped the service-worker cache to `bounce-tales-v21`.
- Added a campaign object-type coverage test.
- Added a live-loop simulation audit that runs the actual `game.js` update function with synthetic directional and jump input through all 15 campaign resources: 720 fixed-tick updates per stage (10,800 total). It checks player/enemy finite state, bounded coordinates, and zero unsupported event opcodes.

## Verified source/resource facts

- All 105 original resource hashes in the supplied reference manifest pass.
- 16 RLEF resources parse and retain their declared framing/object records.
- The 15 campaign resources contain 2,227 object records; the additional `bu` test resource brings the reference total to 2,240.
- The decoded sprite catalogue contains 326 descriptors.
- The animation catalogue contains 1,143 command streams from 316 event/animation objects.
- Campaign event scripts use only the implemented opcode range 0–32.
- The campaign object types encountered by the parser all have corresponding branches in `buildRuntime`.
- The Level 1 springboard regression checks radius-aware descending contact, positive world-up launch velocity and the nearby decoded cliff trajectory.
- All 40 Node regression scripts pass; all 20 project JavaScript files pass `node --check`.

## What the live-loop test proves

The new simulation test executes the same `update()` function used by the game's animation loop, with real parsed level data and real physics/event/enemy modules. It runs 720 updates per campaign stage while alternating left/right movement and holding jump in short intervals. It confirms that Bounce moves, body and enemy coordinates remain finite/bounded, and no campaign event opcode is unsupported during the tested interval.

This is stronger than a resource-load smoke test, but it is **not** a complete player-route playthrough. It does not prove that every switch, boss, cannon, hidden trigger, egg route or exit portal has been reached, nor that all 15 stage-clear screens can be completed through natural gameplay.

## Verification limits and remaining parity work

- Headless Chromium could not be launched in this execution environment: the installed Chromium process exits because its GPU process cannot initialize. Therefore no Chromium keyboard/touch end-to-end session is claimed.
- The 10,800-frame live-loop audit runs in a Node VM harness, not a real browser engine.
- No physical Android/iOS device test has been performed.
- Every campaign stage still needs a known route script that reaches its exit through normal gameplay, including its switches, moving platforms, hazards, form gates and boss/cannon encounters where present.
- The supplied readable Java source and obfuscated 2.0.3 bytecode are not equally transparent for every rendering path. Some enemy image references and special object visuals still need direct resource mapping and side-by-side verification.
- Pixel-identical Nokia MIDP rendering, original device timing, and complete save/progression parity remain un-certified.

V21 is an audit-and-stability build with verified improvements. It should not be described as a certified 1:1 recreation until the remaining route and device checks are completed.
