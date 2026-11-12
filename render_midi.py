import ctypes, ctypes.util, wave, struct, os
import mido
lib=ctypes.CDLL(ctypes.util.find_library('fluidsynth'))
def sig(name,args,restype=ctypes.c_int):
 f=getattr(lib,name);f.argtypes=args;f.restype=restype;return f
ptr=ctypes.c_void_p;I=ctypes.c_int;D=ctypes.c_double;B=ctypes.c_char_p
new_settings=sig('new_fluid_settings',[],ptr)
setnum=sig('fluid_settings_setnum',[ptr,B,D]);setint=sig('fluid_settings_setint',[ptr,B,I])
new_synth=sig('new_fluid_synth',[ptr],ptr);sfload=sig('fluid_synth_sfload',[ptr,B,I])
program=sig('fluid_synth_program_select',[ptr,I,I,I,I]);noteon=sig('fluid_synth_noteon',[ptr,I,I,I]);noteoff=sig('fluid_synth_noteoff',[ptr,I,I]);cc=sig('fluid_synth_cc',[ptr,I,I,I]);bend=sig('fluid_synth_pitch_bend',[ptr,I,I])
write=sig('fluid_synth_write_s16',[ptr,I,ptr,I,I,ptr,I,I]);delete_synth=sig('delete_fluid_synth',[ptr]);delete_settings=sig('delete_fluid_settings',[ptr])
RATE=22050;BLOCK=2048

def build_events(mid):
 tempo=500000;seconds=0;events=[]
 for msg in mid.merged_track:
  seconds+=mido.tick2second(msg.time,mid.ticks_per_beat,tempo)
  if msg.type=='set_tempo':tempo=msg.tempo
  elif not msg.is_meta:events.append((max(0,int(round(seconds*RATE))),msg))
 return events,max((e[0] for e in events),default=0)

def render(src,dest,sf2):
 mid=mido.MidiFile(src);events,end_sample=build_events(mid);end_sample+=int(1.1*RATE)
 settings=new_settings();setnum(settings,b'synth.sample-rate',RATE);setnum(settings,b'synth.gain',0.62);setnum(settings,b'synth.reverb.room-size',0.55);setnum(settings,b'synth.reverb.damp',0.35);setnum(settings,b'synth.chorus.depth',5.0);setint(settings,b'synth.polyphony',128);setint(settings,b'synth.cpu-cores',1)
 synth=new_synth(settings);sfid=sfload(synth,sf2.encode(),1)
 if sfid<0:raise RuntimeError('SoundFont load failed')
 for ch in range(16):program(synth,ch,sfid,0,0);cc(synth,ch,7,100);cc(synth,ch,10,64)
 left=(ctypes.c_short*BLOCK)();right=(ctypes.c_short*BLOCK)();sample=0;idx=0
 with wave.open(dest,'wb') as wav:
  wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(RATE)
  while sample<end_sample:
   while idx<len(events) and events[idx][0]<=sample:
    msg=events[idx][1]
    if msg.type=='program_change':program(synth,msg.channel,sfid,0,msg.program)
    elif msg.type=='note_on':
     if msg.velocity:noteon(synth,msg.channel,msg.note,msg.velocity)
     else:noteoff(synth,msg.channel,msg.note)
    elif msg.type=='note_off':noteoff(synth,msg.channel,msg.note)
    elif msg.type=='control_change':cc(synth,msg.channel,msg.control,msg.value)
    elif msg.type=='pitchwheel':bend(synth,msg.channel,msg.pitch+8192)
    idx+=1
   next_event=events[idx][0] if idx<len(events) else end_sample
   n=min(BLOCK,max(1,min(end_sample,next_event)-sample))
   if write(synth,n,left,0,1,right,0,1)!=0:raise RuntimeError('render failed')
   chunk=bytearray(n*4)
   for j in range(n):
    struct.pack_into('<hh',chunk,j*4,left[j],right[j])
   wav.writeframesraw(chunk);sample+=n
 delete_synth(synth);delete_settings(settings)
 return end_sample/RATE
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('src');p.add_argument('dest');p.add_argument('--sf2',default='/usr/share/sounds/sf2/TimGM6mb.sf2');a=p.parse_args()
 print('rendered',round(render(a.src,a.dest,a.sf2),2),'sec')
