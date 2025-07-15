import {equals} from "./utils"

{
    console.assert(equals(Math.floor(2), 2.0), "Math: floor(2) failed");
    console.assert(equals(Math.floor(2.4), 2.0), "Math: floor(2.4) failed");
    console.assert(equals(Math.floor(0), 0), "Math: floor(0) failed");
    console.assert(equals(Math.floor(-0.0), -0.0), "Math: floor(0) failed");
    console.assert(equals(Math.floor(0.5), 0), "Math: floor(0.5) failed");
    console.assert(equals(Math.floor(-0.5), -1), "Math: floor(0.5) failed");
    console.assert(equals(Math.floor(-10 + 1e-8), -10), "Math: floor(-10 + 1e-8) failed");
    console.assert(equals(Math.floor(10 - 1e-8), 9), "Math: floor(10 - 1e-8) failed");
    console.assert(Number.isNaN(Math.floor(NaN)), "Math: floor(NaN) failed");
    console.assert(Math.floor(+Infinity) === +Infinity, "Math: floor(+Infinity) failed");
    console.assert(Math.floor(Infinity) === Infinity, "Math: floor(-Infinity) failed");
    console.assert(equals(Math.floor(0.000000000000001), 0), "Math: floor(0.000000000000001) failed");
    console.assert(equals(Math.floor(0.000000000000009), 0), "Math: floor(0.000000000000009) failed");

    const x = -1 / 10.0;
    console.assert(equals(Math.floor(x), -Math.ceil(-x)), "Math: equals(Math.floor(x), -Math.ceil(-x) failed");
}