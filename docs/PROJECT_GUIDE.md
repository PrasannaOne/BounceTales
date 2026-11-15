# Bounce Tales · Project Guide

> **Official game:** https://prasannaone.github.io/BounceTales/  
> **Repository:** https://github.com/PrasannaOne/BounceTales  
> **Document scope:** V58 project structure, source crosswalk and maintenance guide

This guide explains how the browser project is organised, how a play session moves through the code, where important behavior lives, how the V58 source crosswalk relates the supplied J2ME classes to browser modules, how to validate changes, and which boundaries should be protected during maintenance. See `docs/V58_RELEASE_AUDIT.md` for the release evidence and safe-import procedure. The current runtime baseline is V58 (`58.0.0`). The V58 importer merges named root-level regression-test files without deleting tests that exist only in the repository; it does not import project documentation, the licence or workflow definitions.

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

V51 applies the saved/default control geometry synchronously before any asynchronous game-resource loading. The control surface remains visually hidden until all four button positions and dimensions have been written. The pause action is outside the 240 × 320 canvas, in a compact right-side gutter aligned with the upper part of the game viewport on portrait screens. In wide landscape layouts, it uses the clear strip above the game column.

The game world remains 240 × 320. The browser shell scales the game presentation to the available viewport; CSS dimensions must not feed back into physics or world coordinates.

Touch controls are separate from the logical game canvas. The Left, Right, Jump and form controls use a shared layout model. The in-game customization screen edits the same geometry used by the live controls, and the saved arrangement is local to the current browser/device.

The stable local-storage key is `bounce-control-layout-v1`. Preserve it across releases unless a deliberate migration is implemented. During V51 startup, the control surface uses `visibility: hidden` rather than `display: none`; it remains in layout, so its dimensions can be measured before the buttons are revealed. Reapply the geometry when the container changes size or the surface becomes available after a hidden state.

## 7. PWA and caching

The project is installable as a Progressive Web App on compatible browsers. The manifest controls installation metadata and icon selection. Those icons belong to the browser/device installation experience; original in-game sprite selection belongs to the game renderer. Keep the two asset roles separate.

The service worker precaches a small startup shell and caches additional same-origin resources as they are requested. The V51.1 pause toolbar is anchored outside the game canvas. Portrait layouts reserve a right-side gutter for the small pause button; wide landscape layouts place it in the clear strip above the game column. Only the pause button itself is hidden outside active play, so entering gameplay does not shift the canvas. This avoids forcing every large media resource into the initial installation download.

When creating a new game release:

1. Update the cache version in `sw.js`.
2. Update versioned asset query strings in `index.html` where used.
3. Confirm the manifest and icon paths still resolve.
4. Test first load, reload, offline startup and an update from the previous cache.
5. Do not change the control-layout storage key without a migration plan.

Documentation-only changes do not require a gameplay cache-version bump. The V58 ZIP importer replaces the allowlisted runtime assets/source trees, updates named root-level test files while preserving repository-only tests, and leaves README, architecture, licence, docs and workflow files alone. Documentation and the importer workflow must be updated separately. V58 changes the header share action to the canonical `https://prasannaone.github.io/BounceTales/` URL; the Web Share API and clipboard fallback use that same address as the canonical metadata and home link.

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


## V52 shell and lifecycle contract

The V52 stylesheet has one responsive-shell section that owns the game-stage size, the external pause-control gutter, and the touch-control surface. Do not append another versioned patch at the bottom of `style.css`; edit the relevant V52 section and its regression tests. `#game-controls` is initially hidden until `applyControlLayoutToSurface()` has written all four button geometries and marked `data-layout-measured="true"`. The same marker is cleared during viewport resizing so old coordinates are never briefly displayed in the new layout.

The V52 audio controller stops the active source, increments its generation token to invalidate pending loads, and suspends the Web Audio context on window `blur`, `visibilitychange`, `pagehide` and `freeze`. The visible-page `focus`/`pageshow` path restores a previously unlocked track only while the music setting remains enabled. It resumes only when the page is visible, audio remains enabled, and the context was previously unlocked by a user gesture. Keep the persisted music setting authoritative.

