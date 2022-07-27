#include "std/tsmath.h"

#include "std/private/tsmath_p.h"

#include "std/tsnumber.h"
#include "std/tsstring.h"

#define DEFINE_MATH_METHOD0(name)                                       \
    Number* Math::name() noexcept                                       \
    {                                                                   \
        return new Number(MathPrivate::name());              \
    }

#define DEFINE_MATH_METHOD1(name)                                       \
    Number* Math::name(Number* x) noexcept                        \
    {                                                                   \
        return new Number(MathPrivate::name(x->unboxed()));  \
    }

#define DEFINE_MATH_METHOD2(name)                                                       \
    Number* Math::name(Number* x, Number* y) noexcept                       \
    {                                                                                   \
        return new Number(MathPrivate::name(x->unboxed(), y->unboxed()));    \
    }

DEFINE_MATH_METHOD0(E)
DEFINE_MATH_METHOD0(LN2)
DEFINE_MATH_METHOD0(LN10)
DEFINE_MATH_METHOD0(LOG2E)
DEFINE_MATH_METHOD0(LOG10E)
DEFINE_MATH_METHOD0(PI)
DEFINE_MATH_METHOD0(SQRT1_2)
DEFINE_MATH_METHOD0(SQRT2)

DEFINE_MATH_METHOD1(abs)
DEFINE_MATH_METHOD1(acos)
DEFINE_MATH_METHOD1(acosh)
DEFINE_MATH_METHOD1(asin)
DEFINE_MATH_METHOD1(asinh)
DEFINE_MATH_METHOD1(atan)
DEFINE_MATH_METHOD1(atanh)
DEFINE_MATH_METHOD1(cbrt)
DEFINE_MATH_METHOD1(ceil)
DEFINE_MATH_METHOD1(clz32)
DEFINE_MATH_METHOD1(cos)
DEFINE_MATH_METHOD1(cosh)
DEFINE_MATH_METHOD1(exp)
DEFINE_MATH_METHOD1(expm1)
DEFINE_MATH_METHOD1(floor)
DEFINE_MATH_METHOD1(fround)
DEFINE_MATH_METHOD2(atan2)
DEFINE_MATH_METHOD2(max)
DEFINE_MATH_METHOD2(min)
DEFINE_MATH_METHOD2(hypot)
DEFINE_MATH_METHOD2(imul)
DEFINE_MATH_METHOD1(log)
DEFINE_MATH_METHOD1(log1p)
DEFINE_MATH_METHOD1(log10)
DEFINE_MATH_METHOD1(log2)
DEFINE_MATH_METHOD2(pow)
DEFINE_MATH_METHOD1(round)
DEFINE_MATH_METHOD1(sign)
DEFINE_MATH_METHOD1(sin)
DEFINE_MATH_METHOD1(sinh)
DEFINE_MATH_METHOD1(sqrt)
DEFINE_MATH_METHOD1(tan)
DEFINE_MATH_METHOD1(tanh)
DEFINE_MATH_METHOD1(trunc)
DEFINE_MATH_METHOD0(random)

String* Math::toString() const
{
    return new String("Global Math Object");
}