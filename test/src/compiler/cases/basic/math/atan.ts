import {equals} from "./utils"

{
    console.assert(equals(Math.atan(1.0), 0.7853981633974483), "Math: atan(1.0) failed");
    console.assert(equals(Math.atan(10000), 1.5706963267952299), "Math: atan(10000), failed");
    console.assert(equals(Math.atan(0.0), 0), "Math: atan(0.0) failed");
    console.assert(equals(Math.atan(-0.0), -0), "Math: atan(-0.0) failed");
    console.assert(Number.isNaN(Math.atan(NaN)), "Math: atan(NaN) failed");
    console.assert(equals(Math.atan(+Infinity), Math.PI / 2), "Math: atan(+Infinity) failed");
    console.assert(equals(Math.atan(-Infinity), -Math.PI / 2), "Math: atan(+Infinity) failed");
}