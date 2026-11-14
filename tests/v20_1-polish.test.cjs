const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
// Separate high-density text layer leaves the native 240x320 pixel-art canvas intact.
assert.match(html,/<canvas id="game-text"[^>]*aria-hidden="true"/);
assert.match(game,/function syncMenuTextResolution\(\)/);
assert.match(game,/textCtx\.setTransform\(width\/W,0,0,height\/H,0,0\)/);
assert.match(game,/const target=textCtx\|\|ctx;target\.save\(\)/);
assert.match(game,/if\(textCtx\)textCtx\.clearRect\(0,0,W,H\)/);
assert.match(css,/canvas#game-text[\s\S]*?image-rendering:auto;pointer-events:none/);
// Keep the original JAR icon unchanged and use it as the source for install imagery.
const sourceIcon=fs.readFileSync(path.join(root,'assets/original/icon.png'));
const hashes=JSON.parse(fs.readFileSync(path.join(root,'reference/original-resource-sha256.json'),'utf8'));
assert.equal(crypto.createHash('sha256').update(sourceIcon).digest('hex'),hashes['icon.png'],'original JAR launcher icon remains byte-for-byte unchanged');
const favicon=fs.readFileSync(path.join(root,'favicon.png'));
assert.equal(favicon.toString('ascii',1,4),'PNG');assert.equal(favicon.readUInt32BE(16),64);assert.equal(favicon.readUInt32BE(20),64);
assert.notEqual(favicon.compare(sourceIcon),0,'root favicon is the high-resolution remaster, not the tiny source file');
for(const [file,size] of [['icon-192.png',192],['icon-512.png',512],['apple-touch-icon.png',180]]){
  const png=fs.readFileSync(path.join(root,file));assert.equal(png.toString('ascii',1,4),'PNG');
  assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
}
assert.match(html,/href="favicon\.png\?v=40"/);
// Minimal and correctly sized web preview metadata.
const preview=fs.readFileSync(path.join(root,'bounce-tales-web-preview.png'));
assert.equal(preview.toString('ascii',1,4),'PNG');assert.equal(preview.readUInt32BE(16),1536);assert.equal(preview.readUInt32BE(20),857);
assert.match(html,/og:image:alt/);assert.match(html,/twitter:image:alt/);
assert.match(sw,/bounce-tales-v40/);assert.match(sw,/favicon\.png/);
// Discreet Ko-fi link is only in About and explicitly opens outside the app.
assert.match(html,/<a class="about-link support-link" href="https:\/\/ko-fi\.com\/prasannaone" target="_blank" rel="noopener noreferrer">[\s\S]*?Support Bounce Tales[\s\S]*?Enjoying Bounce Tales\? If you'd like to support this independent project, you can buy me a coffee\./);
assert.match(css,/\.support-link \.support-text\s*\{[\s\S]*?flex-direction:column/);
assert.match(css,/\.support-link \.support-text small\s*\{[\s\S]*?overflow-wrap:anywhere/);
// Control editor has move, size, local save and reset paths.
for(const id of ['control-editor-layer','control-editor-stage','control-size','save-control-layout','reset-control-layout','cancel-control-editor'])assert.ok(html.includes('id="'+id+'"'),id);
assert.match(game,/bounce-control-layout-v1/);
assert.match(game,/function applyLiveControlLayout\(override=null\)/);
assert.match(game,/function bindControlEditor\(\)/);
assert.match(game,/localStorage\.setItem\(CONTROL_LAYOUT_KEY,JSON\.stringify\(clean\)\)/);
assert.match(game,/editorResetToDefault=true/);assert.match(game,/localStorage\.removeItem\(CONTROL_LAYOUT_KEY\)/,'Reset restores default controls and clears the saved custom layout');
assert.match(css,/#game-controls\.custom-layout[\s\S]*?position:absolute/);assert.match(game,/if\(!metrics\)return null/,'hidden controls are not collapsed by zero-width measurement');
console.log('V20.1 polish: crisp canvas text, original icon preservation, minimal OG banner, Ko-fi About link and editable touch layout verified');
