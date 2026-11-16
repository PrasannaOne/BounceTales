# Player physics constants and traced behaviour

Reference: the supplied Bounce Tales 2.0.3 decompiled `src_decompiled/c.java`. The original obfuscated field names are retained alongside the now-traced meanings. The original class remains authoritative.

## Three form/mode parameter sets

| Original field | Traced meaning | Mode 0 | Mode 1 | Mode 2 |
|---|---|---:|---:|---:|
| `a:[I` | Player collision radius | 20 | 20 | 20 |
| `a:[F` | Gravity scale | 1.0 | 1.4 | 0.5 |
| `b:[F` | Surface friction coefficient | 0.6 | 0.3 | 0.6 |
| `c:[F` | Collision restitution / ricochet | 0.1 | 0.1 | 0.1 |
| `d:[F` | Minimum surface-normal Y for jumping (`cos(55°)`) | same | same | same |
| `e:[F` | Horizontal movement acceleration | 500.0 | 350.0 | 312.5 |
| `f:[F` | Maximum horizontal movement speed | 280.0 | 350.0 | 150.0 |
| `g:[F` | Mid-air movement suppression divisor | 1.5 | 2.5 | 1.2 |
| `h:[F` | Jump impulse | 288.0 | 255.0 | 162.5 |

`c.java` confirms the use sites: `b()`/`c()` use `e`, `f` and `g` for horizontal movement; `a(boolean)` uses `h` and the `d` slope threshold for jumping; `d()` uses `a:[F` for gravity; and `a(j)` uses `b:[F` and `c:[F` for contact friction and restitution.

Additional class constants: static `l:F = 0.0F` and `m:F = -400.0F` (base gravity Y).

## Jump gate

The original `c.a(boolean)` jump method requires both the grounded flag and the surface-normal Y component to be strictly greater than `cos(0.9599311F)` (approximately 0.5736). A normal jump adds `h[mode]` to the vertical impulse; the small-jump path adds half. The browser port uses the same gate and impulse values.

## Arithmetic and timing

The actor stores its world transform in signed 16.16 fixed-point coordinates while velocities and several intermediate calculations use Java `float` (IEEE-754 binary32). The port rounds the main actor integration operations to binary32 and truncates position deltas toward zero, matching the decompiled update order. The original loop can perform multiple actor substeps per rendered frame; comparisons must replay the recorded `o.j` count and integer `o.a` delta rather than assume one 60 Hz step.

## Remaining fidelity limits

- Physics and collision have been compared against the original runtime over the level-1 opening and short scheduled-input runs. Long, collision-heavy routes across multiple object types still need differential captures.
- The browser's overlap-recovery fallback in `terrain-collision.js` is a remaster safety net for penetrations and teleports, not an original-engine collision path.
- The source-faithful contact response still uses JavaScript binary64 for some vector normalization and response intermediates; a full binary32 operation-order port is a possible later precision improvement.
