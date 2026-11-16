# Bounce Tales · Project Guide

> **Playable game:** https://prasannaone.github.io/BounceTales/  
> **Repository:** https://github.com/PrasannaOne/BounceTales  
> **Current runtime baseline:** V62

This guide is the practical entry point for understanding, running, testing and maintaining the current Bounce Tales browser reconstruction. It complements [`ARCHITECTURE.md`](../ARCHITECTURE.md) and the [V62 physics and collision audit](../V62_PHYSICS_COLLISION_AUDIT.md).

## 1. Project identity

Bounce Tales is an independent HTML5 reconstruction of the classic Java ME game, built using recovered original resources and decompiled J2ME bytecode as references. It targets modern mobile and desktop browsers while retaining a 240 × 320 logical game world and adapting input, layout, audio and installation to browser capabilities.

The project aims for a faithful, source-informed player experience. It does not claim complete one-to-one equivalence across every original handset, frame-timing pattern or possible gameplay state. Verified behavior, browser adaptations and open questions are recorded separately.

The project was developed through an Android-only workflow. This is part of its development history, not a runtime requirement: contributors can work from any environment with the tools listed below.

## 2. Runtime entry points

| File | Responsibility |
|---|---|
| `index.html` | Metadata, game canvas, game scenes, header, settings and touch editor |
| `style.css` | Responsive mobile/desktop shell, game frame, overlays and controls |
| `game.js` | Application state, lifecycle, main loop, input integration, rendering coordination and UI behavior |
| `sw.js` | Service-worker app shell and runtime resource caching |
| `manifest.webmanifest` | Install name, display mode, colors and icons |
| `package.json` | Node.js verification commands; no bundler is required for normal play |

Serve the repository root over HTTP(S). Opening `index.html` through `file://` does not provide the service-worker and origin behavior expected by the app.

## 3. Main source modules

| Module | Responsibility |
|---|---|
| `src/fixed-point.js` | Fixed-point arithmetic helpers |
| `src/bounce-physics.js` | Player movement, gravity, jump/bounce and form behavior |
| `src/original-collision.js` | Source-translated swept collision helpers and contact response |
| `src/terrain-collision.js` | Terrain geometry integration and overlap recovery |
| `src/rlef-reader.js` | Original RLEF resource decoding |
| `src/event-engine.js` | Campaign event scripts and command interpretation |
| `src/game-timing.js` | Fixed-step simulation clock and frame pacing support |
| `src/original-camera.js` | Camera/world transform behavior |
| `src/original-enemies.js` | Enemy state and interactions |
| `src/original-water.js` | Water interactions |
| `src/original-trampoline.js` | Springboard/trampoline lifecycle |
| `src/original-cannon.js` | Cannon behavior and shared resource use |
| `src/original-sprite-animation.js` | Source-informed sprite animation sequences |
| `src/sprite-atlas.js` | Sprite atlas and image mapping |
| `src/midp-graphics.js` | MIDP-style drawing compatibility helpers |
| `src/original-hud.js` | HUD rendering mappings |
| `src/original-progression.js` | Campaign progression and completion state |
| `src/audio-controller.js` | Music, sound cues, user-gesture unlock and page lifecycle |
| `src/control-layout.js` | Touch-control geometry, editor behavior and local persistence |
| `src/module-registry.js`, `src/port-engine.js` | Read-only module discovery interface |

## 4. Player-facing features

### Game and campaign

- 15 playable campaign stages, with chapter selection and progression.
- Original-style title, chapter book, pause, how-to-play and result screens.
- Checkpoints, collectibles, scripted events, enemies, water, springboards and cannon interactions.
- Original music playback with a user-facing toggle.
- Original bundled translations exposed through the language selector.

### Mobile and desktop controls

| Action | Touch | Keyboard |
|---|---|---|
| Move left/right | Hold left/right | `A` / `D`, arrow keys |
| Jump | Hold Jump | `Space` / `Enter` |
| Change unlocked form | Tap `*` | `Shift` / `Q` |
| Pause | On-screen pause control | `Escape` |

Supported gamepads are handled through the browser Gamepad API. Touch controls are dedicated left, right, jump and form buttons.

### Touch-control customisation

Open **Settings → Customize touch controls**. The editor exposes the actual gameplay buttons so they can be dragged to a preferred position. Select Left, Right, Jump or Form to change that button's size from 75% to 125%. Save keeps the layout, Cancel discards the editing session, and Reset restores the default geometry. The saved layout is local to that browser/device; it is not synced across devices.

The live controls and editor must continue to share `src/control-layout.js` and the `bounce-control-layout-v1` storage key. Avoid introducing separate coordinate calculations in CSS or `game.js`.

### Settings and header actions

- **Heart:** links to the PrasannaOne website. Ko-fi support is available directly from Settings → About.
- **Share:** uses the Web Share API when available and falls back to clipboard/manual copy. The shared URL is `https://prasannaone.github.io/BounceTales/`.
- **Settings → Game:** language, frame pacing (Auto/30/60/90/120), smooth motion, FPS counter, original music, fullscreen, reset progress and touch-control customisation.
- **Settings → About:** project and creator details, Telegram/GitHub links, Ko-fi support and the independence/rights notice.

