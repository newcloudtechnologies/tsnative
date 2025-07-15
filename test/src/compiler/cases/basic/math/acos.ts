import {equals} from "./utils"

{
    console.assert(equals(Math.acos(0.0), 1.5707963267948966), "Math: acos(0) failed");
    console.assert(equals(Math.acos(-0.0), 1.5707963267948966), "Math: acos(-0) failed");
    console.assert(equals(Math.acos(-1), Math.PI), "Math: acos(-1) failed");
    console.assert(Number.isNaN(Math.acos(NaN)), "Math: acos(NaN) failed");
    console.assert(Number.isNaN(Math.acos(1.000000000000001)), "Math: acos(1.000000000000001) failed");
    console.assert(Number.isNaN(Math.acos(-1.000000000000001)), "Math: acos(-1.000000000000001) failed");
    console.assert(Number.isNaN(Math.acos(2)), "Math: acos(2) failed");
    console.assert(Number.isNaN(Math.acos(-2)), "Math: acos(-2) failed");
    console.assert(Number.isNaN(Math.acos(Infinity)), "Math: acos(Infinity) failed");
    console.assert(Number.isNaN(Math.acos(-Infinity)), "Math: acos(Infinity) failed");
    console.assert(equals(Math.acos(1), 0), "Math: acos(0) failed");
}