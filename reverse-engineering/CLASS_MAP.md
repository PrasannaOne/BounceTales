# Class map (updated from bytecode call paths)

The original class names are obfuscated, so the original identifiers and method descriptors are retained. These roles are now supported by direct bytecode call paths rather than only by class shape.

| Class | Evidence-backed role | Confidence |
|---|---|---|
| `RMIDlet` | Java ME MIDlet entry point. `startApp`, `pauseApp` and `destroyApp` delegate lifecycle events to `o.h(int)` / `o.a()`. | High |
| `o` | Runtime platform layer. Extends `GameCanvas`, owns the run loop, key normalization/event collection, graphics/image loading, Java ME audio players, RecordStore access and Nokia API calls. | High |
| `m` | Main game controller. Owns the active actor reference, menu/UI state, per-frame update and draw/state transitions; dispatches active gameplay inputs to `c`. | High |
| `c` | Main actor/player class. Extends `j`; receives left/right and primary action calls from `m`, holds three indexed modes and mode-dependent numeric parameter arrays. | High |
| `j` | Shared entity/sprite base class. `c` and `g` extend it; it supplies common positioning/rendering/entity state. | Medium–high |
| `g` | A concrete `j`-derived scene/entity record. Its `a(byte[],int)` parser reads fixed-point fields, flags, a short and nested byte arrays; it is not established as the whole level loader. | Medium |
| `h` | Menu/widget data and navigation object, held by `m` and called to build, update and navigate menus. | High |
| `q` | Localization string loader. Reads `lang.<locale>`, falls back to `lang.xx`, resolves offset-indexed UTF strings. | High |
| `k` | Secondary actor/controller used in an alternate game-state branch; its complete gameplay role remains to be mapped. | Low–medium |
| `f` | Menu item/callback object constructed by `m` and attached to `h`. | Medium |
| `n`, `p`, `r`, `a`, `b`, `d`, `e`, `i`, `l` | Supporting rendering, animation, data or UI classes; responsibilities still need focused call-site analysis. | Low–medium |

## Platform interfaces that a browser port must replace

The bytecode references Java ME `MIDlet`, `GameCanvas`, `Graphics`, `Image`, `Player`, `Manager` and `RecordStore`; it also references Nokia `DirectGraphics` and `DeviceControl`. The browser port needs replacements for rendering, lifecycle, audio, input and persistent saves. The input mapping is now separately recovered in `INPUT_TRACE.md`.