The gameplay simulation remains fixed at 60 Hz. Frame pacing and smooth motion are presentation options; they must not change simulation step duration or physics outcomes.

## 5. Resources and research records

- `assets/original/`: original resource material bundled for the reconstruction, including binary resources, class files, images, MIDI data and localized text.
- `reference/`: decoded level fixtures, sprite/animation mappings, resource hashes and source-derived test data.
- `reverse-engineering/`: class maps, decompiled bytecode extracts, input traces, physics notes, resource-format analysis and research records.
- `docs/`: historical restoration audits, release records, architecture and methodology.

Keep original resources in place and preserve their relative paths. Do not silently replace original game art or resource IDs with newly drawn approximations. If a resource cannot be interpreted confidently, document the uncertainty rather than inventing semantics.

## 6. Physics and collision workflow

Physics and collision changes are high-risk because they affect the feel of every level. Before changing them:

1. Read `reverse-engineering/PLAYER_PHYSICS.md` and `reverse-engineering/BUILD_14_COLLISION.md`.
2. Read the current [V62 physics and collision audit](../V62_PHYSICS_COLLISION_AUDIT.md).
3. Identify whether the target behavior belongs to player physics, original collision translation, terrain integration or a browser fallback.
4. Add a focused regression fixture before changing behavior.
5. Compare with the original-runner where a source-grounded original execution path is available.
6. Run focused tests and the full available suite.

V62 measured short Level 1 opening, jump, left and right movement paths. The latest rerun recorded a maximum player-position deviation of 0.0117 logical pixels across those scenarios; the exact value varies slightly with original wall-clock frame deltas. It also corrected moving-contact position reconstruction. These measurements do not prove every campaign collision scenario; longer collision-heavy replays remain a documented follow-up rather than a release blocker for ordinary play.

## 7. Local development

Requirements:

- A modern browser for gameplay.
- Node.js 18 or later for the standard test suite.
- Python 3 for the simplest local static server.
- Java 21 with `jdk.compiler` for the original-JVM replay harness, when available.

Start a local server from the repository root:

```sh
python -m http.server 8000
```

Open `http://localhost:8000`.

No build or bundling step is required for normal browser play. The repository uses browser-native JavaScript modules/scripts and static resources.

## 8. Verification commands

```sh
npm run check                 # syntax-check JavaScript files
npm test                      # run the Node.js regression suite
npm run smoke                 # boot/play/pause smoke checks across all 15 RLEF stages
npm run proof:springboard     # focused Level 1 springboard lifecycle proof
npm run verify                # run the standard verification sequence
npm run verify:differential   # source-derived differential engine checks
npm run verify:original       # original JVM vs browser replay comparison
```

The original-runner needs Java 21 and `jdk.compiler`; it skips cleanly when that environment is unavailable. Its replay comparison uses original frame deltas and substep counts. The current V62 audit records the exact scenarios and limitations.

A verification command can fail because repository-owned helper files or CI workflows are absent from a supplied runtime-only archive. Do not silently remove or replace repository tests to make an imported runtime appear green. Restore the repository-owned files from the actual repository and report the exact result.

## 9. Release and deployment boundaries

- The website is a static site hosted on GitHub Pages.
- GitHub Actions import/deployment workflows are repository-owned and must be preserved when replacing runtime files.
- A runtime ZIP should not overwrite `README.md`, `ARCHITECTURE.md`, `LICENSE`, `.github/`, repository-only tests or historical documentation unless those changes are explicitly intended.
- For a runtime release, update the `sw.js` cache identity and the versioned script/style URLs in `index.html` together.
- Keep the manifest and icon paths valid.
- Preserve the touch-layout storage key unless a migration is deliberate and tested.
- Keep the canonical share URL consistent across metadata, brand navigation and share behavior.
- Verify the final deployed website on both a phone and a desktop browser.

## 10. Practical release checklist

- [ ] Confirm all intended campaign stages load and can be played.
- [ ] Check movement, jumping, landing, slopes and common terrain contacts.
- [ ] Check death/retry, checkpoint, pause/resume and chapter progression.
- [ ] Check touch buttons and the custom layout editor on a real phone.
- [ ] Check keyboard controls and a desktop layout.
- [ ] Check music toggle, language selection, fullscreen and progress reset.
- [ ] Check header heart, share action, About links and Ko-fi support destination.
- [ ] Run syntax, regression, smoke and springboard checks.
- [ ] Check service-worker update behavior after a runtime version change.
- [ ] Preserve repository-owned workflows, license, docs, tests and icons during ZIP import.
- [ ] Update the release notes and state tested/unverified areas honestly.

## 11. License and rights

The root `LICENSE` applies only to the portions authored by the project Licensor. It is a proprietary source-available license, not an OSI-approved open-source license. Original Bounce Tales names, code, artwork, music and other third-party materials are excluded from that grant and remain subject to their respective owners' rights and terms. This is an independent project and is not affiliated with Nokia or Rovio.
