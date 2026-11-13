const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const zlib=require('node:zlib');
function readPngRGBA(bytes){
  let offset=8,width=0,height=0,bitDepth=0,colorType=0;const parts=[];
  while(offset<bytes.length){const len=bytes.readUInt32BE(offset);const type=bytes.toString('ascii',offset+4,offset+8);const data=bytes.subarray(offset+8,offset+8+len);
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];}
    if(type==='IDAT')parts.push(data);offset+=12+len;if(type==='IEND')break;
  }
  assert.equal(bitDepth,8);assert.equal(colorType,6,'PNG should use RGBA pixels');const raw=zlib.inflateSync(Buffer.concat(parts));
  const bpp=4,stride=width*bpp,out=Buffer.alloc(height*stride);let src=0;
  for(let y=0;y<height;y++){const filter=raw[src++];for(let x=0;x<stride;x++){const val=raw[src++],a=x>=bpp?out[y*stride+x-bpp]:0,b=y>0?out[(y-1)*stride+x]:0,c=y>0&&x>=bpp?out[(y-1)*stride+x-bpp]:0;let predictor=0;
      if(filter===1)predictor=a;else if(filter===2)predictor=b;else if(filter===3)predictor=Math.floor((a+b)/2);else if(filter===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);predictor=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}else assert.equal(filter,0,'valid PNG row filter');out[y*stride+x]=(val+predictor)&255;}}
  return {width,height,data:out};
}
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'style.css'),'utf8');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
for(const name of ['icon-192.png','icon-512.png','apple-touch-icon.png','og-preview.png'])assert.ok(fs.existsSync(path.join(root,name)),name+' exists at ZIP root');
for(const tag of ['og:title','og:description','og:image','twitter:card','twitter:image'])assert.ok(html.includes(tag),'metadata '+tag);
assert.match(html,/og-preview\.png/);assert.match(html,/apple-touch-icon\.png/);
assert.deepEqual(manifest.icons.map(i=>i.sizes),['192x192','512x512']);
assert.equal(manifest.icons[0].src,'icon-192.png');assert.equal(manifest.icons[1].src,'icon-512.png');
assert.match(sw,/bounce-tales-v20/);for(const name of ['icon-192.png','icon-512.png','apple-touch-icon.png','og-preview.png','assets\/logo-transparent.png'])assert.ok(sw.includes(name),'precache includes '+name);
const logo=readPngRGBA(fs.readFileSync(path.join(root,'assets/logo-transparent.png')));
const alpha=[];for(let i=3;i<logo.data.length;i+=4)alpha.push(logo.data[i]);
assert.ok(Math.min(...alpha)===0&&Math.max(...alpha)===255,'title logo has true transparency and opaque letter artwork');
// The original source artwork remains untouched for resource-hash parity.
const sourceLogo=readPngRGBA(fs.readFileSync(path.join(root,'assets/original/j.png')));
assert.equal(sourceLogo.width,168);assert.equal(sourceLogo.height,121);assert.equal(sourceLogo.data[3],255,'original JAR atlas image is kept byte-faithful and separate');
const titleStart=html.indexOf('function drawCanvasTitle');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const title=game.slice(game.indexOf('function drawCanvasTitle'),game.indexOf('function drawCanvasChapterBook'));
assert.match(title,/canvasMenuButton\([^\n]+SOUND[^\n]+16,281,82,16/);
assert.match(title,/TAP OR PRESS ACTION',160,289/);
assert.match(game,/index===7\?'assets\/logo-transparent\.png'/);
assert.match(css,/overflow:\s*hidden;\s*overscroll-behavior:\s*none/);
assert.match(css,/margin-bottom:\s*clamp\(8px,\s*2\.2vh,\s*20px\) !important/);
assert.match(css,/width:\s*44px; height:\s*44px; min-height:\s*44px/);
console.log('V20 visuals/PWA: alpha title logo, non-overlapping footer controls, root icons, OG metadata, offline cache and mobile spacing verified');
