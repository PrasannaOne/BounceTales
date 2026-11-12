# Original input path (bytecode-verified)

This file records the input path recovered from the supplied `Bounce Tales` JAR. The original class names are obfuscated, so method/class identifiers are retained exactly rather than guessed.

## 1. Operating-system input arrives at `o`

- `o` extends `javax.microedition.lcdui.game.GameCanvas` and implements `Runnable` and `CommandListener`.
- Its constructor calls `GameCanvas.<init>(false)`, then it overrides `keyPressed(int)` and `keyReleased(int)`.
- `keyPressed(code)` calls `o.d(code, 9)`; `keyReleased(code)` calls `o.d(code, 10)`.
- The second argument uses bit 8 for normalization, bit 1 for key-down and bit 2 for key-up.
- `o.e(int)` converts platform key values to internal integer IDs.

## 2. Exact normalization in `o.e(int)`

| Source key/action | Internal ID |
|---|---:|
| Nokia key code `-7` | 5 |
| Nokia key code `-6` | 6 |
| Nokia key code `-5` | 7 |
| ASCII `0` through `9` | 10 through 19 |
| ASCII `*` | 20 |
| ASCII `#` | 21 |
| MIDP `UP` action (1) | 1 |
| MIDP `DOWN` action (6) | 2 |
| MIDP `LEFT` action (2) | 3 |
| MIDP `RIGHT` action (5) | 4 |
| Other game actions, including MIDP `FIRE` (8) | -1 (ignored by this mapping) |

This is not a guessed Java ME mapping: it is the actual switch table in `o.e(int)`. `o.a(int)` tests a normalized ID against the current held-key bitmask.

## 3. A second key profile exists

When the runtime input profile field `o.t` equals 2, `o.d(int,int)` remaps these normalized numeric keys:

| Physical keypad key | Before remap | After remap |
|---|---:|---:|
| `2` | 12 | 1 (UP) |
| `4` | 14 | 3 (LEFT) |
| `5` | 15 | 7 (select alias) |
| `6` | 16 | 4 (RIGHT) |
| `8` | 18 | 2 (DOWN) |

`o.t` is initialized to 1. The game-controller menu setup calls `o.d(2)`, which clears the held state and selects profile 2. Do not assume this numeric layout is the active gameplay touch layout.

## 4. What gameplay actually polls

The main controller `m` has a per-frame method `a(int)`. In its active gameplay state (`m.i == 4`) it queries `o.a(int)` for held normalized IDs:

- `3` invokes `c.b()` on the main actor.
- `4` invokes `c.c()` on the main actor.
- If any of `15`, `12`, `1`, or `7` is held, it invokes `c.a(false)`.

Thus the exact code proves left/right and a primary actor-action path. The actor-action method is obfuscated; bytecode alone does not name it “jump”, so this report deliberately calls it **primary actor action** until its motion effect is fully traced.

## 5. Discrete gameplay keys

The separate key-event handler `m.b(int)` contains active-gameplay cases:

- Internal ID `5` sets a transition flag. The next controller update requests `m.g(25)`.
- `m.g(25)` builds the pause menu. The original language file `lang.xx` resolves string ID 83 to `Pause menu`; other strings in this menu resolve to `Resume`, `Restart chapter`, and `Chapter selection`.
- Internal ID `20` (`*`) conditionally invokes `c.f()`. `c.f()` advances the actor's mode index `c.d` through 0, 1, 2, wraps, and clamps against `m.a()`.
- Internal ID `21` (`#`) is not consumed by the active gameplay polling/dispatch branches traced here. It may still serve another menu/text/platform path.

## 6. Minimal mobile touch-control implication

A future HTML touch overlay does not need a full `1–9` phone keypad. The source-backed minimum to recreate the active game controls is:

- Left (internal 3), held.
- Right (internal 4), held.
- Primary action (use the UP alias, internal 1), held.
- Mode cycle (internal 20, original `*` event), tapped.
- Pause menu (internal 5, original Nokia code `-7`), tapped.

The original game accepts other aliases for its primary actor-action routine, listed above. The touch buttons should send the same normalized IDs and preserve press/release semantics.

## Evidence locations

- `bytecode/o.txt`: `e(int)`, `d(int,int)`, `a(int)` input-state test, `keyPressed(int)`, `keyReleased(int)`, and run loop.
- `bytecode/m.txt`: `a(int)` active gameplay polling, `b(int)` discrete key events, `g(int)` menu builder.
- `bytecode/c.txt`: actor movement/action methods and `f()` mode-cycle method.
- `input-map.json` and `../src/original-input-map.js`: machine-readable mapping and reusable implementation.
