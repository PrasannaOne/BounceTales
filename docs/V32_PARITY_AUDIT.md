# Bounce Tales V32: J2ME/JavaScript parity audit

## Scope and evidence

Audited the V31 runtime source against the supplied 19-class decompilation and the 16 original RLEF resources. Verification was performed in Node.js only. No Chromium, browser session, or bot simulation was launched.

The 16 resources (`bf` through `bu`) parse as 2,240 objects, 316 event objects, and 1,143 event commands. They contain 13 cannons, 24 water zones, 13 trampolines, and 19 enemies. The 15 playable campaign stages contain 2,227 objects; `bu` is the additional resource/hub scene.

A source crosswalk and Node tests establish formula/behavior parity for the tested paths. This is not a claim that every possible frame and every event branch has been differentially replayed against a running J2ME VM. The decompiler preserves obfuscated method names, and the supplied Java source is not itself an executable reference runtime.

## Subsystem comparison

| Subsystem | Decompiled Java reference | V31 JS implementation | Audit result |
|---|---|---|---|
| Cannons | `k.d()` launch; `k.c()` aim/matrix animation | `game.js`: `cannonAngle`, `updateCannonAim`, `updateCannon`, `fireCannon` | **Formula/sign match.** Java multiplies power by the cannon transform's cosine/sine terms and shifts by 12. JS uses the equivalent `/4096` with `Math.floor`. Node angle probes confirm right = +X, up = +Y, left = -X; no downward/backward sign inversion for those cardinal directions. Full per-cannon authored-path replay is not claimed. |
| Water zones | `i.a(int,int,c)` force/drag update; `i.a()` bounds; `i.d()` animation/update | `src/original-water.js` | **Core force/drag match; boundary parity partial.** JS uses the same `gravity << 5` scaling and `dt * 1.4` drag factor, equivalent to Java's `elapsedMs * 0.0014F`, with form-dependent inverse gravity. JS swept surface crossing/ripple bookkeeping is an adaptation; all entry/exit edge cases have not been differentially replayed against J2ME. |
| Ball forms / physics | `c` static arrays and `c.d()` actor integration | `src/bounce-physics.js` | **Constants match exactly.** Radius `[20,20,20]`, gravity `[1,1.4,0.5]`, friction `[0.6,0.3,0.6]`, restitution `[0.1,0.1,0.1]`, acceleration `[500,350,312.5]`, max speed `[280,350,150]`, air suppression `[1.5,2.5,1.2]`, jump acceleration `[288,255,162.5]`. Node physics/fixed-point tests pass. |
| Terrain / slopes | `c.a(j)` collision traversal and `c.a(...)` polygon response; RLEF geometry in `p`/`n` support code | `src/original-collision.js`, `src/terrain-collision.js` | **Partial source parity.** The port preserves fixed-point transforms, swept contacts, slope normals, and form-dependent restitution; Node terrain, RLEF regression, and collision tests pass. There is no exhaustive per-triangle differential trace for all 490 geometry objects. |
| Enemies / hazards | `l` enemy object update and hit response; actor contact handling in `c` | `src/original-enemies.js`, `game.js` | **Behavioral paths covered; exhaustive parity partial.** Node tests cover LP32 patrol speeds, candle reversal, bumper movement, mole states/vulnerability, stalker retargeting, stomp/egg, and side-hit response. No full tick-by-tick comparison for every one of the 19 authored enemy instances is claimed. |
| Events / doors / gates / checkpoints | `g` event interpreter, opcodes 0–32 | `src/event-engine.js` | **Observed campaign opcodes implemented and covered.** Across the 16 RLEF files, 1,143 commands use 26 distinct opcode values, all within 0–32. Node coverage checks stage scripts, dialogue, sprite animation, triggers, variables, transforms, flags, camera commands, and checkpoint opcode 25. Branch-by-branch differential replay of all event scripts remains unproven. |
| Touch-control editor | No equivalent J2ME touch-layout editor; this is a browser-specific feature | `game.js`: `openControlEditor`, `bindControlEditor`, `applyLiveControlLayout` | **Not applicable to J2ME parity; web behavior verified.** Node runtime test exercises drag, resize preview, Save/localStorage reload, and Cancel restoring saved layout. |
| Trampoline | `e.d()` animation/release; `e.b()` frame anchor; `c.a(j)` launch-segment contact | `src/original-trampoline.js` | **V31 sign correction preserved and re-proven.** The stale pre-V31 test expectations were corrected; no trampoline gameplay logic was changed in V32. The 30-tick real `game.js` Node trace is recorded below. |

