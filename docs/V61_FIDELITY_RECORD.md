# Bounce Tales V61 · fidelity record

**Date:** 2026-11-16 · **Supersedes:** `V60_FIDELITY_RECORD.md` (event/opcode math results there still stand) · **Reference:** the decompiled sources in `BounceTales_Decompiled_Ref`, treated as the specification, and the original classes in `assets/original`

## 1. Physics and collision: what was measured
`tools/original-runner` runs the **real original game** headless in a JVM (about 20 stub classes replace the phone APIs; the original bytecode is untouched), logs every frame, and replays the identical per-frame deltas through the port's `update()`.

| Check | Result |
|---|---|
| Level 1 opening, 41 frames, no input: port vs original player position | **max 0.0053 px, mean 0.0006 px** |
| Intro story message | raised on frame 29 in the port; the original's world freezes on frame 30 |
| Frames 2 and 3 (first gravity steps) | identical (0.0000) |
| Original physics sub-steps per frame (`o.j`) | **2** for the whole run; the port matches when stepped the same way |
| Original slope value / grounded at the jump point | 0.975 (limit 0.574) / grounded, so the jump gate itself matches `body.jump()` |

Run: `npm run verify:original` (Java 21 with `jdk.compiler`; skips cleanly otherwise).

## 2. Gaps found in the port and fixed, read from the decompiled `m.java`
* **Script control lock.** `m.java` dispatches player input by event variable `g.a[1]` (control mode). Every story level (1 to 13) sets it to 3 at the start of its intro/cutscene scripts and back to 0 at the end. The port ignored it, so the ball stayed controllable during scripted sequences. Input is now only applied in mode 0.
* **Scored clock.** The original's clear-time counter only advances while the player is alive and mode is not 3. The port counted cutscenes and death animations (about 3 s per death) toward clear time, which feeds medals and score. A separate `playClock` now drives the score and HUD; the free-running `elapsed` still drives animation. This is verified by reading the source and by the existing suite, not yet by a recorded run.

## 3. Open items found but not resolved
1. **Early jump press.** In the original, pressing fire on frame 20 (ball grounded, slope 0.975, `g.a[0..1] == 0`) did **not** jump; the port jumps. The control lock does not explain it.
2. **Message dismissal.** In the original a fire press 10 frames after the intro message appeared did not dismiss it; later presses did. The port accepts the first press. The rule (minimum display time or multiple pages) is not yet identified.
3. Physics and collision are only verified over the opening 41 frames. Longer, input-driven paths are not yet comparable until items 1 and 2 are understood.
4. Opcode 29 (140 campaign commands), 4, 25, 30, 31 are not yet in the opcode differential. The 46 modern-CSS fallbacks kept in `style.css` are deliberate.

## 4. CSS overrides
`tools/prune-overridden-css.cjs` removes a declaration only when the same selector, in the same media context, sets the same property again later with equal or higher importance, and never when the later value uses newer syntax (`cq*`, `dvh`, `clamp()`...). It removed **51 dead declarations and 4 dead blocks** (33,234 to 32,302 bytes). Proof: computed style of every element in 8 screens at 5 viewport sizes, before and after: **0 of 3,833,560 properties differ**. 178 `!important` and 11 `#app` blocks remain because they set different properties.

## 5. State of this build
`npm run check` clean (100 files). `npm test`: 70/72; the two failures (`repository-health`, `runtime-zip-import`) exist because `.github/workflows/import-bounce-zip.yml` and `tools/import_runtime_zip.py` were not in the supplied archive. Smoke (15 stages) passes; gameplay and settings frames are pixel-identical to V58 at phone, landscape and desktop sizes.
