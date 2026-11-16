package javax.microedition.lcdui;
public abstract class Displayable { public void addCommand(Command c){} public void removeCommand(Command c){} public void setCommandListener(CommandListener l){} public boolean isShown(){return true;} public int getWidth(){return 240;} public int getHeight(){return 320;} protected void sizeChanged(int w,int h){} }
