# Bounce Tales · HTML5 Remaster · Build 14

A browser-based reverse-engineering port built around the supplied Bounce Tales 2.0.3 Java ME JAR. The original 240×320 game viewport and extracted resources are retained. This is still an incremental port, not a completed one-to-one replacement.

## Build 14 changes

- Responsive game shell for phone portrait, phone landscape, tablet and desktop layouts. The game viewport keeps its 3:4 aspect ratio and scales as a single unit.
- Gameplay touch controls appear only while playing. The title, chapter book, guide, pause and result screens are directly touchable HTML controls inside the game viewport.
- Chapter-book paging supports on-screen arrows, swipe/trackpad gestures and keyboard/gamepad input.
- PC controls: A/D or Left/Right to move, Space/Enter to jump, Shift/Q/* to change form, Escape to pause. A standard-mapping gamepad is also supported.
- Options/About has two compact tabs and a fixed, non-scrolling panel. Auto/30/60 FPS pacing, FPS counter, fullscreen and reset progress remain available.
- Replaced the simple exponential camera chase with a source-shaped damped camera spring using the original 15 ms integration quantum and 90/140 default spring parameters. This is a careful translation of the recovered camera routine, not yet visually validated against the original JAR on a device.
- The Share button uses a familiar connected-node share glyph with a visible Share label; About includes Made by Prasanna ❤️, Telegram and the full GitHub repository address.

## Existing gameplay systems retained

- All 15 original campaign and bonus RLEF resources are included and can be loaded from the in-game chapter book.
- Original RLEF object transforms, events and localized language strings are used by the browser scene runtime.
- The event interpreter covers command IDs 0–32, including messages, timed waits, object transforms, visibility/collision flags, forces, checkpoints and camera directives.
- Bounce actor stretch/eye/form rendering, enemy patrol/state behaviour, water/air-tunnel forces, trampoline timing, cannon entry/aim/fire, parallax layers and particle effects have incremental source-derived implementations.
- Progress records and unlock state are stored locally in the browser.

## Controls

| Input | Action |
|---|---|
| Touch Left / Right | Move |
| Touch Jump | Jump / primary action |
| Touch `*` | Change to an unlocked form |
| Keyboard A/D or ←/→ | Move |
| Space / Enter | Jump / select |
| Shift / Q / `*` | Change form |
| Escape | Pause |
| Gamepad left stick / D-pad | Move or page through the chapter book |
| Gamepad A / B / Start | Jump or select / form / pause |

Menus do not use the gameplay control pad. Their on-screen options, book arrows and dialog buttons are direct touch/mouse targets.

## Run locally

Serve this folder over HTTP. The browser loads original RLEF, language and image-map resources with `fetch`, so opening `index.html` directly as a `file://` URL may fail.

## Validation

Run all included Node.js checks from this folder:

```sh
for test in tests/*.cjs; do node "$test" || exit 1; done
```

The 21 test scripts cover the RLEF resources, original input mapping, elapsed-time simulation, event engine, progression, enemies, water, trampolines, cannon mechanics, menu flow, responsive UI wiring, camera spring and collision/landing regressions across all 15 stages. These are automated code/runtime checks. They do not replace real Android touch testing or visual comparison with the original Nokia runtime.

## Known one-to-one gaps

- The complete original LP32/16.16 swept collision and multi-contact solver is not fully translated. Current polygon response is a robust browser implementation with source-derived response terms.
- Not every enemy, friend, special object, boss phase, event edge case or chapter-specific interaction has been validated against a live original runtime.
- Water-surface mesh deformation, complete particle behaviour, exact camera/parallax timing and sprite composition still need side-by-side comparison.
- MIDI tracks and sound effects are preserved in the extracted resources but are not yet reproduced as the original audio mix.
- Chapter unlock/progression and result screens are approximations of the original game flow. All 15 stages load, but that does not mean all 15 are fully playable or complete.
- Real-phone Android browser testing is still required. A local headless-browser screenshot attempt was unreliable in this environment.

See `PORT_STATUS.md` and `REVERSE_ENGINEERING_SUMMARY.md` for the build history and specific source/accuracy boundaries.


## Build 14 · 2026-11-12

- Replaced the icon-only vertical-ellipsis header affordance with the standard connected-node Share glyph and a visible Share label.
- Added extra separation between the 240×320 game viewport and the mobile thumb controls; retained the compact lower Star control.
- Reworked circle-vs-RLEF contour collision around the original JAR's swept offset-edge and vertex-contact construction.
- Changed terrain penetration recovery to resolve the smallest correction first when multiple solid meshes overlap, reducing the chance of ejecting Bounce through a distant or underside contour.
- Added grass-platform landing and all-15-stage player-start/fall/landing regression tests.

Validation: all test scripts in `tests/*.cjs` pass in the local Node.js runtime. This validates deterministic logic only; real-device movement feel and screen layout still require phone/PC playtesting. The collision solver is closer to the source's contact geometry but is not yet a byte-for-byte LP32 translation of the complete original `BounceObject.checkCollisions` response.

## Build 15 · 2026-11-12
- Share control is icon-only, with an accessible label for screen readers.
- Retains the Build 14 swept edge/vertex terrain collision and overlap-recovery implementation.
- The collision implementation is still a browser-side approximation of the original LP32 contact solver; real-device grass landing needs validation before claiming the reported fall-through is fixed.
