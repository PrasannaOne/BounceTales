import java.lang.reflect.*; import java.util.*;
public class OriginalRecorder {
  static int frame=0; static Object shell; static Field fPlayer, fDelta, fMatrix, fJ, fR, fD, fVars; static Method mKeyP, mKeyR; static List<Field> pf=new ArrayList<>();
  static StringBuilder log=new StringBuilder();
  static int startedAt=-1;
  static void key(boolean down,int code){ try{ (down?mKeyP:mKeyR).invoke(shell,code);}catch(Exception e){throw new RuntimeException(e);} }
  public static void main(String[] a) throws Exception {
    final int total=Integer.parseInt(a.length>0?a[0]:"900");
    ClassLoader L=OriginalRecorder.class.getClassLoader(); Class<?> mC=Class.forName("m",false,L), oC=Class.forName("o",false,L);
    for(Field f:mC.getDeclaredFields()) if(Modifier.isStatic(f.getModifiers())&&f.getType().getName().equals("c")){f.setAccessible(true);fPlayer=f;}
    for(Field f:oC.getDeclaredFields()) if(Modifier.isStatic(f.getModifiers())&&f.getType()==int.class&&f.getName().equals("a")){f.setAccessible(true);fDelta=f;}
    for(Field f:oC.getDeclaredFields()) if(Modifier.isStatic(f.getModifiers())&&f.getType()==int.class&&f.getName().equals("j")){f.setAccessible(true);fJ=f;}
    for(Method m:oC.getDeclaredMethods()){ if(m.getName().equals("keyPressed")){m.setAccessible(true);mKeyP=m;} if(m.getName().equals("keyReleased")){m.setAccessible(true);mKeyR=m;} }
    Class<?> cC=Class.forName("c",false,L), jC=Class.forName("j",false,L);
    for(Field f:cC.getDeclaredFields()) if(!Modifier.isStatic(f.getModifiers())&&f.getType()==float.class&&Modifier.isPublic(f.getModifiers())){f.setAccessible(true);pf.add(f);}
    for(Field f:Class.forName("g",false,L).getDeclaredFields()) if(Modifier.isStatic(f.getModifiers())&&f.getType()==int[].class&&f.getName().equals("a")){f.setAccessible(true);fVars=f;}
    for(Field f:cC.getDeclaredFields()){ if(!Modifier.isStatic(f.getModifiers())&&f.getName().equals("r")&&f.getType()==float.class){f.setAccessible(true);fR=f;} if(!Modifier.isStatic(f.getModifiers())&&f.getName().equals("d")&&f.getType()==boolean.class){f.setAccessible(true);fD=f;} }
    for(Field f:jC.getDeclaredFields()) if(f.getName().equals("c")&&f.getType().getName().equals("d")){f.setAccessible(true);fMatrix=f;}
    javax.microedition.lcdui.game.GameCanvas.frameHook=()->{
      frame++; try{Thread.sleep(16);}catch(Exception e){}
      try{
        Object pl=fPlayer.get(null);
        if(shell==null) shell=javax.microedition.lcdui.Display.getDisplay(null).getCurrent();
        if(pl==null){ if(shell!=null&&frame%45==0){ key(true,-5); key(false,-5);} return; }
        if(startedAt<0) startedAt=frame;
        int t=frame-startedAt;
        String sched=System.getProperty("sched");
        if(sched!=null){ for(String ev:sched.split(",")){ String[] p=ev.split(":"); if(Integer.parseInt(p[0])==t) key(p[2].equals("1"),Integer.parseInt(p[1])); } }
        Object m=fMatrix.get(pl); Class<?> dC=m.getClass(); int mc=0,mf=0;
        for(Field f:dC.getDeclaredFields()) if(!Modifier.isStatic(f.getModifiers())&&f.getType()==int.class){f.setAccessible(true);}
        mc=(int)dC.getDeclaredField("c").get(m); mf=(int)dC.getDeclaredField("f").get(m);
        StringBuilder sb=new StringBuilder(); sb.append(t).append(' ').append(fDelta.getInt(null)).append(' ').append(fJ.getInt(null)).append(' ').append(mc).append(' ').append(mf);
        for(Field f:pf) sb.append(' ').append(f.getFloat(pl)); sb.append(' ').append(fR.getFloat(pl)).append(' ').append(fD.getBoolean(pl)?1:0); int[] ev=(int[])fVars.get(null); for(int q=0;q<7;q++) sb.append(' ').append(ev[q]);
        log.append(sb).append('\n');
        if(t>=total){ System.out.print("floats="+pf.size()+" fields:"); for(Field f:pf)System.out.print(" "+f.getName()); System.out.println(); System.out.print(log); System.exit(0);}
      }catch(Exception e){ e.printStackTrace(); System.exit(1);} };
    Class<?> rm=Class.forName("RMIDlet"); Object app=rm.getDeclaredConstructor().newInstance();
    Method start=null; for(Class<?> c=rm;c!=null&&start==null;c=c.getSuperclass()) for(Method m:c.getDeclaredMethods()) if(m.getName().equals("startApp")) start=m;
    start.setAccessible(true); start.invoke(app);
    Thread.sleep(60000); System.out.println("TIMEOUT frames="+frame+" shell="+(shell!=null)); System.exit(2);
  }
}
