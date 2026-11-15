# Bounce Tales V57 · original event-flag and sprite-effect parity

**Release:** 57.0.0  
**Runtime/cache identity:** V57 (`v=57`, `bounce-tales-v57`)  
**Base:** V56

## Scope

V57 follows the decompiled RLEF event interpreter into a concrete runtime mismatch. It corrects opcode 29's packed object-flag semantics and restores the special animated-particle effect emitted for a specific original sprite resource. It does not change campaign data, player physics constants, menus, touch controls, cannon behavior or the soundtrack map.

## Source trace: opcode 29

The original `g.java` opcode-29 branch reads the target object ID, a 32-bit selector and a 32-bit value. Its selectors do not all behave as ordinary bit masks:

| Selector | Original behavior | Browser behavior in V57 |
|---:|---|---|
| `0x01` | Replace the complete low five-bit render-depth value, then set cached depth to `(flags & 31) - 16` | Same packed replacement and cached-depth update |
| `0x20` | Replace only bit 5 | Same |
| `0x80` | Replace only bit 7; run the image-358 particle path for a matching type-5 sprite | Same visibility-bit update and source-effect dispatch |
| `0x100` | Replace only bit 8 | Same |

V56 incorrectly applied the full selector as a conventional bit mask. For selector `0x01`, that changed bit zero only and left the other four depth bits untouched. This could produce incorrect draw ordering after scripted object changes. The browser renderer already sorts by the low five-bit depth value and suppresses objects whose bit `0x80` is set; V57 now feeds those paths correctly.

## Campaign evidence

The original 15 playable RLEF resources contain **140 opcode-29 commands**. Their selector distribution is:

| Selector | Occurrences |
|---:|---:|
| `0x01` | 4 |
| `0x20` | 21 |
| `0x80` | 87 |
| `0x81` | 25 |
| `0xA0` | 1 |
| `0xA1` | 2 |

The `0x81` and `0xA1` cases are important: they update the five-bit depth group and another packed flag in the same command. The regression test re-parses the original level resources, checks the selector distribution, and verifies that the special image-358 path has 14 authored command occurrences.

## Source trace: image-358 fragment effect

When selector `0x80` is processed for a type-5 sprite object whose first image ID is `358`, original `g.java` calls the shared emitter `m.h`. The emitter is configured in `m.java` with:

- 24 particle slots;
- source image families `[390, 414, 396]`;
- emitter mode 4 and drag parameter 35;
- a lifetime base of 2040 ms and a 510 ms variation;
- an emission speed argument of 840 and a 360-degree angular spread centred on zero (the signed remainder produces directions across the full circle).

The image-map data identifies each of the three source families as a five-frame animation. V57 restores this source-specific path in `src/game-particles.js` and renders fragments through the existing original image-map renderer. The spawn region uses the transformed image-358 sprite's source bounds inset by 60 source units, as in the original event handler.

The browser implementation preserves the source particle count, image families, frame sequence, full-circle angle spread and lifetime configuration. The browser's random generator and wall-clock/fixed-step integration are not the J2ME random generator or handset timing loop; velocity conversion, drag and turning are therefore documented as adaptations, not exact deterministic parity.

## Files changed

- `src/event-engine.js` — source-compatible packed selector updates and image-358 effect dispatch.
- `src/game-particles.js` — animated original sprite-fragment emitter and render callback.
- `game.js` — source-object world-position routing and original image-map drawing.
- `tests/event-flag-parity.test.cjs` — focused semantics and all-15-level command census.
- `tests/original-sprite-fragments.test.cjs` — particle count, sprite IDs, bounds, lifetime, motion, animation and draw-path checks.
- `index.html`, `sw.js`, `package.json` — consistent V57 release/cache identity.
- `README.md`, `ARCHITECTURE.md`, `docs/PROJECT_GUIDE.md` — current release and maintenance notes.

## Verification

V57 local verification:

- JavaScript syntax check: passed.
- Regression suite: **67/67 test files passed**.
- Runtime smoke: all 15 playable campaign stages boot, play and pause in the harness.
- Level 1 springboard lifecycle proof: passed.
- Reference census: all 140 opcode-29 commands parsed; 14 matching image-358 effect calls found.

These checks prove the specific source crosswalk and protect the implemented behavior. They do not establish 90% overall game parity, exhaustive original handset equivalence, or successful GitHub Actions/live-site deployment. The exact semantic labels of the three `be` records and all fields of `bv` remain partially unresolved as documented by V56. The resource index identifies `bv` as a 26-byte type-8 entry. Separately, `o.java` contains a type-6 table parser that populates a short-array table later consumed by `m.g(int)` to queue resource IDs. The supplied source does not yet establish that this parsed table originates from `bv`; the numeric resource-index type and the parser selector are separate fields. V57 therefore retains the verified `bv` structure and music-ID correspondence without claiming a proven runtime consumer.
