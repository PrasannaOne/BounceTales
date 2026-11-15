# Bounce Tales V54 · shared cannon and audio parity audit

**Release:** 54.0.0  
**Runtime/cache identity:** V54 (`v=54`, `bounce-tales-v54`)  
**Base:** V53 runtime plus the verified decompiled reference archive

## 1. `bu` is shared cannon geometry, not a campaign stage

The original world manager (`m.java`) has a 16-entry scene-resource array whose final entry is resource definition 54, mapped by the reference resource index to resource 108 (`bu`). It loads both the selected campaign resource (`v[e]`) and `v[15]` during level setup. It parses `v[15]` into a shared polygon array. The original `k.java` type-11 cannon renderer reads that shared array, so `bu` is a reusable cannon mesh resource rather than a sixteenth playable chapter.

The decoded `bu` resource contains 13 RLEF objects: one root and 12 type-4 polygon records. The 12 polygons are organized as four corresponding three-part groups:

- Polygons 0–2: first authored cannon pose
- Polygons 3–5: second authored cannon pose
- Polygons 6–8: third authored cannon pose
- Polygons 9–11: mutable render copies used by the original cannon renderer

V53 preserved and parsed `bu` in the reference fixtures but rendered each cannon using a static sprite. V54 now loads `assets/original/bu`, validates its 12 polygon records, and draws those original black, grey and yellow triangles under each cannon object's world transform. The original sprite remains only as a defensive fallback if the shared resource cannot be loaded.

### Cannon firing animation

`k.java` defines three animation segments of **500 ms, 100 ms and 300 ms** (900 ms total). Each segment linearly interpolates the three polygon parts' vertex arrays between the authored poses. The player is launched when the remaining animation timer reaches 300 ms, which is **600 ms after firing begins**. The mesh animation then continues for the remaining 300 ms and resets the shared mutable polygons to the first pose.

V54 ports those timings and preserves the post-launch animation instead of discarding the cannon state at the moment Bounce leaves the barrel. The shared polygon buffer is restored when a new chapter scene is loaded.

## 2. Original MIDI to browser Opus mapping

The reference resource index maps audio resource IDs 28–35 to eight original MIDI files. `o.java` creates a `audio/midi` player, applies its volume, sets the loop count and starts the selected resource. `m.java` supplies the title, chapter, death and victory call sites.

| Resource ID | Original MIDI | Browser Opus | MIDI duration | Opus duration |
|---:|---|---|---:|---:|
| 28 | `aw.mid` | `title.ogg` | 24.042 s | 25.142 s |
| 29 | `ax.mid` | `act1.ogg` | 36.571 s | 37.672 s |
| 30 | `ay.mid` | `act2.ogg` | 22.154 s | 23.254 s |
| 31 | `az.mid` | `act3.ogg` | 29.538 s | 30.638 s |
| 32 | `ba.mid` | `boss.ogg` | 9.333 s | 10.433 s |
| 33 | `bb.mid` | `lose.ogg` | 2.046 s | 3.146 s |
| 34 | `bc.mid` | `win.ogg` | 1.800 s | 2.900 s |
| 35 | `bd.mid` | `bonus.ogg` | 19.200 s | 20.300 s |

The Opus durations are measured from the Ogg granule position after the Opus pre-skip. MIDI durations are calculated from PPQ timing and tempo events. Every converted track has an approximately **1.1-second longer tail** than its source MIDI. This is strong duration corroboration for the mapping, but it does not prove waveform-level or instrument-level identity.

### Trigger and playback parity

- **Title:** resource 28, looped (`o.c(28, -1)`).
- **Campaign:** resource 29, 30 or 31 based on chapter group, looped.
- **Boss chapters:** resource 32 for chapter indices 3, 8 and 13, looped.
- **Bonus chapters:** resource 35 for chapter indices 4, 9 and 14, looped.
- **Death:** resource 33, one-shot (`o.c(33, 1)`).
- **Victory:** resource 34, one-shot (`o.c(34, 1)`).

The chapter-group and exception routing in `resourceForLevel()` matches the original `m.d()` selection logic. The browser controller uses Web Audio buffer sources, with music looping and death/victory cues played once. Page lifecycle suspension remains a browser-specific safety adaptation.

The original `o.java` volume field defaults to 60 and applies that value through `VolumeControl.setLevel`. The bundled `render_midi.py` conversion script already renders the source MIDI through FluidSynth with `synth.gain=0.62`, while the browser controller applies a separate 0.72 master gain. Those controls are not directly equivalent, so V54 deliberately retains the existing browser gain rather than applying another assumed 0.60 multiplier and risking double attenuation. Exact perceived loudness still needs a listening comparison. The original resource catalogue contains eight MIDI tracks; the extracted gameplay audio call sites use the eight mapped resources above. No additional standalone sound-effect resource family is present in that MIDI catalogue.

## 3. Regression coverage

- `tests/original-cannon.test.cjs` parses the actual `bu` binary and verifies all 12 polygon records, vertex/face topology, the three authored poses, interpolation, the 500/100/300 ms segments, the 600 ms launch boundary, the post-launch reset and chapter reload reset.
- `tests/audio-reference-parity.test.cjs` parses all eight MIDI files and Ogg Opus headers/granule positions, verifies the exact resource mapping and duration tail, and checks the title/chapter/death/victory runtime call sites.
- `tests/audio-controller.test.cjs` verifies browser routing, one-shot versus loop behavior, lifecycle handling and the 60% default volume.
- The runtime smoke test loads `bu` through the same local resource path used by the browser build.

## 4. Other preserved binary resources

The original resource archive also contains `be` and `bv`, which are not campaign RLEF scenes. `be` is represented by three type-5 resource entries of 86 bytes each; the original manager queues resource IDs 36 and 37 for loading in one state. `bv` is a separate 26-byte resource with no confirmed direct gameplay call site in the inspected class sources. Both remain preserved byte-for-byte in `assets/original/` and are covered by the original-resource hash checks. Their higher-level purpose is not sufficiently established to invent a browser behavior for them; they remain a documented reverse-engineering follow-up.

## 5. Scope and limitations

V54 does not add `bu` to the chapter list. It is loaded as shared cannon geometry, matching the original manager's level setup. The accepted browser instructions/options and responsive shell are retained. No physical-device parity target is claimed. The MIDI-to-Opus check establishes source mapping and duration correspondence, not exact synthesized timbre or sample-by-sample equivalence.

Run the complete release gate with:

```sh
npm run verify
python3 tools/import_runtime_zip.py Bounce.zip /tmp/bounce-v54-check --validate-only
```
