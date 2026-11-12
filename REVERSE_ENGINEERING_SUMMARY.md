# Bounce Tales HTML5 remaster · reverse-engineering summary

Build 09 is an incremental port based on the user's supplied Bounce Tales 2.0.3 JAR. The JAR's original assets and RLEF resources remain preserved under `assets/original/`.

## Confirmed original systems
- Original controller key mapping and active gameplay dispatch have been traced from the supplied class bytecode.
- The game loop derives an integer millisecond update delta from elapsed wall time. The default internal update pass count is 1, and the default maximum update delta is 500 ms.
- The actor class contains the original three-form movement constants, jump gate, directional stretch state, eye animation timers and form-specific rendering resources.
- RLEF level resources `bf` through `bu` parse and validate; the playable stage is Misty Morning (`bf`).

## Build 09 translation work
- Browser rendering follows `requestAnimationFrame`; Auto mode does not force a 60 Hz render rate. Optional 30/60 FPS render caps are available.
- Elapsed integer milliseconds are capped at the original 500 ms ceiling and conserved across bounded physics/collision substeps.
- Bounce's directional stretch/squash state and the main Bounce/Bumpy/Wolly player form renderers have been translated into JavaScript/Canvas.
- Terrain collision now includes swept edge and endpoint tests, not just final-position overlap correction.
- The original RLEF event command interpreter and localized message strings are integrated for Misty Morning.
- Original sprite event animations 118→485, 334→474 and 342→480 use their JAR frame timing and fade sequence.
- Event attach/detach, object flag, actor force, checkpoint, transform and camera command paths are translated; the first stage autostart and area-triggered sequences are covered by automated tests. Scene objects and the player are now drawn using their runtime z-depth flags, so scripted depth changes take effect.

## Accuracy caveat
The readable public decompilation at `https://github.com/HelloOO7/BounceTales` targets a different game build (2.0.25). It is used only as an aid to understand complex rendering and collision routines. Key constants and timing statements are checked against the supplied 2.0.3 bytecode wherever noted. Build 09 still does not contain the original complete LP32 collision solver, full object AI, save/progression system or sound/music pipeline. Event command paths outside Misty Morning are not fully validated, and the readable public decompilation used for cross-checks targets version 2.0.25. Do not describe it as a complete one-to-one port yet.

See `reverse-engineering/BUILD_08_ENGINE_PORT.md`, `reverse-engineering/BUILD_09_EVENT_SCRIPTING.md` and `PORT_STATUS.md` for exact scope.
