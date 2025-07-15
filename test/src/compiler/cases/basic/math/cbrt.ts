import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.cbrt(0), 0), "Math: cbrt(0) failed");
    console.assert(equals(Math.cbrt(-0.0), 0), "Math: cbrt(-0) failed");
    console.assert(equals(Math.cbrt(8), 2), "Math: cbrt(8), 2 failed");
    console.assert(equals(Math.cbrt(-27), -3, 200 * EPS), "Math: cbrt(-27) failed");
    console.assert(Number.isNaN(Math.cbrt(NaN)), "Math: cbrt(NaN) failed");
    console.assert(Math.cbrt(-Infinity) === -Infinity, "Math: cbrt(-Infinity) failed");
    console.assert(Math.cbrt(+Infinity) === +Infinity, "Math: cbrt(+Infinity) failed");
    console.assert(1 / Math.cbrt(-0) === -Infinity, "Math: 1/cbrt(-0) failed");
    console.assert(1 / Math.cbrt(+0) === +Infinity, "Math: 1/cbrt(+0) failed");
}