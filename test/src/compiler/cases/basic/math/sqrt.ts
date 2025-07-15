import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.sqrt(-0), -0.0), "Math: sqrt(-0) failed");
    console.assert(equals(Math.sqrt(0), 0.0), "Math: sqrt(0) failed");
    console.assert(equals(Math.sqrt(1), 1), "Math: sqrt(1) failed");
    console.assert(equals(Math.sqrt(10), 3.1622776601683795), "Math: sqrt(10) failed");
    console.assert(Number.isNaN(Math.sqrt(NaN)), "Math: sqrt(NaN) failed");
    console.assert(Number.isNaN(Math.sqrt(-0.000000000000001)), "Math: sqrt(-0.000000000000001) failed");
    console.assert(Number.isNaN(Math.sqrt(-1)), "Math: sqrt(-1) failed");
    console.assert(Number.isNaN(Math.sqrt(-Infinity)), "Math: sqrt(-Infinity) failed");
    console.assert(Math.sqrt(+Infinity) === +Infinity, "Math: sqrt(+Infinity) failed");
}