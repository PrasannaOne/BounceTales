# Build 03 verification record

> **Historical milestone record:** This document describes the state, scope and known limitations of its named build at the time. It is retained as research history and is not a description of the current release unless it explicitly says so.
Verified in the build workspace against the uploaded original JAR:

- 106 non-directory JAR entries found.
- All 106 entries exist under `assets/original/` with matching SHA-256 hashes.
- 19 bytecode disassemblies regenerated directly from the JAR with `javap -c -p -s`.
- 16 resources identified by `RLEF` magic; version/reserved/header field pairs inventoried.
- 47 PNG headers and dimensions inventoried.
- 8 MIDI headers, track counts, format values and division values inventoried.
- JavaScript input mapper tests: 5 tests passed, 0 failed.

Commands used:

```bash
python3 tools/inspect_bounce_jar.py /path/to/original.jar --assets assets/original
./tools/regenerate_bytecode.sh /path/to/original.jar reverse-engineering/bytecode
node --test tests/original-input-map.test.js
```

This verification establishes resource identity and the listed bytecode findings. It does not establish full gameplay equivalence; that still requires complete RLEF decoding, remaining game-state reconstruction and reference-runtime comparison.