The package release version is `52.0.0`. HTML asset URLs and the service-worker cache use the V52 identity (`v=52` / `bounce-tales-v52`). The service-worker source must change with a V52 runtime release so an existing worker installs and refreshes the cache entries.


## V57 event-flag and sprite-effect fidelity

At V57, the package release was `57.0.0`; that historical release used `v=57` / `bounce-tales-v57`. The current V58 release uses `58.0.0`, `v=58` and `bounce-tales-v58`.

The original `g.java` opcode-29 handler treats selector `0x01` as replacement of the complete low five-bit object depth, then updates cached depth to `(flags & 31) - 16`. Selectors `0x20`, `0x80` and `0x100` are independent flag updates. V57 mirrors this behavior. The bundled 15 playable levels contain 140 such commands, including 25 combined `0x81` commands.

The same source handler invokes the original 24-particle effect when selector `0x80` touches a type-5 sprite with first image ID 358. V57 reproduces the three source sprite families (390, 414, 396), five-frame animation, particle count, full-circle emission and 2040 ms lifetime with 510 ms variation. Browser-side timing conversion, random generator, drag and movement remain approximations rather than deterministic J2ME device parity. See [`V57_EVENT_FLAG_PARITY.md`](V57_EVENT_FLAG_PARITY.md) for the source crosswalk and test evidence.

`tests/event-flag-parity.test.cjs` checks the packed selector semantics and all 140 campaign commands. `tests/original-sprite-fragments.test.cjs` verifies the source particle configuration and browser rendering path. The V57 release verification is recorded in the release audit.

## V56 supplemental resource fidelity

At the V56 release, HTML asset references and the service-worker cache used `v=56` / `bounce-tales-v56`. This section records that historical release; the current runtime baseline is V58.

V56 records the exact resource-index identities and payload structure of the previously under-documented `be` and `bv` resources. `be` contains three 86-byte type-5 records (resource indices 90–92); the original world manager queues resource IDs 36 and 37 for loading in its state-1 branch. The purpose of the third group and the payloads' exact semantic labels remain unconfirmed. `bv` is a 26-byte type-8 payload containing thirteen big-endian words; its values 28–35 correspond to the eight original MIDI resource IDs already mapped by the browser audio controller.

The resource-index type values must not be confused with RLEF scene-object type values. The `c(true)` branch in the original world manager handles an RLEF object record of type 8; it does not establish that the standalone `bv` resource is such an object. The file-level resource loader reads `bv` as raw bytes.

`reference/supplemental-resource-audit.json` records offsets, lengths, hashes and the decoded word sequence. `tests/supplemental-resource-parity.test.cjs` protects these facts and checks the correspondence with the existing audio-resource map. The exact gameplay consumer of the `be` records and the full semantics of the `bv` header/trailer remain unresolved, so V56 does not invent runtime behavior for them.

The `Bounce.zip` importer remains release-version agnostic: it validates internal HTML/service-worker version consistency and all `APP_SHELL` paths, but does not impose a minimum release or require tests in the upload. Repository `tests/` remain repository-owned and run after import.

## V58 source crosswalk and command verification

The supplied decompiled 2.0.3 JAR reference is indexed in `src_decompiled/CLASS_ROLE_INDEX.md`. `docs/V58_SOURCE_CROSSWALK_AUDIT.md` maps those original classes to the browser runtime, the available regression evidence and the remaining approximation boundaries. `tests/event-command-semantics.test.cjs` exercises every event opcode from 0 through 32 with controlled test objects. Those synthetic checks complement the 15-stage source corpus profile; they are not an original-JVM versus browser differential replay.

The header Share action now shares or copies `https://prasannaone.github.io/BounceTales/` exactly, including its trailing slash. The canonical URL is intentionally kept in sync with `og:url` and the brand/home link. The V55 X.gd reference in README is a historical record only and is not the current share target.
