import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.sign(3), 1), "Math: sign(3) failed");
    console.assert(equals(Math.sign(-3), -1), "Math: sign(-3) failed");
    console.assert(equals(Math.sign(-0), -0.0), "Math: sign(-0) failed");
    console.assert(equals(Math.sign(0), 0.0), "Math: sign(0) failed");
    console.assert(Number.isNaN(Math.sign(NaN)), "Math: sign(NaN) failed");
    console.assert(equals(Math.sign(-0.000001), -1), "Math: sign(-0.000001) failed");
    console.assert(equals(Math.sign(+Infinity), 1), "Math: sign(+Infinity) failed");
    console.assert(equals(Math.sign(-Infinity), -1), "Math: sign(+Infinity) failed");
}