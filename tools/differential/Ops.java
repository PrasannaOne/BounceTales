import java.util.Random;
/* Transcription of g.java cases 7-11 (variable set / add / sub / mul / div, float and int variants). */
public class Ops {
  static int[] vars=new int[8];
  static final int[] INTS={0,1,-1,2,-2,7,100,65536,-65536,46341,-46341,1<<24,(1<<24)+1,-(1<<24)-1,1<<30,Integer.MAX_VALUE,Integer.MIN_VALUE,123456789,-987654321};
  static final float[] FLTS={0f,-0f,1f,-1f,0.5f,3.14159f,-2.5f,1e-6f,1e6f,16777216f,16777217f,3.4028235e38f,-3.4028235e38f,Float.POSITIVE_INFINITY,Float.NEGATIVE_INFINITY,Float.NaN,Float.MIN_VALUE};
  static int pickInt(Random R){ return R.nextInt(3)==0?R.nextInt():INTS[R.nextInt(INTS.length)]; }
  static int pickFloatBits(Random R){ return Float.floatToIntBits(R.nextInt(3)==0?(R.nextFloat()-0.5f)*(float)Math.pow(10,R.nextInt(14)-4):FLTS[R.nextInt(FLTS.length)]); }
  static float f(int slot){ return Float.intBitsToFloat(vars[slot]); }
  public static void main(String[] a){
    Random R=new Random(7711L); StringBuilder out=new StringBuilder();
    for(int n=0;n<60000;n++){
      int dtype=1+R.nextInt(2), op=7+R.nextInt(5), slot=R.nextInt(8);
      for(int i=0;i<8;i++) vars[i]=(R.nextBoolean())?pickInt(R):pickFloatBits(R);
      int[] init=vars.clone();
      int otype,payload; // otype: float dest -> 1,2,16,32 ; int dest -> 2,32
      if(dtype==1){ int[] ts={1,2,16,32}; otype=ts[R.nextInt(4)]; } else { otype=R.nextBoolean()?2:32; }
      payload = (otype==1||otype==2)? R.nextInt(8) : (otype==16? pickFloatBits(R) : pickInt(R));
      boolean exc=false;
      try{
        if(dtype==1){
          float v = otype==1? f(payload) : otype==2? (float)vars[payload] : otype==16? Float.intBitsToFloat(payload) : (float)payload;
          float old=f(slot), res;
          switch(op){ case 7: res=v; break; case 8: res=old+v; break; case 9: res=old-v; break; case 10: res=old*v; break; default: res=old/v; }
          vars[slot]=Float.floatToIntBits(res);
        } else {
          int v = otype==2? vars[payload] : payload;
          switch(op){ case 7: vars[slot]=v; break; case 8: vars[slot]+=v; break; case 9: vars[slot]-=v; break; case 10: vars[slot]*=v; break; default: vars[slot]/=v; }
        }
      }catch(ArithmeticException e){ exc=true; }
      out.append("O ").append(dtype).append(' ').append(op).append(' ').append(slot).append(' ').append(otype).append(' ').append(payload).append(' ');
      for(int i=0;i<8;i++) out.append(init[i]).append(i<7?",":"");
      out.append(" > ").append(exc?"EXC":String.valueOf(vars[slot])).append('\n');
    }
    // cases 12-15: does the original take the jump? (branch when NOT [==, !=, <, >] respectively)
    Random C=new Random(1212L);
    for(int n=0;n<40000;n++){
      int dtype=1+C.nextInt(2), op=12+C.nextInt(4), slot=C.nextInt(8);
      for(int i=0;i<8;i++) vars[i]=(C.nextBoolean())?pickInt(C):pickFloatBits(C);
      int[] init=vars.clone(); int otype; if(dtype==1){ int[] ts={1,2,16,32}; otype=ts[C.nextInt(4)]; } else { otype=C.nextBoolean()?2:32; }
      int payload=(otype==1||otype==2)?C.nextInt(8):(otype==16?pickFloatBits(C):pickInt(C));
      boolean cont;
      if(dtype==2){ int v=otype==2?vars[payload]:payload; int x=vars[slot];
        cont= op==12? x==v : op==13? x!=v : op==14? x<v : x>v;
      } else { float v=otype==1?f(payload):otype==2?(float)vars[payload]:otype==16?Float.intBitsToFloat(payload):(float)payload; float x=f(slot);
        cont= op==12? x==v : op==13? x!=v : op==14? x<v : x>v;
      }
      out.append("K ").append(dtype).append(' ').append(op).append(' ').append(slot).append(' ').append(otype).append(' ').append(payload).append(' ');
      for(int i=0;i<8;i++) out.append(init[i]).append(i<7?",":"");
      out.append(" > ").append(cont?0:1).append('\n');   // 1 = jump taken
    }
    System.out.print(out);
  }
}
