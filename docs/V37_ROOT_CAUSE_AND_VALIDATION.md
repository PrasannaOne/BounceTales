# V37 root-cause and validation notes

## Touch controls could collapse to zero size

The live control row is intentionally hidden outside gameplay. During boot, `bindControlEditor()` previously called the layout function while the title scene was active. `getBoundingClientRect().width` therefore returned zero. The old layout code converted that measurement into zero-width/zero-height inline styles on every control. Revealing the row later did not guarantee a new measurement, leaving buttons invisible or too small to interact with. The editor could also be opened while its overlay had not completed layout, producing the same class of invalid measurement.

V37 moves the layout calculation into `src/control-layout.js` and shares it between the live row and editor. A hidden/zero-width surface returns `null` and receives no inline geometry. `syncSceneChrome()` reapplies live geometry after switching to gameplay, while `ResizeObserver` and viewport resize handling cover subsequent size changes. The editor waits for its overlay to become measurable before positioning its controls.

The layout is expressed in percentages over a 360 × 108 reference surface. The existing `bounce-control-layout-v1` local-storage key is retained, so V36 layouts are normalized and can be reused. Save persists the current edit, Cancel/Escape restores the last saved layout, and Reset removes the saved layout and returns to the defaults.

## First-load contention

The previous service-worker install list eagerly requested the original audio tracks, original sprite/resource images and the large social preview alongside the files needed to boot. These assets competed for bandwidth during initial installation even though they are not all needed to render the first playable frame.

V37 precaches the critical application shell and the resources needed to initialize the selected level. Other same-origin images and audio are cached when the game first requests them. Previously requested resources then come from the cache. The preview image is social metadata only and is not part of the app shell.

## Responsive presentation

The logical game canvas remains 240 × 320. The V37 CSS limits the portrait play surface, retains its 3:4 ratio, accounts for safe-area insets, and uses a side-by-side layout in landscape/desktop viewports. The touch controls use the same shared 360 × 108 geometry in both portrait and landscape. CSS sizing does not enter player physics, camera calculations or the fixed-step clock.

## Validation performed

- Full Node.js suite: 50 tests passed.
- Live `game.js` update-loop audit: all 15 campaign levels ran 720 simulation/input frames each with finite player/enemy state and no unsupported event opcodes.
- Level 1 trampoline trace and all-level springboard reference tests passed.
- Control runtime tests cover hidden-row zero-width protection, editor opening, pointer drag, resize, save, reset, cancel, and reflow when gameplay becomes visible.
- 21 JavaScript files passed `node --check`.
- No Chromium or browser automation was used. Physical-device touch behavior still requires a final manual check.
