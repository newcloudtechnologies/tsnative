import {equals} from "./utils"

{
    console.assert(equals(Math.expm1(1), 1.718281828459045), "Math expm1(1) failed");
    console.assert(equals(Math.expm1(-1), 0.36787944117144233 - 1), "Math expm1(-1) failed");
    console.assert(equals(Math.expm1(0), 0), "Math Math.expm1(0) failed");
    console.assert(equals(Math.expm1(-0.0), -0.0), "Math Math.expm1(-0) failed");
    console.assert(equals(Math.expm1(10), 22025.465794806718), "Math expm1(10) failed");
    console.assert(Number.isNaN(Math.expm1(NaN)), "Math expm1(NaN) failed");
    console.assert(equals(Math.expm1(-Infinity), -1), "Math expm1(-Infinity) failed");
    console.assert(Math.expm1(+Infinity) === +Infinity, "Math expm1(+Infinity) failed");
    console.assert((1 / Math.expm1(-0.0)) === -Infinity, "Math 1 / expm1(-0.0) failed");
    console.assert(1 / Math.expm1(0.0) === +Infinity, "Math 1 / expm1(0.0) failed");
}