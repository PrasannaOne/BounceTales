const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
assert.equal(manifest.name,'Bounce Tales');assert.equal(manifest.display,'standalone');assert.equal(manifest.scope,'./');
for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(root,icon.src)),`manifest icon ${icon.src} exists`);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.match(html,/rel="manifest" href="manifest\.webmanifest"/);assert.match(html,/navigator\.serviceWorker\.register\('\.\/sw\.js\?v=34'/);
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');const list=sw.match(/const APP_SHELL = (\[[\s\S]*?\]);/);assert.ok(list,'service worker declares precache list');
const paths=JSON.parse(list[1].replace(/,\s*\]$/, "\n]"));for(const p of paths){if(p==='./')continue;assert.ok(fs.existsSync(path.join(root,p.split('?')[0])),`precache path exists: ${p}`);}
for(const d of ['assets','src'])assert.ok(paths.some(p=>p.startsWith(d+'/')),`${d} files are precached`);
console.log(`PWA: manifest and ${paths.length} precache paths validated`);
