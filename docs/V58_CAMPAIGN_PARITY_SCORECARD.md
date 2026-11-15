# Bounce Tales V58 · campaign parity scorecard

**Base:** V57. Campaign resource bytes remain unchanged. V58 adds a source crosswalk, a full 0–32 synthetic command-behavior regression, and the canonical site share target; it does not revise the player-physics algorithm.

## Verified campaign surface

| Area | Verified result | What it proves |
|---|---:|---|
| Playable campaign | 15/15 RLEF stages | Every playable stage resource is present and parsed by the runtime. |
| Scene object kinds | 11 runtime categories | Every object kind observed in the 15 stages has a named runtime handler. |
| Event scripts | 316 events / 1,143 commands | The campaign command corpus is enumerated from the original stage bytes. |
| Event opcode coverage | 26 opcodes occur in campaign | Counts are pinned by `campaign-opcode-profile.test.cjs`. |
| Event interpreter | Opcodes 0–32 have runtime cases; synthetic behavior checks exercise every opcode | The new `event-command-semantics.test.cjs` covers command effects and timing against source-derived expectations. It is not a byte-for-byte JVM replay. |
| Packed flag updates | 140 opcode-29 commands | V57 tests the source-derived selector/depth semantics against the campaign corpus. |
| Command semantics | 33/33 opcode values | Synthetic behavioral checks exercise every implemented command, including cases not observed in the 15 playable stages. |
| Source crosswalk | 19 original classes indexed (18 application classes plus `RMIDlet`) | `V58_SOURCE_CROSSWALK_AUDIT.md` maps source roles to browser modules and records where the mapping is approximate. |
| Share destination | Canonical GitHub Pages URL | Share sheet and clipboard fallback use the same trailing-slash URL as the page metadata and home link. |
| Image-358 fragments | 14 authored matching commands | V57 restores and tests the source-specific fragment effect. |
| Special target commands | 2 opcode-26 commands | Both target object 107, parsed as the player object, in stage `br`. |

## Opcode profile

The campaign uses opcodes `0–8`, `12`, `14–21`, and `23–26`, plus `29–32`. The following implemented interpreter cases do not occur in the 15 playable campaign scripts: `9–11`, `13`, `22`, `27`, and `28`. Opcode 22 is confirmed as an intentional no-op in the supplied `g.java` source. Absence from these stages is not proof that the opcode is unnecessary in other original game states or resources.

## What this scorecard does not claim

This is a traceable coverage inventory, **not a weighted 90% parity score**. The synthetic command tests establish the tested effects of each JavaScript opcode handler, but do not execute the original JAR and browser runtime side by side. The inventory does not establish that every handler reproduces all original arithmetic, timing, object side effects, collision edge cases, rendering order, audio synthesis, save-state behavior, or menus pixel-for-pixel. Campaign corpus coverage, command-case coverage and resource integrity are overlapping measures and must not be added together as if they were independent percentages.

The remaining high-value fidelity work is source-to-runtime differential verification of the collision/physics response, animated object update/render paths, and the unresolved `be`/`bv` resource consumers. The V56 supplemental resource audit records why those opaque payloads have not been assigned invented meanings.

## Verification

Run `npm run verify`. The campaign profile test reads all 15 playable RLEF files and pins exact command counts and object targets. The semantic test runs each opcode from 0 through 32 against controlled synthetic objects. V57's existing tests and smoke proofs remain in the gate.
