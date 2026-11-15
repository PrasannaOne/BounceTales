# Bounce Tales V58 · original-source crosswalk

**Runtime release:** `58.0.0`  
**Reference:** user-supplied Bounce Tales 2.0.3 JAR and decompiled Java sources  
**Runtime/cache identity:** `v=58`, `bounce-tales-v58`  
**Base:** V57

## Purpose and evidence standard

This document connects the supplied decompiled classes to the browser implementation. It distinguishes three kinds of evidence:

1. **Byte/resource parity:** the repository tests compare original resource hashes and parsed RLEF structures against committed decoded fixtures.
2. **Source-derived behavior checks:** tests exercise JavaScript handlers using small, controlled objects and values chosen from the decompiled source behavior.
3. **Browser adaptation:** behavior that necessarily uses browser APIs, browser timing, DOM/canvas rendering, Web Audio or local storage is identified as an adaptation rather than exact MIDP equivalence.

A source-to-module mapping is not, by itself, proof that the browser implementation reproduces every branch of the original. Likewise, test count is not a fidelity percentage.

## Original class to browser-runtime crosswalk

The source roles below follow `src_decompiled/CLASS_ROLE_INDEX.md` in the supplied reference. Browser mappings are many-to-many because the original MIDP application and this browser port divide responsibilities differently.

| Original source | Recovered responsibility | Browser-side location | Evidence / boundary |
|---|---|---|---|
| `RMIDlet` | MIDP application lifecycle entry point | `index.html`, `game.js`, `sw.js` | Browser boot, static shell and PWA lifecycle replace MIDP lifecycle APIs. |
| `a` | Camera/viewport anchor object | `src/original-camera.js`, `game.js` | Camera module tests protect tracking and projection; browser viewport sizing remains an adapter. |
| `b` | Text measurement, wrapping and layout | `src/midp-graphics.js`, `game.js`, `index.html` | MIDP-compatible text/draw helpers are used where practical; CSS/Canvas font rasterization is not handset-identical. |
| `c` | Player actor, movement, bounce and collision response | `src/bounce-physics.js`, `src/original-collision.js`, `game.js` | `c.java` constants and float/fixed-point update details inform the physics port; module tests cover movement, jump, spring response and collision integration. Full original-JVM differential replay is not present. |
| `d` | 16.16 affine transform and coordinate operations | `src/fixed-point.js`, `src/event-engine.js`, `src/rlef-reader.js` | Fixed-point and scene-transform tests cover core arithmetic and hierarchy composition. |
| `e` | Type-12 interactive level object (trampoline/springboard role) | `src/original-trampoline.js`, `game.js` | Dedicated Level 1 lifecycle proof and trampoline regression tests. |
| `f` | Menu item data model | `game.js`, `index.html`, `style.css` | Browser menu scenes preserve the original navigation intent with accessible HTML controls. They are not MIDP widget instances. |
| `g` | Type-6 animated object and event-command interpreter | `src/event-engine.js`, `src/original-sprite-animation.js`, `game.js` | Original `g.java` cases 0–32 are represented in the runtime. V58 adds synthetic behavior checks for all 33 opcode values and a separate campaign command census. These are not a byte-for-byte JVM replay. |
| `h` | Menu/list widget, selection and scrolling | `game.js`, `index.html`, `style.css` | Menu and input regressions cover the browser scenes; typography and hit testing are browser adaptations. |
| `i` | Type-10 water object | `src/original-water.js`, `game.js` | Water-state and interaction tests cover the implemented browser path. |
| `j` | Shared scene-object transform, bounds and parent/child links | `src/rlef-reader.js`, `src/event-engine.js`, `game.js` | RLEF header parity and event transform/parenting checks cover the runtime representation. |
| `k` | Type-11 cannon object | `src/original-cannon.js`, `game.js` | Cannon geometry/behavior tests and shared `bu` resource checks protect this subsystem. |
| `l` | Type-15 enemy object | `src/original-enemies.js`, `game.js` | Enemy behavior and stage boot checks cover the browser implementation. |
| `m` | World manager, RLEF dispatch and resource orchestration | `src/rlef-reader.js`, `game.js`, `src/original-progression.js`, `src/audio-controller.js` | Binary parser/resource parity and all-stage smoke protect the main data path. Some `m` resource-table consumers remain unresolved; see the V56 supplemental audit. |
| `n` | Polygon/shape geometry helpers | `src/terrain-collision.js`, `src/original-collision.js`, `game.js` | Polygon vertices/triangles match the decoded reference; collision response remains a high-value differential area. |
| `o` | MIDP GameCanvas shell, resource/audio/persistence and platform loop | `index.html`, `game.js`, `src/audio-controller.js`, `src/original-progression.js` | Browser events, Web Audio, storage and PWA APIs substitute for MIDP platform services. |
| `p` | Type-4 polygon geometry object | `src/rlef-reader.js`, `src/terrain-collision.js`, `src/original-collision.js` | All parsed polygon data is compared with decoded resource fixtures; runtime collision outcomes are tested separately. |
| `q` | Locale and text-resource loader | `src/event-engine.js`, `game.js` | Original language resource parsing and language selection are in the runtime; available locale files are preserved. |
| `r` | Type-9 path/shape object and sprite data | `src/rlef-reader.js`, `src/sprite-atlas.js`, `game.js` | Sprite atlas/resource mapping and object parsing tests cover the data path; browser rasterization differs from MIDP rendering. |

