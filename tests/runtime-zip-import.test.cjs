'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bounce-zip-test-'));
const importer = path.join(root, 'tools/import_runtime_zip.py');

function run(archive) {
  return spawnSync('python3', [importer, archive, temp, '--validate-only'], {
    cwd: root, encoding: 'utf8'
  });
}

try {
  const valid = path.join(temp, 'valid.zip');
  const create = spawnSync('python3', ['-c', String.raw`
import json, sys, zipfile
p=sys.argv[1]
files={
'index.html':'<!doctype html><link rel="stylesheet" href="style.css?v=53"><script src="game.js?v=53"></script><script src="sw.js?v=53"></script>', 'style.css':'body{}', 'game.js':'', 'sw.js':"const CACHE_NAME = 'bounce-tales-v53';\nconst APP_SHELL = [\"./\", \"index.html\", \"style.css?v=53\", \"game.js?v=53\", \"favicon.png\", \"src/control-layout.js?v=53\", \"src/original-hud.js?v=53\", \"src/module-registry.js?v=53\", \"src/port-engine.js?v=53\"];", 
'manifest.webmanifest':json.dumps({'icons':[{'src':'favicon.png'}]}), 'favicon.png':'x', 'icon-192.png':'x', 'icon-512.png':'x', 'apple-touch-icon.png':'x', 'bounce-tales-web-preview.png':'x',
'assets/original/sample.bin':'asset', 'src/sample.js':'// module', 'src/control-layout.js':'', 'src/original-hud.js':'', 'src/module-registry.js':'', 'src/port-engine.js':'', 'tests/fixture.test.cjs':'// fixture test included to satisfy complete runtime archive contract\\n'
}
with zipfile.ZipFile(p,'w') as z:
 z.writestr('assets/', '')
 z.writestr('assets/original/', '')
 z.writestr('src/', '')
 for n,v in files.items(): z.writestr(n,v)
`, valid], { encoding: 'utf8' });
  assert.equal(create.status, 0, create.stderr);
  const validResult = run(valid);
  assert.equal(validResult.status, 0, validResult.stderr || validResult.stdout);
  assert.match(validResult.stdout, /ZIP validation passed/);

  const stale = path.join(temp, 'stale.zip');
  const staleBuild = spawnSync('python3', ['-c', String.raw`
import sys, zipfile
source, target = sys.argv[1:]
with zipfile.ZipFile(source) as src, zipfile.ZipFile(target, 'w') as dst:
 for item in src.infolist():
  data = src.read(item.filename)
  if item.filename in ('index.html', 'sw.js'):
   data = data.replace(b'v=53', b'v=40').replace(b'bounce-tales-v53', b'bounce-tales-v40')
  dst.writestr(item, data)
`, valid, stale], { encoding: 'utf8' });
  assert.equal(staleBuild.status, 0, staleBuild.stderr);
  const staleResult = run(stale);
  assert.notEqual(staleResult.status, 0, 'older runtime versions must be rejected');
  assert.match(staleResult.stderr, /Stale or inconsistent runtime version/);

  const traversal = path.join(temp, 'traversal.zip');
  const badPath = spawnSync('python3', ['-c', String.raw`
import sys, zipfile
with zipfile.ZipFile(sys.argv[1],'w') as z: z.writestr('../escape.txt','nope')
`, traversal], { encoding: 'utf8' });
  assert.equal(badPath.status, 0, badPath.stderr);
  const traversalResult = run(traversal);
  assert.notEqual(traversalResult.status, 0, 'path traversal archive must be rejected');
  assert.match(traversalResult.stderr, /Unsafe ZIP path segment/);

  const symlink = path.join(temp, 'symlink.zip');
  const badLink = spawnSync('python3', ['-c', String.raw`
import sys, zipfile
z=zipfile.ZipFile(sys.argv[1],'w')
i=zipfile.ZipInfo('link'); i.create_system=3; i.external_attr=(0o120777 << 16); z.writestr(i,'/etc/passwd'); z.close()
`, symlink], { encoding: 'utf8' });
  assert.equal(badLink.status, 0, badLink.stderr);
  const symlinkResult = run(symlink);
  assert.notEqual(symlinkResult.status, 0, 'symlink archive must be rejected');
  assert.match(symlinkResult.stderr, /symlinks are not allowed|Special files/);

  console.log('Runtime ZIP importer: directory entries accepted; stale, traversal and symlink archives rejected');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
