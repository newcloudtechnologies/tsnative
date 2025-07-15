import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.sinh(-0), -0.0), "Math: sinh(-0) failed");
    console.assert(equals(Math.sinh(0), 0.0), "Math: sinh(0) failed");
    console.assert(equals(Math.sinh(1), 1.1752011936438014), "Math: sinh(1) failed");
    console.assert(equals(Math.sinh(10), 11013.232874703393), "Math: sinh(10) failed");
    console.assert(Number.isNaN(Math.sinh(NaN)), "Math: sinh(NaN) failed");
    console.assert(Math.sinh(-Infinity) === -Infinity, "Math: sinh(-Infinity) failed");
    console.assert(Math.sinh(+Infinity) === +Infinity, "Math: sinh(-Infinity) failed");
    console.assert(1 / Math.sinh(-0) === -Infinity, "Math: 1/sinh(-0) failed");
    console.assert(1 / Math.sinh(+0) === +Infinity, "Math: 1/sinh(-0) failed");
}