## Source-derived event-command coverage

The supplied `g.java` implements command values 0 through 32. The browser interpreter in `src/event-engine.js` has a matching case for every value. The V58 test `tests/event-command-semantics.test.cjs` now runs controlled checks for all 33 values, including the cases not present in the playable campaign. It verifies:

- dialogue and sprite-animation dispatch;
- event state transitions and repeatable completion;
- timer countdown and reset;
- integer and float variable set/arithmetic and conditional branches;
- timed translation and rotation in fixed-point scene matrices;
- absolute/source-based positioning, parenting and detaching;
- script jumps, the original opcode-22 no-op, leave-area waiting and checkpoint capture;
- player-targeted push, gravity and velocity changes;
- opcode-29 packed depth/flag replacement and the image-358 effect callback;
- camera target selection and parameter reset.

`tests/campaign-opcode-profile.test.cjs` independently parses all 15 playable campaign scripts and pins the exact observed opcode distribution and the two opcode-26 player targets. V57's `tests/event-flag-parity.test.cjs` checks all 140 campaign opcode-29 commands and the source selector distribution. The separate sprite-animation module covers the source image substitutions in opcode 1 (`118 → 485`, `334 → 474`, `342 → 480`).

**Interpretation:** this is broad interpreter coverage with focused source-derived behavior checks. The synthetic fixtures are not a full original-JAR execution trace. Event trigger overlap, complete event scheduling order and all timing interactions still need differential replay before they can be called exact.

## Original resource and campaign integrity

`tests/reference-parity.test.cjs` verifies the following against the checked-in decoded reference fixtures:

| Evidence | Verified result |
|---|---:|
| Original resource SHA-256 entries | 105/105 match |
| RLEF resources parsed | 16/16 (`bf` through `bu`) |
| Scene object headers | 2,240 |
| Polygon geometry objects | 490 |
| Polygon vertices | 5,776 |
| Triangle indices | 4,306 |
| Event objects | 316 |
| Authored event command streams | 1,143 exact byte-stream matches |
| Playable campaign stages | 15 (`bf` through `bt`) |

The supplemental `bu` resource is shared geometry used by the cannon. It is not a sixteenth playable campaign stage. The campaign command profile and source crosswalk therefore use the 15 playable resources for gameplay coverage while the integrity test still protects all 16 RLEF resources.

## Remaining parity work

These known limits prevent a defensible claim of 90% overall game fidelity at V58:

- **Physics and collision:** key actor constants and update equations are source-informed, but the full `c.java` collision/response path has not been run in lockstep against the original JAR over a broad test corpus.
- **Scene/event timing:** command cases are represented and synthetically exercised, but event activation, overlapping triggers, object update order and every elapsed-time boundary have not all been differential-replayed.
- **Rendering and UI:** original resources, sprite mappings, HUD/menu restoration and MIDP anchor helpers are protected by tests, but browser rasterization, font metrics and viewport presentation are not pixel-identical to a particular handset.
- **Audio and particles:** original resource identity and selected source mappings are protected; browser autoplay, audio scheduling, particle random sampling and frame timing are browser adaptations.
- **Supplemental resources:** `be` and `bv` are preserved and inventoried. Their exact semantic/runtime consumer contracts remain incomplete; no behavior has been invented to fill that gap.
- **External verification:** local verification does not prove GitHub Actions success or a successful GitHub Pages deployment.

V58 records an evidence-backed coverage inventory, not an aggregate parity score. A numeric score should only be assigned after defining weighted subsystem criteria and performing source-to-runtime differential checks for those criteria. The project should continue toward the requested 90% target without presenting resource preservation, opcode count or test count as a substitute for gameplay fidelity.

## V58 share destination

The `#share-site` handler in `game.js` now uses `https://prasannaone.github.io/BounceTales/` for both Web Share and clipboard fallback. The trailing slash matches `og:url` and the header home link in `index.html`. `tests/share-header.test.cjs` protects the canonical target and rejects the retired X.gd share target. The old X.gd note under the V55 historical README section describes that earlier release only.

## V58 verification gate

From the repository root:

```bash
npm run verify
```

This runs syntax checks, every `tests/*.cjs` regression file, the all-stage runtime smoke harness and the Level 1 springboard lifecycle proof. See `docs/V58_CAMPAIGN_PARITY_SCORECARD.md` for the campaign counts and `docs/V57_EVENT_FLAG_PARITY.md` for the opcode-29 source details.
