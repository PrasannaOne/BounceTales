# Bounce Tales V60 · fidelity record

**Date:** 2026-11-16 · **Supersedes:** `V59_FIDELITY_RECORD.md` · **Reference:** `bounce_tales_240x320-269519.jar` (2.0.3) and the decompiled sources in `BounceTales_Decompiled_Ref`

Evidence classes: **Measured (JVM)** = the original class runs in a real JVM and the port is scored against it (`npm run verify:differential`; needs Java 21 with `jdk.compiler`, skips cleanly otherwise). **Byte-identical** = SHA-256 equals the original jar. **Read-checked** = compared to the decompiled source by reading. **Adaptation** = a browser API replaces a MIDP service. No single "% parity" number is given: the areas are not comparable.

## Foundation check
The differential compiles the decompiled `d.java` (one clashing, unused static field removed). That source was itself checked against the **untouched original `d.class` bytecode** (loaded by reflection) on 20,000 cases per routine (`a(x,y)`, `b(x,y)`, `b(d)`, `c(d)` inverse, `a(float)`): 100% identical. So the measurements below are against the real original arithmetic, not a decompiler's reading of it.

## Measured results (JVM reference, seeded)
```
d.a(x,y) point transform  <- fixed-point.js                    n=  30000  exact 100.00%  max dev 0
d.b(x,y) vector transform <- fixed-point.js                    n=  30000  exact 100.00%  max dev 0
d.b(d) matrix compose    <- rlef-reader.js                     n=  30000  exact 100.00%  max dev 0
d.b(d) matrix compose    <- event-engine.js                    n=  30000  exact 100.00%  max dev 0
d.a(float) rotation       <- float32 recipe                    n=  30000  exact 100.00%  max dev 0
g.java case 16 timed translation (per step) <- event-engine.js n= 189245  exact 100.00%  max dev 0
g.java case 16 timed translation (whole runs incl. timer)      n=   3000  exact 100.00%  max dev 0
g.java case 17 timed rotation (per step)  <- event-engine.js   n= 125571  exact 100.00%  max dev 0
g.java case 17 timed rotation (whole runs incl. timer state)   n=   3000  exact 100.00%  max dev 0
g.java cases 7-11 variable set/add/sub/mul/div (float32 + int) n=  60000  exact 100.00%  max dev 0
g.java cases 12-15 conditional branch decisions                n=  40000  exact 100.00%  max dev 0
g.java case 18 move-to-world-position (incl. 1014 singular -> exception) n=  30000  exact 100.00%  max dev 0
All comparisons bit-exact.
```
Opcodes covered by measurement: **7–11** (variable set/add/sub/mul/div, int and float32), **12–15** (branch decisions), **16** (timed translation), **17** (timed rotation), **18** (move to another object's world position), plus all fixed-point transform/compose/rotation/inverse routines. Together these cover **435 of the 1,143 campaign event commands (38.1%)** (opcode 7 alone is 206 uses, 16 is 138). Opcode 6, the wait timer (177 uses), matches the original by reading but is not yet measured; counting it, 612 of 1,143 (53.5%) are verified by measurement or reading. The largest unmeasured one is opcode 29 (140 uses).

## What V60 changed in the engine (all found by the differential)
| Area | Before | Now |
|---|---|---|
| Event-engine matrix compose | Floating-point, 0% bit-exact (error < 1 unit) | Exact `d.b(d)` (long math, `>>16`, int32 narrowing) |
| Opcode 17 timed rotation | 5% of steps exact, up to 6 units off; timer zeroed on finish | 100% exact; timer reset to duration like the original |
| Opcode 10 integer multiply | JS double product, 22% wrong (lost low bits > 2^53) | `Math.imul`, exact |
| Opcodes 7–11 float operations | Int operands not rounded to float32 first; NaN payload bits leaked | float32 rounding as in `(float)int`; canonical NaN like `floatToIntBits` |
| Opcode 11 divide by zero | Completed with 0 | Command stays incomplete (original throws `ArithmeticException`, the interpreter retries) |
| Opcodes 14, 15 | Wrong for NaN, int operand not float32-rounded | Exact |
| Opcode 18 | Floating-point inverse + `Math.round` | Exact fixed-point `d.c(d)`; singular matrix leaves the command incomplete after zeroing the translation, as in the original |

In the 15 campaign stages these differences are tiny (sub-pixel) or unreachable by authored scripts; the point of V60 is that the port is now **exact and provable** for these routines, and that the check can be re-run by anyone.

## Subsystem standing
| Subsystem (original class) | Standing | Basis |
|---|---|---|
| Resources (106 files), 11 locales | **Exact** | Byte-identical |
| Fixed-point math, scene transforms, inverse (`d`) | **Exact** | Measured (JVM) |
| Event opcodes 7–18 (435 of 1,143 campaign commands, 38.1%) | **Exact** | Measured (JVM) |
| Event opcode 6 wait timer (177 commands) | Matches | Read-checked |
| Other event opcodes (1–5, 19–33) | Implemented | Author tests + reading; not yet differential |
| RLEF level parsing | Matches fixtures, all 15 stages | Author fixtures |
| Player physics constants, form cycling (`c`) | Match | Read-checked |
| **Player physics step and collision response** (`c`, `n`) | **Unverified** | Largest remaining gap |
| Progression, medals, bonus unlock | Tables match | Read-checked |
| Main-loop timing | **Adaptation** (fixed 60 Hz; original used device frame time) | Documented |
| Rendering/UI, audio | **Adaptation** (Canvas/CSS, MIDI to browser audio) | V44–V55 audits; no pixel comparison to a handset |

## Fixes carried from V59
Shift stuck-key and shared-action release (reproduced), blocked-`localStorage` startup crash (reproduced), auto-pause when backgrounded, audio-unlock retry hardening (unverified on iOS Safari), 14 dead declarations and 3 dead CSS classes removed. Regression tests in `tests/v59-input-storage-pause.test.cjs`.

## Verification state of this build
`npm run check` clean (98 files). `npm test`: 69/71 pass; the two failures (`repository-health`, `runtime-zip-import`) exist because `.github/workflows/import-bounce-zip.yml` and `tools/import_runtime_zip.py` were absent from the supplied archive. Runtime smoke (all 15 stages) and the springboard proof pass. V58 vs V60 gameplay and settings frames are pixel-identical at phone, landscape and desktop sizes; title/pause differences equal the original's own run-to-run animation noise.

## Still open
1. **Player physics step and collision response differential.** The jar needs only ~70 phone-API members stubbed (class files are Java 1.3, so any current JVM loads them), but its main loop is thread- and wall-clock-driven, so it needs a deterministic driver. Highest value.
2. Remaining opcodes (29 packed flags with 140 campaign uses, 4, 25, 30, 31) in the same differential style.
3. Optional "original timing" mode (real frame deltas, 500 ms cap).
4. Pixel comparison against an emulator capture of the original.
5. The CSS still stacks override layers (`#app` defined 11 times, 186 `!important`); nine tests hard-code the version string.

## Reproduce
```
npm test
npm run verify:differential
```
