import {equals} from "./utils"

{
    console.assert(equals(Math.asin(1.0), 1.5707963267948966), "Math: asin(1.0) failed");
    console.assert(equals(Math.asin(-0.5), -0.5235987755982989), "Math: asin(-0.5), failed");
    console.assert(equals(Math.asin(0.0), 0), "Math: asin(0.0) failed");
    console.assert(equals(Math.asin(-0.0), 0), "Math: asin(-0.0) failed");
    console.assert(Number.isNaN(Math.asin(NaN)), "Math: asin(NaN) failed");
    console.assert(Number.isNaN(Math.asin(1.000000000000001)), "Math: asin(1.000000000000001) failed");
    console.assert(Number.isNaN(Math.asin(-1.000000000000001)), "Math: asin(-1.000000000000001) failed");
    console.assert(Number.isNaN(Math.asin(2)), "Math: asin(2) failed");
    console.assert(Number.isNaN(Math.asin(-2)), "Math: asin(-2) failed");
    console.assert(Number.isNaN(Math.asin(Infinity)), "Math: asin(Infinity) failed");
    console.assert(Number.isNaN(Math.asin(-Infinity)), "Math: asin(Infinity) failed");
}