# V29 source-parity notes: J2ME physics and springboards

This note records the source evidence used for V29. Java line numbers refer to
`src_decompiled/c.java` and `src_decompiled/e.java` in the companion
`BounceTales_Decompiled_Ref.zip`. The Java text is quoted verbatim, including
its obfuscated identifiers. Repeated field names in the decompiler are
descriptor-ambiguous; do not infer meaning from the spelling alone.

## Coordinate and numeric conventions

- World X increases rightward. World Y increases upward.
- The screen projection in `game.js` is
  `screenY = H/2 - (worldY - cameraY) * SCALE`, so an upward world movement
  increases world Y and decreases screen Y.
- Scene transform translations/positions are signed 16.16 fixed point:
  `fixed = integerPixels * 65536`; integer-pixel extraction uses arithmetic
  `>> 16`. Java float velocity/acceleration values remain floating point.
- Java `float` calculations are binary32. V29 uses `Math.fround` at Java
  float-operation boundaries; Java casts to `int` truncate toward zero.
- The player gravity field is `-400.0F`. Form gravity scales are `[1.0F,
  1.4F, 0.5F]`; the player update multiplies acceleration by the scale and
  then multiplies by its reciprocal during integration, matching the source
  order. Jump impulse values are `[288.0F, 255.0F, 162.5F]`.

## Raw Java evidence and direct JavaScript counterparts

### Gravity and player velocity integration

`src_decompiled/c.java`, field and update method:

```java
private static float m = -400.0F;
public static final float[] a = new float[]{1.0F, 1.4F, 0.5F};
private static float[] h = new float[]{288.0F, 255.0F, 162.5F};

this.d += 0.0F * a[this.d];
this.e += m * a[this.d];
float var11 = (float)o.a * 0.001F;
float var3 = 1.0F / a[this.d];
this.a += this.d * var3 * var11;
this.b += this.e * var3 * var11;
this.a += this.f * var3;
this.b += this.g * var3;
d var10000 = this.c;
var10000.c += (int)(this.a * var11 * 65536.0F);
var10000 = this.c;
var10000.f += (int)(this.b * var11 * 65536.0F);
```

V29 counterpart in `src/bounce-physics.js` (`BounceBody.update`):

```js
const motionDelta=fmul(updateDelta,0.001);
const gravityScale=f32(P.gravity[mode]);
const invGravity=f32(1.0/gravityScale);

this.gravityX=fadd(this.gravityX,fmul(0,gravityScale));
this.gravityY=fadd(this.gravityY,fmul(P.baseGravityY,gravityScale));
this.vx=fadd(this.vx,fmul(fmul(this.gravityX,invGravity),motionDelta));
this.vy=fadd(this.vy,fmul(fmul(this.gravityY,invGravity),motionDelta));
this.vx=fadd(this.vx,fmul(this.pushX,invGravity));
this.vy=fadd(this.vy,fmul(this.pushY,invGravity));
this.x16=(this.x16+Math.trunc(fmul(fmul(this.vx,motionDelta),65536.0)))|0;
this.y16=(this.y16+Math.trunc(fmul(fmul(this.vy,motionDelta),65536.0)))|0;
```

`updateDelta` is the integer source tick (`o.a`, milliseconds); `motionDelta`
is the Java-float equivalent of `(float)o.a * 0.001F`. `fadd` and `fmul`
round each operation to binary32 instead of allowing JS binary64 intermediates
to accumulate. The source order is retained: acceleration, velocity from
acceleration, one-shot impulse, then 16.16 coordinate integration.

### Player jump impulse

`src_decompiled/c.java`, `a(boolean)`:

```java
if (this.r > d[this.d] && this.d) {
   if (var1) {
      this.g += h[this.d] / 2.0F;
   } else {
      this.g += h[this.d];
   }
```

V29 counterpart in `src/bounce-physics.js` (`jump`):

```js
jump(small=false){
  if(this.slopeCosAbs>P.maxJumpSlope&&this.grounded){
    this.pushY+=small?P.jumpAcceleration[this.forme]/2:P.jumpAcceleration[this.forme];
    this.grounded=false;
```

The three source values are the `h` array quoted above. A short jump uses
half the selected value; a full jump uses the full value.

### Trampoline contact and impulse calculation

`src_decompiled/c.java`, `c.a(j)` object-tree traversal, `case 8`:

