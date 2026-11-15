# Bounce Tales V57 release audit

**Release:** 57.0.0  
**Base:** V56  
**Runtime/cache:** `v=57`, `bounce-tales-v57`

## Changes

- Corrected RLEF opcode 29 packed flag semantics to match the original `g.java` handler, including complete replacement of the low five-bit depth field for selector `0x01`.
- Restored the source-specific 24-particle image-358 fragment effect using original animated sprite families 390, 414 and 396.
- Added reference-backed tests covering the selector semantics, the 140 opcode-29 commands in all 15 campaign stages, and the 14 matching image-358 effect calls.
- Updated release metadata, cache identity, README, architecture and project guide.

## Verification

- Syntax: 94 JavaScript files checked, zero failures.
- Regression: 67/67 test files passed.
- Runtime smoke: all 15 playable RLEF stages boot, play and pause.
- Springboard lifecycle proof: passed.

## Scope and limitations

No campaign resource bytes, player physics constants, menus, touch-control layout, cannon implementation or soundtrack mapping were changed in this release. The particle RNG, timing conversion, drag and integration remain browser adaptations. V57 does not claim 90% measured parity or exact original-device equivalence. The precise semantic labels of `be` and complete caller/field semantics of `bv` remain open research items; see [`V56_SUPPLEMENTAL_RESOURCE_AUDIT.md`](V56_SUPPLEMENTAL_RESOURCE_AUDIT.md).

GitHub Actions and live-site deployment have not been verified by this local build.
