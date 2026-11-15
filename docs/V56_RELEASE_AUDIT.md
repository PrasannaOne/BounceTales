# Bounce Tales V56 · supplemental resource fidelity audit

**Release:** 56.0.0  
**Runtime/cache identity:** V56 (`v=56`, `bounce-tales-v56`)  
**Base:** V55

## Scope

V56 is a reference-led investigation of the previously under-documented original `be` and `bv` resources. It preserves the V55 gameplay, UI, cannon, audio, share behavior, touch layout and deployment contract.

## Findings

- `be` is resource-index type 5 and comprises three 86-byte records at resource indices 90, 91 and 92. The original world manager's `m.c(1)` state branch explicitly preloads groups 37 and 36; no direct `o.e(38)` call or semantic name for the records was established.
- `bv` is resource-index type 8 at resource index 109. No direct `o.e(55)` call was found in the examined decompiled source. Its 26 bytes decode to thirteen big-endian unsigned 16-bit values: `3, 8, 28, 29, 30, 31, 32, 33, 34, 35, 1, 7, 0`.
- The eight middle values, 28–35, match the original MIDI resource IDs and the eight source MIDI identities already wired to browser audio.
- The resource-index type-8 path is distinct from RLEF scene-object type 8. The `c(true)` constructor is for the latter; it must not be assigned to the standalone `bv` resource based on the shared number.
- Both original files were already present in `assets/original/`. V56 records their structure and adds a regression test. No unsupported runtime consumer is invented.

## Files added/updated

- `reference/supplemental-resource-audit.json`
- `tests/supplemental-resource-parity.test.cjs`
- `docs/V56_SUPPLEMENTAL_RESOURCE_AUDIT.md`
- `reference/README.md`
- `README.md`, `ARCHITECTURE.md`, `docs/PROJECT_GUIDE.md`
- `index.html`, `sw.js`, `package.json`

The V55 release audit remains as a historical record.

## Verification

Final verification passed: 92 JavaScript files syntax-checked, 65/65 tests passed, all 15 RLEF stages passed the runtime smoke harness, and the Level 1 springboard lifecycle proof passed. Automated parity confirms the original bytes and decoded structures; it does not claim that the exact gameplay consumer of the `be` records or every `bv` field has been established.
