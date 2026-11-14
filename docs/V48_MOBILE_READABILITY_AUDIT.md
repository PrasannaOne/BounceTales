# Bounce Tales V48: mobile HUD and dialogue polish

## Scope
V48 is a small presentation-only refinement of the V47 documentation-refresh baseline. It does not change game physics, level data, sprite mappings, progression, touch-control geometry, or the original PWA artwork.

## Changes

### Pause control clearance
The in-game pause button moved from `top: 22px` to `top: 32px` within the 240×320 game viewport. This clears the original clock sprite and right-anchored timer digits instead of competing for the same top-right HUD space.

### Story dialogue readability
Original story dialogue retains its Courier-style presentation, but the text size increased from 7px to 8.2px in logical game coordinates. The dialogue panel was moved slightly upward and increased in height, line spacing increased to 12.5px, and the action prompt was enlarged slightly. Up to six lines are now rendered within the panel. This is a restrained readability improvement, not a replacement of the original dialogue content.

### Field messages and field guide
Transient gameplay messages use 10px text with proportionally increased line spacing. The in-game field guide body text was increased modestly while retaining its existing layout.

## Protected systems
No changes were made to `style.css` rules other than the pause-button top offset; no changes were made to the physics, fixed-step timing, camera, trampoline, collision, RLEF level files, original assets, or touch-layout implementation.

## Verification
- 51/51 `*.test.cjs` test files passed.
- Runtime smoke passed for title, touch-layout editor drag/resize/save/reset, and all 15 playable stages through boot/play/pause.
- Level 1 RLEF springboard lifecycle proof passed in Node.js.
- `game.js` and `sw.js` syntax checks passed.
- Service-worker and asset cache query versions updated to V48.

## Device note
The layout and rendering changes were validated in source/runtime tests. A physical Android screenshot comparison is still required to certify the final font appearance and pause-button clearance on the target handset/browser.
