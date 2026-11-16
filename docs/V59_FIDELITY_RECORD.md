# Bounce Tales V59 · fidelity record

**Date:** 2026-11-15 · **Base:** V58 · **Reference:** `bounce_tales_240x320-269519.jar` (2.0.3) and the decompiled sources in `BounceTales_Decompiled_Ref`

This record separates what was **measured against the original code**, what was **checked by reading** the decompiled source, and what is **still unverified**. It deliberately gives no single "% parity" number: the areas are not comparable, and a blended figure would hide the gaps.

## How closeness was measured

| Evidence class | Meaning | Strength |
|---|---|---|
| **Measured (JVM)** | The original decompiled class runs in a real JVM, generates seeded reference results, and the port's JavaScript is scored against them. `npm run verify:differential` (needs Java 21 with `jdk.compiler`; skips cleanly without it). | Strongest |
| **Byte-identical** | SHA-256 of every shipped resource equals the original jar's. | Strong |
| **Read-checked** | Constants/branches compared to `c.java`, `g.java`, `m.java` by reading. | Medium |
| **Author tests** | Synthetic or fixture tests written against the source (V29–V58). | Medium |
| **Adaptation** | Browser API replaces a MIDP service; cannot be bit-identical. | n/a |

## Measured results (JVM reference, seeded)

| Original routine | Port function | Cases | Bit-exact |
|---|---|---:|---:|
| `d.a(x,y)` point transform | `fixed-point.js` `transformPoint` | 30,000 | 100% |
| `d.b(x,y)` vector transform | `fixed-point.js` (translation zeroed) | 30,000 | 100% |
| `d.b(d)` matrix compose | `rlef-reader.js` `compose` | 30,000 | 100% |
| `d.b(d)` matrix compose | `event-engine.js` `compose` | 30,000 | 100% (was 0%) |
| `d.a(float)` rotation matrix | float32 recipe | 30,000 | 100% |
| `g.java` case 16, timed translation | `event-engine.js` | 189,245 steps / 3,000 runs | 100% |
| `g.java` case 17, timed rotation | `event-engine.js` | 125,571 steps / 3,000 runs | 100% (was 5.2% of steps) |

**What V59 changed to get there.** Before V59 the event engine composed object transforms in floating point (never bit-identical, error < 1 fixed unit) and rotated with plain doubles (up to 6 fixed units off per step, ~0.0001 px), and it zeroed the rotation timer on finish where the original resets it to the duration. All three now follow the original recipe exactly. In the 15 campaign stages the user-visible effect is nil (no event loops back within one activation, and repeatable events are rebuilt from pristine commands); the value is that the port is now exact rather than approximately right, and that it is provable.

Note: `d.java` needs one line removed to compile as Java source (`public static d a = new d();` clashes with an `int a` field, legal only in bytecode). No method was touched. See the header of `tools/differential/d.java`.

## Resources

* 106 / 106 files in `assets/original` are byte-identical to the original jar (86 resources + classes + manifest).
* 35 of 36 PNGs resolve through the image map / sprite atlas; the 36th is `icon.png`, the phone-launcher icon, which has no in-game use.
* 11 / 11 locale files (`lang.*`) are present and selected by `resolveOriginalLocale()`.
* `bv` (13 big-endian words) is the music-ID sequence and is covered by the V56 audit.

## Subsystem assessment

| Subsystem (original class) | Standing | Basis |
|---|---|---|
| Resources, locales | **Exact** | Byte-identical |
| Fixed-point math, scene transforms (`d`) | **Exact** | Measured (JVM) |
| Timed movement / rotation commands (`g` cases 16, 17) | **Exact** | Measured (JVM) |
| Other event opcodes (33 total; campaign uses 26) | Implemented, **not differentially tested** | Author tests + reading |
| RLEF level parsing (`m`, `j`, `p`) | Matches fixtures for all 15 stages | Author fixtures (not re-derived independently here) |
| Player physics constants and form cycling (`c`) | Match | Read-checked (gravity, jump, slope limit, `f()` cycling) |
| Player physics step and **collision response** (`c`, `n`) | **Unverified** | Highest-value gap |
| Progression, medals, bonus unlock (`m` tables) | Tables match (egg 30/29/26…, bonus costs 60/200/400) | Read-checked |
| Main loop timing | **Adaptation**: fixed 60 Hz step, original used device frame time | Documented |
| Rendering, HUD, menus | **Adaptation**: Canvas/CSS, not handset-identical, no pixel comparison to the original | V44–V47 audits |
| Audio | **Adaptation**: MIDI rendered to browser audio | V55 |

## Bugs fixed in V59 (all reproduced first)

1. **Stuck key with Shift.** Keys were tracked by `e.key`; Shift changes `'d'` ↔ `'D'`, so releasing D while Shift was down left a stale entry and the next D press was ignored.
2. **Shared actions cancelled each other.** A and ← both mean LEFT; releasing one released the action. Actions now count their held sources (keyboard keys and gamepad).
3. **Blocked storage prevented startup.** `localStorage` was read unguarded at boot. A closure-local wrapper now falls back to memory.
4. **Backgrounding left the level live.** The page now auto-pauses when hidden/unloaded (the original paused on `hideNotify`).
5. **Audio unlock hardening** (not a reproduced bug): extra retry on `touchend`/`pointerup`/`click`/`keydown` beside the pinned one-shot `pointerdown`. Unverified on iOS Safari.

Cleanup: removed 14 unused declarations/functions (kept `CONTROL_LAYOUT_DEFAULTS`, which a test pins) and 3 dead CSS classes (`.about-card`, `.menu-footnote`, `.title-subtitle`); cache/version bumped to V59 so returning players receive the fixes.

## Not done / still open

* The CSS still has stacked override layers (`#app` defined 11 times, 186 `!important`). Merging them needs a systematic visual regression pass.
* Nine tests hard-code the version number; they should read it from `package.json`.
* `repository-health` and `runtime-zip-import` fail in the supplied zip only because `.github/workflows/import-bounce-zip.yml` and `tools/import_runtime_zip.py` were not in the archive.
* Opcode 18 uses a floating-point inverse (`inversePoint` + `Math.round`); the original `d.c(d)` inverts in fixed point. 14 campaign uses.

## Recommended next steps toward the original (highest value first)

1. **Player physics differential.** Compile `c.java` against small MIDP stubs, drive its step with scripted input over a fixed polygon set, and score `bounce-physics.js` for position/velocity per tick. This is the single largest unverified area and the one players feel.
2. **Collision response differential** (`n`, `p`, `c`): same harness, randomized polygons and approach vectors, scoring contact normal and response.
3. **Remaining high-use opcodes:** 7 (206 uses, variable ops), 6 (177, wait timer), 29 (140, packed flags), then 4, 18, 25, 30, 31. Extend `Op17.java`'s pattern.
4. **Optional "original timing" mode** that feeds the engine real frame deltas (capped at 500 ms like `o.java`) instead of the fixed 60 Hz step, to compare feel against a handset or FreeJ2ME.
5. **Pixel comparison of rendering** against an emulator capture of the original jar (FreeJ2ME) for title, HUD, level 1 and the end-of-level screen.
6. Resolve the `be` consumer noted in the V56 audit.

## Reproduce

```
npm test                       # full suite (includes the differential test)
node tools/differential/run.cjs
```
