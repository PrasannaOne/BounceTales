# Reverse-engineering summary · 2.0.3 source JAR

- JAR manifest: Bounce Tales 2.0.3, CLDC 1.1 / MIDP 2.0.
- 106 non-directory JAR entries are preserved in `assets/original/`.
- The JAR resource map contains 110 resource records and 55 resource batches.
- Sixteen resources `bf` through `bu` are RLEF level/object streams. Their header contains a version, object count and event count, not width/height fields.
- Build 05's JavaScript parser validates all 16 RLEF object/event counts and object-parent transforms.
- The original key normalizer's internal IDs are UP=1, DOWN=2, LEFT=3, RIGHT=4, Nokia softkeys=5/6/7, STAR=20, POUND=21. The touch UI displays all these except the omitted numeric keypad 1–9.
- Source-derived player movement and jump constants are extracted from the supplied 2.0.3 `c.class`; detailed values are in `BUILD_05_RLEF_AND_ENGINE.md`.
- The first playable scene is based on the original `bf` Misty Morning resource, not a hand-drawn training level.
