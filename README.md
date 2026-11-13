# Bounce Tales

A browser-based HTML5 recreation of the classic Bounce Tales mobile platform game. The project uses the original game's resource formats and a source-informed JavaScript engine to reproduce its 240 × 320 gameplay world, pixel-art presentation, levels, objects, and audio.

This is an independent fan project. It is not affiliated with, sponsored by, or endorsed by Nokia or Rovio.

## Play and controls

The game runs in a modern browser on desktop and mobile.

| Action | Touch | Keyboard |
|---|---|---|
| Move left / right | Hold ◀ / ▶ | A / D or ← / → |
| Jump / bounce | Hold **JUMP** | Space / Enter |
| Change unlocked form | Tap **\*** | Shift / Q |
| Pause | In-game pause button | Escape |

Standard gamepads are supported when the browser exposes the Gamepad API. Touch controls can be customized in **Settings → Customize touch controls**; saved layouts are local to that browser/device.

## Run locally

The game must be served over HTTP. Opening `index.html` directly with `file://` is not supported. Service-worker installation and offline support require HTTPS or `localhost`.

With Python 3:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/>.

Any static web server can be used. No build step or package installation is required for normal play.

## Project structure

```text
.
├── index.html              Application shell and UI
├── style.css               Responsive layout and visual styling
├── game.js                 Main game loop, state, rendering and integration
├── sw.js                   Network-first service worker and offline shell
├── manifest.webmanifest    PWA metadata
├── src/                    Engine modules
│   ├── fixed-point.js       Fixed-point numeric helpers
│   ├── bounce-physics.js   Player physics and form behavior
│   ├── rlef-reader.js       Original level-resource parser
│   ├── event-engine.js      Scripted level events and triggers
│   ├── original-*.js        Source-informed gameplay systems
│   ├── midp-graphics.js     MIDP-style drawing compatibility
│   └── audio-controller.js Web Audio playback
├── assets/
│   ├── original/            Original game resource files used at runtime
│   └── audio/               Music and sound resources
├── reference/               Decoded sprite/animation and level fixtures
├── reverse-engineering/     Engine and resource research notes
├── docs/                    Reverse-engineering methodology
├── tests/                   Node.js regression and validation scripts
├── tools/                   Reference inspection/generation utilities
├── LICENSE                  Project license and third-party-material scope
└── .github/                 Repository automation/configuration
```

The original RLEF level resources in `assets/original/` are the runtime source for level geometry and event data. The reference fixtures are retained for validation and research.

## Tests and maintenance

Node.js is used for the repository's headless regression checks. To run the full suite:

```bash
for test in tests/*.cjs; do node "$test" || exit 1; done
```

To check JavaScript syntax without running gameplay tests:

```bash
find . -name '*.js' -not -path './assets/*' -print0 |
  xargs -0 -n1 node --check
```

The tests exercise resource parsing, physics/collision, level scripting, input, UI logic, audio-controller behavior, and PWA references. Passing automated checks does not establish exhaustive completion of every stage or guarantee identical behavior on every physical device.

## License and original game materials

The reimplementation code and supporting project work are governed by the terms in [`LICENSE`](LICENSE), the **Sovereign Source License v1.0**. Read that file before copying, modifying, hosting, or redistributing this project. In particular, public network hosting has attribution and source-availability conditions, and commercial use requires separate permission.

The original Bounce Tales sprites, illustrations, audio, fonts, level data, binary resources, trademarks, and other materials originating from the J2ME game are not relicensed by this project. They remain the property of their respective rights holders, including Nokia and/or Rovio as applicable.
