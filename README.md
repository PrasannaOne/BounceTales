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
├── index.html              Application shell and PWA metadata
├── style.css               Responsive layout and visual styling
├── game.js                 Game loop, state, rendering and integration
├── sw.js                   Critical shell cache and on-demand asset cache
├── manifest.webmanifest    PWA metadata
├── src/                    Engine modules and shared control-layout geometry
├── assets/                 Original runtime resources and Web Audio files
├── reference/              Decoded sprite, animation and level fixtures
├── reverse-engineering/    Engine and resource research notes
├── docs/                   Reverse-engineering and release notes
├── tests/                  Node.js regression and validation scripts
├── tools/                  Reference inspection/generation utilities
├── LICENSE                 Sovereign Source License v1.1
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

The reimplementation code and supporting project work are governed by [`LICENSE`](LICENSE), the **Sovereign Source License v1.1**. It is proprietary and source-available, not an open-source license. Original Bounce Tales sprites, illustrations, audio, fonts, level data, binary resources, trademarks, and other materials originating from the J2ME game are excluded and remain subject to their respective rights holders.

### Touch control customization

Open Settings → Touch Controls to drag the Left, Right, Jump and Forme buttons or adjust the selected button's size. Save persists the layout on the current browser/device; Cancel or Escape restores the previously saved arrangement. The layout is retained across game releases through the stable `bounce-control-layout-v1` local-storage key.


## V37 responsive shell

The touch-control editor and live controls share a tested responsive geometry model. Hidden controls are not measured or assigned zero-sized styles; the live row is recalculated when gameplay reveals it and when the viewport changes. The service worker precaches only the critical startup shell and caches original sprites/audio as they are requested, avoiding a full asset download during first installation. The original 240×320 simulation canvas and gameplay update loop are unchanged.


## V40 original UI restoration

See [`docs/V40_ORIGINAL_UI_RESTORATION.md`](docs/V40_ORIGINAL_UI_RESTORATION.md) for the original JAR menu text, blocking story dialogue, language resources, challenge medals, and Node.js verification scope.



## V46 HUD and pause-menu visual correction

See [`docs/V46_HUD_MENU_VISUAL_AUDIT.md`](docs/V46_HUD_MENU_VISUAL_AUDIT.md). The gameplay HUD now follows the original J2ME sprite anchors and measured counter spacing, and the pause-menu focus row uses a clean MIDP-style rectangle instead of the unrelated striped sprite.

## V45 J2ME menu restoration

See [`docs/V45_J2ME_MENU_RESTORATION.md`](docs/V45_J2ME_MENU_RESTORATION.md). The menu presentation now uses square MIDP-style rows and original atlas decoration/highlight elements, with the existing localized text and menu actions retained.
