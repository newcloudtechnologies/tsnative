import {equals} from "./utils"

const atanMatcher = (ys: number[], xs: number[], predicate: (n: number) => boolean, title = "") => {
    ys.forEach((y, i) => {
        xs.forEach(x => {
            const result = predicate(Math.atan2(y, x));
            console.assert(result, "Math. ", title, ". Case [", i, "]: atan2(", y, ",",  x, ") failed");
        });
    });
}

{
    console.assert(equals(Math.atan2(0, 0), 0), "Math: atan2(0, 0) failed");
    console.assert(Math.atan2(0, -0) === Math.PI, "Math: atan2(0, -0) failed");
    console.assert(equals(Math.atan2(-0.0, -0.0), -1 * Math.PI), "Math: atan2(-0, -0) failed");
    console.assert(equals(Math.atan2(-0.0, 0.0), -0), "Math: atan2(-0, 0) failed");
    console.assert(equals(Math.atan2(7, 0), 1.5707963267948966), "Math: atan2(7, 0) failed");
    console.assert(equals(Math.atan2(0, 2), 0), "Math: atan2(0, 2) failed");
    console.assert(equals(Math.atan2(3, 4), 0.6435011087932844), "Math: atan2(3, 4) failed");

    // If either x or y is NaN, Math(x,y) is NaN
    const vals = [
        -Infinity,
        -0.000000000000001,
        -0,
        +0,
        0.000000000000001,
        +Infinity,
        NaN
    ];
    atanMatcher(vals, [NaN], (n: number) => Number.isNaN(n), "Expects NaN. [A]");
    atanMatcher([NaN], vals, (n: number) => Number.isNaN(n), "Expects NaN. [B]");

    // If y > 0 and y is finite and x is equal to +Infinity, Math.atan2(y,x) is +0
    atanMatcher([0.000000000000001, 1, Number.MAX_VALUE],[+Infinity], (n: number) => n === 0, "Expects +0. [C]");

    // If y < 0 and y is finite and x is equal to +Infinity, Math.atan2(y,x) is -0
    atanMatcher([-0.000000000000001, -1, -Number.MIN_VALUE],[+Infinity], (n: number) => n === -0, "Expects -0. [D]");

    // If y is +0 and x>0, Math.atan2(y,x) is +0
    atanMatcher([+0],[0.000000000000001, +Infinity, 1], (n: number) => n === 0, "Expects 0. [E]");

    // If y is equal to -0 and x>0, Math.atan2(y,x) is -0
    atanMatcher([-0],[0.000000000000001, +Infinity, 1], (n: number) => n === 0, "Expects 0. [F]");
    const x2 = [0.000000000000001, +Infinity, 1];
}