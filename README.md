<div align="center">

# 🟠 BOUNCE TALES
### The classic bounce, rebuilt for the browser.

<p><a href="https://prasannaone.github.io/BounceTales/"><img src="https://img.shields.io/badge/▶_PLAY_BOUNCE_TALES-LAUNCH_THE_GAME-ff8b24?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Play Bounce Tales" /></a></p>

**🌐 Official playable site**  
### [prasannaone.github.io/BounceTales](https://prasannaone.github.io/BounceTales/)

<p>
  <img src="https://img.shields.io/badge/Release-V47-f97316?style=flat-square" alt="Release V47" />
  <img src="https://img.shields.io/badge/Platform-Web%20%2F%20PWA-0ea5e9?style=flat-square" alt="Web and PWA" />
  <img src="https://img.shields.io/badge/Runtime-HTML5%20%2B%20JavaScript-facc15?style=flat-square" alt="HTML5 and JavaScript" />
  <img src="https://img.shields.io/badge/Simulation-240%C3%97320-22c55e?style=flat-square" alt="240 by 320 simulation" />
  <img src="https://img.shields.io/badge/License-Sovereign%20Source%20v1.1-bc8cf2?style=flat-square" alt="Sovereign Source License v1.1" />
</p>

<img src="bounce-tales-web-preview.png" alt="Bounce Tales browser game preview" width="720" />

*An independent, source-informed browser reimplementation inspired by the classic J2ME game.*

</div>

---

## ✨ What is Bounce Tales?

Bounce Tales brings the familiar red bouncing hero and its platforming world to modern browsers. The project rebuilds the experience around a **240 × 320 logical game world**, original resource formats, a JavaScript gameplay engine, responsive browser controls, and installable PWA support.

The goal is not to turn the game into a generic platformer. It is to preserve the character of the original while making it practical to play on today's phones and computers.

> 📱 **Play instantly:** no app-store installation or account is required. Open the official site above in a supported browser.

## 🎮 Controls

| Action | Touch | Keyboard |
|---|---|---|
| Move left / right | Hold **◀** / **▶** | `A` / `D` or `←` / `→` |
| Jump / bounce | Hold **JUMP** | `Space` / `Enter` |
| Change unlocked form | Tap **`*` (form) button** | `Shift` / `Q` |
| Pause | Tap the in-game pause button | `Escape` |

Standard gamepads are supported when the browser exposes the Gamepad API. Touch controls can be moved and resized in **Settings → Customize touch controls**. Your layout is saved locally in that browser on that device.

## 🌟 Highlights

- 🕹️ **Original-scale simulation:** a logical 240 × 320 playfield, scaled to modern screens.
- 🧩 **Resource-aware engine:** reads the original RLEF level format and uses source-informed sprite and animation mappings.
- 🧭 **Campaign systems:** stage progression, checkpoints, collectibles, scripted events and level objects.
- 🪀 **Platforming systems:** fixed-step updates, collision handling, bounce physics, forms, enemies, water and springboards.
- 🎨 **Pixel-art presentation:** canvas rendering designed around crisp sprite presentation.
- 📳 **Phone-friendly controls:** touch, keyboard and supported gamepad input.
- 🛠️ **Live control editor:** reposition and resize the on-screen controls.
- 📦 **Installable PWA:** browser installation and a lightweight offline startup shell.
- 🔊 **Audio:** browser-based music and sound playback.

## 🚀 Play and install