## Trace-before-patch record

No additional gameplay-logic discrepancy was confirmed strongly enough to justify a V32 runtime patch. The only code changes beyond cache versioning are test maintenance: two tests still asserted the old negative trampoline offset. Their expected anchor was updated to the positive world-Y offset already present in V31. The V31 trampoline implementation itself is unchanged.

### Level 1 (`bf`) real `game.js` loop trace

Controlled descending setup contacts the real Level 1 leaf spring at tick 3. Compression lasts through tick 15; release occurs at tick 16. The compression range is Y=552–573, and `y16` is synchronized with `y` on every recorded tick.

| Tick | Enabled | World Y | `vy` | Spring active | Frame |
|---:|:---:|---:|---:|:---:|---:|
| 1 | yes | 591.384 | -506.8 | no | 0 |
| 2 | yes | 582.653 | -513.6 | no | 0 |
| 3 | no | 573.000 | 0 | yes | 0 |
| 4–6 | no | 557.000 | 0 | yes | 1 |
| 7–9 | no | 552.000 | 0 | yes | 2 |
| 10–12 | no | 557.000 | 0 | yes | 3 |
| 13–15 | no | 573.000 | 0 | yes | 4 |
| 16 | yes | 583.084 | +593.2 | yes | 5 |
| 17 | yes | 593.053 | +586.4 | yes | 5 |
| 18 | yes | 602.906 | +579.6 | yes | 5 |
| 19 | yes | 612.644 | +572.8 | no | 0 |
| 20 | yes | 622.266 | +566.0 | no | 0 |
| 21 | yes | 631.772 | +559.2 | no | 0 |
| 22 | yes | 641.163 | +552.4 | no | 0 |
| 23 | yes | 650.438 | +545.6 | no | 0 |
| 24 | yes | 659.598 | +538.8 | no | 0 |
| 25 | yes | 668.642 | +532.0 | no | 0 |
| 26 | yes | 677.570 | +525.2 | no | 0 |
| 27 | yes | 686.383 | +518.4 | no | 0 |
| 28 | yes | 695.080 | +511.6 | no | 0 |
| 29 | yes | 703.040 | -44.927 | no | 0 |
| 30 | yes | 702.117 | -54.288 | no | 0 |

At tick 29, Bounce has crossed above Y=700; the velocity reversal on that tick is a subsequent terrain collision response, not a downward trampoline impulse. The spring launch itself is positive world-Y and the player is never repositioned below the leaf during compression.

## Node verification

- 16/16 RLEF resources parsed: 2,240 objects, 316 events, 1,143 commands.
- 15-stage campaign object coverage and stage-script coverage passed; the additional `bu` resource was included in the 16-resource parser audit.
- Cannon cardinal-angle/sign probe passed.
- Water, enemy, event, terrain, physics, fixed-point, touch-control editor, settings, trampoline, and real game-loop tests passed.
- 83 curated Node test files/scripts passed. Four historical cache/PWA tests are intentionally excluded because they assert V19/V20/V29 cache strings, not V32 behavior.
- All JavaScript files passed `node --check`.
- ZIP CRC/integrity verification passed.

## V32 changes

- `index.html`: all cache query strings bumped from `?v=31` to `?v=32`.
- `sw.js`: cache name bumped to `bounce-tales-v32`; precache query strings bumped to `?v=32`.
- Updated stale trampoline test expectations to the V31 positive offset and added the 30-tick compression/fixed-point/launch assertions.
- Added `tests/v32-reference-audit.test.cjs` for 16-resource parsing, J2ME-derived physics constants, and cannon direction probes.
- Preserved the V31 runtime implementation, `LICENSE`, `README.md`, `ARCHITECTURE.md`, `.github`, icons, Web Audio, and the red heart header link.
