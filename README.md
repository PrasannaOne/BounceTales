# Bounce Tales · HTML5 Remaster · Build 11

A browser-based reverse-engineering port built around the supplied Bounce Tales 2.0.3 JAR. The 15 original campaign and bonus RLEF stages are selectable as preview scenes. The goal is faithful behaviour, not a redesigned game.

## Existing systems retained through Build 10

- Kept **Auto**, **30 FPS** and **60 FPS** render pacing. Auto follows the browser's `requestAnimationFrame`; gameplay time remains based on elapsed milliseconds and the original JAR's 500 ms ceiling.
- Added the original RLEF event interpreter (opcodes 0–32) and runtime decoding of the original 91-string `lang.xx` resource.
- Misty Morning's autostart and area-triggered scripts now play their original localized messages and perform their authored sprite-animation, object-flag, attach/detach and timed-wait actions.
- Translated the original sprite event mappings 118→485, 334→474 and 342→480, including 150 ms frames and the 750 ms plus 1500 ms fade sequence.
- Added event-based checkpoints and original-style scene depth sorting, including runtime depth-flag changes.
- Retained the source-derived Bounce stretch/eye/form rendering, separate mobile buttons, fixed header, settings and About links.


## Touch controls

- **◀ / ▶**: move left and right. Hold for continuous movement.
- **JUMP**: original primary gameplay action. Hold while the original slope/ground check permits it.
- **\***: cycle through unlocked forms.
- **Ⅱ**: pause through the original softkey route.

Numeric keys 1–9 and `#` are not shown on the touch interface.

## Run locally

Serve this folder over HTTP. The browser fetches RLEF and image-map resources, so opening `index.html` directly as a `file://` URL may fail.

## Accuracy boundary

Build 11 is a closer incremental port, **not yet a complete one-to-one game**. The supplied 2.0.3 JAR and exact stage resources ground the translated actor, timing and Misty Morning event systems. Some event commands, camera behaviour, dialogue presentation and object interactions remain approximations; the complete original LP32 collision solver, all enemy/special-object state machines, full chapter progression, save/progression, MIDI music and sound effects are not complete. All 15 campaign/bonus scenes can be selected, but full chapter progression and every level-specific event are not implemented. Real-phone gameplay still needs testing.
See `PORT_STATUS.md`, `reverse-engineering/BUILD_08_ENGINE_PORT.md` and `reverse-engineering/BUILD_09_EVENT_SCRIPTING.md` for implementation boundaries and source notes.


## Build 10
Build 10 introduced the original 15-stage selector, enemy patrol-point decoding, wide-integer stretch recovery, and the first cannon load/aim/fire path.

## Build 11
- Added source-derived Candle and Mole patrol/state behaviour, LP32 speed conversion, stomp/egg-drop paths, and the unused Stalker reset-on-hit path.
- Added water/air-tunnel gravity interpolation, water velocity drag, torque damping, surface ripples and bubble effects.
- Added trampoline animation timing, integer frame thresholds, launch velocity and the original level-zone trampoline image selection (hill/spooky/bonus).
- Improved terrain contact response with the original per-form ricochet, friction-force comparison and torque low-pass behaviour.
- Corrected Canvas arc orientation to match MIDP's counter-clockwise `fillArc`, for Bounce's four stretch quadrants and Wolly's six segments. This is a likely contributor to the detached/deformed-looking player in earlier screenshots.
- Kept the 15 original stage selector, cannon, events, mobile controls and settings.

Build 11 brings more original object systems into the shared runtime. It does **not** yet make all 15 chapters fully playable: level-specific triggers, object scripts, enemies and win/lose/progression still need deeper coverage.

Run the complete test suite:

```sh
for test in tests/*.cjs; do node "$test" || exit 1; done
```
