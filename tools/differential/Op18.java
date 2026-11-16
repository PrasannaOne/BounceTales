import java.util.Random;
/* Transcription of g.java `case 18` (move object to another object's world position) on the real class d. */
public class Op18 {
  static final int ONE=65536;
  static d mk(int[] v){ d x=new d(); x.a=v[0]; x.b=v[1]; x.c=v[2]; x.d=v[3]; x.e=v[4]; x.f=v[5]; return x; }
  public static void main(String[] args){
    Random R=new Random(1818L); StringBuilder out=new StringBuilder();
    for(int n=0;n<30000;n++){
      int[] P=new int[6], L=new int[6];
      boolean singular=R.nextInt(30)==0;
      for(int i=0;i<6;i++){ boolean lin=(i==0||i==1||i==3||i==4); P[i]=lin?R.nextInt(4*ONE)-2*ONE:R.nextInt(2000*ONE)-1000*ONE; L[i]=lin?R.nextInt(4*ONE)-2*ONE:R.nextInt(2000*ONE)-1000*ONE; }
      if(R.nextInt(3)==0){ d r=new d(); r.a((R.nextFloat()-0.5f)*12.5f); P[0]=r.a;P[1]=r.b;P[3]=r.d;P[4]=r.e; }
      if(singular){ P[0]=0;P[1]=0;P[3]=0;P[4]=0; }
      int sx=R.nextInt(4000*ONE)-2000*ONE, sy=R.nextInt(4000*ONE)-2000*ONE;
      out.append("N ");for(int v:P)out.append(v).append(' ');for(int v:L)out.append(v).append(' ');out.append(sx).append(' ').append(sy).append(" > ");
      try{
        d l0=mk(L); l0.c=0; l0.f=0;          // dest translation zeroed
        d np=mk(P); np.b(l0);                 // parentWorld * local (no translation)
        d inv=new d(); np.c(inv);             // may throw ArithmeticException
        inv.a(sx,sy);                         // maps the source world translation
        out.append(d.g).append(' ').append(d.h);
      }catch(ArithmeticException e){ out.append("EXC"); }
      out.append('\n');
    }
    System.out.print(out);
  }
}
