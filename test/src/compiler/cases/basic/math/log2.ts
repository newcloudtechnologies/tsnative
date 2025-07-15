import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.log2(1), 0), "Math: log2(1) failed");
    console.assert(equals(Math.log2(128), 7), "Math: log2(100) failed");
    console.assert(Math.log2(-0) === -Infinity, "Math: log2(-0) failed");
    console.assert(Math.log2(+0) === -Infinity, "Math: log2(-0) failed");
    console.assert(Number.isNaN(Math.log2(-0.9)), "Math: log2(-0.9) failed");
    console.assert(Number.isNaN(Math.log2(NaN)), "Math: log2(NaN) failed");
    console.assert(Number.isNaN(Math.log2(-10)), "Math: log2(-10) failed");
    console.assert(Number.isNaN(Math.log2(-Infinity)), "Math: log2(-Infinity) failed");
    console.assert(Math.log2(+Infinity) === +Infinity, "Math: log2(+Infinity) failed");
}