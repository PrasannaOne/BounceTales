package javax.microedition.lcdui;
public class Font { public static final int FACE_SYSTEM=0,STYLE_PLAIN=0,STYLE_BOLD=1,SIZE_SMALL=8,SIZE_MEDIUM=0,SIZE_LARGE=16;
  static final Font F=new Font(); public static Font getFont(int a,int b,int c){return F;} public static Font getDefaultFont(){return F;}
  public int getHeight(){return 12;} public int substringWidth(String s,int o,int l){return 6*l;} public int stringWidth(String s){return 6*s.length();} public int charWidth(char c){return 6;} public int getBaselinePosition(){return 10;} }
