# Bounce Tales · Build 05 port status

## Actual game code now present
- Replaced the hand-made training course, fabricated platform array, six invented collectibles and finish flag with the original first level resource `assets/original/bf` (Misty Morning).
- Implemented a JavaScript RLEF reader and parent-transform resolver. All 16 RLEF level resources from the supplied JAR parse and pass object/event-count and transform-tree validation.
- Parsed the original resource table and 540 image-map IDs. Browser renderer supports simple atlas crops, compound maps and animated maps from the original 46 PNG atlases.
- First level runtime builds real geometry, sprites, eggs, player start, trampoline and mole objects from JAR records.
- Ported source-derived BounceObject movement/jump constants and integration from the supplied 2.0.3 `c.class` bytecode. The values are documented in `reverse-engineering/BUILD_05_RLEF_AND_ENGINE.md`.
- Added a first-pass terrain-contact solver against actual RLEF geometry contours. It is useful for iterative play testing but is not yet the original collision routine.
- Added an initial mole state cycle and trampoline bounce sequence based on the decompiled object behaviour. Contact response and edge cases remain approximate.

## Touch and keyboard controls
The visible control pad intentionally omits numeric 1–9. It retains the original functional set:
- D-pad: Up, Down, Left, Right
- Nokia softkeys: Left (`L`), Middle (`OK`), Right (`R`)
- Special keys: `*` and `#`

Original IDs are retained: UP=1, DOWN=2, LEFT=3, RIGHT=4, softkeys=5/6/7, `*`=20, `#`=21. `R`/ID 5 pauses active play; `*`/ID 20 invokes the original forme-cycle path, with the original progression lock (only Bounce forme is unlocked at the start). UP and middle softkey are the source-backed jump/action holds. `#` and left softkey are preserved and forwarded for the menu/controller layer; the traced active-game branch does not assign them a gameplay action.

## Verified original first-level structure
`bf` / Misty Morning:
- 101 records total
- 18 Geometry, 44 Sprite, 29 Egg, 6 Event
- 1 Player, 1 Trampoline, 1 Enemy, 1 root record
- Player spawn world position: (-1740, 918)

## Still not complete
- RLEF event-command interpreter and level-specific event execution
- Exact full `GameObject` collision solver, collision-point/normal selection, contact friction and special surface/object response
- Full player stretch/torque visuals and animated eye/state system
- Correct original world camera/parallax and all background transition details
- Cannon mode, all enemy types and all object-specific interactions
- Title, chapter selection, pause/confirm and results layouts from original UI data
- RMS save/progression/challenge logic
- MIDI music and sound effect triggers
- Runtime selection/playability for all 16 level resources (the parser validates all; the gameplay runtime currently loads Misty Morning only)

No fake completion trigger is included. Event-driven doors, chapter progression and level-complete states will arrive when their original event commands are translated.

## Validation
- `tests/rlef-validation.cjs`: all 16 JAR RLEF resources parse; declared object and event counts match; parent transforms resolve.
- `tests/input-map.test.cjs`: key IDs, softkeys, D-pad, `*`, `#`, and second input profile mappings.
- `tests/physics.test.cjs`: source-derived acceleration, jump gate, and forme progression lock.
- Browser smoke test: first-level data loaded, START enters gameplay, no console/page errors, original atlas sprites render.
