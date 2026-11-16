// NOTE: verbatim decompiled `d` from BounceTales_Decompiled_Ref/src_decompiled/d.java with exactly ONE line removed:
// `public static d a = new d();` -- bytecode allows a field and a static field both named `a`, Java source does not.
// That static singleton is not used by any method below; all arithmetic is untouched.
/**
 * Bounce Tales decompiled reference: obfuscated class `d`.
 * Reconstructed role: 16.16 fixed-point 2D affine transform and coordinate math.
 * Source basis: supplied JAR bytecode cross-reference and Phase 2 decompiler output.
 *
 * Names remain obfuscated. Field/method annotations identify symbols and evidence level;
 * they do not rename members or claim unsupported semantic certainty.
 */

public final class d {
   // OBFUSCATED FIELD `a`; affine transform component or shared transformed-coordinate scratch value.
   public int a = 65536;
   // OBFUSCATED FIELD `b`; affine transform component or shared transformed-coordinate scratch value.
   public int b;
   // OBFUSCATED FIELD `c`; affine transform component or shared transformed-coordinate scratch value.
   public int c;
   // OBFUSCATED FIELD `d`; affine transform component or shared transformed-coordinate scratch value.
   public int d;
   // OBFUSCATED FIELD `e`; affine transform component or shared transformed-coordinate scratch value.
   public int e = 65536;
   // OBFUSCATED FIELD `f`; affine transform component or shared transformed-coordinate scratch value.
   public int f;
   // OBFUSCATED FIELD `g`; affine transform component or shared transformed-coordinate scratch value.
   public static int g;
   // OBFUSCATED FIELD `h`; affine transform component or shared transformed-coordinate scratch value.
   public static int h;

   // OBFUSCATED METHOD `a(int var1, int var2)`; fixed-point coordinate transform or matrix operation (overload-specific).
   public final void a(int var1, int var2) {
      g = (int)((long)this.a * (long)var1 + (long)this.b * (long)var2 >> 16) + this.c;
      h = (int)((long)this.d * (long)var1 + (long)this.e * (long)var2 >> 16) + this.f;
   }

   // OBFUSCATED METHOD `b(int var1, int var2)`; fixed-point transform composition/coordinate operation (overload-specific).
   public final void b(int var1, int var2) {
      g = (int)((long)this.a * (long)var1 + (long)this.b * (long)var2 >> 16);
      h = (int)((long)this.d * (long)var1 + (long)this.e * (long)var2 >> 16);
   }

   // OBFUSCATED METHOD `a(d var1)`; fixed-point coordinate transform or matrix operation (overload-specific).
   public final void a(d var1) {
      this.a = var1.a;
      this.b = var1.b;
      this.c = var1.c;
      this.d = var1.d;
      this.e = var1.e;
      this.f = var1.f;
   }

   // OBFUSCATED METHOD `b(d var1)`; fixed-point transform composition/coordinate operation (overload-specific).
   public final void b(d var1) {
      int var2 = (int)((long)this.a * (long)var1.a + (long)this.b * (long)var1.d >> 16);
      int var3 = (int)((long)this.a * (long)var1.b + (long)this.b * (long)var1.e >> 16);
      int var4 = (int)(((long)this.a * (long)var1.c + (long)this.b * (long)var1.f >> 16) + (long)this.c);
      int var5 = (int)((long)this.d * (long)var1.a + (long)this.e * (long)var1.d >> 16);
      int var6 = (int)((long)this.d * (long)var1.b + (long)this.e * (long)var1.e >> 16);
      int var7 = (int)(((long)this.d * (long)var1.c + (long)this.e * (long)var1.f >> 16) + (long)this.f);
      this.a = var2;
      this.b = var3;
      this.c = var4;
      this.d = var5;
      this.e = var6;
      this.f = var7;
   }

   // OBFUSCATED METHOD `a(d var0, d var1, d var2)`; fixed-point coordinate transform or matrix operation (overload-specific).
   public static void a(d var0, d var1, d var2) {
      int var3 = (int)((long)var0.a * (long)var1.a + (long)var0.b * (long)var1.d >> 16);
      int var4 = (int)((long)var0.a * (long)var1.b + (long)var0.b * (long)var1.e >> 16);
      int var5 = (int)(((long)var0.a * (long)var1.c + (long)var0.b * (long)var1.f >> 16) + (long)var0.c);
      int var6 = (int)((long)var0.d * (long)var1.a + (long)var0.e * (long)var1.d >> 16);
      int var7 = (int)((long)var0.d * (long)var1.b + (long)var0.e * (long)var1.e >> 16);
      int var8 = (int)(((long)var0.d * (long)var1.c + (long)var0.e * (long)var1.f >> 16) + (long)var0.f);
      var2.a = var3;
      var2.b = var4;
      var2.c = var5;
      var2.d = var6;
      var2.e = var7;
      var2.f = var8;
   }

   // OBFUSCATED METHOD `c(d var1)`; obfuscated method; exact overload is identified by parameter types and body.
   public final void c(d var1) {
      long var2;
      if ((var2 = (long)this.a * (long)this.e - (long)this.b * (long)this.d >> 16) != 0L) {
         var1.a = (int)(((long)this.e << 16) / var2);
         var1.b = (int)(((long)this.d << 16) / var2);
         var1.d = (int)(((long)this.b << 16) / var2);
         var1.e = (int)(((long)this.a << 16) / var2);
         var1.c = -((int)((long)this.c * (long)var1.a + (long)this.f * (long)var1.b >> 16));
         var1.f = -((int)((long)this.c * (long)var1.d + (long)this.f * (long)var1.e >> 16));
      } else {
         throw new ArithmeticException("Non-invertible matrix.");
      }
   }

   // OBFUSCATED METHOD `a(float var1)`; fixed-point coordinate transform or matrix operation (overload-specific).
   public final void a(float var1) {
      int var2 = (int)((float)Math.cos((double)var1) * 65536.0F);
      int var3 = (int)((float)Math.sin((double)var1) * 65536.0F);
      this.a = var2;
      this.b = -var3;
      this.d = var3;
      this.e = var2;
   }

   // OBFUSCATED METHOD `toString()`; obfuscated method; exact overload is identified by parameter types and body.
   public final String toString() {
      return new String(this.a + " " + this.b + " " + this.c + "\n" + this.d + " " + this.e + " " + this.f);
   }
}
