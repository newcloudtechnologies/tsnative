import {equals} from "./utils"

{
    console.assert(equals(Math.cosh(1), 1.5430806348152437), "Math cosh(1) failed");
    console.assert(equals(Math.cosh(-1), 1.5430806348152437), "Math cosh(-1) failed");
    console.assert(equals(Math.cosh(0), 1), "Math cosh(0) failed");
    console.assert(equals(Math.cosh(-0.0), 1), "Math cosh(-0) failed");
    console.assert(Number.isNaN(Math.cosh(NaN)), "Math cosh(NaN) failed");
    console.assert(Math.cosh(-Infinity) === Infinity, "Math cosh(-Infinity) failed");
    console.assert(Math.cosh(+Infinity) === +Infinity, "Math cosh(+Infinity) failed");
}