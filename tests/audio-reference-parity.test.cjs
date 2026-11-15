'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {RESOURCE_FILES,SOURCE_MIDI_FILES}=require('../src/audio-controller.js');

function readVlq(bytes,state){
  let value=0;
  for(let count=0;count<4;count++){
    if(state.offset>=bytes.length)throw new Error('Truncated MIDI variable-length quantity');
    const byte=bytes[state.offset++];value=(value<<7)|(byte&0x7f);
    if(!(byte&0x80))return value;
  }
  throw new Error('Invalid MIDI variable-length quantity');
}
function midiDuration(bytes){
  assert.equal(bytes.toString('ascii',0,4),'MThd');
  const headerLength=bytes.readUInt32BE(4),trackCount=bytes.readUInt16BE(10),division=bytes.readUInt16BE(12);
  assert.ok(headerLength>=6&&trackCount>0&&division>0&&!(division&0x8000),'MIDI uses a supported PPQ time division');
  let offset=8+headerLength,maxTick=0;const tempos=[];
  for(let track=0;track<trackCount;track++){
    assert.equal(bytes.toString('ascii',offset,offset+4),'MTrk');
    const length=bytes.readUInt32BE(offset+4),end=offset+8+length,state={offset:offset+8};
    let tick=0,runningStatus=null,ended=false;
    while(state.offset<end&&!ended){
      tick+=readVlq(bytes,state);
      let status=bytes[state.offset++];
      if(status<0x80){if(runningStatus===null)throw new Error('MIDI running status without status byte');state.offset--;status=runningStatus;}
      else if(status<0xf0)runningStatus=status;
      if(status===0xff){
        const type=bytes[state.offset++],size=readVlq(bytes,state),data=bytes.subarray(state.offset,state.offset+size);state.offset+=size;
        if(type===0x51&&size===3)tempos.push([tick,data.readUIntBE(0,3)]);
        if(type===0x2f)ended=true;
      }else if(status===0xf0||status===0xf7){state.offset+=readVlq(bytes,state);}
      else{
        const kind=status>>4;state.offset+=(kind===0xc||kind===0xd)?1:2;
      }
      if(state.offset>end)throw new Error('MIDI track event exceeds track boundary');
    }
    maxTick=Math.max(maxTick,tick);offset=end;
  }
  let cursor=0,tempo=500000,seconds=0;
  for(const [tick,nextTempo] of tempos.sort((a,b)=>a[0]-b[0])){
    if(tick>maxTick)break;
    seconds+=(tick-cursor)*tempo/(division*1e6);cursor=tick;tempo=nextTempo;
  }
  return seconds+(maxTick-cursor)*tempo/(division*1e6);
}
function opusDuration(bytes){
  let offset=0,lastGranule=null,preSkip=null;
  while(offset+27<=bytes.length){
    if(bytes.toString('ascii',offset,offset+4)!=='OggS')throw new Error('Invalid Ogg page capture pattern');
    const segmentCount=bytes[offset+26],laceStart=offset+27,bodyStart=laceStart+segmentCount;
    let bodyLength=0;for(let i=0;i<segmentCount;i++)bodyLength+=bytes[laceStart+i];
    const bodyEnd=bodyStart+bodyLength;if(bodyEnd>bytes.length)throw new Error('Truncated Ogg page');
    const page=bytes.subarray(bodyStart,bodyEnd),headerAt=page.indexOf(Buffer.from('OpusHead'));
    if(headerAt>=0){assert.ok(headerAt+12<=page.length);preSkip=page.readUInt16LE(headerAt+10);}
    const granule=bytes.readBigUInt64LE(offset+6);
    if(granule!==0xffffffffffffffffn)lastGranule=granule;
    offset=bodyEnd;
  }
  if(preSkip===null||lastGranule===null)throw new Error('Missing Opus identification header or final granule');
  return Number(lastGranule-BigInt(preSkip))/48000;
}

const expected={
  28:['aw.mid','title.ogg'],29:['ax.mid','act1.ogg'],30:['ay.mid','act2.ogg'],31:['az.mid','act3.ogg'],
  32:['ba.mid','boss.ogg'],33:['bb.mid','lose.ogg'],34:['bc.mid','win.ogg'],35:['bd.mid','bonus.ogg']
};
assert.deepEqual(Object.keys(RESOURCE_FILES).map(Number),Object.keys(expected).map(Number));
for(const [id,[midiName,oggName]] of Object.entries(expected)){
  assert.equal(SOURCE_MIDI_FILES[id],midiName,'resource '+id+' retains its original MIDI identity');
  assert.equal(RESOURCE_FILES[id],oggName,'resource '+id+' selects the corresponding browser audio');
  const midi=fs.readFileSync(path.join(root,'assets/original',midiName));
  const ogg=fs.readFileSync(path.join(root,'assets/audio',oggName));
  assert.ok(midi.length>100&&ogg.length>100,'both source MIDI and browser audio are present');
  const sourceDuration=midiDuration(midi),browserDuration=opusDuration(ogg);
  const tail=browserDuration-sourceDuration;
  assert.ok(tail>=1.0&&tail<=1.2,`${midiName} -> ${oggName}: duration tail ${tail.toFixed(3)}s should stay within the observed ~1.1s conversion tail`);
}
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const renderer=fs.readFileSync(path.join(root,'render_midi.py'),'utf8');
assert.match(renderer,/synth\.gain',0\.62/,'the existing MIDI-to-audio renderer already applies its own master gain');
assert.match(renderer,/1\.1\*RATE/,'the OGG duration tail is deliberately added during source rendering');
assert.match(game,/musicController\?\.playTitle\(\)/,'title scene starts resource 28');
assert.match(game,/musicController\?\.playLevel\(currentLevel\.index\)/,'campaign scenes select the original chapter music group');
assert.match(game,/musicController\?\.playCue\(33\)/,'death plays the original one-shot cue');
assert.match(game,/musicController\?\.playCue\(34\)/,'victory plays the original one-shot cue');
console.log('Audio reference parity: all eight MIDI-to-Opus mappings and source-duration tails verified; title, chapter, death and victory triggers wired');
