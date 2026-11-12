# Bounce Tales · V17 source-parity build

V16 establishes a repeatable reverse-engineering workflow around the original Bounce Tales 2.0.3 Java ME JAR. It preserves the V15 browser build as the runtime baseline while separating source modules, tests, tooling and reference documentation.

## Repository map
- `src/`: browser runtime modules (engine, physics, collision, rendering, audio, levels, menus). Existing modules are retained while boundaries are documented.
- `assets/`: browser-required extracted game assets. The original JAR itself is not included.
- `reference/`: public, generated metadata only. Do not commit copyrighted decompiled source or the original JAR here.
- `tools/`: JAR inventory, integrity, RLEF and MIDI catalogue tooling.
- `tests/`: deterministic Node.js regression checks.
- `.github/workflows/`: Pages deployment, reference generation and guarded one-time cleanup.

## Generate a reference pack locally
Python 3.10+ required. Keep the original JAR in a private folder outside this repository:
```bash
python tools/build_reference.py /path/to/bounce_tales_2.0.3.jar --output ../BounceTales_Private_Reference
```
The output includes resource hashes, class inventory, PNG dimensions, MIDI headers, language resources, RLEF headers and a searchable index. It does not publish raw class files or the JAR.

For readable Java decompilation, obtain CFR from its official release and run:
```bash
java -jar cfr.jar /path/to/private-extracted/classes --outputdir ../private-reference/decompiled
```
Keep decompiled output private unless you have permission to redistribute it. Obfuscated identifiers are retained alongside proposed semantic labels; labels are hypotheses until verified.

## Tests
```bash
for test in tests/*.cjs; do node "$test" || exit 1; done
```

## One-time repo cleanup
GitHub Actions → **One-time repository cleanup (V16 reset)** → Run workflow. Type exactly `DELETE_REPO_CONTENTS`. It removes tracked files outside `.github/workflows` and preserves all workflow files. This is destructive; create a Git tag or backup branch first.

## Accuracy status
This is a reverse-engineering foundation, not a claim of a complete one-to-one port. The original JAR remains the source of truth. Each translated system should carry source references, confidence and regression tests.


## V17 · decoded atlas, animation parity and soundtrack

V17 is the first build that consumes the Phase 2 decoded sprite atlas in the browser runtime. Static sprite IDs 0–325 are drawn from the verified descriptor table in `src/sprite-atlas.json`; `src/sprite-atlas.js` validates all 326 crop rectangles, offsets and PNG slots against the legacy image map before gameplay starts.

The reference fixtures in `reference/` are compared against the original binary RLEF resources. The regression suite verifies all 105 extracted original resources against SHA-256 hashes and proves parity for 16 level resources, 2,240 object headers, 490 polygon records, 5,776 vertices, 4,306 triangles, and 316 animated objects containing 1,143 exact command streams. The event engine executes those parsed source command streams using the recovered millisecond timing semantics.

V17 also wires the original title, act, boss, bonus, lose and win music resources to the existing browser-rendered audio tracks, adds a music setting, removes title-page build/version clutter, and locks the page to a no-scroll viewport.

**Accuracy boundary:** V17 is materially closer to the supplied source data, but it is not honestly describable as a complete one-to-one recreation yet. Remaining gaps include the full fixed-point multi-contact collision solver and exact rounding, some enemy/friend/boss and event edge cases, complete original water/particle behaviour, pixel-identical camera/parallax and MIDP menu/UI rendering, and device-level comparison against the original Java ME game. A passing parser/regression suite establishes data parity for the tested structures, not full gameplay equivalence.
