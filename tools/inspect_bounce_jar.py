#!/usr/bin/env python3
"""Inspect Bounce Tales JAR resources using only Python's standard library."""
from __future__ import annotations
import argparse, hashlib, json, struct, zipfile
from pathlib import Path

def inspect(jar_path: Path):
    entries=[]; counts={}
    with zipfile.ZipFile(jar_path) as archive:
        for info in archive.infolist():
            if info.is_dir():
                continue
            data=archive.read(info.filename)
            name=info.filename
            ext=Path(name).suffix.lower()
            kind='other'; extra={}
            if ext=='.class': kind='class'
            elif ext=='.png':
                kind='png'
                if data[:8] == b'\x89PNG\r\n\x1a\n' and len(data)>=24:
                    extra['width'],extra['height']=struct.unpack('>II',data[16:24])
            elif data.startswith(b'MThd') and len(data)>=14:
                kind='midi'
                extra['format'],extra['tracks'],extra['division']=struct.unpack('>HHH',data[8:14])
            elif name.startswith('lang.'):
                kind='language'
            elif data.startswith(b'RLEF') and len(data)>=14:
                kind='RLEF'
                ver,reserved,w,h,other=struct.unpack('>HHHHH',data[4:14])
                extra.update(version=ver,reserved=reserved,header_width=w,header_height=h,header_extra=other)
            elif name in ('a','b','be','bv'):
                kind='binary'
            counts[kind]=counts.get(kind,0)+1
            entries.append({'path':name,'kind':kind,'size_bytes':len(data),
                            'sha256':hashlib.sha256(data).hexdigest(),**extra})
    return {'jar':jar_path.name,'archive_file_count':len(entries),'counts':counts,'entries':entries}

def verify_asset_copy(jar_path: Path, asset_dir: Path):
    missing=[]; mismatched=[]
    with zipfile.ZipFile(jar_path) as archive:
        for info in archive.infolist():
            if info.is_dir(): continue
            target=asset_dir.joinpath(*info.filename.split('/'))
            original=archive.read(info.filename)
            if not target.is_file():
                missing.append(info.filename)
            elif hashlib.sha256(target.read_bytes()).digest()!=hashlib.sha256(original).digest():
                mismatched.append(info.filename)
    return {'missing':missing,'mismatched':mismatched,'ok':not missing and not mismatched}

def main():
    p=argparse.ArgumentParser()
    p.add_argument('jar',type=Path)
    p.add_argument('--assets',type=Path,help='optional extracted assets/original directory to compare byte-for-byte')
    p.add_argument('--output',type=Path,help='optional JSON output path')
    a=p.parse_args()
    result=inspect(a.jar)
    if a.assets:
        result['asset_copy_verification']=verify_asset_copy(a.jar,a.assets)
    rendered=json.dumps(result,indent=2)
    if a.output: a.output.write_text(rendered+'\n',encoding='utf-8')
    print(rendered)
    if a.assets and not result['asset_copy_verification']['ok']:
        raise SystemExit(1)
if __name__=='__main__': main()
