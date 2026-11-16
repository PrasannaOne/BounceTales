import java.util.Random;
public class Gen {
  static final int ONE = 65536;
  static int r(Random R,int lim){ return R.nextInt(2*lim+1)-lim; }
  static void m(StringBuilder s,d x){ s.append(x.a).append(' ').append(x.b).append(' ').append(x.c).append(' ').append(x.d).append(' ').append(x.e).append(' ').append(x.f); }
  static d rnd(Random R){ d x=new d(); x.a=r(R,2*ONE); x.b=r(R,2*ONE); x.d=r(R,2*ONE); x.e=r(R,2*ONE); x.c=r(R,4000*ONE); x.f=r(R,4000*ONE); return x; }
  static d rot(Random R){ d x=new d(); x.a(R.nextFloat()*12.566f-6.283f); x.c=r(R,4000*ONE); x.f=r(R,4000*ONE); return x; }
  public static void main(String[] a){
    Random R=new Random(20260515L);
    StringBuilder out=new StringBuilder();
    for(int i=0;i<150000;i++){
      int k=i%5; d p=(i%2==0)?rnd(R):rot(R);
      if(k==0){ int x=r(R,4000*ONE),y=r(R,4000*ONE); p.a(x,y); out.append("T "); m(out,p); out.append(' ').append(x).append(' ').append(y).append(" > ").append(d.g).append(' ').append(d.h); }
      else if(k==1){ int x=r(R,4000*ONE),y=r(R,4000*ONE); p.b(x,y); out.append("V "); m(out,p); out.append(' ').append(x).append(' ').append(y).append(" > ").append(d.g).append(' ').append(d.h); }
      else if(k==2){ d q=(i%3==0)?rot(R):rnd(R); d c=new d(); c.a(p); out.append("C "); m(out,p); out.append(' '); m(out,q); c.b(q); out.append(" > "); m(out,c); }
      else if(k==3){ float ang=R.nextFloat()*25.0f-12.5f; d z=new d(); z.a(ang); out.append("R ").append(Float.floatToIntBits(ang)).append(" > ").append(z.a).append(' ').append(z.b).append(' ').append(z.d).append(' ').append(z.e); }
      else { d inv=new d(); try{ p.c(inv); out.append("I "); m(out,p); out.append(" > "); m(out,inv);}catch(ArithmeticException e){ out.append("X"); } }
      out.append('\n');
    }
    System.out.print(out);
  }
}
