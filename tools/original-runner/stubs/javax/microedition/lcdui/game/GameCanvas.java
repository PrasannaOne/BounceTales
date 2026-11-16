package javax.microedition.lcdui.game;
import javax.microedition.lcdui.*;
public abstract class GameCanvas extends Canvas {
  public static Runnable frameHook;  // harness: called on the game thread after each flush
  private static Graphics shared=new Graphics();
  protected GameCanvas(boolean suppress){ super(); }
  protected Graphics getGraphics(){ return shared; }
  public void flushGraphics(){ if(frameHook!=null) frameHook.run(); }
  public void flushGraphics(int x,int y,int w,int h){ flushGraphics(); }
  public int getKeyStates(){ return 0; }
}
