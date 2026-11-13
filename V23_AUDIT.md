# Bounce Tales V23 Static Audit

## Changes
- Added no-cache/no-store, Pragma, and Expires metadata to `index.html`.
- Versioned every local JavaScript and CSS reference with `?v=23`, including service-worker registration.
- Replaced cache-first service-worker reads with network-first fetches, cache refresh on successful online responses, and cached fallback only after network failure.
- Bumped the service-worker cache to `bounce-tales-v23`; retained install-time shell precaching, `skipWaiting()`, old-cache cleanup, and `clients.claim()`.
- Top-aligned the 240×320 (3:4) game viewport under the compact fixed header and repositioned touch controls into left/right thumb zones. Removed the gameplay hint paragraph.
- Explicitly disabled smoothing on both game canvas contexts and retained pixelated CSS rendering.

## Decompiled-JAR cross-check
- `e.java` confirms the trampoline level sprite IDs (497, 509, 490), the period/frame progression, launch threshold, and the original `o.b(image, frame)` frame-offset lookup. `src/original-trampoline.js` already uses the frame's first composite-part Y offset rather than the sprite draw-origin, and preserves the centre-path trigger segment x=-70..70 at y=95.
- `c.java` confirms the three-form actor constants ported in `src/bounce-physics.js`: radii [20,20,20], gravity [1.0,1.4,0.5], friction [0.6,0.3,0.6], restitution [0.1,0.1,0.1], movement acceleration [500,350,312.5], maximum movement speed [280,350,150], midair suppression [1.5,2.5,1.2], and jump acceleration [288,255,162.5].
- The first window-level `pointerdown` continues to call the audio controller's `unlock()` once; the current controller uses browser `HTMLAudioElement` playback for the supplied OGG tracks (not a Web Audio `AudioContext`). Existing level event/checkpoint/exit dispatch, progression logic, and sprite atlas mappings were retained. This was a static source audit only. No route solvers, bot simulations, browser automation, or Chromium tests were run.

## Verification boundary
JavaScript syntax, required root files, archive integrity, and static level/resource presence are checked during packaging. Actual in-game route completion and device-specific visual/audio behavior are not claimed as runtime-verified by this static-only pass.
