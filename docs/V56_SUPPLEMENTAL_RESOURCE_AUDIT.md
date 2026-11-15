# V56 supplemental resource fidelity audit

## Scope

V56 investigates the two original JAR resources previously retained without a role note: `be` and `bv`. This pass is deliberately evidence-led. It does not turn an index type number into a scene-object type, and it does not invent a runtime consumer where the decompiled call path does not establish one.

## Confirmed from the supplied JAR reference

| Resource | Resource-index type | Resource entries | Payload |
|---|---:|---|---|
| `be` | 5 | 90, 91, 92 | 258 bytes, three consecutive 86-byte records |
| `bv` | 8 | 109 | 26 bytes, thirteen big-endian unsigned 16-bit words |

`be` is split by the original `/a` resource index into three 86-byte records at offsets 0, 86 and 172. The decompiled world manager's `m.c(1)` state branch explicitly preloads resource groups 37 and 36 (`o.e(37)`, `o.e(36)`). No direct `o.e(38)` call or definitive semantic label for the three payloads was established. All three record hashes and the call-site evidence are retained in [`reference/supplemental-resource-audit.json`](../reference/supplemental-resource-audit.json).

`bv` decodes to:

`[3, 8, 28, 29, 30, 31, 32, 33, 34, 35, 1, 7, 0]`

The eight values 28 through 35 match the original MIDI resource IDs and the eight MIDI-to-browser-audio identities already represented by `src/audio-controller.js`. This is a strong correspondence, not proof of the complete meaning of the header/trailer words. No direct `o.e(55)` call was found in the examined source.

## Important type-system distinction

The resource-index type values handled by the platform resource loader in `o.java` are not the same thing as the per-object type values inside an RLEF scene stream. In particular, the `c(true)` construction in `m.java` is reached for an RLEF scene-object record whose object type is 8. It does **not** prove that the standalone `bv` resource is itself a `c(true)` scene object. The file-level resource loader reads the `bv` type-8 entry as raw bytes.

## Runtime impact

- Both files were already present in `assets/original/` and remain byte-for-byte preserved.
- The V55 audio controller already maps the eight MIDI IDs 28–35 to their browser audio counterparts. V56 adds a regression check that the `bv` embedded ID sequence matches those existing source identities.
- The 214 dynamic sprite IDs (326–539) remain represented in the runtime image map. The reference catalogue explicitly treats their payload encoding separately from the 326 static sprite descriptors.
- No new gameplay behavior is added for `be` or the trailing `bv` fields because the supplied decompiled source does not yet establish a safe, complete consumer contract. Guessing here could create false behavior rather than improve fidelity.

## Verification added

`tests/supplemental-resource-parity.test.cjs` verifies:
- all three `be` records, offsets, lengths and hashes;
- the complete `bv` word sequence and hash;
- correspondence between `bv` values 28–35 and the source MIDI IDs used by the audio controller;
- continued coverage of all 214 dynamic sprite IDs in the runtime image map.

This closes the preservation and structure gap. The exact semantics of `be` and the non-music `bv` words remain an explicit research item rather than an unsupported claim.
