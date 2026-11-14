# Bounce Tales · Project Guide

> **Official game:** https://prasannaone.github.io/BounceTales/  
> **Repository:** https://github.com/PrasannaOne/BounceTales  
> **Document scope:** V49 project structure and maintenance guide

This guide explains how the browser project is organised, how a play session moves through the code, where important behavior lives, how to validate changes, and which boundaries should be protected during maintenance.

## 1. Project identity and scope

Bounce Tales is an independent browser reimplementation and research project based on the classic J2ME Bounce Tales game. It uses a 240 × 320 logical gameplay space, original resource formats and decoded reference fixtures, alongside a JavaScript runtime and a responsive HTML/CSS shell.

The implementation is source-informed. Some behavior is directly supported by recovered Java bytecode, resource data or localized strings; other behavior is a browser-side adaptation or remains approximate. The documentation records these distinctions rather than claiming universal, pixel-perfect equivalence.

## 2. Runtime entry points

| File | Role |
|---|---|
| `index.html` | Browser document, metadata, PWA references, canvas and interface elements |
| `style.css` | Responsive page shell, game frame, menus, overlays and touch-control styling |
| `game.js` | Application state, game lifecycle, main update/render coordination and integration |
| `sw.js` | Service-worker install shell and runtime resource caching |
| `manifest.webmanifest` | Install name, theme, display mode and PWA icon references |

The app is static-hosted. Normal play requires no bundler or package installation. A local HTTP server is required because browser security rules do not support the service worker and resource loading from a `file://` page.

## 3. Gameplay pipeline

A normal active frame follows this broad sequence:

1. **Input collection:** touch, keyboard and supported gamepad inputs are normalized into gameplay actions.
2. **Fixed-step scheduling:** simulation updates use a controlled time step rather than integrating arbitrary display-frame deltas.
3. **World and player updates:** player movement, bounce/form behavior, collision and world interactions are processed.
4. **Event processing:** level scripts and object triggers update their state and can request dialogue or transitions.
5. **Camera projection:** world positions are transformed into the original logical screen coordinate space.
6. **Rendering:** background, terrain, objects, actors, effects, HUD and overlays are drawn using sprite/resource mappings.
7. **Audio and progression:** gameplay events can trigger audio, collectible changes, checkpoints and stage transitions.

Pause and blocking dialogue must suspend the appropriate simulation work. Avoid introducing a second independent timer or a CSS-pixel dependency into the simulation clock.

## 4. Important modules

| Module | Responsibility | Maintenance note |
|---|---|---|
| `src/module-registry.js` | Standalone game-agnostic module registry factory | Reusable in a separate port without loading Bounce modules |
| `src/port-engine.js` | Bounce Tales module catalog over the generic registry | Keep Bounce-specific adapters and recovered behavior clearly labeled |
| `src/fixed-point.js` | Fixed-point arithmetic helpers | Keep simulation units consistent; avoid accidental floating/CSS-pixel mixing |
| `src/game-timing.js` | Fixed-step timing support | Preserve deterministic update cadence and pause behavior |
| `src/bounce-physics.js` | Player movement and bounce logic | Treat physics constants and established movement behavior as regression-sensitive |
| `src/terrain-collision.js` | Terrain contact helpers | Validate slopes, edges and contact transitions |
| `src/original-collision.js` | Source-informed collision behavior | Compare against recovered class/resource evidence before changing semantics |
| `src/rlef-reader.js` | RLEF binary parsing | Preserve byte-level compatibility with bundled level resources |
| `src/event-engine.js` | Scripted event/opcode processing | Preserve command order and event suspension/resumption |
| `src/original-camera.js` | Camera tracking and world projection | Keep the logical viewport independent from CSS sizing |
| `src/original-enemies.js` | Enemy behavior/state | Validate across stages, not only the opening level |
| `src/original-water.js` | Water interaction | Check entry, movement and exit transitions |
| `src/original-trampoline.js` | Springboard/trampoline behavior | High-risk regression area; retain the dedicated lifecycle proof |
| `src/original-progression.js` | Eggs, checkpoints and stage progression | Keep collected and total counts distinct |
| `src/sprite-atlas.js` | Sprite lookup and atlas metadata | Do not substitute PWA artwork for original in-game sprites |
| `src/original-sprite-animation.js` | Original animation sequences | Preserve frame order, timing and source dimensions |
| `src/midp-graphics.js` | MIDP-style graphics compatibility | Respect original anchor and draw-offset semantics |
| `src/original-hud.js` | HUD mapping and source-informed values | Verify values, bitmap digits, offsets and clock placement against reference evidence |
| `src/control-layout.js` | Shared touch-control geometry | Keep live controls and editor on the same geometry model |
| `src/audio-controller.js` | Web Audio playback | Account for browser user-gesture and autoplay restrictions |

`game.js` is the integration point. Before moving responsibilities between modules, trace all call sites and preserve the current initialization/update order.

## 5. Original resources and reference material

- `assets/original/` contains runtime resources used by the project, including original-format level and media resources.
- `reference/` contains decoded fixtures, metadata and checksums used for inspection and validation.
- `reverse-engineering/` records class maps, resource formats, input traces, physics notes and runtime flow.
- `tools/` contains inspection and reference-generation utilities.

