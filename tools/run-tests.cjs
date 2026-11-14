'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const testDir = path.join(root, 'tests');
const files = fs.readdirSync(testDir).filter(name => name.endsWith('.cjs')).sort();
let failed = 0;

for (let index = 0; index < files.length; index += 1) {
  const file = files[index];
  const result = spawnSync(process.execPath, [path.join(testDir, file)], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024
  });
  const label = `[${String(index + 1).padStart(2, '0')}/${files.length}] ${file}`;
  if (result.status === 0) {
    process.stdout.write(`${label}  PASS\n`);
  } else {
    failed += 1;
    process.stderr.write(`${label}  FAIL (exit ${result.status ?? 'unknown'})\n`);
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
}

process.stdout.write(`\nTest files: ${files.length} | Passed: ${files.length - failed} | Failed: ${failed}\n`);
if (failed) process.exitCode = 1;
