# Bounce Tales architecture

> **Playable game:** https://prasannaone.github.io/BounceTales/  
> **Repository:** https://github.com/PrasannaOne/BounceTales  
> **Current documented runtime:** V62

This document describes the current browser reconstruction, its relationship to the original J2ME game, the main runtime boundaries and the rules that should be preserved during maintenance. For practical setup and release steps, see [`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md). For measured physics/collision evidence, see [`V62_PHYSICS_COLLISION_AUDIT.md`](V62_PHYSICS_COLLISION_AUDIT.md).

## 1. Project shape

Bounce Tales is a static HTML5/JavaScript reconstruction informed by the original game's decompiled Java ME bytecode and recovered resources. The logical game world remains **240 × 320**. The browser shell scales that world to mobile and desktop viewports without feeding CSS dimensions back into the simulation.

The project deliberately separates three concerns:

1. **Original-game model:** recovered resources, level records, sprite mappings, event commands and source-informed engine behavior.
2. **Browser runtime:** simulation, collision, event processing, camera, rendering, audio and progression.
3. **Modern presentation:** responsive page shell, touch/keyboard/gamepad input, settings, sharing and installable-web-app integration.

This is a faithful, source-informed reconstruction, not a claim of complete device-specific J2ME equivalence. Where the browser must adapt timing, input, rendering, audio or lifecycle behavior, the relevant documentation records that boundary.

## 2. Runtime flow

`index.html` loads the document shell, styles, engine modules and `game.js`. The application coordinator owns the game state and connects input, simulation, event scripts, camera, drawing, progression and audio.

A typical active frame follows this order:

1. Collect and normalize touch, keyboard and supported gamepad input.
2. Advance the fixed-step simulation clock.
3. Update player movement and physics.
4. Resolve terrain and object contacts, then update enemies, water, springboards and other world systems.
5. Process scripted events and their control/message state.
6. Update camera projection and render the logical scene.
7. Apply audio cues, score/time updates and progression effects.

Pause, blocking dialogue and scripted control modes can suspend or restrict parts of gameplay. Rendering presentation may be paced independently, but the gameplay simulation remains fixed at 60 Hz.

## 3. J2ME-to-browser mapping

| Original game responsibility | Browser implementation |
|---|---|
| MIDlet lifecycle and game coordinator | `game.js` |
| Fixed-point arithmetic | `src/fixed-point.js` |
| Player movement, gravity, bounce and form behavior | `src/bounce-physics.js` |
| Terrain and surface contacts | `src/terrain-collision.js`, `src/original-collision.js` |
| RLEF level/resource parsing | `src/rlef-reader.js` |
| Scripted commands and event triggers | `src/event-engine.js` |
| Camera and world transforms | `src/original-camera.js` |
| Enemy state and interactions | `src/original-enemies.js` |
| Water behavior | `src/original-water.js` |
| Springboard/trampoline behavior | `src/original-trampoline.js` |
| Cannon mesh and firing behavior | `src/original-cannon.js` and original shared resource |
| Sprite maps and animation | `src/sprite-atlas.js`, `src/original-sprite-animation.js` |
| MIDP drawing compatibility | `src/midp-graphics.js` |
| HUD and progression | `src/original-hud.js`, `src/original-progression.js` |
| Music and sound cues | `src/audio-controller.js` |
| Touch-control layout | `src/control-layout.js` |
| Read-only module registry | `src/module-registry.js`, `src/port-engine.js` |

The map identifies implementation responsibilities. It does not imply that every original Java class has a one-to-one JavaScript class or that every device-specific behavior is exact.

## 4. Physics and collision

### Simulation model

- The world uses the original logical coordinate space and upward-positive world Y convention.
- Simulation advances at a fixed 60 Hz step; display frame pacing and optional interpolation affect presentation, not the simulation rate.
- Fixed-point helpers preserve the original engine's scaled integer arithmetic where represented.
- Player physics and world collision are separate modules so the movement model can be tested independently from terrain/contact resolution.

### Collision model

`src/original-collision.js` translates recovered original collision helpers, including swept edge and endpoint intersection calculations, nearest-contact selection, surface-relative velocity response, restitution, friction-force comparison, torque smoothing and contact-state updates. The implementation uses fixed-point arithmetic with `BigInt` intermediates for the translated integer calculations.

`src/terrain-collision.js` connects the collision routines to decoded level geometry and contains browser-side overlap recovery where required. Keep that fallback distinguishable from source-translated collision behavior; do not present it as original-engine logic.

V62 corrected moving-contact position reconstruction. The original maintains a previous transform advanced by the full contacted-surface displacement, while the corrected current actor transform uses the retained tangent offset, the absolute normal component and the contact skin. The earlier browser path double-counted part of the displacement. Regression fixtures now cover tangential movement and both directions of normal movement.

### What the evidence means

The original-runner can execute the untouched original game classes in a JVM with small MIDP/Nokia API stubs, record frame deltas and physics substeps, and replay those values through the browser port. V62 records short Level 1 runs for the opening, jump, left movement and right movement. In the latest rerun, the maximum player-position deviation across those scenarios was 0.0117 logical pixels; the value varies slightly with the original game's wall-clock frame deltas.

That is strong evidence for those measured paths, not exhaustive proof of all collision combinations, moving-geometry event sequences, device timing patterns or all 15 stages. See the V62 audit for exact measurements, commands and open verification items.

## 5. Resources, levels and rendering

`assets/original/` contains the original game resource material used by the reconstruction, including binary resources, class files and localized text files. The playable campaign uses the recovered RLEF resources; `reference/` contains decoded level fixtures, inventories, hashes and other test references. `reverse-engineering/` retains class maps, bytecode extracts, resource-format notes and research records.

Sprite IDs, dimensions, source offsets, animation sequences and MIDP anchor semantics are part of the rendering contract. Do not substitute browser branding icons for original in-game sprites. The logical canvas remains 240 × 320; CSS scales it to the available viewport and the renderer controls pixel-art smoothing.

The browser soundtrack uses the project's audio controller and converted browser-playable audio. Browser audio policies require a user gesture before playback can begin in some browsers; the controller handles unlock and page visibility lifecycle behavior.

## 6. Responsive shell and controls

The page supports mobile and desktop browser layouts. The canvas remains the fixed logical game surface; the responsive shell controls its CSS size and the placement of the external touch-control surface.

### Input

| Action | Touch | Keyboard |
|---|---|---|
| Move left/right | Hold left/right buttons | `A` / `D`, arrow keys |
| Jump | Hold Jump | `Space` / `Enter` |
| Change unlocked form | Form `*` button | `Shift` / `Q` |
| Pause | External pause control | `Escape` |

Standard gamepads are supported through the browser Gamepad API when available.

### Touch layout editor

The live touch controls and editor share `src/control-layout.js` as their geometry source. The editor moves the actual left, right, jump and form buttons. A user selects a control, changes its size from 75% to 125%, then saves, cancels or resets. Layout values are stored locally as normalized geometry on the fixed reference surface, using the stable `bounce-control-layout-v1` key. The editor and live controls must continue to use the same geometry model.

### Header and settings

The compact header contains:

- **Heart:** opens the PrasannaOne site. The direct Ko-fi support link is in Settings → About.
- **Share:** shares the canonical game URL through the Web Share API where available, with a clipboard/manual fallback.
- **Settings:** opens Game and About tabs.

The Game settings include language, frame pacing, smooth motion, FPS counter, original music, fullscreen, reset progress and touch-control customisation. About includes creator/project links, Ko-fi support and the independence/rights disclaimer. Do not move the creator credit onto the main game screen; it belongs in About.

## 7. Installability, caching and updates

The site includes a web app manifest and service worker. Compatible browsers may offer installation to a home screen or app launcher. Normal browser play does not require installation.

The service worker precaches a small startup shell and caches additional same-origin resources as they are requested. For a runtime release, keep all of the following in sync:

- `CACHE_NAME` in `sw.js`;
- versioned script and stylesheet query strings in `index.html`;
- matching versioned paths in the service worker app shell;
- manifest/icon paths when those assets change.

Test first load, reload, offline startup where supported, and update from a previously cached release. Documentation-only changes do not require a service-worker cache bump. Preserve the touch-layout storage key unless a deliberate migration is included.

## 8. Verification and limits

The repository includes syntax checks, regression tests, runtime smoke tests, a springboard lifecycle proof, differential checks and the original-JVM replay harness. These checks cover selected resource parsing, physics/collision, event commands, campaign data, input, audio and interface logic.

Automated tests do not prove exhaustive gameplay completion or identical behavior on every physical device. Real-device testing is still needed for touch ergonomics, browser chrome, audio policy, fullscreen behavior, install prompts and the actual deployed website. The V62 physics/collision audit explicitly lists the remaining longer-path comparisons.

## 9. Maintenance boundaries

- Preserve all original resource files and their relative paths unless a resource change is intentional and audited.
- Keep the 240 × 320 logical world independent of CSS dimensions.
- Keep simulation fixed at 60 Hz; do not let render frame pacing alter physics time.
- Keep source-translated collision behavior separate from browser overlap-recovery fallbacks.
- Preserve the RLEF campaign data and event ordering.
- Keep live touch controls and the control editor on the same geometry model and storage key.
- Keep original in-game art separate from web/PWA branding.
- Keep the canonical share URL synchronized across metadata, the brand link and share action.
- Update HTML asset query versions and the service-worker cache name together for runtime releases.
- Run focused tests and the full available verification suite after engine changes; document any environment-dependent or repository-only test failures accurately.

## 10. License and original-game rights

The root `LICENSE` governs only the portions authored by the project Licensor. It is a proprietary source-available license, not an OSI-approved open-source license. Original Bounce Tales code, names, images, music and other third-party materials are excluded from that grant and remain subject to their respective owners' rights and terms. The project is independent and is not affiliated with Nokia or Rovio.
