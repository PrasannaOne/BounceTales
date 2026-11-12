# Port status · playable prototype

## What works in this build
- Static HTML5 deployment with a 240×320 logical canvas.
- Responsive scaling and phone-friendly touch controls.
- Keyboard input.
- A playable side-scrolling training stage with movement, jump, platform landing, collectibles, a finish trigger, restart and pause.
- Local progress storage.
- Original JAR resources preserved in `assets/original/`.

## Not yet equivalent to the original
- Original level file decoding and all original stages.
- Exact Bounce Tales movement constants, bounce modes and collision response.
- Original player sprite animation and full object/enemy interactions.
- Exact menus, transitions, sound effects and MIDI sequencing.
- Original save format and full progression.
- Frame-by-frame comparison with a reference emulator/device.

## Acceptance checklist
- [ ] Decode and load every original level from the JAR.
- [ ] Match player movement, bounce states, gravity and collision frame-by-frame.
- [ ] Reproduce original menus, level transitions, enemies, hazards, checkpoints and collectibles.
- [ ] Match original sprite frames, draw order, particles and effects.
- [ ] Map all MIDI tracks and sound events to original triggers.
- [ ] Match pause, restart, save/load and progression.
- [ ] Compare all stages against the original JAR running in a reference environment.
- [ ] Test on Android Chrome at multiple screen sizes.

This package is a playable baseline for comparison, not a claim of completed one-to-one fidelity.
