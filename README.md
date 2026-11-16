<div align="center">

# 🟠 Bounce Tales

<p>
  <a href="https://prasannaone.github.io/BounceTales/"><img src="https://img.shields.io/badge/▶_PLAY_NOW-OPEN_BOUNCE_TALES-ff8b24?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Play Bounce Tales" /></a>
</p>

**[Play Bounce Tales](https://prasannaone.github.io/BounceTales/)** · **[Source repository](https://github.com/PrasannaOne/BounceTales)**

<p>
  <img src="https://img.shields.io/badge/Release-V62%20Final-f97316?style=flat-square" alt="V62 Final Edition" />
  <img src="https://img.shields.io/badge/Platform-Mobile%20%26%20Desktop-0ea5e9?style=flat-square" alt="Mobile and desktop" />
  <img src="https://img.shields.io/badge/Runtime-HTML5%20%2B%20JavaScript-facc15?style=flat-square" alt="HTML5 and JavaScript" />
  <img src="https://img.shields.io/badge/Original%20basis-J2ME%20bytecode%20%2B%20assets-8b5cf6?style=flat-square" alt="Original J2ME bytecode and assets" />
  <img src="https://img.shields.io/badge/License-Source--available-bc8cf2?style=flat-square" alt="Source available license" />
</p>

<img src="bounce-tales-web-preview.png" alt="Bounce Tales running in a modern browser" width="760" />

*The little red ball is back. Play in a modern browser, on a phone or a computer.*

</div>

---

## What is Bounce Tales?

Bounce Tales is an independent HTML5 reconstruction of the classic Java ME platform game. The browser version is built from recovered original game resources and decompiled J2ME bytecode, with the original campaign data, visual identity and gameplay systems used as the reference.

The goal is simple: bring the familiar adventure back to players while making it comfortable on today's devices. The game keeps its original 240 × 320 logical playfield and adapts the surrounding experience for responsive screens, touch input, keyboard and gamepads. It is a source-informed reconstruction, not a claim of perfect device-by-device J2ME equivalence.

**No account or installation is required to play:** open the [game website](https://prasannaone.github.io/BounceTales/) and start playing.

## Play

| Action | Phone / tablet | Desktop |
|---|---|---|
| Move | Hold **◀** / **▶** | `A` / `D` or `←` / `→` |
| Jump | Hold **JUMP** | `Space` / `Enter` |
| Change unlocked form | Tap **`*`** | `Shift` / `Q` |
| Pause | On-screen pause button | `Escape` |

Standard gamepads are supported when the browser exposes the Gamepad API. The on-screen controls remain available on touch devices and can be customised in Settings.

## Made for phones and computers

- **Responsive play area:** the original 240 × 320 game world scales to portrait, landscape and desktop layouts.
- **Touch controls:** dedicated left, right, jump and form buttons, with touch-friendly hold behaviour.
- **Personal control layout:** open **Settings → Customize touch controls** to drag the actual buttons, select a button and resize it from 75% to 125%, then save, cancel or reset the layout. The saved layout stays in that browser on that device.
- **Keyboard and gamepad:** play without touch controls on a computer or with a supported controller.
- **Fullscreen:** available from the Game settings panel where the browser supports it.
- **Frame presentation options:** Auto, 30, 60, 90 or 120 FPS presentation targets, optional render interpolation, and an FPS counter. The gameplay simulation remains fixed at 60 Hz.
- **Music toggle:** turn the original soundtrack playback on or off.
- **Language selection:** choose from the original bundled translations, or follow the device language when available.
- **Progressive Web App (PWA):** the project includes a web app manifest, app icons and a service worker. On supported browsers, install Bounce Tales to the phone home screen or desktop app launcher and open it in a standalone window. Ordinary browser play remains available.
- **Repeat-visit caching:** the service worker caches the app shell and resources as they are used, helping repeat visits load faster and allowing some previously cached content to remain available offline. Offline completeness depends on which resources have already been cached; the first visit requires an internet connection.

## The game

- **15 playable campaign stages**, with chapter selection and progression.
- Original RLEF level resources and recovered sprite, animation and audio mappings.
- Checkpoints, collectibles, scripted events and chapter completion flow.
- Bounce movement, forms, terrain contacts, enemies, water, springboards and cannon interactions.
- Original-style title, chapter book, pause, guide and result screens.
- Local progress and touch-layout preferences stored in the browser.

## The current build: V62 Final Edition

V62 is the planned final feature release: a complete, playable browser reconstruction with the current physics and collision improvements, recovered campaign content and modern controls. The project moves to maintenance mode after this release. Further changes should be limited to genuine bugs, compatibility fixes, security issues and essential browser/platform updates rather than an open-ended version chase.

- The original game classes can be run in a headless JVM through a small MIDP/Nokia API compatibility layer. The original bytecode is not modified by this harness.
- The browser port can be replayed using the original run's frame deltas and physics substep count.
- Short Level 1 comparisons cover the opening, a short jump, left movement and right movement. In the latest recorded rerun, the maximum player-position deviation across those scenarios was 0.0117 logical pixels; the exact value varies slightly with the original game's wall-clock frame deltas.
- The original collision translation uses fixed-point arithmetic and `BigInt` intermediates for the swept edge and endpoint intersection helpers, contact selection and surface-relative response.
- V62 corrects moving-contact position reconstruction so the corrected actor transform does not double-count tangential platform movement or the normal displacement.
- The project includes 600,816 bit-exact differential comparisons for fixed-point, transform and event-script operations, plus physics, collision, terrain and campaign-spawn regression tests.

These results are meaningful but bounded. They do not establish exhaustive collision parity across every level, device timing pattern or combination of moving objects. See the [V62 physics and collision audit](V62_PHYSICS_COLLISION_AUDIT.md) for measurements, commands and remaining gaps.

## The interface

The game screen keeps its focus on the playfield. The compact header provides:

- **Heart:** opens the project's Ko-fi page directly. The About panel also contains the support link and project information.
- **Share:** opens the device share sheet where available, with a copy fallback, using the canonical game URL.
- **Settings:** opens the Game and About panels.

The **Game** panel contains language, frame pacing, smooth motion, FPS counter, original music, fullscreen, reset progress and touch-control customisation. The **About** panel contains project/creator links, the Ko-fi support link and the independence/rights disclaimer. The header heart now opens the project's Ko-fi page directly, so support is easy to find without interrupting play.

## Install Bounce Tales (PWA)

Bounce Tales can be installed where the browser supports Progressive Web Apps. The site must be served from a secure HTTPS origin (or localhost for development).

- **Android (Chrome and compatible browsers):** open the game website, open the browser menu, then choose **Install app** or **Add to Home screen** when offered. The wording varies by browser and device.
- **Desktop (Chrome / Edge):** open the game website and use the install icon in the address bar, if shown, or choose **Install Bounce Tales** from the browser menu.
- **iPhone / iPad (Safari):** use **Share → Add to Home Screen** where available. Installation and standalone behaviour can differ from Chromium browsers.

The manifest supplies the app name, icons, theme and standalone display preference. The service worker caches the core app shell and caches additional same-origin resources as they are requested. This improves repeat visits and can provide partial offline access after resources have been cached; it is not a guarantee that every level, sound or asset is available offline after a first visit.

## Run locally

The game is a static browser project. You do not need a bundler to play it. Serve the repository root over HTTP rather than opening `index.html` directly, because service workers and some browser resource APIs require an HTTP(S) origin.

With Python installed:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

For the Node.js checks, use Node.js 18 or later:

```sh
npm run check
npm test
npm run smoke
npm run proof:springboard
```

The combined command is:

```sh
npm run verify
```

Additional source-comparison commands:

```sh
npm run verify:differential
npm run verify:original
```

`verify:original` needs Java 21 with `jdk.compiler` and the original-runner support files. It skips cleanly when the required Java environment is unavailable. Individual test commands and their scope are described in the [Project Guide](docs/PROJECT_GUIDE.md).

## Project map

| Path | Purpose |
|---|---|
| `index.html` | Browser shell, game canvas, menus, settings and touch editor |
| `style.css` | Responsive layouts, game presentation and interface styling |
| `game.js` | Application lifecycle, game loop, input integration, scenes and rendering coordination |
| `src/bounce-physics.js` | Player movement and bounce physics |
| `src/original-collision.js` | Source-informed original collision routines and contact response |
| `src/terrain-collision.js` | Terrain collision integration and fallback handling |
| `src/fixed-point.js` | Fixed-point arithmetic helpers |
| `src/rlef-reader.js` | Original RLEF resource reader |
| `src/event-engine.js` | Scripted event and command interpreter |
| `src/control-layout.js` | Shared touch-control geometry and persistence |
| `src/original-*.js` | Reconstructed camera, enemies, water, trampoline, cannon, HUD, progression and animation systems |
| `assets/original/` | Bundled original game resources used by the reconstruction |
| `reference/` | Decoded resource fixtures, inventories and source-derived reference data |
| `reverse-engineering/` | Decompiled class notes, bytecode extracts, resource analysis and research records |
| `tests/` | Regression and behavior tests |
| `tools/` | Verification, replay and development utilities |
| `docs/` | Project, architecture, release and fidelity documentation |

## Documentation

- [Architecture](ARCHITECTURE.md): runtime flow, engine boundaries, collision model, responsive shell and controls.
- [Project Guide](docs/PROJECT_GUIDE.md): modules, development workflow, commands and release checklist.
- [Reverse-engineering method](docs/REVERSE_ENGINEERING_METHOD.md): how the original resources and code are examined.
- [Engine porting guide](docs/ENGINE_PORTING_GUIDE.md): module boundaries and reusable port-engine interface.
- [V62 release notes](docs/V62_RELEASE_NOTES.md): concise release summary and player-facing feature inventory.
- [V62 physics and collision audit](V62_PHYSICS_COLLISION_AUDIT.md): measured original-vs-port runs, collision correction and remaining work.
- [Historical audits](docs/): versioned restoration, source-parity and release records. Earlier version documents are retained as historical evidence, not as the current release description.

## Credits and rights

Created by **Prasanna**. The project is an independent, unofficial reconstruction and is not affiliated with Nokia or Rovio. Bounce Tales names, original game assets, music and other original materials remain the property of their respective owners. The project's own source is governed by the root `LICENSE`; it is source-available under the stated terms and is **not** an OSI-approved open-source license. See the full license and rights notice before reuse or redistribution.

If you enjoy playing, use the **heart button in the top header** or the **Support Bounce Tales** link in **Settings → About** to visit [Ko-fi](https://ko-fi.com/prasannaone). Support is optional; the game can be played without an account or payment. Your support also helps explore future restorations of other mobile classics, potentially including **Diamond Rush** and **City Bloxx**.
