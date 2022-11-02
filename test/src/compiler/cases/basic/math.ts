/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

{
    // TODO https://jira.ncloudtech.ru:8090/browse/AN-1064
    // Remove after implementation
    const EPS = 1e-8;

    const equals = function (x: number, y: number): boolean {
        return Math.abs(x - y) < EPS;
    };

    // TODO Add tests for infinities and overflows for all related methods
    console.assert(equals(Math.E, 2.718281828459045), "Math: E failed");
    console.assert(equals(Math.LOG2E, 1.44269504088896340736), "Math: LOG2E failed");
    console.assert(equals(Math.LOG10E, 0.434294481903251827651), "Math: LOG10E failed");
    console.assert(equals(Math.LN2, 0.693147180559945309417), "Math: LN2 failed");
    console.assert(equals(Math.LN10, 2.30258509299404568402), "Math: LN10 failed");
    console.assert(equals(Math.PI, 3.14159265358979323846), "Math: PI failed");
    console.assert(equals(Math.SQRT2, 1.41421356237309504880), "Math: SQRT2 failed");
    console.assert(equals(Math.SQRT1_2, 0.707106781186547524401), "Math: SQRT1_2 failed");

    // TODO no arguments, INF, NaN
    console.assert(equals(Math.abs(-1), 1), "Math: abs(-1) failed");
    console.assert(equals(Math.abs(1), 1), "Math: abs(1) failed");
    console.assert(equals(Math.abs(0), 0), "Math: abs(0) failed");
    console.assert(equals(Math.abs(-0.0), 0), "Math: abs(-0) failed");

    // TODO no arguments, one argument, many arguments, INF, NaN
    console.assert(equals(Math.min(1, 15000), 1), "Math: min(1, 15000) failed");
    console.assert(equals(Math.min(1, -15000), -15000), "Math: min(1, -15000) failed");
    console.assert(equals(Math.min(1 - EPS * 10, 1), 1 - EPS * 10), "Math: min(1-EPS*10, 1) failed");
    console.assert(equals(Math.min(-10, -10 - EPS), -10 - EPS), "Math: min(-10, -10 - EPS) failed");
    console.assert(equals(Math.max(1, 15000), 15000), "Math: max(1, 15000) failed");
    console.assert(equals(Math.max(1, -15000), 1), "Math: max(1, -15000) failed");
    console.assert(equals(Math.max(1 - EPS * 10, 1), 1), "Math: max(1-EPS*10, 1) failed");
    console.assert(equals(Math.max(-10, -10 - EPS), -10), "Math: max(-10, -10 - EPS) failed");

    // TODO no arguments, overflow, INF, NaN
    console.assert(equals(Math.acos(0.0), 1.5707963267948966), "Math: acos(0) failed");
    console.assert(equals(Math.acos(-0.0), 1.5707963267948966), "Math: acos(-0) failed");
    console.assert(equals(Math.acos(-1), Math.PI), "Math: acos(-1) failed");
    console.assert(equals(Math.acos(0.5), 1.0471975511965979), "Math: acos(0.5) failed");

    // TODO no arguments, INF, NaN, acosh(0) -> NAN
    console.assert(equals(Math.acosh(1), 0), "Math: acosh(1) failed");
    console.assert(equals(Math.acosh(10), 2.993222846126381), "Math: acosh(10) failed");

    // TODO no arguments, overflow, INF, NaN
    console.assert(equals(Math.asin(1.0), 1.5707963267948966), "Math: asin(1.0) failed");
    console.assert(equals(Math.asin(-0.5), -0.5235987755982989), "Math: asin(-0.5), failed");
    console.assert(equals(Math.asin(0.0), 0), "Math: asin(0.0) failed");
    console.assert(equals(Math.asin(-0.0), 0), "Math: asin(-0.0) failed");

    // TODO no arguments, INF, NaN
    console.assert(equals(Math.asinh(1.0), 0.881373587019543), "Math: asinh(1.0) failed");
    console.assert(equals(Math.asinh(-1.0), -0.881373587019543), "Math: asinh(-1.0), failed");
    console.assert(equals(Math.asinh(0.0), 0), "Math: asinh(0.0) failed");
    console.assert(equals(Math.asinh(-0.0), 0), "Math: asinh(-0.0) failed");

    // TODO no arguments, INF, NaN
    console.assert(equals(Math.atan(1.0), 0.7853981633974483), "Math: atan(1.0) failed");
    console.assert(equals(Math.atan(10000), 1.5706963267952299), "Math: atan(10000), failed");
    console.assert(equals(Math.atan(0.0), 0), "Math: atan(0.0) failed");
    console.assert(equals(Math.atan(-0.0), 0), "Math: atan(-0.0) failed");

    // TODO no arguments, overflow
    console.assert(equals(Math.atanh(-0.0), 0), "Math: atanh(-0) failed");
    console.assert(equals(Math.atanh(0), 0), "Math: atanh(0) failed");
    console.assert(equals(Math.atanh(0.9), 1.4722194895832204), "Math: atanh(0.9), failed");

    // TODO one argument, no arguments, overflow, INF, NaN
    console.assert(equals(Math.atan2(0, 0), 0), "Math: atan2(0, 0) failed");

    // TODO https://jira.ncloudtech.ru:8090/browse/AN-1063
    console.assert(equals(Math.atan2(-0.0, -0.0), -1 * Math.PI), "Math: atan2(-0, -0) failed");
    console.assert(equals(Math.atan2(7, 0), 1.5707963267948966), "Math: atan2(7, 0) failed");
    console.assert(equals(Math.atan2(0, 2), 0), "Math: atan2(0, 2) failed");
    console.assert(equals(Math.atan2(3, 4), 0.6435011087932844), "Math: atan2(3, 4) failed");

    // TODO no arguments, overflow, INF, NaN
    console.assert(equals(Math.cbrt(0), 0), "Math: cbrt(0) failed");
    console.assert(equals(Math.cbrt(-0.0), 0), "Math: cbrt(-0) failed");
    console.assert(equals(Math.cbrt(8), 2), "Math: cbrt(8), 2 failed");
    console.assert(equals(Math.cbrt(-27), -3), "Math: cbrt(-27) failed");

    // TODO no arguments, INF, NaN
    console.assert(equals(Math.ceil(2.4), 3.0), "Math: ceil(2.4) failed");
    console.assert(equals(Math.ceil(-2.4), -2.0), "Math: ceil(-2.4) failed");
    console.assert(equals(Math.ceil(-1 + 1e-8), 0), "Math: ceil(-1 + 1e-8) failed");
    console.assert(equals(Math.ceil(1 - 1e-8), 1), "Math: ceil(1 - 1e-8) failed");
    console.assert(equals(Math.ceil(0), 0), "Math: ceil(0) failed");
    console.assert(equals(Math.ceil(-0.0), 0), "Math: ceil(-0) failed");

    // TODO no arguments, overflow, INF, NaN
    console.assert(equals(Math.clz32(8), 28), "Math: clz32(8) failed");
    console.assert(equals(Math.clz32(2), 30), "Math: clz32(2) failed");
    console.assert(equals(Math.clz32(0), 32), "Math: clz32(0) failed");
    console.assert(equals(Math.clz32(-0.0), 32), "Math: clz32(-0) failed");
    console.assert(equals(Math.clz32(-0.5), 32), "Math: clz32(-0.5) failed");
    console.assert(equals(Math.clz32(0.5), 32), "Math: clz32(0.5) failed");
    console.assert(equals(Math.clz32(1.7), 31), "Math: clz32(1.7) failed");
    console.assert(equals(Math.clz32(-1), 0), "Math: clz32(-1) failed");
    console.assert(equals(Math.clz32(-100), 0), "Math: clz32(-100) failed");

    // TODO no arguments, INF, NaN
    console.assert(equals(Math.cos(0), 1), "Math.cos(0) failed");
    console.assert(equals(Math.cos(-0.0), 1), "Math.cos(-0) failed");
    console.assert(equals(Math.cos(Math.PI / 3), 0.5), "Math.cos(pi/3) failed");
    console.assert(equals(Math.cos(Math.PI), -1), "Math.cos(pi) failed");
    console.assert(equals(Math.cos(Math.PI / 2), 0), "Math.cos(pi/2) failed");
    console.assert(equals(Math.cos(2 * Math.PI), 1), "Math.cos(2*pi) failed");

    // TODO no arguments, overflow, INF, NaN
    console.assert(equals(Math.cosh(1), 1.5430806348152437), "Math cosh(1) failed");
    console.assert(equals(Math.cosh(-1), 1.5430806348152437), "Math cosh(-1) failed");
    console.assert(equals(Math.cosh(0), 1), "Math cosh(0) failed");
    console.assert(equals(Math.cosh(-0.0), 1), "Math cosh(-0) failed");
    console.assert(equals(Math.cosh(10), 11013.232920103324), "Math cosh(10) failed");

    // TODO no arguments, overflow, INF, NaN
    console.assert(equals(Math.exp(1), 2.718281828459045), "Math exp(1) failed");
    console.assert(equals(Math.exp(-1), 0.36787944117144233), "Math exp(-1) failed");
    console.assert(equals(Math.exp(0), 1), "Math Math.exp(0) failed");
    console.assert(equals(Math.exp(-0.0), 1), "Math Math.exp(-0) failed");
    console.assert(equals(Math.exp(10), 22026.465794806718), "Math exp(10) failed");

    // TODO no arguments, overflow, INF, NaN
    console.assert(equals(Math.expm1(1), 1.718281828459045), "Math expm1(1) failed");
    console.assert(equals(Math.expm1(-1), 0.36787944117144233 - 1), "Math expm1(-1) failed");
    console.assert(equals(Math.expm1(0), 0), "Math Math.expm1(0) failed");
    console.assert(equals(Math.expm1(-0.0), 0), "Math Math.expm1(-0) failed");
    console.assert(equals(Math.expm1(10), 22025.465794806718), "Math expm1(10) failed");

    // TODO no arguments, INF, NaN
    console.assert(equals(Math.floor(2), 2.0), "Math: floor(2) failed");
    console.assert(equals(Math.floor(2.4), 2.0), "Math: floor(2.4) failed");
    console.assert(equals(Math.floor(0), 0), "Math: floor(0) failed");
    console.assert(equals(Math.floor(-0.0), -0.0), "Math: floor(0) failed");
    console.assert(equals(Math.floor(0.5), 0), "Math: floor(0.5) failed");
    console.assert(equals(Math.floor(-0.5), -1), "Math: floor(0.5) failed");
    console.assert(equals(Math.floor(-10 + 1e-8), -10), "Math: floor(-10 + 1e-8) failed");
    console.assert(equals(Math.floor(10 - 1e-8), 9), "Math: floor(10 - 1e-8) failed");

    // TODO no arguments
    console.assert(equals(Math.fround(0), 0), "Math: fround(0) failed");
    console.assert(equals(Math.fround(-0.0), -0.0), "Math: fround(-0) failed");
    console.assert(equals(Math.fround(1), 1.0), "Math: floor(1) failed");
    console.assert(equals(Math.fround(1.337), 1.3370000123977661), "Math: fround(1.337) failed");

    // TODO no arguments, one argument, many arguments, overflow, INF, NaN
    console.assert(equals(Math.hypot(0, 0), 0), "Math: hypot(0, 0) failed");
    console.assert(equals(Math.hypot(-0.0, -0.0), 0), "Math: hypot(-0, -0) failed");
    console.assert(equals(Math.hypot(3, 4), 5), "Math: hypot(3, 4) failed");
    console.assert(equals(Math.hypot(-1, -2), 2.23606797749979), "Math: hypot(-1, -2) failed");
    console.assert(equals(Math.hypot(5, -3), 5.8309518948453), "Math: hypot(5, -3) failed");
    console.assert(equals(Math.hypot(-5, 3), 5.8309518948453), "Math: hypot(-5, 3) failed");

    // TODO One argument, no arguments, overflow, INF, NaN
    console.assert(equals(Math.imul(0, 4), 0), "Math: imul(0, 4) failed");
    console.assert(equals(Math.imul(-0.0, 4), 0), "Math: imul(-0, 4) failed");
    console.assert(equals(Math.imul(3, -0.0), -0.0), "Math: imul(3, -0.0)) failed");
    console.assert(equals(Math.imul(3, 0), 0), "Math: imul(3, 0) failed");
    console.assert(equals(Math.imul(3, 4), 12), "Math: imul(3, 4) failed");
    console.assert(equals(Math.imul(3.1, 4.2), 12), "Math: imul(3.1, 4.2) failed");
    console.assert(equals(Math.imul(-3.5, 4.2), -12), "Math: imul(-3.5, 4.2) failed");
    console.assert(equals(Math.imul(-3.9999, -4.9999), 12), "Math: imul(-3.9999, -4.9999) failed");

    // TODO 0, negative, overflow, no arguments, INF, NaN
    console.assert(equals(Math.log(1), 0), "Math: log(1) failed");
    console.assert(equals(Math.log(100), 4.605170185988092), "Math: log(100) failed");
    console.assert(equals(Math.log1p(0), 0), "Math: log1p(0) failed");
    console.assert(equals(Math.log1p(-0.0), 0), "Math: log1p(-0.0) failed");
    console.assert(equals(Math.log1p(1), 0.6931471805599453), "Math: log1p(1) failed");
    console.assert(equals(Math.log1p(100), 4.61512051684126), "Math: log1p(100) failed");
    console.assert(equals(Math.log10(1), 0), "Math: log10(1) failed");
    console.assert(equals(Math.log10(100), 2), "Math: log10(100) failed");
    console.assert(equals(Math.log2(1), 0), "Math: log2(1) failed");
    console.assert(equals(Math.log2(128), 7), "Math: log2(100) failed");

    // One argument, no arguments, overflow, INF, NaN
    console.assert(equals(Math.pow(100, 0), 1), "Math: pow(100, 0) failed");
    console.assert(equals(Math.pow(10, 2), 100), "Math: pow(10, 2) failed");
    console.assert(equals(Math.pow(0, 0), 1), "Math: pow(0, 0) failed"); // JS does so...
    console.assert(equals(Math.pow(-0, -0), 1), "Math: pow(-0, -0) failed"); // JS does so...
    console.assert(equals(Math.pow(-2, 2), 4), "Math: pow(-2, 2) failed");

    let i = 0;
    let randoms: Set<Number> = new Set;
    const COUNT = 100;
    for (i = 0; i < COUNT; ++i) {
        const nextRand = Math.random();
        console.assert(0 <= nextRand && nextRand < 1, "Math: random generated number outside [0, 1)");
        randoms.add(Math.random());
    }
    i = 0;
    console.assert(randoms.size === COUNT, "Math: random generated non unique numbers");

    // No arguments, NaN, Inf
    console.assert(equals(Math.round(-0.0), -0.0), "Math: round(-0) failed");
    console.assert(equals(Math.round(0), 0), "Math: round(0) failed");
    console.assert(equals(Math.round(-0.2), 0), "Math: round(-0.2) failed");
    console.assert(equals(Math.round(-0.5), -0.0), "Math: round(-0.5) failed");
    console.assert(equals(Math.round(-0.6), -1), "Math: round(-0.6) failed");
    console.assert(equals(Math.round(0.2), 0), "Math: round(0.2) failed");
    console.assert(equals(Math.round(0.5), 1), "Math: round(0.5) failed");
    console.assert(equals(Math.round(0.7), 1), "Math: round(0.7) failed");

    // No arguments, NaN, Inf
    console.assert(equals(Math.sign(3), 1), "Math: sign(3) failed");
    console.assert(equals(Math.sign(-3), -1), "Math: sign(-3) failed");
    console.assert(equals(Math.sign(-0), -0.0), "Math: sign(-0) failed");
    console.assert(equals(Math.sign(0), 0.0), "Math: sign(0) failed");

    // No arguments, NaN, Inf
    console.assert(equals(Math.sin(-0), -0.0), "Math: sin(-0) failed");
    console.assert(equals(Math.sin(0), 0.0), "Math: sin(0) failed");
    console.assert(equals(Math.sin(3 * Math.PI / 2), -1), "Math: sin(3 * pi / 2) failed");
    console.assert(equals(Math.sin(-3 * Math.PI / 2), 1), "Math: sin(-3 * pi / 2) failed");
    console.assert(equals(Math.sin(6 * Math.PI), 0), "Math: sin(6 * pi) failed");

    // No arguments, NaN, Inf
    console.assert(equals(Math.sinh(-0), -0.0), "Math: sinh(-0) failed");
    console.assert(equals(Math.sinh(0), 0.0), "Math: sinh(0) failed");
    console.assert(equals(Math.sinh(1), 1.1752011936438014), "Math: sinh(1) failed");
    console.assert(equals(Math.sinh(10), 11013.232874703393), "Math: sinh(10) failed");

    // No arguments, NaN, Inf, negative
    console.assert(equals(Math.sqrt(-0), -0.0), "Math: sqrt(-0) failed");
    console.assert(equals(Math.sqrt(0), 0.0), "Math: sqrt(0) failed");
    console.assert(equals(Math.sqrt(1), 1), "Math: sqrt(1) failed");
    console.assert(equals(Math.sqrt(10), 3.1622776601683795), "Math: sqrt(10) failed");

    // No arguments, NaN, Inf
    console.assert(equals(Math.tan(-0), -0.0), "Math: tan(-0) failed");
    console.assert(equals(Math.tan(0), 0.0), "Math: tan(0) failed");
    console.assert(equals(Math.tan(Math.PI / 4), 1), "Math: tan(PI / 4) failed");
    console.assert(equals(Math.tan(6 * Math.PI), 0), "Math: sin(6 * pi) failed");

    // No arguments, NaN, Inf
    console.assert(equals(Math.tanh(-0), -0.0), "Math: tanh(-0) failed");
    console.assert(equals(Math.tanh(0), 0.0), "Math: tanh(0) failed");
    console.assert(equals(Math.tanh(1), 0.7615941559557649), "Math: tanh(1) failed");
    console.assert(equals(Math.tanh(10), 0.9999999958776927), "Math: tanh(10) failed");

    // No arguments, NaN, Inf
    console.assert(equals(Math.trunc(-0), -0.0), "Math: trunc(-0) failed");
    console.assert(equals(Math.trunc(0), 0.0), "Math: trunc(0) failed");
    console.assert(equals(Math.trunc(2 - EPS), 1), "Math: trunc(2 - eps) failed");
    console.assert(equals(Math.trunc(2 + EPS), 2), "Math: trunc(2 + eps) failed");
    console.assert(equals(Math.trunc(-2 - EPS), -2), "Math: trunc(-2 - eps) failed");
    console.assert(equals(Math.trunc(-2 + EPS), -1), "Math: trunc(-2 + eps) failed");
}