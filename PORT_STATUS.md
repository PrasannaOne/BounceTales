# Bounce Tales · port status

## Current website state
- The browser page remains a playable training-stage prototype.
- It uses a 240×320 logical canvas and proportionally scales it.
- The training stage's platforms, stars and movement constants are still approximations, not original game data.

## Verified reverse-engineering progress in this build
- All 106 files in the supplied JAR are preserved under `assets/original/` and verified byte-for-byte.
- Fresh `javap` bytecode disassemblies are included for all 19 original classes.
- Original key normalization, gameplay-held inputs, pause-menu event and actor mode-cycle input are traced.
- The pause menu's original localized strings were recovered.
- Sixteen `RLEF` resources have their signature/version/header fields inventoried.
- Three-mode actor physics constants are extracted exactly from `c.class`, with field semantics intentionally left unlabeled where unproven.
- A reusable JavaScript input mapper is included and has automated tests.

## Remaining before a faithful remaster
- [ ] Fully decode the 16 RLEF payloads and prove their relationship to the level/stage system.
- [ ] Rebuild original level loading from the original resources.
- [ ] Trace and reproduce the actor physics and all three actor modes.
- [ ] Map original PNG indexes to sprite sheets, player frames, level tiles, UI and effects.
- [ ] Rebuild enemies, hazards, collectibles, checkpoints and level completion from original logic/data.
- [ ] Map MIDI files and playback triggers.
- [ ] Rebuild menus and progression, including RMS save-data compatibility.
- [ ] Compare against the JAR running in an original Java ME reference environment.

This is a reverse-engineering build, not a claim of full game completion. See `reverse-engineering/` for bytecode-backed evidence and known unknowns.
