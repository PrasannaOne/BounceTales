# Bounce Tales architecture

> **Official playable site:** https://prasannaone.github.io/BounceTales/  
> **Source repository:** https://github.com/PrasannaOne/BounceTales  
> **Current documented baseline:** V58

This document describes the browser runtime, the relationship between the original J2ME resource model and the JavaScript implementation, and the boundaries that should remain stable during maintenance. For the operational walkthrough and release checklist, see [`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md).

## 1. Runtime flow

`index.html` loads the browser shell, stylesheet, engine modules, then `game.js`. The main game loop coordinates input, fixed-step simulation, level events, camera updates, drawing, progression, and audio. The logical playfield remains **240 × 320**; CSS scales the canvas to the available viewport while pixel-art rendering disables smoothing.

A typical active update proceeds through input normalization, fixed-step scheduling, player/world updates, event processing, camera projection, rendering, and event-driven audio/progression. Pause and blocking dialogue suspend the relevant simulation work. The browser shell and touch controls are presentation/input surfaces; they must not redefine world coordinates.

## 2. J2ME-to-HTML5 mapping

| Original J2ME area | Browser implementation |
|---|---|
| MIDlet/application lifecycle and game loop | `game.js` application state and update/render loop |
| Fixed-point integer arithmetic | `src/fixed-point.js` |
| Player movement, bounce and form behavior | `src/bounce-physics.js` plus `src/original-collision.js` |
| Original RLEF level/resource loading | `src/rlef-reader.js` |
| Scripted object commands and triggers | `src/event-engine.js` |
| Camera and world transforms | `src/original-camera.js` |
| Moving enemies and enemy state | `src/original-enemies.js` |
| Water interaction and buoyancy | `src/original-water.js` |
| Springboard/trampoline behavior | `src/original-trampoline.js` |
| Shared cannon mesh and firing animation | `src/original-cannon.js` plus `assets/original/bu` |
| Sprite frames and animation sequences | `src/sprite-atlas.js`, `src/original-sprite-animation.js` |
| MIDP graphics compatibility | `src/midp-graphics.js` |
| HUD mapping and collectible progression | `src/original-hud.js`, `src/original-progression.js` |
| Music and event cues | `src/audio-controller.js` using Web Audio |
| Responsive touch-control geometry | `src/control-layout.js` |

The mapping is an implementation guide, not a claim that every J2ME class or device-specific behavior has exact one-to-one parity. Some browser behavior is adapted to modern input, rendering, audio and lifecycle APIs.

## 3. Fixed-step physics pipeline

1. **Read input:** touch, keyboard, or supported gamepad input is normalized into gameplay actions.
2. **Advance simulation:** the main loop advances the game in fixed time steps rather than using arbitrary render-frame deltas.
3. **Update physics:** fixed-point helpers preserve the original engine's scaled integer arithmetic where represented. Player velocity, gravity, collision bounds, and form-specific behavior are updated in world coordinates.
4. **Resolve world interactions:** terrain collision and source-informed object systems process platforms, springboards, water, enemies, and scripted triggers.
5. **Project the camera:** world positions are transformed into the logical screen coordinate system. The camera follows the player within the level bounds.
6. **Render:** sprite and animation data are drawn into the logical canvas. Pixel-art smoothing is disabled; the browser scales the canvas for the device viewport.
7. **Audio and progression:** gameplay events trigger buffered Web Audio playback and update checkpoints, collectibles, and stage state.

World Y follows the original game's upward-positive convention; canvas projection converts it to screen coordinates. Keep physics calculations in their established fixed-point/world-coordinate domain and avoid mixing CSS pixels into simulation state.

## 4. Rendering and original resources

The original binary resources under `assets/original/` supply runtime level and sprite/audio data. `reference/` contains decoded fixtures used by tests and tooling, including the V56 supplemental-resource inventory for the three `be` records and the `bv` table, plus the V57 opcode-29 and image-358 particle crosswalk. Sprite indices, dimensions, source offsets and MIDP anchor semantics are part of the resource mapping; do not replace an original in-game sprite with a PWA installation icon or a similarly named modern asset.

The game renderer owns in-game artwork and HUD composition. The PWA manifest and page metadata own browser/device branding. These are separate asset paths with separate purposes.

The service worker precaches a small critical startup shell. Original sprite images and audio are cached on demand after the game requests them; repeat requests are served cache-first. The social-sharing preview is not a runtime dependency. The header share action passes `https://prasannaone.github.io/BounceTales/` to the Web Share API or the clipboard fallback. Sharing, canonical metadata, and brand/home navigation now use the same public GitHub Pages address.

## 5. Interface and touch controls

The logical game canvas remains 240 × 320. CSS scales it within portrait, landscape, narrow-phone, tablet and desktop layouts without feeding CSS dimensions into physics or camera calculations.

The live touch controls and Settings editor use `src/control-layout.js` as their shared geometry source. Positions and sizes are stored as normalized percentages and a percentage size multiplier on a fixed 360 × 108 reference surface. The stable `bounce-control-layout-v1` storage key preserves user layouts across releases. Hidden controls must not be measured or assigned zero-sized styles; recalculate when gameplay reveals the controls and when the viewport/container changes. The editor waits until its overlay is visible before measuring, and Save, Cancel, Reset and Escape have distinct persistence semantics.

### Header share control

The `#share-site` button uses a small outlined connected-node SVG. Its stroke is explicitly set to `currentColor`; do not rely on SVG default fill behavior for the open path segments. `shareSite()` sends the canonical GitHub Pages URL to `navigator.share`, then falls back to clipboard copy or a manual prompt. Keep the literal URL identical to the canonical `og:url` metadata and brand/home link.

## 6. Event dialogue suspension

RLEF message opcodes suspend only their owning event at the message instruction. The UI queues messages from concurrent events and resumes the matching event after player input, preserving command order without advancing the fixed-step simulation while dialogue is visible.

### Original RLEF packed flags and source particle effect

RLEF event opcode 29 updates the original `j.m` packed object field. Its selector is not a conventional mask for every bit: selector `0x01` replaces the complete low five-bit render-depth value and recomputes the cached depth as `(flags & 31) - 16`; `0x20`, `0x80` and `0x100` update their individual bits. The renderer sorts by the low five bits and suppresses objects carrying `0x80`, matching the corresponding `j.java` render path. Do not simplify this to `(flags & ~mask) | (values & mask)`.

When selector `0x80` is processed for a type-5 sprite whose first image is 358, original `g.java` invokes the 24-particle emitter configured in `m.java`. V57 routes that event to the original animated sprite families 390, 414 and 396. Sprite family, particle count, angle envelope and lifetime base/variation are cross-referenced from the source. Browser random sampling, timing conversion, drag and particle integration are adapted; the port does not claim byte-for-byte J2ME RNG or per-device frame timing.

## 7. Offline behavior and release caching

The service worker precaches a small critical startup shell and lazily caches additional same-origin resources. This reduces first-install transfer and avoids eagerly downloading all original media.

For a gameplay release, update the service-worker cache name and versioned asset query strings together. Confirm manifest paths, first-load behavior, reload, offline startup and update-from-previous-cache behavior. Documentation-only changes do not require a cache-version bump. Preserve the touch-layout storage key unless a deliberate migration is included.

## 8. Verification boundaries

Node.js tests cover selected resource parsing, physics/collision, level scripting, input, UI logic, audio-controller behavior and PWA references. Dedicated runtime smoke and springboard checks provide additional coverage. Automated checks do not establish exhaustive completion of every stage or guarantee identical behavior on every physical device. Visual layout, mobile browser chrome, touch ergonomics, audio policy and PWA installation require real-device testing.

## 9. Maintenance boundaries

- Preserve original resource files and their relative paths.
- Keep the logical 240 × 320 coordinate system independent of responsive CSS sizing.
- Preserve fixed-step timing, pause behavior, physics and springboard lifecycle unless a deliberate gameplay change is being made and tested.
- Keep original in-game sprite mappings separate from PWA icons and web branding.
- Preserve all bundled RLEF levels unless level changes are explicitly intended.
- Keep live touch controls and the editor on the same geometry model.
- Update `index.html` asset query versions and the service-worker cache name together for gameplay releases.
- Keep the share target synchronized with the canonical site URL in metadata and home navigation; avoid introducing an unverified short-link dependency.
- Run the Node.js test suite after engine changes; syntax checks alone do not establish gameplay parity.

## 10. License and rights boundary

The root `LICENSE` governs only the portions of the project authored by the Licensor. It is the proprietary Sovereign Source License v1.1, not an open-source license. Original Bounce Tales content and third-party components are excluded and remain subject to their respective rights and terms.


## Port-engine boundary (V49)

`src/module-registry.js` is a dependency-free, game-agnostic helper that can be reused independently. It accepts named system definitions, optional groups/descriptions and unavailable (`null`) systems, then exposes immutable registry operations and diagnostics. `src/port-engine.js` uses it to publish the Bounce Tales catalog as `BouncePortEngine` API v1. The generic registry is deliberately separated from Bounce-specific globals and module loading.

`src/port-engine.js` exposes the existing systems through `BouncePortEngine` API v1. The registry is a discovery surface, not a replacement for the Bounce Tales application coordinator. Its `createRegistry(definitions)` factory also allows a future port to build a separate read-only registry from its own systems without importing Bounce-specific globals. Keep generic primitives and host adapters separate from game-specific behavior; see [the engine porting guide](docs/ENGINE_PORTING_GUIDE.md).


## V58 release and import boundary

V58 adds synthetic behavior checks for all event-command values and uses the canonical share URL `https://prasannaone.github.io/BounceTales/`. The safe ZIP importer imports only the allowlisted runtime files and replaces the runtime `assets/` and `src/` trees; it merges root-level test files by filename without deleting repository-only tests. It does not import README, architecture, licence, docs or workflow files. See `docs/V58_RELEASE_AUDIT.md` for the exact evidence and remaining parity limits.
