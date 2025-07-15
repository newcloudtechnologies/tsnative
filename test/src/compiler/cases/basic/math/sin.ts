import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.sin(-0), -0.0), "Math: sin(-0) failed");
    console.assert(equals(Math.sin(0), 0.0), "Math: sin(0) failed");
    console.assert(equals(Math.sin(3 * Math.PI / 2), -1), "Math: sin(3 * pi / 2) failed");
    console.assert(equals(Math.sin(-3 * Math.PI / 2), 1), "Math: sin(-3 * pi / 2) failed");
    console.assert(equals(Math.sin(6 * Math.PI), 0, 2000 * EPS), "Math: sin(6 * pi) failed");
    console.assert(Number.isNaN(Math.sin(NaN)), "Math: sin(NaN) failed");
    console.assert(Number.isNaN(Math.sin(Infinity)), "Math: sin(Infinity) failed");
    console.assert(Number.isNaN(Math.sin(-Infinity)), "Math: sin(-Infinity) failed");
}