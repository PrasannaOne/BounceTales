'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bounce-full-zip-test-'));
const importer = path.join(root, 'tools/import_runtime_zip.py');

function run(archive, destination = temp, validateOnly = true) {
  const args = [importer, archive, destination];
  if (validateOnly) args.push('--validate-only');
  return spawnSync('python3', args, { cwd: root, encoding: 'utf8' });
}
function makeZip(target, version = 58, extra = {}) {
  const py = String.raw`
import json, sys, zipfile
p, version = sys.argv[1], int(sys.argv[2])
extra = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
files = {
 'index.html': f'<!doctype html><link rel="stylesheet" href="style.css?v={version}"><script src="game.js?v={version}"></script><script src="sw.js?v={version}"></script>',
 'style.css': 'body{}', 'game.js': '/* runtime */',
 'sw.js': "const CACHE_NAME = 'bounce-tales-v{}'; const APP_SHELL = ".format(version) + json.dumps(['./', 'index.html', f'style.css?v={version}', f'game.js?v={version}', 'assets/original/bu', f'src/control-layout.js?v={version}']) + ';',
 'manifest.webmanifest': json.dumps({'icons':[{'src':'favicon.png'}]}),
 'favicon.png':'icon', 'icon-192.png':'icon', 'icon-512.png':'icon', 'apple-touch-icon.png':'icon',
 'bounce-tales-web-preview.png':'preview',
 'assets/original/bu':'cannon', 'src/control-layout.js':'module',
 'README.md':'# Bounce Tales', 'ARCHITECTURE.md':'# Architecture', 'LICENSE':'Test licence',
 'package.json':json.dumps({'name':'bounce-tales','version':'1.0.0'}),
 '.github/FUNDING.yml':'github: []', 'docs/fixture.md':'# docs',
 'tools/fixture.py':'# tools', 'tests/fixture.test.cjs':'// test'
}
files.update(extra.get('files', {}))
with zipfile.ZipFile(p, 'w') as z:
 for name, data in files.items(): z.writestr(name, data)
`;
  const result = spawnSync('python3', ['-c', py, target, String(version), JSON.stringify(extra)], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

try {
  const valid = path.join(temp, 'valid-project.zip');
  makeZip(valid, 58);
  const validResult = run(valid);
  assert.equal(validResult.status, 0, validResult.stderr || validResult.stdout);
  assert.match(validResult.stdout, /Full-project ZIP validation passed/);

  // Version strings are deliberately not compared or enforced.
  const mismatched = path.join(temp, 'mismatched-version.zip');
  makeZip(mismatched, 1, { files: {
    'index.html': '<!doctype html><link href="style.css?v=999"><script src="game.js?v=4"></script>',
    'sw.js': "const CACHE_NAME = 'unrelated-cache-name'; const APP_SHELL = " + JSON.stringify(['./','index.html','style.css?v=12','game.js?v=88','assets/original/bu','src/control-layout.js?v=3']) + ';'
  }});
  const mismatchResult = run(mismatched);
  assert.equal(mismatchResult.status, 0, mismatchResult.stderr || mismatchResult.stdout);

  const traversal = path.join(temp, 'traversal.zip');
  let bad = spawnSync('python3', ['-c', "import sys,zipfile; z=zipfile.ZipFile(sys.argv[1],'w'); z.writestr('../escape.txt','nope'); z.close()", traversal], { encoding: 'utf8' });
  assert.equal(bad.status, 0, bad.stderr);
  const traversalResult = run(traversal);
  assert.notEqual(traversalResult.status, 0);
  assert.match(traversalResult.stderr, /Unsafe ZIP path segment/);

  const symlink = path.join(temp, 'symlink.zip');
  bad = spawnSync('python3', ['-c', "import sys,zipfile; z=zipfile.ZipFile(sys.argv[1],'w'); i=zipfile.ZipInfo('link'); i.create_system=3; i.external_attr=(0o120777<<16); z.writestr(i,'/etc/passwd'); z.close()", symlink], { encoding: 'utf8' });
  assert.equal(bad.status, 0, bad.stderr);
  const symlinkResult = run(symlink);
  assert.notEqual(symlinkResult.status, 0);
  assert.match(symlinkResult.stderr, /Special files and symlinks are not allowed/);

  const importZip = path.join(temp, 'merge-project.zip');
  makeZip(importZip, 58, { files: {
    'tests/new-v58.test.cjs':'// imported test',
    'tools/__pycache__/bad.pyc':'not copied',
  }});
  const destination = path.join(temp, 'repo');
  fs.mkdirSync(path.join(destination, 'tools'), { recursive: true });
  fs.mkdirSync(path.join(destination, '.github/workflows'), { recursive: true });
  fs.mkdirSync(path.join(destination, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(destination, 'README.md'), '# Existing README');
  fs.writeFileSync(path.join(destination, 'docs/remote-only.md'), '# Keep me');
  fs.writeFileSync(path.join(destination, 'tests-remote-only.txt'), 'keep');
  fs.writeFileSync(path.join(destination, '.github/workflows/import-bounce-zip.yml'), 'protected workflow');
  fs.writeFileSync(path.join(destination, 'tools/import_runtime_zip.py'), 'protected importer');
  const imported = run(importZip, destination, false);
  assert.equal(imported.status, 0, imported.stderr || imported.stdout);
  assert.equal(fs.readFileSync(path.join(destination, 'README.md'), 'utf8'), '# Bounce Tales');
  assert.equal(fs.readFileSync(path.join(destination, 'docs/remote-only.md'), 'utf8'), '# Keep me');
  assert.equal(fs.readFileSync(path.join(destination, 'tests-remote-only.txt'), 'utf8'), 'keep');
  assert.equal(fs.readFileSync(path.join(destination, '.github/workflows/import-bounce-zip.yml'), 'utf8'), 'protected workflow');
  assert.equal(fs.readFileSync(path.join(destination, 'tools/import_runtime_zip.py'), 'utf8'), 'protected importer');
  assert.equal(fs.existsSync(path.join(destination, 'tools/__pycache__/bad.pyc')), false);
  assert.equal(fs.existsSync(importZip), false);
  assert.match(imported.stdout, /protected workflow\/importer preserved/);

  console.log('Full-project ZIP importer: version-agnostic validation, required project structure, traversal/symlink rejection, protected workflow/importer, pycache exclusion, non-destructive overlay and upload cleanup passed');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
