# Bounce Tales · HTML5 browser port

The current browser build is an incremental port based on the original Bounce Tales 2.0.3 Java ME resources. Build 16 tightens the phone-first presentation and removes document scrolling and build labels from the game screen. It does not claim complete one-to-one gameplay equivalence.

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
