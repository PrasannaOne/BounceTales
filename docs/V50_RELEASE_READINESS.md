# Bounce Tales V50 · release-readiness and deployment audit

**Release:** V50  
**Scope:** repository quality gates, runtime ZIP import safety, public-facing project clarity, and limited browser-shell polish  
**Gameplay scope:** no intentional changes to simulation, physics, campaign data, HUD drawing, or touch-layout geometry/storage; V50 did include browser-shell positioning and first-paint visibility changes

## 1. Release intent

V50 is an engineering and release-readiness pass. It does not claim new game content or a new physics revision. The V49 gameplay runtime and original campaign resources are retained; the release makes repository checks and the existing `Bounce.zip` deployment path more predictable and safer. It also made two limited shell changes: the pause action was moved outside the canvas into a row below the viewport, and touch controls were kept hidden until the live layout had been measured. The touch-layout storage key and geometry model were not changed. V51 initially placed the pause action above the viewport; the V51.1 correction moved it into the external right-side gutter on portrait screens and the clear strip above the game column on wide landscape layouts. V51 also applies the initial control geometry synchronously before resource loading.

## 2. Runtime ZIP import boundary

The `Import Bounce Tales runtime ZIP` workflow continues to support the established workflow: upload `Bounce.zip` to the repository root and let GitHub Actions import the playable runtime.

Before files are written, `tools/import_runtime_zip.py` validates the archive:

- rejects absolute paths, drive-prefixed paths, backslashes, empty path segments, `.` and `..` segments;
- rejects symlinks, special files, encrypted entries, duplicate/case-colliding paths and malformed directory entries;
- caps the archive at 20,000 entries, 500 MiB total expanded data, 100 MiB per file and a 250:1 compression ratio;
- supports normal directory entries ending in `/` and a single optional enclosing folder;
- requires the complete static runtime shell, PWA icons, `assets/` and `src/`;
- validates the web manifest icon references and every local service-worker app-shell reference before import.

The importer stages only an explicit runtime allowlist. It replaces only the runtime `assets/` and `src/` trees and copies known root-level app files. It never imports documentation, `LICENSE`, tests, reverse-engineering records, reference fixtures, repository metadata or `.github` workflows from the uploaded ZIP. The incoming `Bounce.zip` is removed only after successful validation and copy.

The workflow stages only the same runtime paths plus the consumed `Bounce.zip`; it does not use repository-wide `git add -A`.

## 3. Automated quality gates

`.github/workflows/quality.yml` runs on pushes and pull requests to `main`. It executes `npm run verify` and parses the PWA manifest.

The ZIP import workflow runs these checks after import and before committing:

1. PWA manifest JSON validation;
2. JavaScript syntax checks;
3. all Node.js regression tests;
4. runtime smoke harness;
5. Level 1 springboard lifecycle proof.

The ZIP validator is a standalone Python program so its archive checks can be run locally and tested independently of GitHub Actions.

## 4. Local commands

```bash
# Validate an uploaded ZIP without changing the working tree
python tools/import_runtime_zip.py Bounce.zip . --validate-only

# Run the complete project verification suite
npm run verify

# Compile-check the Python importer
python -m py_compile tools/import_runtime_zip.py
```

## 5. Protected game behavior

This release does not intentionally change:

- fixed-step simulation and established physics constants;
- trampoline/springboard behavior and its regression proof;
- Smooth Motion discontinuity handling;
- the original 16 RLEF files and 15 playable campaign resources;
- original in-game sprites, title/menu/HUD presentation, or game dialogue;
- V41/V43 touch controls and the live on-screen control-layout editor.

The quality and import workflows do not modify these systems. Existing regression tests remain the guardrail against accidental changes.

## 6. Honest verification boundary

Automated Node.js tests and smoke harnesses do not replace real-browser testing. This release does not claim certification across every Android browser, device size, audio policy, PWA installation path or offline transition. A final manual pass on a physical phone remains appropriate after deployment.

## 7. Licensing and public presentation

The README distinguishes the project's proprietary, source-available license from an OSI-approved open-source license. It also states that original Bounce Tales assets and marks are not relicensed by this project and that the project is independent and unaffiliated. The V50 readiness work does not resolve or grant rights to third-party game material; those rights require separate review before making broader redistribution or promotional claims.

## 8. Summary

V50 improves the integrity of the release pipeline and makes limited browser-shell refinements without changing gameplay. The existing ZIP-based publishing workflow remains intact, but its inputs are validated, its write scope is constrained, and the imported result is tested before commit. A separate CI workflow gives contributors the same automated checks before changes reach `main`.
