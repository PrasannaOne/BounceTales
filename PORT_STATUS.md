# Bounce Tales V20.1 · build status

## Implemented in V20.1

- [x] Nokia-style canvas menus and pixel-art scene remain visually retro; vector UI text is rendered on a separate high-density transparent canvas layer for sharpness. The logical 240×320 game and source sprites are not resampled.
- [x] The original JAR launcher icon at `assets/original/icon.png` is preserved byte-for-byte. PWA and Apple icons are restrained dark-field enlargements of the same original icon artwork.
- [x] Replaced the previous complex preview artwork with a minimal 1200×630 social banner using the real game logo and a restrained dark forest palette.
- [x] Added optional `Support Bounce Tales` Ko-fi link in Settings → About. It opens externally without prompts or update promises.
- [x] Added a draggable and resizable touch-control editor, 75–130% per-button sizing, localStorage persistence, and reset-to-default.

## Implemented in V20

- [x] 326 decoded sprite descriptors and 1,143 animation command streams retained.
- [x] 16 RLEF resources retained; source resource hashes remain unchanged.
- [x] Level 1 springboard contact uses the actor collision radius from the original JAR bounds.
- [x] World-up / canvas-up sign convention verified: positive world `vy` becomes negative screen `dy`.
- [x] Misty Morning source-object trajectory regression clears the nearby decoded cliff collision mesh.
- [x] Source logo atlas file remains unchanged; a separate alpha-matte derivative removes the opaque white rectangle only for title rendering.
- [x] Title-screen sound and action prompt separated to prevent text/hit-area overlap.
- [x] Header Settings includes Auto / 30 / 60 / 90 / 120 FPS selection and persisted Smooth Motion toggle (OFF default).
- [x] Smooth Motion changes render interpolation only; fixed 60 Hz simulation is independent.
- [x] PWA icons, apple-touch icon, 1200×630 social preview, OG/Twitter tags, PWA manifest and service-worker cache are present and versioned for V20.1.
- [x] Fixed no-scroll viewport, responsive canvas sizing, canvas/control gap and enlarged `*` touch target retained.

## Verification

- 105 original resource hashes checked by the source-parity test.
- 16 RLEF resources, 2,240 object headers, 490 polygons, 5,776 vertices, 4,306 triangles, 316 event objects and 1,143 animation streams match the decoded reference fixtures.
- 15 campaign levels pass headless boot/play/pause smoke checks and event opcode coverage.
- Misty Morning springboard regression uses its decoded base strength (75), radius-aware contact, fixed-tick release and actual nearby cliff mesh. The tested arc reaches approximately 844.7 world Y versus a local high-cliff mesh point of 775.0.
- PWA cache references and all root image/meta assets verified.

Run all tests with `for test in tests/*.cjs; do node "$test" || exit 1; done`.

## V20.1 checks

- [x] All 38 regression scripts pass; all project JavaScript files pass `node --check`.

- [x] Separate text canvas scales with the displayed game canvas at up to 3× device pixel ratio; it is pointer-transparent and does not change simulation coordinates.
- [x] Original launcher icon bytes match the preserved JAR resource. PWA icon files, Apple icon and social preview dimensions are validated.
- [x] Ko-fi URL, new control editor, local persistence and reset path are covered by regression tests.

## Not yet certified

- The 15 campaign stages have not all been completed end-to-end in a browser automation session.
- Every specialized enemy, boss, door, switch, cannon and exit path still needs direct side-by-side game comparison.
- The transparent logo is a derived alpha-matte treatment because the supplied `j.png` is opaque white; the original resource itself is preserved unchanged.
- Pixel-perfect Nokia menu rendering and physical Android/iOS behavior are not certified.
