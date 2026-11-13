# V38 control and responsive UI rewrite

## What changed
- Replaced the layered legacy control-layout implementation with `src/control-layout.js`, a DOM-free geometry module.
- Gameplay controls and editor preview now use the same percentage-based placement function and the same 360:126 reference surface.
- Added button selection, pointer dragging, size adjustment, save, cancel, reset, Escape-to-cancel, resize/orientation refresh, and ResizeObserver refresh.
- Kept the established `bounce-control-layout-v1` localStorage key so existing saved layouts remain readable.
- Live layout measurement is deferred while the play surface is hidden and retried after the scene becomes visible.
- Rebuilt the responsive play surface: smaller portrait game canvas, safe-area-aware spacing, and a landscape two-column layout on wider screens.
- Updated the service-worker cache namespace to V38 while retaining progressive on-demand caching.

## Gameplay preservation
`game.js` physics/update loop, fixed-step timing, input IDs, RLEF level data, original assets, and trampoline implementation were not rewritten. Touch buttons still dispatch the original input IDs: left 3, right 4, jump 7, form 20.

## Verification
Run `node --test tests/v38-control-layout.test.cjs` for the new geometry tests.
Run `node --check` against the JavaScript files for syntax validation.
The historical UI tests include hard-coded version and legacy-selector expectations; they are not all applicable to the V38 design and should be reviewed rather than treated as visual acceptance tests.
