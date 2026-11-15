# Bounce Tales V52 · release audit

**Release:** 52.0.0  
**Runtime/cache identity:** V52 (`v=52`, `bounce-tales-v52`)  
**Base archive:** the uploaded `Bounce.zip` supplied for this maintenance pass

## Scope

V52 is a maintenance release. The intended changes are limited to the responsive web shell, control-layout visibility during startup and viewport changes, audio lifecycle handling, release metadata, documentation and regression coverage. The original game simulation, 15 playable RLEF stages, the original binary/resource archive, campaign progression and saved touch-layout key remain intact.

## Findings and changes

- The package metadata identified itself as `51.0.1` while the HTML and service worker already used V52 asset references. Package metadata now identifies `52.0.0`.
- `style.css` contained successive layout generations with overlapping page, canvas, touch-control and breakpoint rules. The old layout patch stack was removed and replaced with one V52 responsive-shell section. Original canvas/menu styling, compact settings/About presentation, support card, touch editor and custom-control styling were retained.
- The pause button remains a sibling of `.game-wrap` inside `.game-stage`, not a child of the canvas viewport. Compact portrait and narrow-landscape layouts reserve the right gutter; wide and short-height landscape layouts use the empty strip above the game column.
- Touch controls remain hidden until geometry is measured. The measured marker is cleared before resize/orientation recomputation, then restored only after all four control boxes are written.
- The audio controller now stops the active source as well as suspending AudioContext on lifecycle departure. A generation counter invalidates pending fetch/decode/play operations. Returning does not create or unlock audio without a prior user gesture; the previous track can resume only while the saved music setting remains enabled.
- The service-worker source identifies the V52 shell so existing installations receive a worker update and replacement of the matching V52 cache entries.

## Verification

Post-change verification against the rebuilt source passes: 87 JavaScript files syntax-checked, all 61 regression test files passed, the runtime smoke test booted and played all 15 RLEF stages, and the Level 1 springboard lifecycle proof passed. The ZIP importer validation is run against the final release archive before handoff.

Node-based tests validate the app's actual modules, startup ordering, lifecycle races, importer behavior, RLEF data and stage transitions. The stylesheet was parsed structurally with zero CSS parse or declaration errors. The obsolete V39/V41/V42 responsive patch stack and duplicate live-control block were removed; one V52 responsive-shell section owns layout and pause placement. These checks do not establish visual equivalence on every browser or handset. No claim of physical-device certification is made by this document.

## Manual device checks still required

1. Android Chrome/Firefox: first visit with no saved layout, then a saved custom layout; rotate portrait/landscape and resize the viewport. Confirm there is no default-control flash and the pause button stays in the reserved external gutter.
2. Background the app, switch apps, lock the screen, open an external link and return. Confirm music stops while away and returns only when enabled and previously unlocked.
3. Repeat on iOS Safari and desktop Chromium/Firefox/WebKit where available. Check compact height, narrow width, browser chrome expansion/collapse, safe areas and settings/control-editor dialogs.

