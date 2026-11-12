# Build 09 · original RLEF event scripting

## Exact source evidence

The supplied Bounce Tales 2.0.3 JAR contains `g.class`. Its `javap -c -p` output is preserved at `reverse-engineering/bytecode/g.txt`. The class extends the shared scene object class `j`, parses a trigger rectangle and nested byte arrays, and its event execution method contains a `tableswitch` covering opcodes **0 through 32**. `g.class` is the event object/interpreter, not a generic scenery record.

The original stage records are RLEF command type 6. Each event stores:

- local bounding rectangle (`minX`, `maxY`, `maxX`, `minY`)
- initial state: waiting (0), terminated (1), active (2), paused (3)
- trigger on entering or leaving the area
- repeatable flag
- trigger object ID (`100` is the Misty Morning player)
- an ordered list of event command byte arrays

The readable `HelloOO7/BounceTales` decompilation was used to clarify complex handler flow, but that public repository targets 2.0.25. The supplied 2.0.3 `g.class` switch and the user's own RLEF/language resources remain the version-specific evidence.

## Opcode map implemented in `src/event-engine.js`

| Opcode | Behaviour translated |
|---:|---|
| 0 | Show a localized field message using the script-message index |
| 1 | Start a sprite's original event animation mapping |
| 2–5 | Terminate, cancel/reset, start or pause another event |
| 6 | Wait for a millisecond countdown |
| 7–11 | Set/add/subtract/multiply/divide integer or float event variables |
| 12–15 | Conditional branches: not-equal, equal, greater/equal and less/equal |
| 16 | Move an object by fixed-point speed for a timed duration |
| 17 | Rotate an object's matrix over a timed duration from its stored starting matrix |
| 18 | Set an object's position or copy a source object's world position |
| 19 | Attach an object to a new parent |
| 20 | Detach to the dummy root without rewriting its local matrix |
| 21 | Unconditional branch |
| 22 | No operation |
| 23 | End the current script |
| 24 | Wait until the actor is no longer within the event area |
| 25 | Save the event object's world position as the checkpoint |
| 26–28 | Apply push, gravity or velocity changes to the player actor |
| 29 | Update object flags (including depth, collision and visibility flags) |
| 30 | Change camera target |
| 31 | Set camera parameters |
| 32 | Restore default camera parameters |

The interpreter uses the original event state values and millisecond deltas. It rebuilds world matrices after scripted hierarchy or transform changes and refreshes the level's transformed geometry/visibility/collision state. Scene drawing also reads the runtime z-coordinate bits from each object's flags, so scripted depth changes update the visible order of scenery and the player.

## Original sprite event animations

The supplied `g.class` command-1 handler and `r.class` sprite code identify three source image IDs and their animation maps:

| Sprite image ID | Animation map ID | Timer | Frames |
|---:|---:|---:|---:|
| 118 | 485 | 9999 ms (loop) | 4 |
| 334 | 474 | 750 ms, then 1500 ms fade-in | 5 |
| 342 | 480 | 9999 ms (loop) | 4 |

The original sprite animation frame interval is 150 ms. This mapping and timer logic is in `src/original-sprite-animation.js`. Misty Morning's autostart event requests animation of object 76, whose original sprite uses image ID 342, so the map changes to the original animated map 480.

## Misty Morning event evidence

`bf` contains 101 objects and six event objects. Two real stage paths are covered by the test suite:

- **Event 99**, initial active/autostart: starts the image animation for object 76, changes object flags, waits, then displays localized story messages 58, 59 and 60.
- **Event 94**, triggered when player object 100 enters its event area: updates object flags, detaches objects 77 and 76, waits, then displays localized story messages 65, 66 and 67. It terminates after its one-shot script.

`lang.xx` contains 91 indexed strings. The browser runtime decodes this resource and displays script messages with a simple overlay. The messages are the original localized text; the overlay layout is not yet the original Java ME field-message UI.

## Test coverage

- `tests/event-engine.test.cjs` runs the real `bf` autostart event and confirms its message sequence, animation request and reset/replay behaviour.
- The same test enters the real event-94 trigger region and checks the three story messages, object detach semantics and flag result.
- Synthetic checks cover event entry, integer variables, timed rotation and checkpoint position.
- `tests/original-sprite-animation.test.cjs` checks the source image-to-animation mapping, 150 ms frame timing and finite fade sequence.
- `tests/runtime-smoke.cjs` loads the event engine and sprite animator with the browser game, boots Misty Morning and starts the display-driven loop.

## Remaining caveats

The interpreter command set is implemented, but not every opcode has a live stage path in Misty Morning. Commands involving the full original scene graph, native message UI, some object-specific animation hooks and camera spring model still need side-by-side checks against the 2.0.3 runtime. Trigger-area intersection and event-24 actor-gone checks are simplified browser equivalents. All 16 level resources still parse, but only Misty Morning is wired into playable gameplay. This work is not a claim of complete one-to-one parity.
