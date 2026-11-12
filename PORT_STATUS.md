# Bounce Tales · Build 04 status

## Actual website changes
- Replaced the generic control row with five source-backed touch controls: Left, Right, Action, Mode (`*`) and Pause.
- Integrated a JavaScript translation of the JAR key normalization and held/edge input model.
- Browser arrows feed the same normalized IDs as the original Java ME directional actions.
- Pause routes through original internal ID 5 (Nokia key code -7).
- Mode-cycle routes through original ID 20 (`*`) and follows the observed 0-2 index cycle.
- Preserved the proportional 240×320 logical viewport.

## Exact versus provisional
- Exact bytecode-derived mapping and input-state boundary: key IDs, directional mapping, numeric remap profile, held-key semantics, pause event and mode-cycle event.
- Provisional: training world, player shape, physics, collision, stars, goal and placeholder interpretation of primary action as jump.
- Original actor mode effects, levels and complete controller state machine remain unported.

## Next port targets
1. Actor update and collision methods in `c`, shared entity/collision code in `j`/`d`.
2. Controller state transitions and scene loading in `m`.
3. RLEF payload decoding and mapping to original stage/scene data.
4. Image-index mapping to sprite animations, tiles and UI.
5. MIDI playback triggers and save/progression.
6. Replace provisional systems with translated original systems and verify against a Java ME reference run.