```java
case 8:
   e var81 = (e)var9;
   int var91 = -4587520;
   int var96 = 6225920;
   if (a(var91, var96, 9175040, 0, var10, var11, var12, var13, 0)) {
      float var61 = var3.b;
      if (var61 < 0.0F) {
         if ((var13 = -((int)var61)) < 100) {
            var13 = 100;
         }

         if (var13 > 1000) {
            var13 = 1000;
         }

         var81.b = (1100 - var13 >> 1) + 20;
         var81.a = var81.b / o.b(var81.a);
         var81.a = var3;
         var81.a = -var61 * (float)var81.a * 2.0F / 100.0F;
         var61 = 400.0F * (float)var81.a * 2.0F / 100.0F;
         if (var81.a > var61) {
            var81.a = var61;
         }

         var81.a.a = false;
         var81.a.a = 0.0F;
         var81.a.b = 0.0F;
         var81.a = false;
         var81.b();
         if (var81.a.equals(m.a)) {
            g.a[1] = 2;
         }
      }
   }
   var9 = var9.a(var4);
   break;
```

The source contact segment is local `(-70, 95)` with delta `(140, 0)` in
16.16 coordinates. `var3.b < 0.0F` is the descending-world-Y guard. The
integer cast of the incoming speed is clamped to 100..1000 for the period:
`period = ((1100 - clampedSpeed) >> 1) + 20`. The period is divided by the
number of frames. Separately, the untruncated incoming float is used for the
positive launch impulse and capped by a 400-unit incoming-speed reference:
`min((-incomingVy * basePush * 2 / 100), (400 * basePush * 2 / 100))`.

V29 counterparts:

`src/original-trampoline.js` (`begin`):

```js
if(!t||!body||!body.enabled||!Number.isFinite(body.vy)||body.vy>=0)return false;
const incomingRaw=Math.fround(-Math.fround(body.vy));
const basePush=Math.fround(Number(t.basePush));
const incomingLimit=clamp(Math.trunc(incomingRaw),100,1000);
const count=frameCount(imageMaps,t.imageId);
const period=((1100-incomingLimit)>>1)+20;
const frameStep=Math.floor(period/count);
const impulse=Math.fround(Math.fround(Math.fround(incomingRaw*basePush)*2.0)/100.0);
const impulseCap=Math.fround(Math.fround(Math.fround(400.0*basePush)*2.0)/100.0);
const push=impulse>impulseCap?impulseCap:impulse;
...
body.enabled=false;body.vx=0;body.vy=0;
```

`game.js` calls `BounceOriginalTrampoline.crossesLaunchLineFixed(prev,now)`
before `begin`; `sourceSegmentHit` reproduces the finite J2ME line segment
using BigInt operations to retain signed Java-long arithmetic. The Level 1
leaf spring therefore only accepts a descending crossing of its actual local
launch segment, not a proximity-only overlap.

### Spring compression and release impulse

`src_decompiled/e.java`, `e.d()` (the actor-reference and float fields named
`a` are disambiguated in the class file by their JVM descriptors):

```java
if (!this.a) {
   this.a = true;
   this.a.a = true;
   this.a.b = this.a;
   this.a.j = 0.0F;
   this.a.k = 0.0F;
   this.a.c = true;
   if (this.a.equals(m.a)) {
      g.a[1] = 0;
   }
}
```

V29 counterpart in `src/original-trampoline.js` (`update`):

```js
if(!t.jumpFinished){
  t.jumpFinished=true;
  body.enabled=true;
  body.vy=t.calcPush;
  body.torqueX=0;body.torqueY=0;body.skipAccelStretch=true;
}
```

The stored launch impulse is already positive by construction. V29 deliberately
does not apply `Math.abs()` at release: doing so would conceal a wrong-sign
calculation instead of preserving the J2ME sign and execution order. The actor
is re-enabled before the launch velocity is assigned, as in the source.
Compression updates the leaf/spring image frame using the original frame
height and `j.g.a` scale (`43266` for the 240-pixel logical viewport).

## Verified RLEF spring inventory

All 16 level resource JSON files were read and checked. They contain 13
type-12 springboard/trampoline objects in five levels:

| RLEF | Spring object IDs | Base push |
|---|---:|---:|
| `bf` (Level 1) | 2 | 75 |
| `bg` | 5, 66 | 65 |
| `bo` | 60 | 60 |
| `bq` | 104, 124 | 100 |
| `bs` | 49, 50, 51, 52, 53, 54, 55 | 100 |

The other 11 decoded levels contain no type-12 springboard objects; the
verification correctly reports zero rather than inventing test springs.
`tests/v29-springboard-all-levels.test.cjs` validates all 16 RLEF/JSON pairs
and drives each of the 13 actual spring records through the source contact
segment, every compression frame, and a positive upward release.

## Verification scope

- `tests/level1-game-loop-springboard.test.cjs` exercises Level 1 through the
  real `game.js` update loop in Node. It asserts increasing world Y and
  decreasing screen Y after the spring release.
- `tests/v29-springboard-all-levels.test.cjs` checks all 16 decoded level
  records and all 13 actual spring objects.
- `tests/control-layout-runtime.test.cjs` checks immediate active-button
  preview, persisted layout hydration after a simulated fresh runtime, and
  Cancel restoration.
- No Chromium launch, browser automation, or bot/campaign simulation is used.
