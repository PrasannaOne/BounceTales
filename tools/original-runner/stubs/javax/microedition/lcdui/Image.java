package javax.microedition.lcdui;
import java.io.*;
public class Image {
  int w,h; static final Graphics G=new Graphics();
  Image(int w,int h){this.w=w;this.h=h;}
  public static Image createImage(int w,int h){return new Image(w,h);}
  public static Image createImage(Image s){return new Image(s.w,s.h);}
  public static Image createImage(String name) throws IOException {
    InputStream in=Image.class.getResourceAsStream(name); if(in==null) throw new IOException("no resource "+name);
    byte[] b=in.readAllBytes(); return createImage(b,0,b.length); }
  public static Image createImage(byte[] d,int o,int l){ if(l>=24&&d[o+1]=='P'&&d[o+2]=='N'&&d[o+3]=='G'){ int w=((d[o+16]&255)<<24)|((d[o+17]&255)<<16)|((d[o+18]&255)<<8)|(d[o+19]&255); int h=((d[o+20]&255)<<24)|((d[o+21]&255)<<16)|((d[o+22]&255)<<8)|(d[o+23]&255); return new Image(w,h);} return new Image(1,1); }
  public static Image createRGBImage(int[] rgb,int w,int h,boolean a){return new Image(w,h);}
  public Graphics getGraphics(){return G;} public int getWidth(){return w;} public int getHeight(){return h;}
  public void getRGB(int[] a,int o,int s,int x,int y,int w,int h){ if(a!=null) java.util.Arrays.fill(a,0); }
}
