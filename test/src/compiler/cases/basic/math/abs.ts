import {equals} from "./utils"

{
    console.assert(equals(Math.abs(-1), 1), "Math: abs(-1) failed");
    console.assert(equals(Math.abs(1), 1), "Math: abs(1) failed");
    console.assert(equals(Math.abs(0), 0), "Math: abs(0) failed");
    console.assert(equals(Math.abs(-0.0), 0), "Math: abs(-0) failed");
    console.assert(equals(Math.abs(-0.000001), 0.000001), "Math: abs(-0.000001) failed");
    console.assert(equals(Math.abs(-1e-17), 1e-17), "Math: abs(-1e-17) failed");
    console.assert(Number.isNaN(Math.abs(NaN)), "Math: abs(NaN) failed");
    console.assert(Math.abs(-Infinity) === +Infinity, "Math: abs(-Infinity) failed");
    console.assert(Math.abs(Infinity) === +Infinity, "Math: abs(Infinity) failed");
}