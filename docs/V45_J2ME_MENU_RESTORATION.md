# Bounce Tales V45 · J2ME menu presentation restoration

## Reference basis
The supplied decompiled JAR identifies `h.java` as the original menu/list widget and `f.java` as its menu-item model. `h.d()` shows rectangular clipping, row-level selection/highlight rendering, item sprites, and scroll indicators (original sprite IDs 150 and 151). The menu scenes are assembled by `m.java` using localized strings and item flags rather than modern card-style UI.

## V45 changes
- Replaced rounded modern canvas menu buttons with hard-edged MIDP-style rectangular rows.
- Reused the original atlas highlight strip (sprite 10) for focused menu rows and original ornamental divider (sprite 89) on menu panels.
- Replaced rounded card panels with square, wood-toned panels consistent with the original title/chapter-book palette.
- Applied the same presentation to title, pause, completion, guide, scores, options, and confirmation menus.
- Kept localized JAR text, menu actions, progression, and existing scene flow intact.
- Updated resource query strings and service-worker cache to V45.

## Non-regression
No physics, trampoline, fixed-step simulation, smooth-motion interpolation, RLEF level data, touch-control geometry, or live layout editor source was changed. `style.css` was retained without deleting rules.

## Scope
This is a source-informed visual restoration of the menu presentation using original atlas elements and original menu widget behavior. It does not claim a pixel-identical reconstruction of every MIDP device/font configuration. Physical-device visual testing remains outstanding.
