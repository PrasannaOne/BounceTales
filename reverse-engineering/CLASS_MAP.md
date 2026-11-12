# Java class map (tentative)

The original class names are heavily obfuscated (`a` through `r`). These roles are working hypotheses based on bytecode signatures, method calls and referenced platform APIs, not final source-level identifications.

| Class | Current reading | Confidence |
|---|---|---|
| `RMIDlet` | MIDlet lifecycle entry point; starts, pauses and destroys the runtime in `o`. | High |
| `o` | Runtime/thread and platform integration. Contains a run loop and references Nokia `DirectGraphics`, device control and media players. | High |
| `m` | Main game/controller layer. Holds global level/render/game state and extensive update/draw logic. | Medium |
| `c` | Player/physics actor candidate. Contains many float state fields and update/collision methods. | Medium |
| `j` | Sprite/entity base candidate with drawing, transforms, bounds and collision helpers. | Medium |
| `g` | Binary level/tile or scene-resource decoder candidate; parses byte arrays and draws collections. | Low–medium |
| `q` | Language/localization string loader. | High |
| `h` | Collection/route/menu data structure candidate. | Low |
| `a`, `b`, `d`–`i`, `k`–`p`, `r` | Supporting resource, entity, rendering, UI or animation classes. Their responsibilities need call-graph tracing. | Low |
| `n` | Renderable geometry/particle or scene primitive candidate. | Low |

## Important platform dependencies

The bytecode references Java ME APIs (`MIDlet`, `Graphics`, `Image`, `Player`, `Manager`) and Nokia APIs such as `com.nokia.mid.ui.DirectGraphics` and `DeviceControl`. A native HTML port must replace these with explicit browser-side rendering, audio, input and lifecycle code. It must not simply bundle a Java ME emulator.
