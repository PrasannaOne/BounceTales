# Build 06 implementation notes

> **Historical milestone record:** This document describes the state, scope and known limitations of its named build at the time. It is retained as research history and is not a description of the current release unless it explicitly says so.
## Original actor eye/glow rendering
The actor renderer in the public `HelloOO7/BounceTales` decompilation identifies:
- Bounce glow layers: image-map IDs `17` and `28`.
- Expression image-map ID `20` for the special `eyeFrame == 1` state.
- Idle blink sequences: image-map IDs `462` (2-frame idle) and `447` (4-frame expression).
- Eye-expression sequence IDs: `458`, `460`, `454`, `452`, `456` for eye frames 4–8.
- Idle timing: a 3000 ms idle threshold; a 600 ms initial eye animation; a follow-up expression selected for 600 or 1500 ms.

Build 06 ports the idle/blink state transitions and reuses these original image-map IDs. It does not yet port the complete stretched-circle renderer, acceleration stretch buffers, loss/win eye states, exact random generator or all update/render timing details. The JavaScript sequence uses `Math.random`, so it is visually related but not frame-identical.

## Collision improvement
Build 05's terrain pass only considered edges within the ball radius. It could therefore fail to recover a ball whose center was already inside a polygon. Build 06 adds a point-in-polygon test and, for embedded overlaps, chooses the nearest contour edge and pushes the ball outside by its radius. The ordinary edge-contact path still uses the existing approximate normal/penetration response.

This is a robustness fix, not a completed translation of the original swept-collision method in `BounceObject.checkCollisions`.

## Simulation timing
The original engine updates physics using `GameRuntime.updateDelta` in milliseconds. Build 06 uses a fixed 1/60 second simulation step with a capped accumulator. This avoids applying different acceleration/collision step sizes solely because a browser frame happened to be late. It is a stability choice pending exact measurement of the original game loop's update cadence.

## Control map
- ID 3: left held movement.
- ID 4: right held movement.
- ID 7: primary actor action; used as the touch JUMP/confirm button.
- ID 1: original UP input remains mapped to the actor action for keyboard compatibility.
- ID 20: edge-triggered form cycle (`*`).
- ID 5: edge-triggered pause path (original Nokia right softkey).
- `#` / ID 21 is not shown on the touch pad because no active-game action has been confirmed in the traced controller branch.

The `L` softkey and up/down directions are omitted from the visible mobile layout because they are not needed for the current Misty Morning gameplay controls; original ID mapping remains in the input adapter for future menu work.

## Reference source and version caution

The readable method reference is [`BounceObject.java`](https://github.com/HelloOO7/BounceTales/blob/master/BounceTales/src/bouncetales/BounceObject.java) from the public HelloOO7 decompilation. That source identifies the eye IDs and idle timers used here, and also documents the original stretched-circle player renderer and collision solver. It is a 2.0.25 reference. The supplied JAR is 2.0.3, so any not-yet-cross-checked behaviour is explicitly provisional.
