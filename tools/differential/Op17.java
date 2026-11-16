import java.util.Random;
/* Transcription of g.java `case 17` (timed rotation), using the real class d. Runs whole commands step by step. */
public class Op17 {
  static final int ONE=65536;
  public static void main(String[] args){
    Random R=new Random(1717L); StringBuilder out=new StringBuilder();
    for(int n=0;n<3000;n++){
      int angle=R.nextInt(8*ONE*2+1)-8*ONE;            // +-8 rad in 16.16
      int duration=1+R.nextInt(2000);
      d obj=new d(); obj.a=R.nextInt(3*ONE)-ONE; obj.b=R.nextInt(3*ONE)-ONE; obj.d=R.nextInt(3*ONE)-ONE; obj.e=R.nextInt(3*ONE)-ONE;
      obj.c=R.nextInt(2000*ONE)-1000*ONE; obj.f=R.nextInt(2000*ONE)-1000*ONE;
      out.append("P ").append(angle).append(' ').append(duration).append(' ').append(obj.a).append(' ').append(obj.b).append(' ').append(obj.d).append(' ').append(obj.e).append(' ').append(obj.c).append(' ').append(obj.f).append('\n');
      int remaining=duration; int[] base=new int[4]; boolean done=false; int guard=0;
      while(!done && guard++<5000){
        int delta=8+R.nextInt(33);
        int var66=remaining, var18=duration, var5=delta;
        if(var66==var18){ base[0]=obj.a; base[1]=obj.b; base[2]=obj.d; base[3]=obj.e; }
        if(var66-var5<=0){ remaining=duration; var66=0; }
        float var72=(float)((long)angle*(long)(var18-var66)/(long)var18)/65536.0F;
        d rot=new d(); rot.a(var72); rot.c=0; rot.f=0;
        obj.a=base[0]; obj.b=base[1]; obj.d=base[2]; obj.e=base[3];
        obj.b(rot);
        if((var66=var66-var5)<=0){ done=true; } else { remaining=var66; }
        out.append("S ").append(delta).append(' ').append(obj.a).append(' ').append(obj.b).append(' ').append(obj.d).append(' ').append(obj.e).append(' ').append(obj.c).append(' ').append(obj.f).append(' ').append(remaining).append(' ').append(done?1:0).append('\n');
      }
    }
    // g.java case 16 (timed translation): obj.c += vx*delta, obj.f += vy*delta (int arithmetic), timer reset on finish
    Random Q=new Random(1616L);
    for(int n=0;n<3000;n++){
      int vx=Q.nextInt(400001)-200000, vy=Q.nextInt(400001)-200000, duration=1+Q.nextInt(3000);
      d obj=new d(); obj.c=Q.nextInt(2000*ONE)-1000*ONE; obj.f=Q.nextInt(2000*ONE)-1000*ONE;
      out.append("A ").append(vx).append(' ').append(vy).append(' ').append(duration).append(' ').append(obj.c).append(' ').append(obj.f).append('\n');
      int stored=duration, remaining=duration; boolean done=false; int guard=0;
      while(!done && guard++<5000){
        int delta=8+Q.nextInt(33); int var68=remaining, var19=delta;
        if(var68-var19<=0){ remaining=stored; var19=var68; }
        obj.c+=vx*var19; obj.f+=vy*var19;
        if((var68=var68-var19)<=0){ done=true; } else { remaining=var68; }
        out.append("B ").append(delta).append(' ').append(obj.c).append(' ').append(obj.f).append(' ').append(remaining).append(' ').append(done?1:0).append('\n');
      }
    }
    System.out.print(out);
  }
}
