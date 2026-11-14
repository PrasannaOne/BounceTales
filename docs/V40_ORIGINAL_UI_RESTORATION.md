# V40 original UI and dialogue restoration

V40 is based on the stable V39 package. The existing page shell, header, responsive game viewport, touch-control editor, physics, fixed-step clock, sprites, audio, and progression modules are retained.

## Original JAR content now used by the UI

- Main menu, chapter selection, high scores, instructions, options, pause, and chapter-complete scenes continue to render inside the original 240 × 320 game canvas.
- Main-menu, chapter-selection, pause, completion, and confirmation labels now use the original indexed language strings where the JAR provides them.
- The Instructions screen now uses the original JAR instruction paragraphs rather than browser-authored substitute instructions.
- Chapter completion now evaluates the original per-level egg and time trophy requirement tables, displays both challenge outcomes, and surfaces original unlock/high-score/story notices.
- Pause actions include Resume, Restart Chapter, Chapter Selection, Quit, and Sound. Destructive/exit actions use the original JAR confirmation prompts.
- RLEF message commands now suspend their owning event until the player advances the dialogue. Multiple simultaneous event messages are queued and resumed one event at a time, preventing messages from being overwritten or scripts running through dialogue.
- The language selector supports all 11 language resources included in the supplied JAR. Auto uses a supported device locale when available and otherwise falls back to the original English `xx` resource.

## Source fidelity checks

- All 16 playable RLEF resources (`bf` through `bu`) are retained byte-for-byte against the supplied JAR reference.
- All 11 language resources are retained byte-for-byte against the supplied JAR reference.
- Original source-language indices are used directly; no new translation strings are fabricated for the game narrative.
- Existing V39 responsive layout, header, original image atlas, title art, app icons, web preview, audio and touch-control persistence are preserved.

## Verification

- Node.js syntax validation is run for all JavaScript files.
- The full Node.js regression suite covers the game systems, original resource parsing, progression, controls, cache wiring, and modal event dialogue.
- No Chromium launch or bot simulation is used for this build. This is source-level and Node.js verification, not a claim of a fresh physical-device visual test.

## Known scope boundary

This restoration makes the original JAR's indexed text, level-event dialogue, menu actions, challenge thresholds, and available screens part of the browser UI. It does not claim pixel-identical rendering of every MIDP handset/font/device variation. Browser presentation remains responsive while the game canvas preserves its original 240 × 320 coordinate space.
