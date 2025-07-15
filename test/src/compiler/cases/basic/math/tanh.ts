import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.tanh(-0), -0.0), "Math: tanh(-0) failed");
    console.assert(equals(Math.tanh(0), 0.0), "Math: tanh(0) failed");
    console.assert(equals(Math.tanh(1), 0.7615941559557649), "Math: tanh(1) failed");
    console.assert(equals(Math.tanh(10), 0.9999999958776927), "Math: tanh(10) failed");
    console.assert(Number.isNaN(Math.tanh(NaN)), "Math: tanh(NaN) failed");
    console.assert(equals(Math.tanh(-Infinity), -1), "Math: tanh(-Infinity) failed");
    console.assert(equals(Math.tanh(Infinity), 1), "Math: tanh(Infinity) failed");
    console.assert(1 / Math.tanh(-0) === -Infinity, "Math: tanh(Infinity) failed");
    console.assert(1 / Math.tanh(0) === Infinity, "Math: tanh(Infinity) failed");
}