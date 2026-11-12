<!-- Historical Build 04 note. Build 05 supersedes the live-site status and integrates real RLEF level data. See ../PORT_STATUS.md and BUILD_05_RLEF_AND_ENGINE.md. -->\n\n# Build 04: original input path integrated into the browser shell

## Exact Java ME input facts translated

The original `o.e(int)` normalizer maps Nokia key codes -7/-6/-5 to IDs 5/6/7, ASCII digits to IDs 10-19, `*` to 20, `#` to 21, and MIDP directional game actions to IDs 1-4. The original input state distinguishes held keys from newly pressed key edges.

Build 04 preserves these IDs and the held-versus-edge distinction. Its minimal touch controls are Left (held ID 3), Right (held ID 4), Action (held ID 1, an exact active-gameplay alias), Mode (`*`, edge ID 20), and Pause (Nokia key -7, edge ID 5). No full numeric keypad or `#` button is shown.

The actor method `c.f()` increments its mode index, wraps after 2, clamps against `m.a()`, then calls the actor reset/update method. Build 04 integrates the observed 0-2 cycle as an input event, but the original mode-specific actor effects are not yet ported.

## Important boundary

The training-stage world, player shape, movement, jump response, collisions, collectibles and goal are still provisional. The primary-action input uses the original normalized ID but the prototype interprets it as its placeholder jump. This is a genuine translation of the input boundary, not a full Java-to-JavaScript game-engine conversion. Next targets are actor update/collision code in `c`, shared entity/collision code in `j`/`d`, controller state machine in `m`, and RLEF resource decoding.
