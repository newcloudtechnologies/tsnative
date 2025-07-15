import {equals} from "./utils"

{
    console.assert(equals(Math.atanh(-0.0), 0), "Math: atanh(-0) failed");
    console.assert(equals(Math.atanh(0), 0), "Math: atanh(0) failed");
    console.assert(equals(Math.atanh(0.9), 1.4722194895832204), "Math: atanh(0.9), failed");
    console.assert(Number.isNaN(Math.atanh(-1.9)), "Math: atanh(-1.9), failed");
    console.assert(Number.isNaN(Math.atanh(1.9)), "Math: atanh(1.9), failed");
    console.assert(Number.isNaN(Math.atanh(NaN)), "Math: atanh(NaN), failed");
    console.assert(Number.isNaN(Math.atanh(-10)), "Math: atanh(-10), failed");
    console.assert(Number.isNaN(Math.atanh(10)), "Math: atanh(10), failed");
    console.assert(Number.isNaN(Math.atanh(-Infinity)), "Math: atanh(-Infinity), failed");
    console.assert(Number.isNaN(Math.atanh(+Infinity)), "Math: atanh(+Infinity), failed");
    console.assert(Math.atanh(-1) === -Infinity, "Math: atanh(-1), failed");
    console.assert(Math.atanh(+1) === +Infinity, "Math: atanh(+1), failed");
    console.assert(1 / Math.atanh(-0) === -Infinity, "Math: 1/atanh(-0), failed");
    console.assert(1 / Math.atanh(+0) === +Infinity, "Math: 1/atanh(+0), failed");
}