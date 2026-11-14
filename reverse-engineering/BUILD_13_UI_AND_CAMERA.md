# Build 13 · UI, input and camera

> **Historical milestone record:** This document describes the state, scope and known limitations of its named build at the time. It is retained as research history and is not a description of the current release unless it explicitly says so.
## Adaptive shell

The 240×320 logical viewport remains constant. CSS changes only the presentation scale and placement: portrait layouts stack canvas and controls, landscape phones place controls beside the canvas, and wider desktop screens place controls in a side column. The canvas keeps a 3:4 ratio.

Menus use DOM buttons layered inside the logical game viewport. This means menu actions are touch/mouse targets without adding permanent menu buttons to the gameplay control pad. The gamepad and keyboard share the same original key-ID input state as touch controls.

## PC controls

- A/D and Left/Right: left/right game actions.
- Space/Enter: primary action or menu select.
- Shift/Q/*: original star/form action.
- Escape: original pause softkey.
- Standard browser Gamepad API mapping: D-pad/left stick, A, B and Start.

The gamepad is polled in the existing animation loop and emits input edges only on state transitions. Touch pointer capture and release behavior remain in place.

## Camera spring

The readable reference implementation's camera update uses target velocity anticipation, a one-fifth-screen vertical offset, and 15 ms substeps with default spring/stabilization parameters 90 and 140. Build 13 translates the structure into `src/original-camera.js` and keeps rendering on `requestAnimationFrame`. The simulation delta still comes from elapsed time, not a fixed 60 Hz clock.

This translation works in world units rather than the original LP32 matrix arithmetic. Its timing and structure are source-derived, but exact pixel-for-pixel camera results are not claimed until compared to the original runtime on device.

## Test coverage

- `tests/camera.test.cjs`: target prediction, one-fifth screen offset, spring easing, 15 ms cadence and snap behavior.
- `tests/responsive-ui.test.cjs`: desktop/landscape CSS breakpoints, no-scroll settings, touch menu controls, keyboard/gamepad and swipe hooks.
- `tests/original-input-map.test.cjs`: original Java ME IDs plus A/D, W, Space, Shift/Q desktop aliases.
- `tests/runtime-smoke.cjs`: all 15 RLEF stages load, start, render-loop and enter pause.