1. Visit **[the official Bounce Tales site](https://prasannaone.github.io/BounceTales/)**.
2. Start the game and use the on-screen controls, keyboard, or a supported gamepad.
3. On a compatible browser, use its **Install app** or **Add to Home Screen** option to install the PWA.

The service worker requires HTTPS or `localhost`. The official GitHub Pages site is served over HTTPS.

## 🧑‍💻 Run locally

The game is a static web project. There is no build step or package installation required for normal play. Serve the repository over HTTP; opening `index.html` directly through `file://` is not supported.

With Python 3:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/>.

Any static HTTP server can be used.

## 🏗️ Project map

```text
BounceTales/
├── index.html                 Browser shell, metadata and interface
├── style.css                  Responsive layout and presentation
├── game.js                    Main state, game loop and rendering integration
├── sw.js                      Service-worker startup and runtime caching
├── manifest.webmanifest       PWA installation metadata
├── src/                       Gameplay and rendering modules
│   ├── bounce-physics.js      Player movement and bounce behavior
│   ├── fixed-point.js         Fixed-point arithmetic helpers
│   ├── game-timing.js         Fixed-step timing utilities
│   ├── rlef-reader.js         Original level-resource reader
│   ├── event-engine.js        Scripted event processing
│   ├── original-collision.js  Collision translation
│   ├── original-camera.js     Camera and world projection
│   ├── original-trampoline.js Springboard/trampoline behavior
│   ├── original-hud.js        HUD-related source mapping
│   ├── sprite-atlas.js        Sprite and animation lookup
│   └── audio-controller.js    Web Audio playback controller
├── assets/                    Runtime art, audio and game resources
├── reference/                 Decoded fixtures and reference metadata
├── reverse-engineering/       Research notes and recovered behavior
├── docs/                      Audits, implementation notes and guides
├── tests/                     Node.js regression and validation suite
├── tools/                     Resource inspection utilities
├── ARCHITECTURE.md             Engine architecture and boundaries
├── LICENSE                    Sovereign Source License v1.1
└── README.md                   This project guide
```

For a guided explanation of how the pieces fit together, read **[ARCHITECTURE.md](ARCHITECTURE.md)** and **[docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md)**.

## 🧠 How the browser port is structured

The browser shell loads the styles and JavaScript modules, then `game.js` coordinates the application lifecycle. Input is normalized, the simulation advances in fixed steps, gameplay systems update, the camera projects the world, and the renderer draws into the logical canvas.

| Layer | Main responsibility |
|---|---|
| Browser shell | Page, PWA metadata, responsive layout and input surfaces |
| Game coordinator | Application state, update/render orchestration and integration |
| Simulation | Fixed-step timing, fixed-point helpers, physics and collision |
| World systems | RLEF loading, scripted events, enemies, water and springboards |
| Presentation | Sprite atlas, animation, MIDP-style drawing, HUD and camera |
| Platform services | Audio, local settings, service worker and install metadata |

The port combines recovered source/resource facts with browser-specific implementation choices. It is **source-informed**, not a claim that every original handset behavior has a perfect one-to-one browser equivalent. See the architecture and reverse-engineering notes for the boundaries and evidence.

## 🧪 Tests and verification

The repository includes Node.js tests for resource parsing, physics, collision, level scripting, input, control layout, audio, menus, timing, PWA references and regression-sensitive behavior.

Run the CommonJS test files:

```bash
for test in tests/*.cjs; do
  node "$test" || exit 1
done
```

Run JavaScript syntax checks:

```bash
find . -name '*.js' -not -path './assets/*' -print0 |
  xargs -0 -n1 node --check
```

Run the Level 1 springboard proof and runtime smoke checks:

```bash
node tests/level1-springboard-proof.cjs
node tests/runtime-smoke.cjs
```

Automated checks are valuable regression guards, but passing them does not prove exhaustive visual or gameplay parity on every physical device. Real-device testing remains important, especially for touch behavior, browser viewport differences, audio policies and PWA installation.

## 📚 Documentation

| Document | What it covers |
|---|---|
| [Project guide](docs/PROJECT_GUIDE.md) | Features, runtime flow, controls, maintenance and release checklist |
| [Architecture](ARCHITECTURE.md) | Modules, simulation pipeline, resource flow and non-regression boundaries |
| [V47 visual-parity audit](docs/V47_FULL_VISUAL_PARITY_AUDIT.md) | Original-game UI/HUD findings and V47 changes |
| [Reverse-engineering method](docs/REVERSE_ENGINEERING_METHOD.md) | How the reference material is inspected and recorded |
| [Reference inventory](reference/README.md) | Decoded fixtures and reference-resource notes |
| [Reverse-engineering notes](reverse-engineering/BUILD_NOTES.md) | Implementation history, evidence and open caveats |
| [License and attribution](LICENSE) | Proprietary source terms and third-party exclusions |

The `docs/` and `reverse-engineering/` folders contain detailed, versioned notes. They are retained as a project record; an older document describes the state of its named development pass and should not be read as a claim that every later release has identical internals.

## ⚖️ License and original-game rights

The portions of this project authored by Prasanna are distributed under the **[Sovereign Source License v1.1](LICENSE)**. This is a **proprietary, source-available license**, not an open-source license. It allows limited personal, educational and noncommercial use under its terms; it does not grant general permission to republish, host, redistribute or monetise copies.

Original Bounce Tales artwork, sprites, animation, audio, music, fonts, level data, binary resources, names and marks are **not relicensed by this project license**. They remain subject to the rights of their respective owners. This is an independent project and is not affiliated with, sponsored by, or endorsed by Nokia or Rovio.

## 🔗 Project links

- 🌐 **Play:** [prasannaone.github.io/BounceTales](https://prasannaone.github.io/BounceTales/)
- 💻 **Source repository:** [github.com/PrasannaOne/BounceTales](https://github.com/PrasannaOne/BounceTales)
- 👤 **Creator:** [Prasanna One](https://github.com/PrasannaOne)

---

<div align="center">

**Made with care by Prasanna.** ❤️  
*Keep bouncing.*

</div>
