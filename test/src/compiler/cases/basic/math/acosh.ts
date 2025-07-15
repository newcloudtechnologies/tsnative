import {equals} from "./utils"

{
    console.assert(equals(Math.acosh(1), 0), "Math: acosh(1) failed");
    console.assert(equals(Math.acosh(10), 2.993222846126381), "Math: acosh(10) failed");
    console.assert(Math.acosh(Infinity) === Infinity, "Math: acosh(Infinity) failed");
    console.assert(Number.isNaN(Math.acosh(NaN)), "Math: acosh(NaN) failed");
    console.assert(Number.isNaN(Math.acosh(0.999999)), "Math: acosh(0.999999) failed");
    console.assert(Number.isNaN(Math.acosh(0.999999)), "Math: acosh(0.999999) failed");
    console.assert(Number.isNaN(Math.acosh(0)), "Math: acosh(0) failed");
    console.assert(Number.isNaN(Math.acosh(-1)), "Math: acosh(-1) failed");
    console.assert(Number.isNaN(Math.acosh(-Infinity)), "Math: acosh(-Infinity) failed");
}