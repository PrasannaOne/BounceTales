# Bounce Port Engine · Reuse and porting guide

> **Current release:** V49  
> **Runtime API:** `BouncePortEngine` · API version 1  
> **Scope:** Reusable modules and the adapter boundary for future browser-game ports

## 1. What is reusable today?

The repository is not a drop-in universal game engine. It is a source-informed game port with a deliberately separated set of small systems. Some are broadly reusable; others encode Bounce Tales or its original J2ME resource formats. V49 separates a portable, dependency-free `src/module-registry.js` utility from the Bounce-specific `src/port-engine.js` catalog. Neither changes the existing game loop.

| Group | Systems | Reuse guidance |
|---|---|---|
| `foundation` | `fixedPoint`, `timing`, `terrainCollision`, `particles` | Useful starting points for another 2D game after checking units, timestep and collision assumptions. |
| `platform` | `audio`, `controlLayout` | Browser-facing helpers that can be adapted to another game shell. |
| `formats` | `rlef`, `spriteAtlas`, `midpGraphics`, `eventEngine` | Format/render compatibility pieces. RLEF and the 326-entry atlas mapping are Bounce Tales-specific. |
| `bounceCompatibility` | `bouncePhysics`, `collision`, `camera`, `enemies`, `water`, `trampoline`, `progression`, `inputMap`, `spriteAnimation`, `hud` | Preserve for this port; use as reference material or adapt deliberately for a future port. |

## 2. Discover the available systems

In a browser, `index.html` loads the individual systems, then `src/module-registry.js`, then `src/port-engine.js`. The Bounce catalog is exposed as `window.BouncePortEngine` (also `globalThis.BouncePortEngine`). In Node.js, the catalog is CommonJS-loadable and initializes the same local Bounce modules automatically. A future port can import only `src/module-registry.js` without loading any Bounce Tales systems.

```js
// Browser
const clock = BouncePortEngine.require('timing');
const simulation = new clock.FixedStepClock();

// Node.js
const PortEngine = require('./src/port-engine.js');
const RLEF = PortEngine.require('rlef');

console.log(PortEngine.list('foundation'));
console.log(PortEngine.diagnostics());
```

The registry API is intentionally small:

- `get(name)` returns a system or `null` when it is unavailable.
- `require(name)` returns a system or throws a descriptive error.
- `list(group)` returns system names, categories, descriptions and availability. Omit the group to list everything.
- `diagnostics()` reports missing modules and whether the complete catalog is present.
- `createRegistry(definitions, options)` creates an independent read-only registry from another port's own `{ name, group, description, system }` entries. It validates unique names and system values, reports unavailable systems, and has no Bounce-specific imports.

The Bounce catalog is read-only. It does not create a second simulation loop, mutate game state, or replace the established globals used by `game.js`. A future project can copy or import the standalone `module-registry.js` helper and register its own systems without importing `port-engine.js`.

### Standalone registry example

```js
// Copy src/module-registry.js into another game's engine/ folder.
const { createRegistry } = require('./engine/module-registry.js');
const GameEngine = createRegistry([
  { name: 'clock', group: 'foundation', system: gameClock },
  { name: 'renderer', group: 'platform', system: renderer },
  { name: 'saveStore', group: 'platform', system: saveStore }
], { name: 'My Game Systems' });

GameEngine.require('clock');
console.log(GameEngine.diagnostics());
```

The registry only stores and discovers the systems supplied to it. It does not impose a loop, world model, renderer, asset format or physics scheme on the new game.

## 3. A safe architecture for another port

Keep a future game's host-specific code separate from reusable systems:

```text
new-port/
├── index.html             Browser shell and accessibility
├── style.css              Responsive layout and controls
├── app/                   New game's lifecycle and state coordinator
├── adapters/
│   ├── asset-loader.js    New game's resource format and asset pipeline
│   ├── renderer.js        Canvas/WebGL rendering adapter
│   ├── input.js           Keyboard, touch and gamepad normalization
│   ├── persistence.js     Save format and migration policy
│   └── audio.js           Host audio policy and lifecycle
└── engine/                Only the systems that the new port actually needs
```

Do not copy `game.js` as a generic engine. It is the Bounce Tales application coordinator and includes this game's object model, level lifecycle, resource assumptions, rendering order and save behavior. Start with the registry, select the small systems that fit the new game's coordinate and timing model, then write adapters for everything game-specific.

## 4. Adapter contracts to define before porting

Before reusing a module, document these decisions in the new port:

1. **Coordinates and units:** world origin, axis direction, scale, fixed-point representation and logical viewport.
2. **Time:** simulation tick rate, pause semantics, delta clamp, catch-up policy and render interpolation policy.
3. **Collision:** shape model, contact ordering, penetration correction, restitution, friction and callback order.
4. **Resources:** binary/text formats, endianness, versioning, validation, image origins and sprite anchors.
5. **Input:** normalized actions, key-down/key-up behavior, repeated input, touch capture, gamepad mapping and focus loss.
6. **Persistence:** schema version, corruption recovery, storage limits and save migration.
7. **Lifecycle:** loading, visibility changes, audio unlock, pause/resume, failure reporting and offline behavior.

A system should only move into a shared `foundation` group after its assumptions are explicit and tests cover those assumptions. A Bounce Tales behavior should remain in `bounceCompatibility`, even if another game might later adapt it.

## 5. Build and verify

No third-party package installation is needed for the current project. Node.js 18 or later is used for the repository scripts:

```bash
npm test                 # Run every tests/*.cjs regression file
npm run check            # Syntax-check runtime, modules, tests and tools
npm run smoke            # Exercise the browser runtime in the Node test harness
npm run proof:springboard # Dedicated Level 1 springboard lifecycle proof
npm run verify           # Run the complete verification sequence
```

The registry is not a substitute for behavioral tests. Every future game port should add tests for its own adapter boundaries and must not assume Bounce Tales-specific constants are universal.

## 6. Current limitations

- `game.js` remains the application/game-specific coordinator rather than a generic engine kernel.
- `module-registry.js` is a small reusable registry utility, not a complete engine implementation.
- RLEF parsing, the original sprite atlas, MIDP rendering details, Bounce physics and progression are tied to this game's recovered resources or behavior.
- Some collision and browser presentation behavior remains an approximation of the original handset implementation.
- Passing Node.js checks does not replace testing the new port in target browsers and on physical devices.

Keep these limitations visible when describing the project. The goal is a reusable toolkit and a clean porting boundary, not a claim that one codebase can run arbitrary game formats unchanged.
