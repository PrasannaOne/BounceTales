#!/usr/bin/env python3
"""Build a searchable, non-redistributive metadata reference from a Bounce Tales JAR."""
import argparse, zipfile, hashlib, json, struct, re
from pathlib import Path

def main():
 p=argparse.ArgumentParser(); p.add_argument('jar',type=Path); p.add_argument('--output',type=Path,required=True); a=p.parse_args()
 out=a.output; out.mkdir(parents=True,exist_ok=True); entries=[]; classes=[]; levels=[]; midis=[]; images=[]; langs=[]
 with zipfile.ZipFile(a.jar) as z:
  for info in z.infolist():
   if info.is_dir(): continue
   b=z.read(info); n=info.filename; e={'path':n,'size':len(b),'sha256':hashlib.sha256(b).hexdigest()}
   if n.endswith('.class'):
    e['kind']='class'; classes.append({'path':n,'bytes':len(b),'sha256':e['sha256'],'magic_ok':b[:4]==b'\xca\xfe\xba\xbe'})
   elif b.startswith(b'RLEF') and len(b)>=14:
    v,r,w,h,x=struct.unpack('>HHHHH',b[4:14]); e.update(kind='RLEF',version=v,width=w,height=h,header_extra=x,payload_bytes=len(b)-14); levels.append(e.copy())
   elif b.startswith(b'\x89PNG\r\n\x1a\n') and len(b)>=24:
    w,h=struct.unpack('>II',b[16:24]); e.update(kind='PNG',width=w,height=h); images.append(e.copy())
   elif b.startswith(b'MThd') and len(b)>=14:
    fmt,tr,div=struct.unpack('>HHH',b[8:14]); e.update(kind='MIDI',format=fmt,tracks=tr,ticks_per_quarter=div); midis.append(e.copy())
   elif n.startswith('lang.'):
    e['kind']='language'; langs.append(e.copy())
   else: e['kind']='other'
   entries.append(e)
 report={'source_jar_name':a.jar.name,'source_jar_sha256':hashlib.sha256(a.jar.read_bytes()).hexdigest(),'entry_count':len(entries),'classes':classes,'levels_rlef':levels,'images':images,'midi':midis,'languages':langs,'entries':entries}
 (out/'reference-index.json').write_text(json.dumps(report,indent=2)+'\n')
 (out/'REFERENCE_README.md').write_text('# Bounce Tales private reference index\n\nGenerated metadata only. Original JAR/class/resource bytes are not copied. Use SHA-256 to verify any separately held private source archive. RLEF dimensions and MIDI headers are parsed from the original resources. Class files are inventoried, not decompiled; use CFR privately for readable Java.\n\nCounts: '+json.dumps({k:len(report[k]) for k in ['classes','levels_rlef','images','midi','languages']},indent=2)+'\n')
 print(f"Indexed {len(entries)} entries: {len(classes)} classes, {len(levels)} RLEF, {len(images)} PNG, {len(midis)} MIDI")
if __name__=='__main__': main()
