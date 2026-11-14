# Reverse-engineering notes

> **Historical milestone record:** This document describes the state, scope and known limitations of its named build at the time. It is retained as research history and is not a description of the current release unless it explicitly says so.
## Source of truth

The only primary binary used for this pass was the supplied `bounce_tales_240x320-269519.jar`. Its full archive content is preserved under `assets/original/`. Every one of the 106 archive files was verified byte-for-byte against that folder using SHA-256.

## Work completed in this pass

1. Regenerated `javap -c -p -s` disassemblies for all 19 obfuscated classes.
2. Traced JAR key normalization, key press/release semantics, held-key state, active gameplay polling and discrete pause/mode-cycle events.
3. Decoded the original pause-menu string IDs through the included fallback language resource.
4. Identified all 16 `RLEF` binary payloads and extracted their leading header fields without claiming the complete format is solved.
5. Recorded exact three-mode actor parameter arrays from `c.class`.
6. Inventoried PNG and MIDI dimensions/headers, localization resources, runtime audio players and RMS save API calls.
7. Added a tested JavaScript implementation of the recovered input normalization in `src/original-input-map.js`.

## Reproduce the analysis

```bash
python3 tools/inspect_bounce_jar.py /path/to/original.jar --assets assets/original
./tools/regenerate_bytecode.sh /path/to/original.jar reverse-engineering/bytecode
node --test tests/original-input-map.test.js
```

The analysis scripts require only Python's standard library; bytecode regeneration requires a JDK with `javap`; input tests require Node.js 18 or newer.

## Still open

- Decode complete RLEF payloads and link each file to the corresponding level/stage.
- Trace every `c` physics array read to named behaviour and compare its three modes.
- Identify which sprite/image indexes correspond to the player, level tiles, effects and menus.
- Map each MIDI resource to its actual game/menu trigger and any sound effects.
- Recover all level object, enemy, collision, checkpoint and progression logic.
- Reproduce the Java ME RecordStore save schema and verify state transitions against an original runtime.

At the time of this early research pass, the browser prototype did not yet execute the original game engine. The current repository has since evolved into a playable browser implementation; consult the root README and ARCHITECTURE.md for the present runtime. The findings above remain a historical record of this build.
