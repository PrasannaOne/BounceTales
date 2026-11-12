# Bounce Tales HTML5 remaster · reverse-engineering summary

Build 11 is an incremental port based on the user's supplied Bounce Tales 2.0.3 JAR. The JAR's original assets and RLEF resources remain preserved under `assets/original/`.

## Confirmed original systems
- Original controller key mapping and active gameplay dispatch have been traced from the supplied class bytecode.
- The game loop derives an integer millisecond update delta from elapsed wall time. The default internal update pass count is 1, and the default maximum update delta is 500 ms.
- The actor class contains the original three-form movement constants, jump gate, directional stretch state, eye animation timers and form-specific rendering resources.
- RLEF level resources `bf` through `bu` parse and validate; `bf`–`bt` are the 15 selectable campaign/bonus preview scenes and `bu` is the separate cannon-object test resource. Full chapter progression is not yet implemented.

## Build 09 translation work
- Browser rendering follows `requestAnimationFrame`; Auto mode does not force a 60 Hz render rate. Optional 30/60 FPS render caps are available.
- Elapsed integer milliseconds are capped at the original 500 ms ceiling and conserved across bounded physics/collision substeps.
- Bounce's directional stretch/squash state and the main Bounce/Bumpy/Wolly player form renderers have been translated into JavaScript/Canvas.
- Terrain collision now includes swept edge and endpoint tests, not just final-position overlap correction.
- The original RLEF event command interpreter and localized message strings are integrated for Misty Morning.
- Original sprite event animations 118→485, 334→474 and 342→480 use their JAR frame timing and fade sequence.
- Event attach/detach, object flag, actor force, checkpoint, transform and camera command paths are translated; the first stage autostart and area-triggered sequences are covered by automated tests. Scene objects and the player are now drawn using their runtime z-depth flags, so scripted depth changes take effect.

## Accuracy caveat
The readable public decompilation at `https://github.com/HelloOO7/BounceTales` targets a different game build (2.0.25). It is used only as an aid to understand complex rendering and collision routines. Key constants and timing statements are checked against the supplied 2.0.3 bytecode wherever noted. The port still does not contain the original complete LP32 collision solver, full object AI, save/progression system or sound/music pipeline. Event command paths outside Misty Morning are not fully validated, and the readable public decompilation used for cross-checks targets version 2.0.25. Do not describe it as a complete one-to-one port yet.

See `reverse-engineering/BUILD_08_ENGINE_PORT.md`, `reverse-engineering/BUILD_09_EVENT_SCRIPTING.md` and `PORT_STATUS.md` for exact scope.


## Build 10 update
- The original game controller's level-resource and level-label arrays establish 15 campaign/bonus level slots plus a 16th cannon-object test resource. The JAR's RLEF files `bf`–`bt` map to those 15 stages; `bu` has no player start and is not a selectable campaign stage.
- The port now uses that table to load all 15 original stage object trees through the existing RLEF parser and shared scene builder.
- Enemy records contain two local patrol points. Build 10 keeps both and transforms them through the parent object matrix.
- Cannon interaction has been traced from `CannonObject`: player load bounds, disabled/hidden state, rotate rate, 900 ms animation, release timing at 300 ms remaining, and velocity based on power and local transform. The touch controls map left/right to aiming and jump to fire.
- Bounce's stretch restoration/damping uses the original wide intermediate arithmetic to avoid a Java-long-to-JavaScript-32-bit overflow mismatch.

Build 10 makes all original stages accessible for preview, but does not claim complete stage equivalence. The remaining per-object behaviours, collision solver, game-state flow, progression, audio and effects are still being ported.


## Build 11 update
- Enemy motion constants `{6000, 4000, 4000, 10000}` are LP32 values used with elapsed milliseconds. The browser converts them to world-units-per-second with `speed * 1000 / 65536`; Stalker's original 4-second target extension is converted through the same LP32 scale.
- Candle, Mole and Stalker state transitions, patrol points, enemy dimensions, stomp thresholds and contact pushes are ported into `src/original-enemies.js`. This covers selected class branches, not every enemy state and animation.
- WaterObject's water/air-tunnel force path is represented in `src/original-water.js`: local-space position, un-clamped interpolation of the four directional gravity values, `<<5` force contribution, torque damping `(deltaMs * torque) / 400`, and water-only velocity slowdown `deltaMs * 0.0014 / formGravity`. Browser surface ripples/bubbles are visual approximations.
- TrampolineObject's level-zone image selection, launch-period integer arithmetic, frame-count threshold and bounce release are represented in `src/original-trampoline.js`. The original source overwrites the RLEF trampoline image by stage zone: IDs 497, 509 and 490.
- `GameObject`'s MIDP arc semantics (0 degrees at 3 o'clock, positive counter-clockwise) are translated to Canvas in `src/midp-graphics.js`; Bounce quadrant fills and Wolly segments use that helper.
- The terrain solver now applies source-derived friction/ricochet/torque response but does not reproduce the full fixed-point multi-contact solver.

Build 11's all-level smoke check proves the 15 resources load and the shared scene runtime can start, not that every stage is complete or fully playable. The public readable decompilation is 2.0.25 and is used only as a naming/logic aid; the user's supplied 2.0.3 JAR and exact assets remain the project authority.

## Build 13 · adaptive controls and camera pass

Build 13 retains the uploaded 2.0.3 JAR resources as the data source. The camera update structure is translated from the readable Bounce Tales `GameObject.updateCamera` implementation used as a reference: it predicts camera target motion, keeps the player roughly one-fifth down the viewport, and integrates a damped spring in 15 ms quanta. The Java implementation uses fixed-point matrices and a global camera matrix; the JavaScript port expresses the spring in world units and should be checked visually against the original game before treating it as pixel-identical.

The shell now fits phone portrait, phone landscape and desktop; gameplay touch controls are hidden on non-gameplay scenes. DOM menu controls are tappable/clickable directly, while the in-game book also accepts swipe and trackpad paging. Keyboard and standard gamepad inputs feed the same original input-ID state used by the touch controls.

**Accuracy boundary:** this is an incremental behavior port. The custom DOM menu is not a complete reproduction of the original MIDP menu renderer, and the 15 playable-stage claim is still limited to loading and starting each RLEF scene. Complete collision, full event/object coverage, sound and every chapter's expected gameplay remain unfinished.


## Build 14 · source-shaped terrain contact and shell spacing

Build 14 changes the header share affordance to a connected-node Share icon with visible text and gives the portrait game viewport more visual separation from the touch controls.

The terrain resolver now sweeps against radius-offset contour edges and rounded vertices, then performs smallest-correction-first overlap recovery. This is a closer translation of the original collision method's edge/vertex contact construction. Synthetic grass and layered-mesh tests pass, and a 5-second initial-fall/landing simulation for each of the 15 RLEF stages finishes with the player outside solid polygons. The original LP32 contact buffer and complete fixed-point response remain to be ported.
