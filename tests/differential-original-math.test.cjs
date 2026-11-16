'use strict';
// Scores the port's fixed-point math and timed-rotation command against results produced by the
// original decompiled class `d` in a real JVM. Skips (passes) when Java is not installed.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'differential', 'run.cjs')], { encoding: 'utf8' });
process.stdout.write(r.stdout);
if (r.status !== 0) { process.stderr.write(r.stderr); process.exit(r.status || 1); }
