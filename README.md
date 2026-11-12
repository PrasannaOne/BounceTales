# Bounce Tales · V19 browser port

An independent HTML5 browser reimplementation of the original Bounce Tales 2.0.3 Java ME game, built from the supplied private Phase 2 reference archive and decoded game resources.

## Run locally

Serve this folder from a local HTTP server or deploy it to a static HTTPS host. The service worker and offline installation require a secure context (`https://` or `localhost`); opening `index.html` directly with `file://` is not supported.

For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## V19 changes

- Keeps the decoded 326-entry sprite atlas, the 1,143 decoded animation command sequences, all 16 parsed level resources, and the original soundtrack resources.
- Fixes the Level 1 grass springboard trigger ordering: the trampoline segment is checked before the terrain solver can change the incoming vertical velocity. The spring trigger uses the source segment-intersection model, integer Java period/frame division, and source launch-velocity caps.
- Gives the spring animation a finite watchdog and recovers a disabled player if a damaged or interrupted spring state is encountered.
- Adds explicit iteration limits to fixed-point square-root fallback, actor/terrain collision passes, and the recursive compound-sprite renderer.
- Paints the title, chapter book, high-score list, options, instructions, pause and chapter-complete scenes directly into the 240×320 game canvas. The game controls remain outside the canvas.
- Adds saved chapter progression and per-chapter egg/score/time records through localStorage.
- Improves mobile touch layout with additional space between the canvas and the control row, thumb-friendly separated controls, a slightly larger `*` button, safe-area handling, simultaneous pointer input, and a no-scroll document viewport. The canvas may shrink on compact displays to preserve the control area.
- Adds a web app manifest and a service worker that precaches the app shell and game resources for repeat offline use after the first successful online load.

## Controls

- Hold left/right to move.
- Hold JUMP to jump/bounce.
- Tap `*` to cycle an unlocked form.
- Tap the in-game pause control to pause.
- Keyboard: A/D or arrow keys to move, Space/Enter to jump, Shift/Q to change form, Escape to pause.
- Standard gamepads are supported where the browser exposes the Gamepad API.

## Regression tests

With Node.js installed, run:

```bash
for test in tests/*.cjs; do node "$test" || exit 1; done
```

The tests cover decoded resource structure, physics and collision modules, the springboard lifecycle and watchdog, all available stage resources, canvas menu wiring, simultaneous pointer-input cleanup and first-tap audio unlock, PWA file references and the responsive no-scroll layout. These are automated code/data regressions, not a full device-lab test or proof of byte-for-byte runtime equivalence to the original Nokia MIDP implementation.

## Accuracy and known limitations

V19 is a source-driven browser port, not a certified or pixel-identical 1:1 recreation. The main game resources and decoded animation descriptors are retained, and several gameplay systems have been translated from the private decompiled reference. Canvas menus are reconstructed from the available UI resources and source flow; they have not been verified pixel-for-pixel against every original Nokia handset. Some specialized enemy, trigger, score-tally, rendering and timing edge cases still require side-by-side play testing against the original JAR. Browser audio playback also differs from native MIDP audio behavior. Physical Android/iOS testing remains necessary.

## Intellectual property

The original Bounce Tales sprites, illustrations, audio, fonts, levels, resource data and related game materials are not relicensed by this project. They remain the intellectual property of their respective owners, including Nokia and/or Rovio as applicable. This project is independent and is not affiliated with, sponsored by, or endorsed by Nokia or Rovio. See [`LICENSE`](LICENSE) for the scope of the MIT license on the original reimplementation code only.
