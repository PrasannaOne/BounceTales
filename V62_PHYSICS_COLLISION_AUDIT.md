# Bounce Tales V62 · physics and collision audit

**Reference:** `BounceTales_Decompiled_Ref/src_decompiled/c.java`, `m.java`, and the original bytecode executed by `tools/original-runner`.

## What is now measured

The original-runner executes the untouched original game classes in a JVM with small MIDP/Nokia API stubs. It records the original integer frame delta, original physics substep count, player transform and event variables. The comparison replays those same deltas and substeps through the browser port.

| Scenario | Frames | Maximum position deviation | Mean deviation |
|---|---:|---:|---:|
| Level 1 opening, no input (latest rerun) | 41 | 0.0038 px | 0.0005 px |
| Short jump press/release (`20:-5:1,21:-5:0`) | 46 | 0.0117 px (latest rerun) | 0.0006 px |
| Right movement (`20:-4:1,28:-4:0`) | 46 | 0.0006 px (latest rerun) | 0.0003 px |
| Left movement (`20:-3:1,28:-3:0`) | 46 | 0.0053 px (latest rerun) | 0.0002 px |

The input comparator applies scheduled events after each recorded frame on both sides. This matters because `OriginalRecorder` hooks `GameCanvas.flushGraphics()` after the original world update. A press scheduled at frame 20 is therefore consumed by the original on the following update, frame 21. The earlier claim that the port jumped one frame too early was a test-harness alignment issue, not a confirmed physics defect. Repeated position maxima vary slightly because the original uses wall-clock integer frame deltas (`o.a`). In the latest rerun the largest observed deviation was 0.0117 px during the short jump sequence. These are extremely small positional differences, but they should not be rounded down into a claim that every run remains below 0.01 px.

The no-input opening includes the initial fall/contact sequence. These are short level-1 measurements, not proof of complete campaign-wide collision parity.

## Collision translation status

`src/original-collision.js` translates the original `c.class` swept edge and endpoint intersection helpers using 16.16 integer arithmetic and `BigInt` intermediates. It also ports the original nearest-contact selection, surface-relative velocity response, restitution, friction-force comparison, torque smoothing and contact state updates.

### V62 correction: moving-contact position reconstruction

Tracing `c.a(j)` showed that the original maintains two distinct transforms after a moving-surface contact:

1. The next collision pass's previous transform advances to the contact point plus the **full** contacted-surface displacement.
2. The corrected current actor transform uses the retained tangent offset, the **absolute normal component only** of surface displacement, and the 0.01-unit contact skin.

The previous browser code added the full surface displacement to the current position and then added its normal component again. This double-counted moving-platform motion and incorrectly added tangential platform motion to the corrected position. V62 separates those two transforms and adds regression tests for tangential movement and either direction of normal movement.

## Verified checks

- Original no-input replay: passes the 0.01 px threshold.
- Aligned short jump, left and right scheduled-input replays: latest observed maximum is 0.0117 px (the short jump run); the left and right runs are 0.0053 px and 0.0006 px respectively.
- Differential engine checks: all listed comparisons bit-exact (600,816 comparisons in the current run).
- Physics, original-collision, terrain-collision and 15-chapter spawn/terrain regression tests: all pass.
- Syntax check: 100 JavaScript files, zero failures.
- Runtime smoke: all 15 RLEF stages boot, play and pause.
- Full test suite: 70/72. The two failures are caused by files absent from the supplied archive: `.github/workflows/import-bounce-zip.yml` and `tools/import_runtime_zip.py`.

## Still to do

1. Capture longer input-driven original-vs-port paths after the intro message, including repeated jumps, slope transitions, wall/ceiling contacts and landing sequences.
2. Exercise the moving-contact correction through actual event-driven moving geometry, not only isolated response fixtures.
3. Compare contact normals and actor velocity/grounded state per frame, not only player position.
4. Differential-test collision with several adjacent polygons and repeated contacts in one original update.
5. Keep the floating-point overlap-recovery fallback clearly separate from original collision behaviour.

## Commands

```sh
npm run verify:original
SCHEDULE='20:-5:1,21:-5:0' node tools/original-runner/replay-input-compare.cjs
SCHEDULE='20:-4:1,28:-4:0' node tools/original-runner/replay-input-compare.cjs
SCHEDULE='20:-3:1,28:-3:0' node tools/original-runner/replay-input-compare.cjs
npm run verify:differential
node --test tests/physics.test.cjs tests/original-collision.test.cjs tests/terrain-collision.test.cjs tests/terrain-rlef-regression.test.cjs
```

The original-runner requires Java 21 with `jdk.compiler`; it skips cleanly when unavailable.
