package javax.microedition.lcdui;
public class Graphics {
  public static final int HCENTER=1,VCENTER=2,LEFT=4,RIGHT=8,TOP=16,BOTTOM=32,BASELINE=64,SOLID=0,DOTTED=1;
  int cx=0,cy=0,cw=240,ch=320;
  public void drawRGB(int[] a,int b,int c,int d,int e,int f,int g,boolean h){} public void drawRect(int a,int b,int c,int d){}
  public void drawRegion(Image i,int a,int b,int c,int d,int e,int f,int g,int h){} public void drawSubstring(String s,int a,int b,int c,int d,int e){}
  public void drawImage(Image i,int x,int y,int a){} public void drawString(String s,int x,int y,int a){} public void drawLine(int a,int b,int c,int d){}
  public void fillArc(int a,int b,int c,int d,int e,int f){} public void fillRect(int a,int b,int c,int d){} public void fillTriangle(int a,int b,int c,int d,int e,int f){}
  public int getClipHeight(){return ch;} public int getClipWidth(){return cw;} public int getClipX(){return cx;} public int getClipY(){return cy;}
  public void setClip(int x,int y,int w,int h){cx=x;cy=y;cw=w;ch=h;} public void clipRect(int x,int y,int w,int h){}
  public void setColor(int c){} public void setColor(int r,int g,int b){} public void setFont(Font f){}
  public void translate(int x,int y){}
}