Treat original resources as evidence and runtime inputs, not as generic artwork to replace with modern branding. Keep source filenames and resource paths stable unless every dependent mapping, loader and test is updated together.

The original game's content is not relicensed by the project's source license. See the root `LICENSE` for the exact boundary between Licensor-authored project work and third-party/original-game material.

## 6. Interface and control model

The game world remains 240 × 320. The browser shell scales the game presentation to the available viewport; CSS dimensions must not feed back into physics or world coordinates.

Touch controls are separate from the logical game canvas. The Left, Right, Jump and form controls use a shared layout model. The in-game customization screen edits the same geometry used by the live controls, and the saved arrangement is local to the current browser/device.

The stable local-storage key is `bounce-control-layout-v1`. Preserve it across releases unless a deliberate migration is implemented. Do not hide a control surface and then measure it as though it had valid visible dimensions. Recalculate when the surface becomes visible and when its container changes size.

## 7. PWA and caching

The project is installable as a Progressive Web App on compatible browsers. The manifest controls installation metadata and icon selection. Those icons belong to the browser/device installation experience; original in-game sprite selection belongs to the game renderer. Keep the two asset roles separate.

The service worker precaches a small startup shell and caches additional same-origin resources as they are requested. This avoids forcing every large media resource into the initial installation download.

When creating a new game release:

1. Update the cache version in `sw.js`.
2. Update versioned asset query strings in `index.html` where used.
3. Confirm the manifest and icon paths still resolve.
4. Test first load, reload, offline startup and an update from the previous cache.
5. Do not change the control-layout storage key without a migration plan.

Documentation-only changes do not require a gameplay cache-version bump.

## 8. Local development

Use any static HTTP server. With Python 3:

```bash
python -m http.server 8000
```

Open <http://localhost:8000/>. Use browser developer tools to inspect runtime errors, failed resource requests, viewport behavior and service-worker state. Physical-device testing is still needed for touch ergonomics, mobile browser chrome, audio policy and PWA installation.

## 9. Validation commands

Run the complete release verification workflow from the repository root:

```bash
npm run verify
```

This runs the syntax checker, every `tests/*.cjs` file, the runtime smoke harness and the dedicated Level 1 springboard lifecycle proof. Individual commands are also available as `npm run check`, `npm test`, `npm run smoke` and `npm run proof:springboard`. No third-party npm packages are required.

Validate the RLEF resources with the repository's validation scripts when level files or their reader are touched. A passing test suite is evidence for the assertions those tests actually make; it is not proof of every stage, every device or every visual detail.

## 10. High-risk non-regression boundaries

The following areas have repeatedly required explicit protection:

- fixed-step simulation and elapsed-game-time behavior;
- player physics, collision and trampoline/springboard lifecycle;
- camera/world coordinate transforms;
- all 16 bundled RLEF level resources;
- original sprite atlas indices, source dimensions and draw anchors;
- HUD values and bitmap digit placement;
- menu/dialogue/confirmation draw order and input flow;
- touch-control geometry, persistence and the live layout editor;
- service-worker cache/version consistency.

For a focused UI change, compare the exact source asset and draw routine first. For a gameplay change, run the relevant module tests and the full suite. For a resource change, compare hashes and exercise the parser. For a release, test the deployed site on an actual phone.

## 11. Release checklist

- [ ] Confirm the intended release scope and version.
- [ ] Keep gameplay changes separate from documentation-only changes where possible.
- [ ] Inspect the diff for accidental resource, CSS, physics or level edits.
- [ ] Run all Node.js tests and syntax checks.
- [ ] Run the dedicated springboard and runtime smoke checks when relevant.
- [ ] Verify all 16 RLEF resources and original assets remain intact when they are not intended to change.
- [ ] Check PWA manifest paths, service-worker cache version and asset query versions for gameplay releases.
- [ ] Test the deployed GitHub Pages site on a phone and desktop browser.
- [ ] Update README and the relevant audit/documentation files.
- [ ] State exactly what was tested and what remains unverified.

## 12. Project license

The Licensor-authored portions of the project are governed by the root **Sovereign Source License v1.1**. It is proprietary and source-available, not an open-source license. Original Bounce Tales materials and third-party components are excluded and remain under their respective rights and terms. Read the complete `LICENSE` before copying or using project materials.


## V49 repository and porting notes

The current release includes a dependency-free Node.js verification workflow (`npm run verify`) and the `BouncePortEngine` API v1 registry. The registry exposes existing standalone modules and provides `createRegistry(definitions)` for a separate future port to compose its own read-only module registry. It does not turn Bounce Tales' application coordinator into a universal engine. Consult [ENGINE_PORTING_GUIDE.md](ENGINE_PORTING_GUIDE.md) for module boundaries and adapter contracts.

The GitHub Actions workflow at `.github/workflows/import-bounce-zip.yml` imports and validates a supplied `Bounce.zip` archive. It is not the GitHub Pages publishing workflow. The deployed static site is published separately through the repository's Pages configuration.
