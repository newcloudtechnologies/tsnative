import {equals} from "./utils"

{
    console.assert(equals(Math.asinh(1.0), 0.881373587019543), "Math: asinh(1.0) failed");
    console.assert(equals(Math.asinh(-1.0), -0.881373587019543), "Math: asinh(-1.0), failed");
    console.assert(equals(Math.asinh(0.0), 0), "Math: asinh(0.0) failed");
    console.assert(equals(Math.asinh(-0.0), 0), "Math: asinh(-0.0) failed");
    console.assert(Number.isNaN(Math.asinh(NaN)), "Math: asinh(NaN) failed");
    console.assert(Math.asinh(-Infinity) === -Infinity, "Math: asinh(-Infinity) failed");
    console.assert(Math.asinh(+Infinity) === +Infinity, "Math: asinh(+Infinity) failed");
    console.assert(1 / Math.asinh(-0) === -Infinity, "Math: 1/asinh(-0) failed");
    console.assert(1 / Math.asinh(+0) === +Infinity, "Math: 1/asinh(+0) failed");
}