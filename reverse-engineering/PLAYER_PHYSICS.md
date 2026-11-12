# Player/actor constants recovered from `c.class`

`c` extends the shared entity base class `j`. The game controller's active gameplay update calls methods on its static `c` actor instance for left/right movement and the primary actor action. The class has a mode index (`c.d`) that `c.f()` advances through values 0, 1 and 2.

The static initializer in `c.class` defines the following three-entry parameter arrays. The original field names are kept because the classes are obfuscated.

| Original field | Mode 0 | Mode 1 | Mode 2 |
|---|---:|---:|---:|
| `b:[F` | 0.6 | 0.3 | 0.6 |
| `c:[F` | 0.1 | 0.1 | 0.1 |
| `d:[F` | cos(0.9599310755729675 rad) | same | same |
| `a:[I` | 20 | 20 | 20 |
| `a:[F` | 1.0 | 1.4 | 0.5 |
| `e:[F` | 500.0 | 350.0 | 312.5 |
| `f:[F` | 280.0 | 350.0 | 150.0 |
| `g:[F` | 1.5 | 2.5 | 1.2 |
| `h:[F` | 288.0 | 255.0 | 162.5 |

Additional class-level constants include `l:F = 0.0` and `m:F = -400.0`.

**Important:** these values are exact bytecode constants, but the obfuscated field semantics are not all proven yet. This file does not label them gravity, acceleration, jump impulse, friction or collision radius. The next reverse-engineering step is to trace every array read to the actor update/collision call sites and compare the values against frame captures from the original runtime.
