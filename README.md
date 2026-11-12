# Bounce Tales HTML5 Remaster · Build 05

This is the first build that loads an actual level from the supplied Nokia Bounce Tales 2.0.3 JAR.

## What is real in this build
- **Misty Morning** is loaded from the original `assets/original/bf` RLEF resource.
- Its 101 real records are parsed, including 18 terrain meshes, 44 sprite objects, 29 eggs, the original player spawn, one trampoline, one mole and six event records.
- The original image resource table is decoded into a browser image-map catalog: 46 atlases and 540 sprite-map IDs, including direct, compound and animated entries.
- The terrain triangles, scene sprites, eggs, trampoline and mole visuals are drawn from the original level data and original PNG atlases.
- The 240×320 logical game viewport is preserved.
- The original Java ME control IDs are represented on touch: four directions, all three softkeys, `*` and `#`. Numeric keys 1–9 are not shown.

## What is still a port-in-progress
The original event/script interpreter, complete collision response, parallax/camera details, particles, RMS save format, original menus and MIDI playback are not yet fully ported. Terrain collision is an explicitly provisional first-pass solver; the original movement and jump constants/integration have been translated from the supplied 2.0.3 bytecode. The first level is playable as an engine foundation, but it is not yet a one-to-one finished remake.

Read `PORT_STATUS.md` and `reverse-engineering/BUILD_05_RLEF_AND_ENGINE.md` for the exact boundary. Run local validation with:

```sh
node tests/rlef-validation.cjs
node tests/input-map.test.cjs
node tests/physics.test.cjs
```
