import {EPS, equals} from "./utils"

{
    console.assert(equals(Math.min(1, 15000), 1), "Math: min(1, 15000) failed");
    console.assert(equals(Math.min(1, -15000), -15000), "Math: min(1, -15000) failed");
    console.assert(equals(Math.min(1 - EPS * 10, 1), 1 - EPS * 10), "Math: min(1-EPS*10, 1) failed");
    console.assert(equals(Math.min(-10, -10 - EPS), -10 - EPS), "Math: min(-10, -10 - EPS) failed");
    console.assert(equals(Math.min(0, 0), 0), "Math: min(-0, 0) failed");
    console.assert(equals(Math.min(-0, -0), -0), "Math: min(-0, -0) failed");
    console.assert(equals(Math.min(0, -0), -0), "Math: min(0, -0) failed");
    console.assert(equals(Math.min(-0, 0), -0), "Math: min(-0, 0) failed");
    console.assert(equals(Math.max(-0, 0), 0), "Math: max(-0, 0) failed");
    console.assert(Math.min(1, -Infinity) === -Infinity, "Math: min(1, -Infinity) failed");
    console.assert(Math.min(+Infinity, -Infinity) === -Infinity, "Math: min(+Infinity, -Infinity) failed");
    console.assert(Math.min(Number.EPSILON, -Infinity) === -Infinity, "Math: min(Number.EPSILON, -Infinity) failed");
    console.assert(Math.min(Number.EPSILON, Number.MIN_VALUE) === Number.MIN_VALUE, "Math: min(Number.EPSILON, Number.MIN_VALUE) failed");
    console.assert(Math.min(Number.MAX_VALUE, -Infinity) === -Infinity, "Math: min(Number.MAX_VALUE, -Infinity) failed");
    console.assert(Math.min(Number.MAX_VALUE, Number.MIN_VALUE) === Number.MIN_VALUE, "Math: min(Number.MAX_VALUE, Number.MIN_VALUE) failed");

    // If any value is NaN, the result of Math.min is NaN
    const vals = [
        -Infinity,
        -0.000000000000001,
        -0,
        +0,
        0.000000000000001,
        +Infinity,
        NaN
    ];
    vals.forEach(v => {
        const isNaN = Number.isNaN(Math.min(v, NaN));
        console.assert(isNaN, "Math: min(", v, ", NaN) failed");
    });
}