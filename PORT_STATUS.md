# Bounce Tales V21 · build status

## V21 changes
- Corrected the About → Support Bounce Tales card so the full-width target has a stacked title and the complete requested description, with no overlapping inline subtitle.
- Remastered the launcher/favicon/PWA/Apple icons by exact nearest-neighbour enlargement of the original JAR `icon.png`. The original 46×48 resource remains byte-for-byte unchanged; the artwork is not reimagined.
- Replaced the social preview with a minimal image-only 1200×630 composition using the same original character art. No overlay text, promotional labels or badges.
- Updated the service-worker cache namespace to `bounce-tales-v21`.
- Added `tests/campaign-object-coverage.test.cjs`.
- Added `tests/live-loop-audit.test.cjs`, which runs the actual `game.js` update function for 720 fixed ticks on each of the 15 campaign resources with synthetic left/right/jump input (10,800 total updates).

## Preserved V20/V20.1 systems
- 326 decoded sprite descriptors and 1,143 animation command streams.
- 16 original RLEF resources, including the 15 campaign stages and separate `bu` test scene.
- 105 original resource hashes.
- Fixed 60 Hz simulation with optional render interpolation and Auto / 30 / 60 / 90 / 120 FPS display caps.
- Original source-informed collision, trampoline, water, enemy, cannon and event modules.
- No-scroll mobile shell, separated controls, control editor, local layout persistence, settings, PWA offline cache and Ko-fi link.

## V21 verification
- 40/40 Node regression scripts pass.
- 20/20 JavaScript files pass `node --check`.
- All 105 source resource hashes pass.
- All 15 campaign levels run through 720 live update/input ticks each; the test asserts finite/bounded player and enemy state and no unsupported event opcodes.
- All campaign object types parsed from the 15 stage resources have runtime handler branches.
- ZIP integrity checked and `index.html` is at the archive root.

## Important verification boundary
The live-loop test is a Node VM simulation of the production `game.js` update function with real RLEF level data. It is not a Chromium session and does not complete all 15 levels. Headless Chromium could not initialize in this environment because its GPU process failed to start. Physical Android/iOS testing is also outstanding.

Natural stage-clear routes, all specialized switch/boss/cannon/exit paths, exact enemy sprite mappings and pixel-perfect MIDP rendering still require direct comparison with the original game. See `V21_AUDIT.md` for the detailed audit scope and remaining work.
