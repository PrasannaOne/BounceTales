# Bounce Tales architecture

## Runtime flow

`index.html` loads the browser shell, stylesheet, engine modules, then `game.js`. The main game loop coordinates input, fixed-step simulation, level events, camera updates, drawing, progression, and audio. The logical playfield remains **240 × 320**; CSS scales the canvas to the available viewport while pixel-art rendering disables smoothing.

## J2ME-to-HTML5 mapping

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
| Sprite frames and animation sequences | `src/sprite-atlas.js`, `src/original-sprite-animation.js` |
| MIDP graphics compatibility | `src/midp-graphics.js` |
| Checkpoints, eggs and stage progression | `src/original-progression.js` |
| Music and sound effects | `src/audio-controller.js` using Web Audio |
| Particles and visual effects | `src/game-particles.js` |

The mapping is an implementation guide, not a claim that every J2ME class or device-specific behavior has exact one-to-one parity.

## Fixed-point physics pipeline

1. **Read input:** touch, keyboard, or supported gamepad input is normalized into gameplay actions.
2. **Advance simulation:** the main loop advances the game in fixed time steps rather than using arbitrary render-frame deltas.
3. **Update physics:** fixed-point helpers preserve the original engine's scaled integer arithmetic where represented. Player velocity, gravity, collision bounds, and form-specific behavior are updated in world coordinates.
4. **Resolve world interactions:** terrain collision and source-informed object systems process platforms, springboards, water, enemies, and scripted triggers.
5. **Project the camera:** world positions are transformed into the logical screen coordinate system. The camera follows the player within the level bounds.
6. **Render:** sprite and animation data are drawn into the logical canvas. Pixel-art smoothing is disabled; the browser scales the canvas for the device viewport.
7. **Audio and progression:** gameplay events trigger buffered Web Audio playback and update checkpoints, collectibles, and stage state.

World Y follows the original game's upward-positive convention; canvas projection converts it to screen coordinates. Keep physics calculations in their established fixed-point/world-coordinate domain and avoid mixing CSS pixels into simulation state.

## Resources and offline behavior

The original binary resources under `assets/original/` supply runtime level and sprite/audio data. `reference/` contains decoded fixtures used by tests and tooling. The service worker uses a versioned cache shell, prefers the network while online, and falls back to cached resources when offline.

## Maintenance boundaries

- Preserve original resource files and their relative paths.
- Keep the logical 240 × 320 coordinate system independent of responsive CSS sizing.
- Update `index.html` asset query versions and the service-worker cache name together when releasing.
- Run the Node.js test suite after engine changes; syntax checks alone do not establish gameplay parity.

## V33 touch-control layout

The four touch controls use one canonical 420 × 128 reference surface. `CONTROL_LAYOUT_DEFAULTS` and `CONTROL_BASE` in `game.js` define the default coordinates and reference dimensions; both the gameplay controls and Settings editor preview are positioned from those same values. The editor uses Pointer Events for touch/mouse dragging and a size slider for resizing. Unsaved edits preview on the live controls only while the editor is open; Cancel/Escape restores the saved layout. Save writes the sanitized layout to the stable `bounce-control-layout-v1` localStorage key. The key is intentionally independent of release/cache versions so ordinary upgrades do not discard user layouts.

The live control container scales from its measured width. The nested `.main-controls` and `.special-control-row` wrappers use `display: contents`, leaving each button absolutely positioned relative to `#game-controls`. The editor preview uses the same 420:128 aspect ratio and shared dimension calculation. Starting or restarting a level does not own or mutate control-layout preferences.
