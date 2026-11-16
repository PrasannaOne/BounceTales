# original-runner

Runs the **original Bounce Tales bytecode** (`assets/original/*.class` + resources) headless in a
JVM, using ~20 tiny stub classes for the phone APIs (`stubs/`: screen, sound, record store,
Nokia UI). `OriginalRecorder` hooks `GameCanvas.flushGraphics()` (called on the game thread after
every world update) to log, per frame: the millisecond delta (`o.a`), the sub-step count (`o.j`,
2 in play), the player's matrix translation, its float state and the event variables `g.a[0..6]`.
It can also inject key presses on a schedule (`-Dsched=frame:keycode:1|0,...`).

`node tools/original-runner/replay-compare.cjs` records the opening of level 1 with no input and
replays the identical deltas through the port's own `update()`.

`tools/original-runner/replay-input-compare.cjs` repeats the comparison with scheduled Java ME
key events. Set `SCHEDULE='20:-5:1,21:-5:0'` (and optionally `FRAMES=45`) to select the
frame/key/down-up schedule. The comparator applies each event after the matching frame on both
sides, because the original recorder hook runs after that frame's world update. This keeps input
timing aligned and avoids a false one-frame mismatch.

Needs Java 21 with `jdk.compiler`; prints `SKIPPED` otherwise. Known open items are listed in
`V62_PHYSICS_COLLISION_AUDIT.md`.
