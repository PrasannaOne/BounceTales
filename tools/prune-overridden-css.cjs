#!/usr/bin/env node
'use strict';
// Removes CSS declarations that can never take effect because the SAME selector, in the SAME
// media/supports context, sets the SAME property again in a later rule with the same or higher
// importance. Provably safe for every element and state (identical selector = identical
// specificity and matches, later wins). Deliberately conservative:
//   * declarations inside one block are never touched (they are usually fallback pairs);
//   * an earlier value is kept as a fallback when the later value uses syntax older browsers may
//     reject at parse time (cq units, dvh/svh/lvh, env(), clamp()/min()/max(), color-mix()).
// Usage: node tools/prune-overridden-css.cjs style.css [--write]
const fs=require('node:fs');
const file=process.argv[2]||'style.css',write=process.argv.includes('--write');
const src=fs.readFileSync(file,'utf8');
const RISKY=/\b\d*\.?\d*(cq[whibmax]+)\b|dvh|svh|lvh|dvw|svw|lvw|env\(|clamp\(|\bmin\(|\bmax\(|color-mix\(|:has\(/i;
// ---- tokenizer-aware scan -------------------------------------------------
let i=0;const n=src.length;
function skipTrivia(){for(;;){if(/\s/.test(src[i]||'')){i++;continue;}if(src.startsWith('/*',i)){const e=src.indexOf('*/',i+2);i=e<0?n:e+2;continue;}break;}}
function readUntil(chars){ // read until an unquoted/unparenthesised char in `chars`; returns text (not consuming the stop char)
  const s=i;let depth=0,q=null;
  while(i<n){const c=src[i];
    if(q){if(c==='\\')i++;else if(c===q)q=null;}
    else if(src.startsWith('/*',i)){const e=src.indexOf('*/',i+2);i=e<0?n:e+1;}
    else if(c==='"'||c==="'")q=c;
    else if(c==='(')depth++;else if(c===')')depth--;
    else if(depth<=0&&chars.includes(c))break;
    i++;}
  return src.slice(s,i);
}
const rules=[]; // {ctx, sel, decls:[{prop,value,important,start,end}]}
function parseBlockBody(){ // after '{' ; returns decls until matching '}'
  const decls=[];
  for(;;){skipTrivia();if(i>=n||src[i]==='}'){i++;return decls;}
    const start=i;const head=readUntil(':;}');
    if(src[i]===':'){i++;const v=readUntil(';}');const end=src[i]===';'?i+1:i;if(src[i]===';')i++;
      const raw=v.trim(),imp=/!\s*important\s*$/i.test(raw);
      decls.push({prop:head.trim().toLowerCase(),value:raw.replace(/!\s*important\s*$/i,'').trim(),important:imp,start,end});}
    else if(src[i]===';')i++;}
}
function parseSheet(ctx,depth){
  for(;;){skipTrivia();if(i>=n)return;if(src[i]==='}'){i++;return;}
    const head=readUntil('{;');
    if(src[i]===';'){i++;continue;}
    i++; // '{'
    const h=head.trim();
    if(h.startsWith('@')){
      if(/^@(media|supports)\b/i.test(h)){const rc=ctx+'|'+h.replace(/\s+/g,' ');if(depth>1)throw new Error('nesting too deep');parseSheet(rc,depth+1);}
      else{let d=1;while(i<n&&d>0){const c=src[i++];if(c==='{')d++;else if(c==='}')d--;}} // keyframes/font-face etc: skipped
    }else{const bs=i;const decls=parseBlockBody();rules.push({ctx,sel:h.replace(/\s+/g,' '),decls,blockStart:bs,blockEnd:i});}
  }
}
parseSheet('',0);
// ---- find dead declarations ---------------------------------------------
const groups=new Map();rules.forEach((r,idx)=>{const k=r.ctx+'\u0000'+r.sel;(groups.get(k)||groups.set(k,[]).get(k)).push(idx);});
const dead=[];let consideredProps=0;
for(const [k,idxs] of groups){
  if(idxs.length<2)continue;
  const byProp=new Map();
  idxs.forEach((ri,pos)=>{for(const d of rules[ri].decls){(byProp.get(d.prop)||byProp.set(d.prop,[]).get(d.prop)).push({pos,ri,d});}});
  for(const [prop,list] of byProp){
    if(prop.startsWith('--')||list.length<2)continue;consideredProps++;
    for(const e of list){
      // later blocks (strictly later position) that set the same property
      const later=list.filter(o=>o.pos>e.pos);if(!later.length)continue;
      // the effective later declaration = its block's last declaration of this prop; is there one that dominates e?
      const dominating=later.find(o=>{const lastInBlock=list.filter(x=>x.pos===o.pos).pop();
        const ok=(!e.d.important)||lastInBlock.d.important;               // important beats normal regardless of order
        const safe=!RISKY.test(lastInBlock.d.value)||RISKY.test(e.d.value)&&false; // keep fallback unless later value is plain
        return ok&&safe;});
      if(!dominating)continue;
      // never drop an entry that is part of a same-block fallback pair
      if(rules[e.ri].decls.filter(x=>x.prop===prop).length>1)continue;
      dead.push({rule:rules[e.ri],d:e.d});
    }
  }
}
// ---- report / write ---------------------------------------------------------
const byRule=new Map();for(const x of dead){(byRule.get(x.rule)||byRule.set(x.rule,[]).get(x.rule)).push(x.d);}
let removedDecls=0,removedRules=0;const cuts=[];
for(const [r,ds] of byRule){
  removedDecls+=ds.length;
  if(ds.length===r.decls.length){ // whole block is dead: remove "selector{...}" including its selector text
    let s=r.blockStart-1;while(s>0&&src[s-1]!=='}'&&src[s-1]!=='{'&&src[s-1]!==';'&&!(src[s-1]==='/'&&src[s-2]==='*'))s--; // selector start
    cuts.push([s,r.blockEnd]);removedRules++;
  }else for(const d of ds)cuts.push([d.start,d.end]);
}
cuts.sort((a,b)=>b[0]-a[0]);
let out=src;for(const [a,b] of cuts)out=out.slice(0,a)+out.slice(b);
out=out.replace(/\n[ \t]*\n[ \t]*\n+/g,'\n\n');
console.log(`rules parsed: ${rules.length} | property groups compared: ${consideredProps} | overridden declarations: ${removedDecls} | blocks emptied: ${removedRules} | ${src.length} -> ${out.length} bytes`);
if(write){fs.writeFileSync(file,out);console.log('written',file);}
