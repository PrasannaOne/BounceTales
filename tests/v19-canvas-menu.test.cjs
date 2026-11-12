const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const game=fs.readFileSync(path.join(__dirname,'..','game.js'),'utf8');
for(const name of ['drawCanvasTitle','drawCanvasChapterBook','drawCanvasScores','drawCanvasOptions','drawCanvasPause','drawCanvasComplete','drawCanvasGuide'])assert.ok(game.includes('function '+name+'('),`${name} exists`);
for(const action of ['continue','chapters','scores','options','guide','sound','fps','resume','restart','title','next'])assert.ok(game.includes("action==='"+action+"'"),`${action} menu action wired`);
assert.match(game,/canvas\.addEventListener\('pointerdown'/);assert.match(game,/canvas\.addEventListener\('pointerup'/);
console.log('Canvas navigation: seven canvas-rendered menu states and pointer actions are wired');
