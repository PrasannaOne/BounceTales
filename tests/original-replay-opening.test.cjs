'use strict';
// Replays the real original game's level-1 opening (recorded in a JVM) through the port's update().
// Skips (passes) when Java is not installed.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'original-runner', 'replay-compare.cjs')], { encoding: 'utf8', timeout: 180000 });
process.stdout.write(r.stdout);
if (r.status !== 0) { process.stderr.write(r.stderr); process.exit(r.status || 1); }
