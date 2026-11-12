# Runtime and input call flow

The following sequence is visible directly in `RMIDlet`, `o` and `m` bytecode.

```text
RMIDlet.startApp()
  └─ o.h(1)
       ├─ constructs the GameCanvas instance `o`
       └─ starts its Runnable thread
            └─ o.run()
                 ├─ makes the canvas current/full-screen
                 ├─ creates the main controller `m`
                 ├─ initializes resources and display state
                 └─ loops through input, update and render work
```

## Lifecycle

- `RMIDlet.startApp()` checks/sets the MIDlet reference in `o` and calls `o.h(1)` to start the runtime.
- `RMIDlet.pauseApp()` calls `o.h(2)` and then `notifyPaused()`.
- `RMIDlet.destroyApp(boolean)` calls `o.a()` to shut down.
- `o.h(1)` creates a new `o` `GameCanvas` and starts a `Thread` using it as the `Runnable`.
- `o.run()` obtains the display, sets the canvas current, enables full-screen mode, creates `m`, initializes runtime resources and enters the main loop.

## Input/update pipeline

1. `o.keyPressed(int)` and `o.keyReleased(int)` enter `o.d(int,int)` with distinct down/up flag values.
2. `o.d` normalizes the platform key, records press/release state in internal arrays/bitmasks and queues discrete key presses.
3. The frame/update method `o.k()` drains the queued key IDs and sends each to `m.b(int)`.
4. It merges the current held-key bitmasks into `o.w` and clears the edge/transition accumulator.
5. It calls `m.a(int)` repeatedly for the update steps in the frame. The controller reads held keys through `o.a(int)`.
6. During active gameplay, `m.a(int)` sends directional and primary-action calls to the actor instance `c`.

This distinction matters: the original game has both **edge-triggered key events** (used for pause and mode-cycle) and **held-key state** (used for continuous movement/action). A mobile touch implementation should preserve both press and release, not just fire a one-shot click.

## Rendering/resources

- `o.paint(Graphics)` delegates to the runtime's internal graphics path.
- The display loop calls the controller's update/render flow; `m` owns the high-level scene and menu state.
- `o` creates a 46-entry `Image[]` for game image resources; the archive has 47 PNGs including `icon.png`.
- `o` uses Java ME `Manager.createPlayer(InputStream, String)` and owns two `Player` references.
- `o` calls RMS `RecordStore` APIs for persistent byte records.

## Pause menu verified from localized strings

The `m.g(25)` state builder requests language resource IDs that resolve in `lang.xx` to:

- ID 83: `Pause menu`
- ID 38: `Resume`
- ID 37: `Restart chapter`
- ID 39: `Chapter selection`

The same state also sets its soft-key labels using IDs 48 (`Select`) and 47 (`Quit`). This confirms that the input code `5` reached from the Nokia-specific key code `-7` is the pause-menu path, not a guessed star/hash mapping.
