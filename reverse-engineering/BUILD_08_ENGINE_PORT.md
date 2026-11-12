# Build 08 · original-engine translation notes

## Timing from the supplied `o.class`

The original `o.k()` routine reads `System.currentTimeMillis()`, subtracts the previous timestamp, divides by the configured internal update-pass count, and clamps the resulting integer update delta to the configured maximum. The class initializer sets the pass count to `1` and maximum delta to `500` ms. A public helper changes the pass count to `2`; another configures the maximum. `c.d()` reads this update delta and converts milliseconds to seconds with `0.001f` for movement integration.

Build 08 follows this timing model as closely as practical in a browser:

1. Measure elapsed milliseconds between browser frames.
2. Use the JAR's 500 ms upper bound.
3. Split longer visible-frame deltas into chunks of no more than 33 ms for the current browser collision implementation.
4. Preserve the total integer milliseconds across those chunks.
5. Draw using `requestAnimationFrame`, independently of the physics chunk size.

This is **not** a fixed 60 Hz simulation clock. Auto follows the browser's frame scheduling. Optional 30/60 settings cap rendering cadence; they do not change the total elapsed gameplay time. The original code's second internal update pass is a platform/configuration path, not evidence that the game should be run at 120 FPS.

## Actor update from the supplied `c.class`

The exact 2.0.3 class bytecode contains the three-entry arrays used for:

- gravity multiplier: `1.0`, `1.4`, `0.5`
- friction: `0.6`, `0.3`, `0.6`
- ricochet: `0.1`, `0.1`, `0.1`
- movement acceleration: `500`, `350`, `312.5`
- maximum movement speed: `280`, `350`, `150`
- mid-air movement suppression: `1.5`, `2.5`, `1.2`
- jump acceleration: `288`, `255`, `162.5`
- base vertical gravity: `-400`
- max velocity: `999`

Build 08 keeps these values in `src/bounce-physics.js`. It also translates the actor's directional acceleration-to-stretch mapping, 16.16 stretch arrays, per-axis clamping, spring restoration and damping. The form-specific draw paths use the original Bounce highlight/eye IDs, the Bumpy Cracks rotation sprite sequence and Wolly segment colours from the readable `BounceObject` reference, with IDs cross-checked against `src/image-map.json` extracted from the supplied JAR.

## Terrain collision

The supplied `c.class` performs a multi-pass swept collision search. For geometry it checks edge contacts and rounded vertex contacts along the movement path, then selects a collision point and applies a fixed-point response. Build 08 replaces the older final-position-only test with a swept circle against polygon edges/endpoints and keeps a separate overlap recovery path for starts embedded in geometry.

The new browser algorithm is still an approximation. It does not yet reproduce the original LP32 ray/contact weights, nearest-contact selection across all 16 stored collision points, exact impulse/torque calculations, or every object-type callback. It should reduce tunnelling and sticking, but gameplay testing is required before calling the collision port faithful.

## Validation

- `tests/timing.test.cjs` checks the 500 ms source-derived ceiling and verifies substeps conserve elapsed milliseconds.
- `tests/physics.test.cjs` checks source-derived acceleration, jump and stretch state.
- `tests/terrain-collision.test.cjs` checks embedded starts, static overlap, no-collide geometry and a fast swept collision/rebound.
- `tests/rlef-validation.cjs` checks the 16 original RLEF resources.
- `tests/runtime-smoke.cjs` checks resource boot, Start and background/visibility reset.

Node checks passing is not a substitute for real-device playtesting or side-by-side comparison with the original JAR runtime.
