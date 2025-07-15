import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.hypot(0, 0), 0), "Math: hypot(0, 0) failed");
    console.assert(equals(Math.hypot(-0.0, -0.0), 0), "Math: hypot(-0, -0) failed");
    console.assert(equals(Math.hypot(3, 4), 5), "Math: hypot(3, 4) failed");
    console.assert(equals(Math.hypot(-1, -2), 2.23606797749979), "Math: hypot(-1, -2) failed");
    console.assert(equals(Math.hypot(5, -3), 5.8309518948453, 200 * EPS), "Math: hypot(5, -3) failed");
    console.assert(equals(Math.hypot(-5, 3), 5.8309518948453, 200 * EPS), "Math: hypot(-5, 3) failed");
    console.assert(Math.hypot(3, Infinity) === Infinity, "Math: hypot(3, Infinity) failed")
    console.assert(Math.hypot(3, -Infinity) === Infinity, "Math: hypot(3, -Infinity) failed")
    console.assert(Math.hypot(NaN, Infinity) === Infinity, "Math: hypot(NaN, Infinity) failed")
    console.assert(Number.isNaN(Math.hypot(NaN, 3)), "Math: hypot(NaN, 3) failed");
}