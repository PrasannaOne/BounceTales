# Bounce Tales V62 Final Edition · release notes

V62 is the planned final feature release: a physics/collision-focused browser runtime update with additional original-game replay evidence and documentation cleanup. After V62, the project is intended to enter maintenance mode. Further releases should be limited to genuine gameplay bugs, browser compatibility, security and essential platform fixes.

## Gameplay and engine

- Added/retained a headless original-game runner that executes the original game classes with small MIDP/Nokia API stubs and records frame deltas, physics substeps and player transforms.
- Added aligned short input replay comparisons for a jump press/release and left/right movement.
- Corrected moving-contact position reconstruction in `src/original-collision.js`: the previous browser path double-counted part of the moving surface displacement when rebuilding the corrected current actor transform.
- Added regression coverage for tangential surface movement and positive/negative normal movement.
- Kept the logical 240 × 320 game world and fixed 60 Hz simulation model.

## V62 measured evidence

The latest recorded short Level 1 original-vs-port rerun shows a maximum player-position deviation of 0.0117 logical pixels across the opening, short jump, left movement and right movement scenarios. The exact maximum varies slightly with the original game's wall-clock integer frame deltas. Differential engine checks report 600,816 bit-exact comparisons in the current run. The audit also records syntax, focused physics/collision and campaign terrain/spawn checks.

The full test suite was recorded as 70/72 in the supplied V62 runtime archive. The two failures concern repository-owned files absent from that archive: `.github/workflows/import-bounce-zip.yml` and `tools/import_runtime_zip.py`. They should be preserved/restored from the main repository, not treated as gameplay defects.

These are bounded test results, not a claim of exhaustive parity. Longer input-driven collision sequences, multiple simultaneous polygon contacts and moving geometry exercised through campaign events remain open verification work.

## Player-facing experience carried by V62

- Responsive mobile and desktop browser layouts.
- Original-scale 240 × 320 game canvas.
- Touch controls for left, right, jump and form switching.
- Settings-based touch editor: drag the live controls, select a control, resize it from 75% to 125%, then save/cancel/reset.
- Keyboard and supported gamepad input.
- Settings for game language, frame pacing, smooth motion, FPS counter, original music, fullscreen and progress reset.
- Game/About settings tabs, project links and Ko-fi support link.
- Header heart opens Ko-fi directly; the About panel retains the support link and project information.
- Responsive web app manifest, install icons and service worker for supported PWA installation and app-shell/resource caching. Offline availability is partial and depends on resources already cached.

## Verification commands

```sh
npm run check
npm test
npm run smoke
npm run proof:springboard
npm run verify:differential
npm run verify:original
```

The original replay harness requires Java 21 with `jdk.compiler`. See [`../V62_PHYSICS_COLLISION_AUDIT.md`](../V62_PHYSICS_COLLISION_AUDIT.md) for scenario-level measurements and limitations.
