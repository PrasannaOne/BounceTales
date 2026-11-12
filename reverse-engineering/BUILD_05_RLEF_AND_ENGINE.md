# Build 05 · RLEF level decoding and initial engine translation

## Supplied JAR facts

The original JAR identifies itself as Bounce Tales 2.0.3. Its resource map (`assets/original/a`) contains 110 resource records and 55 resource batches. Sixteen batches point to the resources `bf` through `bu`; these are not image dimensions or raw screen layouts. They are **RLEF level/object streams**.

RLEF structure used by the runtime:
- Big-endian magic `RLEF` (`0x524C4546`)
- Version word `0x00010000`
- 16-bit object count, reserved 16-bit field, 16-bit event count
- Records: signed 8-bit object command, signed 16-bit payload length, payload bytes
- Signed command 127 terminates the stream

Each object payload begins with the common object header: parent ID, previous-sibling ID, transform flags, local transform and object flags. The parser handles geometry, event, player, sprite, water, cannon, trampoline, egg, friend and enemy records, plus the root/base object.

### Verified level resource counts

| Resource | Chapter / level | Objects | Events |
|---|---|---:|---:|
| bf | Misty Morning | 101 | 6 |
| bg | Unfriendly Friends | 146 | 20 |
| bh | Seeking Answers | 159 | 17 |
| bi | Bumpy Cracks | 108 | 15 |
| bj | Secret Stalkway | 139 | 21 |
| bk | Into the Mines | 185 | 24 |
| bl | A Gloomy Path | 176 | 27 |
| bm | Rumbling Sounds | 173 | 32 |
| bn | Trapped in Machine | 189 | 48 |
| bo | Tunnel of Treasures | 256 | 47 |
| bp | Wicked Circus | 157 | 26 |
| bq | Hunting Colours | 160 | 15 |
| br | Almost There | 109 | 12 |
| bs | Final Ride | 56 | 0 |
| bt | Fantastic Fair | 113 | 6 |
| bu | Cannon object/tutorial resource | 13 | 0 |

The browser parser test reads every one of these original binary resources, confirms its declared object and event counts and resolves every parent transform. This does not mean that every level's gameplay logic has been ported.

## Misty Morning object records

`bf` parses to:
- 18 Geometry records
- 44 Sprite records
- 29 Egg records
- 6 Event records
- 1 Player record
- 1 Trampoline record
- 1 Enemy record
- 1 root/base record

The player transform resolves to (-1740, 918) world units. The level is no longer a hand-authored substitute: all triangles, scenery, eggs, trampoline and enemy placements originate in the original RLEF stream.

## Image resource mapping

The Java ME image resource loader has a map table with direct atlas regions and extended map entries. The new `src/image-map.json` is generated from the JAR resource table:
- 46 original PNG atlases are indexed in the same image-resource order.
- 540 image-map IDs are decoded.
- Direct maps are atlas crops with original width, height, origin and atlas coordinates.
- Compound maps retain their component offsets and child image IDs.
- Animated maps retain their frame-ID sequences.

The renderer in `game.js` implements these three forms and uses the original atlas files. Some original rendering details such as transform flags, offscreen buffering, frame timing and sprite-specific effects are still incomplete.

## Input mapping retained

The original key normalizer maps:
- MIDP UP/DOWN/LEFT/RIGHT to IDs 1/2/3/4
- Nokia softkey codes -7/-6/-5 to IDs 5/6/7
- `*` and `#` to IDs 20/21

The visible touch controller exposes those controls only. The number keys are intentionally omitted, but the normalization function still understands the numeric source IDs for JAR compatibility.

Observed gameplay dispatch in the original controller:
- Held LEFT and RIGHT call `moveLeft()` / `moveRight()`.
- Held UP or middle softkey calls `jump(false)` in normal play.
- Softkey RIGHT opens the pause menu.
- `*` calls `cycleForme()` in normal play.
- `#` and softkey LEFT remain mapped; the traced active-gameplay switch does not give them a direct player action.

## Player movement and jump translation

The key constants below were read directly from the supplied obfuscated 2.0.3 `c.class` static initializer (`javap -p -c`). They are also consistent with the publicly available 2.0.25 decompilation; the supplied JAR is the primary source for the values.

| Parameter | Bounce | Bumpy | Wolly |
|---|---:|---:|---:|
| Radius / dimension | 20 | 20 | 20 |
| Gravity multiplier | 1.0 | 1.4 | 0.5 |
| Surface friction | 0.6 | 0.3 | 0.6 |
| Ricochet factor | 0.1 | 0.1 | 0.1 |
| Horizontal acceleration | 500 | 350 | 312.5 |
| Maximum horizontal speed | 280 | 350 | 150 |
| Midair acceleration suppression | 1.5 | 2.5 | 1.2 |
| Jump acceleration | 288 | 255 | 162.5 |

Common base vertical gravity is -400. The game uses world units where 1 cm corresponds to 1 px. Jump is gated by the collision-surface cosine threshold `cos(55°)` and a grounded state. Mode cycling wraps over three forms but clamps to the forms unlocked by progression. At the start of Misty Morning only Bounce is unlocked.

`src/bounce-physics.js` translates the movement acceleration, velocity cap, jump gate, gravity integration and forme lock. The original torque/stretched-ball system is not fully translated.

## Collision and object interactions: explicitly provisional

The first terrain contact implementation operates on the original geometry contours. It selects a nearest segment, derives an outward normal from contour winding, corrects circle penetration, applies the original 0.1 ricochet factor, and uses a stable friction approximation. The original JAR's collision routine is significantly more complex: it registers multiple collision points, handles contact normals and slopes, computes friction and torque, and dispatches special object contacts. Therefore current collision behaviour must not be described as pixel-perfect or source-identical.

The first trampoline and mole handlers use source-derived dimensions, object IDs and initial states, but the full `BounceObject.checkCollisions` response path and every enemy state edge are still being refined. The six event records in `bf` are decoded and retained, not executed yet.

## Current runtime boundary

Build 05 loads and plays the first level as a real-data engine foundation. The next reverse-engineering passes should port:
1. Event command bytecode and the level event interpreter
2. Exact collision point/segment handling, contact friction, torque and special object response
3. Original camera, parallax, water surface and particle rendering
4. Level-specific menus, pause/results scenes, save records and progression
5. Music and sound triggers
6. Remaining fifteen level runtime variants and their object scripts
