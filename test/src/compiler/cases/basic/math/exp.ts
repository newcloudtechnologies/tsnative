import {equals} from "./utils"

{
    console.assert(equals(Math.exp(1), 2.718281828459045), "Math exp(1) failed");
    console.assert(equals(Math.exp(-1), 0.36787944117144233), "Math exp(-1) failed");
    console.assert(equals(Math.exp(0), 1), "Math Math.exp(0) failed");
    console.assert(equals(Math.exp(-0.0), 1), "Math Math.exp(-0) failed");
    console.assert(equals(Math.exp(10), 22026.465794806718), "Math exp(10) failed");
    console.assert(Number.isNaN(Math.exp(NaN)), "Math exp(NaN) failed");
    console.assert(Math.exp(+Infinity) === +Infinity, "Math exp(+Infinity) failed");
    console.assert(equals(Math.exp(-Infinity), 0), "Math exp(-Infinity) failed");
}