'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const files = ['game.js', 'sw.js'];
for (const directory of ['src', 'tests', 'tools']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (name.endsWith('.js') || name.endsWith('.cjs')) files.push(path.join(directory, name));
  }
}
let failed = 0;
for (const relative of files) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, relative)], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    failed += 1;
    process.stderr.write(`${relative}:\n${result.stderr || result.stdout || `exit ${result.status}`}\n`);
  }
}
process.stdout.write(`Syntax checked ${files.length} JavaScript files; ${failed} failure(s).\n`);
if (failed) process.exitCode = 1;
