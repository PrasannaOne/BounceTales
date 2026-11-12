# Bounce Tales · HTML5 Remaster · Build 09

A browser-based reverse-engineering port built around the supplied Bounce Tales 2.0.3 JAR. The only playable stage remains Chapter 1, Misty Morning. The goal is faithful behaviour, not a redesigned game.

## Build 09 changes

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

Build 09 is a closer incremental port, **not yet a complete one-to-one game**. The supplied 2.0.3 JAR and exact Misty Morning resources ground the translated actor, timing and event systems. Some event commands, camera behaviour, dialogue presentation and object interactions remain approximations; the complete original LP32 collision solver, all enemy/special-object state machines, other playable chapters, save/progression, MIDI music and sound effects are not complete. Only Misty Morning is currently playable. Real-phone gameplay still needs testing.
See `PORT_STATUS.md`, `reverse-engineering/BUILD_08_ENGINE_PORT.md` and `reverse-engineering/BUILD_09_EVENT_SCRIPTING.md` for implementation boundaries and source notes.
