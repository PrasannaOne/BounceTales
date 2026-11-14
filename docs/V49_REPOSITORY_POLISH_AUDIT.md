# Bounce Tales V49 · Repository polish and portability audit

**Baseline:** V48  
**Release:** V49  
**Scope:** Mobile pause/HUD clearance, accessibility, repository hygiene, workflow safety, documentation consistency and future-port discoverability.

## Summary

V49 is a maintenance and portability release. The simulation, campaign resources and touch-layout behavior are protected. The changes focus on the site shell, repository checks, documentation and an additive registry API.

## Changes made

- Moved the pause control to `top: 62px` inside the game frame and retained a compact `32 × 30` CSS-pixel target. This gives the original top-right clock artwork more vertical clearance than V48's `44px` position. Automated layout assertions cover the rule; the final visual result still needs handset confirmation.
- Kept the cannon guidance in an accessible `role="status"` live region, but visually clipped it so the responsive control layout does not gain another row. Existing on-screen toast feedback remains the visible prompt.
- Removed the unused `save-summary` DOM references and the selected-record locals that only fed that absent element. The real chapter-book summary and error status remain intact.
- Added dependency-free `src/module-registry.js`, a generic read-only module-registry utility with name validation, groups, availability reporting and diagnostics. `src/port-engine.js` now builds `BouncePortEngine` API v1 over that generic utility. A future port can import `module-registry.js` alone without loading Bounce-specific globals.
- Added `package.json` scripts for syntax checks, the full CommonJS test suite, runtime smoke and the dedicated springboard proof. No runtime dependencies were added.
- Added repository-health checks for unique and resolvable DOM IDs, PWA icons, service-worker shell files, cache-version consistency, local README links and port-engine availability.
- Removed two byte-identical, unreferenced `assets/pwa-192.png` and `assets/pwa-512.png` copies. Canonical root PWA icon files and original in-game art remain unchanged.
- Removed **11 exact duplicate CSS rules** with a CSS parser. No repeated identical declarations inside the same rule were found in the final cleanup pass. Responsive media-query boundaries and non-identical cascade overrides were retained.
- Renamed and hardened the ZIP-import GitHub Action. It validates archive paths and service-worker assets, then copies only runtime files under an explicit allowlist. It no longer uses root-level `rsync --delete`, so a runtime ZIP cannot wipe documentation, the license, tests, research notes or workflow files.
- Marked early reverse-engineering documents as historical records and corrected resource documentation to distinguish 15 current playable campaign resources from all 16 retained original RLEF files.
- Updated the README, architecture and project guide for V49, with the official playable site prominent at the top of the README.

## Protected boundaries

The following are byte-identical to V48: player physics, original trampoline behavior, fixed-step timing, original camera, live touch-control geometry, input mapping, all 16 original RLEF resources, original game images/audio and the PWA icon artwork. The root `LICENSE` is unchanged in this pass.

`game.js` only loses dead `save-summary` lookups and their unused locals; its update/render loop, progression, input, physics integration and level behavior are unchanged. No player constants, collision response, stage object data, save schema or touch-layout persistence key were changed.

## Verification performed

- **59/59** `tests/*.cjs` test files passed.
- **85** JavaScript files passed `node --check`.
- Runtime smoke passed, including all **15 currently playable campaign stages**, pause/play flow and the live control editor drag/resize/save/reset checks.
- The dedicated Level 1 RLEF springboard lifecycle proof passed.
- Repository-health checks passed for DOM references, duplicate IDs, PWA manifest icons, every service-worker app-shell path, local links across the Markdown documentation set, current version/cache identity and the engine registry.
- ZIP integrity and protected-file SHA-256 comparisons were performed before packaging.

## Limits and follow-up

These checks run in Node.js and inspect source/layout rules; they do not render a real browser frame. V49 has not been certified on every mobile browser or physical device. In particular, confirm the pause-control clearance on your phone after deployment, then test PWA update/offline behavior and audio under the browser's normal policies. The engine registry is a reusable module-discovery and composition helper, not a universal game runtime.
