package javax.microedition.media;
import javax.microedition.media.control.VolumeControl;
public class Manager { public static Player createPlayer(java.io.InputStream in,String t) throws java.io.IOException,MediaException {
  return new Player(){ int st=100; public void close(){st=0;} public void deallocate(){} public Control getControl(String s){return (VolumeControl)l->l;} public int getState(){return st;} public void prefetch(){st=300;} public void setLoopCount(int n){} public void start(){st=400;} public void stop(){st=300;} }; } }
