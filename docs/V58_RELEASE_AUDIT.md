# Bounce Tales V58 · release audit

**Release:** 58.0.0  
**Baseline:** V57  
**Canonical site and share URL:** https://prasannaone.github.io/BounceTales/

## Release scope

V58 completes the campaign/source crosswalk and records the current verification boundary. It retains the V57 packed object-depth/flag correction and image-358 fragment effect, adds controlled behavior checks for all 33 event-command values (0–32), records the command distribution across the 15 playable stages, and points the header Share action to the canonical GitHub Pages URL.

The canonical URL is used by the native share sheet and clipboard/manual-copy fallbacks. It matches the `og:url` metadata and the header home link. The retired X.gd share destination is not used by the V58 runtime.

## Evidence protected by the release

- 105 original resource SHA-256 entries match the checked-in originals.
- All 16 RLEF resources (`bf` through `bu`) are parsed and compared with decoded fixtures; 15 are playable campaign stages and `bu` is supplemental geometry.
- The decoded campaign fixtures cover 2,240 object headers, 490 polygon objects, 5,776 vertices, 4,306 triangle indices, 316 event objects and 1,143 authored command streams.
- All 33 event interpreter values have synthetic behavior checks. Opcode 22 is a source-confirmed no-op.
- All 15 playable campaign stages boot, play and pause in the runtime smoke harness.
- The Level 1 springboard lifecycle proof passes.
- The importer regression test checks version consistency, traversal/symlink rejection, test-free archives, named test merging, and preservation of unrelated repository records.

These are distinct evidence sets, not additive percentages. They do not establish that 90% of every gameplay behavior has been reproduced.

## Verification performed locally

Command:

```bash
python3 -m py_compile tools/import_runtime_zip.py
npm run verify
```

Results:

- 96 JavaScript files syntax-checked; zero failures.
- 69/69 test files passed.
- Runtime smoke passed: original title, touch-control editor drag/resize/save/reset, all 15 RLEF stages boot/play/pause, and FPS defaults/visibility reset.
- Level 1 springboard lifecycle proof passed.

## Import/deployment safety

The current V58 safe importer updates allowlisted runtime root files and replaces the versioned `assets/` and `src/` trees. It merges root-level `tests/*.cjs` by filename and never deletes the tests directory, so repository-only tests absent from a ZIP survive. It does not import README, architecture, licence, docs, research, or workflow files. `package.json` version is updated to match the service-worker cache version.

The GitHub repository previously contained an older importer that replaced the entire tests directory. Install the V58 Safe Import Pipeline patch (`tools/import_runtime_zip.py` and `.github/workflows/import-bounce-zip.yml`) before uploading `Bounce.zip`. The upload workflow validates before import, runs `npm run verify`, and stages only the allowlisted runtime files, assets, source modules and merged tests.

A local pass does not prove GitHub Actions or GitHub Pages deployment. Those checks must be observed after the user applies the pipeline patch and uploads the runtime ZIP.

## Remaining fidelity work

V58 is a broad, source-informed browser port, not a measured 90% parity release. The most important unresolved areas are lockstep comparison of the full `c.java` collision/response path, event-trigger overlap and scheduling order, animation/render update ordering, browser-vs-MIDP raster/audio timing, and exact runtime consumers for supplemental resources `be` and `bv`. Future score claims should use a published weighted rubric and source-to-runtime differential results, not test counts or resource counts.
