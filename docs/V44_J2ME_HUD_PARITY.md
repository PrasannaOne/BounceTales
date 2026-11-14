# Bounce Tales V44 · J2ME HUD and menu parity

## Reference evidence
The supplied decompiled J2ME reference identifies `m.java` as the world/HUD owner and `o.java` as the MIDP GameCanvas/platform shell. The original in-game HUD draw path in `m.java` draws sprite 102 (egg), the egg count, sprite 101, the score count, sprite 103 (clock), and elapsed minutes/seconds along the top edge at the original 240×320 logical resolution. The exact numeric fields are obfuscated; the browser port uses its existing collected-egg state, progression score formula, and elapsed gameplay clock rather than claiming an unproven field-name mapping.

## V44 changes
- Reintroduced an in-game egg / score / elapsed-time HUD using the original sprite atlas icons (IDs 102, 101, 103).
- HUD text is drawn on the existing DPR-scaled `#game-text` overlay, with a high-contrast outline and the 240×320 logical coordinate grid.
- Removed the overlapping browser-authored level/egg status line from the gameplay view; the original-style HUD owns that top row.
- Simplified the pause menu to Continue, Restart, Options, and Main Menu. Existing restart and main-menu confirmation flows are retained.
- Existing chapter book, high-score, guide, options, confirmation, story-message and completion tally scenes remain in place.

## Non-regression boundaries
No physics, trampoline, fixed-step timing, smooth-motion interpolation, RLEF parser/data, level assets, or touch-control/editor code was changed. Existing CSS rules were retained; V44 adds only a narrow status-line suppression rule for the new HUD.

## Verification
Run the repository Node.js test suite from the project root. This is source-level verification; it is not a physical-device visual test.
