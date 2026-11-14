# V39 UI recovery

V39 restores the complete V37 stylesheet and page structure. The V38 stylesheet had removed broad header, scene, overlay, layout, and visibility rules. Those are restored rather than rewritten.

The V38 control editor and shared geometry module are retained, with a corrected default footprint:
- Left, Right, and Jump are three equally sized buttons in one horizontal row.
- Form is smaller and sits directly beneath Jump on the right.
- Both live controls and the editor use the same 360:126 geometry.
- Drag, resize, select, save, cancel, reset, pointer capture, and resize/orientation handling remain available.
- The established `bounce-control-layout-v1` storage key is preserved.

The mobile play viewport is capped at 270 CSS pixels in portrait, leaving more room for the control row. Landscape keeps the V37 responsive composition.

Physics, the fixed-step simulation, input IDs, RLEF resources, original imagery, audio and progression are retained unchanged from V37 except for the V38 pointer-event robustness changes in the input binding.
