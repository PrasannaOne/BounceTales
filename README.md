# Bounce Tales · V21 browser port

An independent HTML5 browser recreation of Bounce Tales 2.0.3 Java ME, built from the supplied Phase 2 reference archive and decoded game resources.

## Run locally

Serve this folder from a local HTTP server or deploy it to a static HTTPS host. The service worker and offline installation require a secure context (`https://` or `localhost`); opening `index.html` directly with `file://` is not supported.

```bash
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## V20.1 changes

- Keeps the original Nokia/J2ME menu styling and pixel-art sprites while rendering all canvas menu and message text on a separate high-density text layer. The logical 240×320 game coordinate system and original sprite scale are unchanged.
- Keeps the original JAR launcher icon artwork byte-for-byte at `assets/original/icon.png`; root PWA and Apple touch icon sizes are neutral, nearest-neighbour enlargements of that exact legacy icon rather than newly invented artwork.
- Replaces the previous busy social preview with a restrained 1200×630 banner using the game logo, dark forest palette and concise browser-play message.
- Adds an optional `Support Bounce Tales` link to Settings → About → Ko-fi. It opens the creator's Ko-fi page externally; there are no donation prompts or update-frequency promises.
- Adds a touch-control editor in Settings. Players can drag ◀, ▶, JUMP and * within a preview, adjust each control from 75% to 130%, save a device-local layout, or reset to the default.
- Adds high-density text rendering without smoothing or redrawing the original pixel-art sprite resources.

## V20 changes

- Preserves the verified 326-entry sprite catalogue, 1,143 decoded animation command sequences, 16 RLEF level resources, and original audio/resource files. The source resource set remains hash-verified.
- Fixes the Level 1 springboard contact test to use the original actor collision bounds. The V19 centre-only test waited until the player centre crossed local `y=95`; the Java actor collision uses its radius, so the lower edge contacts the spring while the centre is still at `y=95+radius`.
- Keeps the JAR's axis convention intact: world Y is positive upward, and the canvas projection negates world Y. The trampoline launch velocity is therefore positive in world coordinates and produces negative screen/canvas Y displacement.
- Adds a deterministic Misty Morning spring trajectory regression using the actual decoded Level 1 trampoline strength and nearby cliff geometry. It verifies the launch is finite, upward, and has enough vertical rise to clear the tested ledge.
- Retains bounded collision/animation loops, the springboard watchdog, and radius-aware downward-only spring contact.
- Removes the title-logo white matte using a separate transparent derivative. The original JAR `j.png` resource is left unchanged; it is opaque white in the supplied archive, so the transparent edge matte is a derived presentation asset, not original PNG alpha data.
- Separates the title-screen `SOUND` control and `TAP OR PRESS ACTION` prompt so their hit areas and labels no longer overlap.
- Adds a persistent Smooth Motion setting (OFF by default). OFF renders the latest discrete simulation tick; ON interpolates only the rendered position between fixed simulation ticks. The underlying simulation remains fixed at 60 Hz in either mode.
- Adds Auto / 30 / 60 / 90 / 120 FPS display caps. Changing the display cap does not reset or change the fixed simulation clock.
- Adds root-level `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, and a 1200×630 `og-preview.png`, plus Open Graph and Twitter preview metadata. V20.1 restores the original icon artwork for the install icons.
- Updates the PWA manifest and offline service worker cache for the V20.1 shell, original-icon install assets, logo derivative and social preview.
- Preserves the no-scroll viewport, safe-area handling, separate touch controls, canvas-to-controls breathing room, and the enlarged `*` control.

## Controls

- Hold left/right to move.
- Hold JUMP to jump/bounce.
- Tap `*` to cycle an unlocked form.
- Tap the in-game pause control to pause.
- Keyboard: A/D or arrow keys to move, Space/Enter to jump, Shift/Q to change form, Escape to pause.
- Standard gamepads are supported where the browser exposes the Gamepad API.
- To customise touch controls, open Settings → Customize touch controls. Drag a control to reposition it, select it to resize, then save. Layout changes are local to the current browser/device.

## Regression tests

With Node.js installed, run:

```bash
for test in tests/*.cjs; do node "$test" || exit 1; done
```

The suite checks original resource hashes and decoded level/animation structures; all 15 campaign levels boot, play and pause in the headless runtime smoke test; event opcode coverage; physics/collision, water, enemies, springboard animation and a Level 1 spring trajectory; menu/input/settings behavior; responsive no-scroll layout; and PWA/metadata asset references.

The V20.1 UI regression also checks the separate high-density text layer, untouched original icon, new social preview, Ko-fi link, and touch-layout editor. All 38 regression scripts pass, and the project JavaScript files pass syntax checks. These automated checks are not a complete exhaustive playthrough of every route, enemy encounter, stage-clear sequence, or real-device interaction. The springboard trajectory check exercises the decoded source object and physics model, not every possible approach angle in the browser.

## Accuracy and known limitations

This is a source-informed browser port, not a certified or pixel-identical reproduction of every Nokia MIDP runtime. The source resource and animation data are preserved and tested, and the new springboard path is checked against the decoded Level 1 resource. However, full level-by-level completion routes, every specialized trigger and enemy state, and pixel-perfect menu/layout parity still need side-by-side validation against the original JAR. Browser audio and input also differ from native MIDP devices. Physical Android/iOS testing remains necessary.

## Intellectual property

The original Bounce Tales sprites, illustrations, audio, fonts, levels, resource data and related game materials are not relicensed by this project. They remain the intellectual property of their respective owners, including Nokia and/or Rovio as applicable. This project is independent and is not affiliated with, sponsored by, or endorsed by Nokia or Rovio. See [`LICENSE`](LICENSE) for the scope of the MIT license on the original reimplementation code only.


## V21 audit and polish

- Fixed the About support card layout and added the full optional Ko-fi explanation in a readable stacked card.
- Rebuilt the favicon and install icons by exact pixel-art enlargement of the original JAR launcher icon. No new character details or text were introduced; the original source icon remains unchanged.
- Replaced the social preview with a minimal image-only 1200×630 composition without overlay copy.
- Added campaign object-type coverage and a live-loop simulation test that runs the production `game.js` update function for 720 ticks on each of the 15 campaign resources (10,800 total) with synthetic movement/jump input.
- 40 Node regression scripts pass, and all project JavaScript files pass syntax checks.

The live-loop test is not a complete stage-clear playthrough and does not run in Chromium. The installed headless Chromium could not initialize in this environment because its GPU process failed to start. Physical mobile testing and natural exit-route playthroughs remain outstanding. See `V21_AUDIT.md` for the source audit, exact test scope and remaining parity gaps.
