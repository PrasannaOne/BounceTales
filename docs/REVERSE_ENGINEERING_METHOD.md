# Reverse-engineering method

1. Preserve original resource bytes and SHA-256 hashes.
2. Parse container formats (RLEF, PNG, MIDI, language tables) without modifying source data.
3. Decompile class files privately with CFR; retain original class/method/field identifiers.
4. Build a symbol map with evidence: class, method, bytecode offset, resource IDs, observed callers.
5. Translate one subsystem at a time. Record source version, fixed-point scale, timing units and deviations.
6. Add deterministic tests for every discovered rule and compare against original runtime captures where available.
7. Never label an approximation as exact.
