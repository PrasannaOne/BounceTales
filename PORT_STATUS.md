# Bounce Tales V20 · build status

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
- [x] PWA icons, apple-touch icon, 1200×630 social preview, OG/Twitter tags, V20 manifest and service-worker cache are present.
- [x] Fixed no-scroll viewport, responsive canvas sizing, canvas/control gap and enlarged `*` touch target retained.

## Verification

- 105 original resource hashes checked by the source-parity test.
- 16 RLEF resources, 2,240 object headers, 490 polygons, 5,776 vertices, 4,306 triangles, 316 event objects and 1,143 animation streams match the decoded reference fixtures.
- 15 campaign levels pass headless boot/play/pause smoke checks and event opcode coverage.
- Misty Morning springboard regression uses its decoded base strength (75), radius-aware contact, fixed-tick release and actual nearby cliff mesh. The tested arc reaches approximately 844.7 world Y versus a local high-cliff mesh point of 775.0.
- PWA cache references and all root image/meta assets verified.

Run all tests with `for test in tests/*.cjs; do node "$test" || exit 1; done`.

## Not yet certified

- The 15 campaign stages have not all been completed end-to-end in a browser automation session.
- Every specialized enemy, boss, door, switch, cannon and exit path still needs direct side-by-side game comparison.
- The transparent logo is a derived alpha-matte treatment because the supplied `j.png` is opaque white; the original resource itself is preserved unchanged.
- Pixel-perfect Nokia menu rendering and physical Android/iOS behavior are not certified.
