# Build 14 · collision and terrain contact

## Original source basis

The uploaded 2.0.3 `c.class` collision routine walks scene geometry contours, intersects the swept player-centre path with edges offset by the active ball radius, then checks the contour vertices with a circle-contact routine. Contact candidates store the surface direction and are used by the actor response path. The public readable `BounceObject.checkCollisions` source makes this logic easier to follow, but is a 2.0.25 reference; the uploaded 2.0.3 bytecode remains authoritative.

## Browser translation

`src/terrain-collision.js` now includes:
- contour winding-aware outward normals;
- swept centre path against radius-offset edges;
- swept circle tests against contour vertices;
- start-of-frame penetration recovery for suspended-tab/long-frame cases;
- iterative overlap recovery across multiple solid RLEF meshes, preferring the smallest positional correction.

This replaces the earlier edge sweep plus deepest-overlap heuristic. It remains a floating-point world-space approximation. The original's LP32 transforms, contact registration, nearest-contact selection, exact normal/torque response and all object-type checks are still being translated.

## Regression coverage

`tests/terrain-collision.test.cjs` exercises contour normals, containment, single-edge overlap, no-collide flags, high-speed swept contact, landing on a grass-like surface, and overlapping terrain meshes. `tests/terrain-rlef-regression.test.cjs` simulates the initial 5 seconds from each of the 15 original player starts and asserts the actor does not remain inside solid terrain.
