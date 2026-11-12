# Bounce Tales HTML5 playable prototype

A mobile-friendly browser prototype built from the original JAR supplied for this project. The original JAR resources are preserved byte-for-byte in `assets/original/`.

## Run
Open `index.html` through a local static web server or deploy the `game/` directory with GitHub Pages. No server-side runtime is required.

## Controls
- Left / Right arrows: move
- Up arrow or Space: jump
- Enter: start / resume
- Escape: pause
- R: restart
- On-screen buttons: touch controls

## Current implementation
- 240×320 logical canvas, scaled responsively for phones
- Playable side-scrolling training stage, jump physics, platform landing, star collection and finish trigger
- Touch and keyboard controls
- Local progress persistence
- Original JAR art resources retained unchanged

## Important fidelity status
This is a **playable prototype**, not yet a complete one-to-one port. The current stage and browser physics are a first playable baseline. Original level-data decoding, exact collision and bounce physics, enemy/object behaviour, original menu flow, animation timing, MIDI event mapping, and save compatibility still need to be translated and validated against the supplied JAR. Do not describe this build as a finished faithful port until those comparisons pass.

## Source and resource notes
The `reverse-engineering/` directory contains the inventory and bytecode inspection notes produced from the supplied JAR. Original binary resources are under `assets/original/`. The game assets remain the property of their respective rights holders.
