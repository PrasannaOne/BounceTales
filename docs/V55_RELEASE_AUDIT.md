# Bounce Tales V55 · share and maintenance audit

**Release:** 55.0.0  
**Runtime/cache identity:** V55 (`v=55`, `bounce-tales-v55`)  
**Base:** V54 runtime, including the shared cannon mesh and source-mapped audio tracks

## Scope

V55 is deliberately limited to the header share control, its URL target, runtime-import maintenance, release metadata and documentation. It does not introduce gameplay changes.

## Share control

- The header share button retains its existing position, size, accessible label and click behavior.
- The connected-node SVG now has explicit `fill: none`, `stroke: currentColor`, rounded line caps/joins and a visible two-pixel stroke. This makes both connectors and node outlines visible against the dark header button.
- `shareSite()` sends `https://X.gd/BounceTales` through the Web Share API and uses the same URL for clipboard/manual-copy fallbacks.
- Canonical site navigation, page metadata and the direct website URL remain `https://prasannaone.github.io/BounceTales/`.
- The X.gd alias is the configured share target. The redirect destination was not independently confirmed during this build, so this audit does not claim it is live or correct.

## Importer and repository hygiene

- Removed the importer minimum-version floor and hard-coded V54 module list.
- Removed the requirement that `Bounce.zip` contain the repository's test suite.
- The importer validates version consistency between versioned page assets and `CACHE_NAME`, manifest icon paths, and all service-worker `APP_SHELL` entries.
- Runtime imports copy the allowlisted site shell plus `assets/` and `src/`; repository tests and project documentation remain untouched.
- GitHub Actions runs the repository-owned `npm run verify` suite after import and stages runtime paths only.
- Existing ZIP safety checks remain: normalized paths, no traversal, no symlinks/special files, no duplicate/case-colliding entries, no encrypted entries, and bounded entry counts, sizes and compression ratios.

## Preserved boundaries

- No changes to the 240 × 320 logical game world, player physics, collision, progression, level scripts or menus.
- No changes to original RLEF resources, sprite/animation mappings, V54 cannon mesh/animation or audio track mapping.
- No changes to touch-control geometry, persisted layout key or save-data format.
- The canonical GitHub Pages URL remains in navigation and metadata; only the share action uses the X.gd alias.

## Verification

Final V55 verification passed: 91 JavaScript files syntax-checked, 64/64 tests passed, all 15 RLEF stages passed the runtime smoke harness, and the Level 1 springboard lifecycle proof passed. The new share-header test checks the visible SVG stroke and exact share URL. Importer tests cover version-agnostic validation, test-free runtime ZIPs, preservation of repository-owned tests, inconsistent versions, path traversal and symlink rejection.

The X.gd redirect still requires a real browser check because the redirect endpoint did not return a verifiable destination during this build.
