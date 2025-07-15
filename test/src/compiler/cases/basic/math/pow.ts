import {equals} from "./utils"

const powMatcher = (bases: number[], exponents: number[], predicate: (n: number) => boolean, title = "") => {
    for (let i = 0; i < bases.length; ++i) {
        for (let j = 0; j < exponents.length; ++j) {
            console.assert(predicate(Math.pow(bases[i], exponents[j])),
                "Math. ", title, ". Case [", i, "]: failed pow(", bases[i], ", ", exponents[j], ")");
        }
    }
}

{
    console.assert(equals(Math.pow(100, 0), 1), "Math: pow(100, 0) failed");
    console.assert(equals(Math.pow(10, 2), 100), "Math: pow(10, 2) failed");
    console.assert(equals(Math.pow(0, 0), 1), "Math: pow(0, 0) failed"); // JS does so...
    console.assert(equals(Math.pow(-0, -0), 1), "Math: pow(-0, -0) failed"); // JS does so...
    console.assert(equals(Math.pow(-2, 2), 4), "Math: pow(-2, 2) failed");
    console.assert(Number.isNaN(Math.pow(-1, 0.5)), "Math: pow(-1, 0.5) failed");
    console.assert(Number.isNaN(-Math.pow(-1, 0.5)), "Math: -pow(-1, 0.5) failed");

    // If exponent is NaN, the result is NaN.
    powMatcher([
        -Infinity,
        -Number.MAX_VALUE,
        -0.000000000000001,
        -0,
        +0,
        0.000000000000001,
        Number.MAX_VALUE,
        +Infinity,
        NaN
    ], [NaN], (n: number) => Number.isNaN(n), "Expects NaN. [A]");

    // If abs(base) < 1 and exponent is −∞, the result is +∞.
    powMatcher([
        0.999999999999999,
        0.5,
        +0,
        -0,
        -0.5,
        -0.999999999999999
    ], [-Infinity], (n: number) => n === +Infinity, "Expects +Infinity. [B]");

    // If base is +∞ and exponent > 0, the result is +∞.
    powMatcher([+Infinity], [
        Infinity,
        Number.MAX_VALUE,
        1,
        0.000000000000001,
        7
    ], (n: number) => n === +Infinity, "Expects +Infinity. [C]");

    // If base is +∞ and exponent < 0, the result is +0.
    powMatcher([+Infinity], [
        -Infinity,
        -Number.MAX_VALUE,
        -1,
        -0.000000000000001,
        -7,
        -0.5
    ], (n: number) => n === +0, "Expects +0. [D]");

    //
    powMatcher([-Infinity], [
        -Infinity,
        -Number.MAX_VALUE,
        -1,
        -0.000000000000001
    ], (n: number) => n === 0, "Expects 0. [E]");

    // If base is −∞ and exponent > 0 and exponent is an odd integer, the result is −∞.
    powMatcher([-Infinity], [
        1,
        111,
        111111,
        Math.pow(2, 10) + 1
    ], (n: number) => n === -Infinity, "Expects -Infinity. [F]");

    // If base is −∞ and exponent > 0 and exponent is not an odd integer, the result is +∞.
    powMatcher([-Infinity], [
        0.000000000000001,
        2,
        Math.PI,
        Number.MAX_VALUE,
        +Infinity,
        Math.pow(2, 10),
        22222222222
    ], (n: number) => n === +Infinity, "Expects +Infinity. [G]");

    // If base is −∞ and exponent < 0 and exponent is an odd integer, the result is −0.
    powMatcher([-Infinity], [
        -1,
        -111,
        -111111,
    ], (n: number) => n === -0, "Expects -0. [H]");

    // If base is −∞ and exponent < 0 and exponent is not an odd integer, the result is +0.
    powMatcher([-Infinity], [
        -0.000000000000001,
        -2,
        -Math.PI,
        -Number.MAX_VALUE,
        -Infinity,
    ], (n: number) => n === +0, "Expects +0, [I]");

    // If base is +0 and exponent > 0, the result is +0.
    powMatcher([+0], [
        Infinity,
        Number.MAX_VALUE,
        1,
        0.000000000000001,
    ], (n: number) => n === +0, "Expects +0. [J]");

    // If base is +0 and exponent < 0, the result is +∞.
    powMatcher([+0], [
        -Infinity,
        -Number.MAX_VALUE,
        -1,
        -0.000000000000001,
    ], (n: number) => n === +Infinity, "Expects +Infinity. [K]");

    // If base is −0 and exponent > 0 and exponent is an odd integer, the result is −0.
    powMatcher([-0], [
        1,
        111,
        111111
    ], (n: number) => n === -0, "Expects -0. [L]");

    // If exponent is +0, the result is 1, even if base is NaN.
    powMatcher([
        -Infinity,
        -Number.MAX_VALUE,
        -0.000000000000001,
        -0,
        +0,
        0.000000000000001,
        Number.MAX_VALUE,
        +Infinity,
        NaN
    ], [+0], (n: number) => n === 1, "Expects 1. [M]");

    // If base is −0 and exponent > 0 and exponent is not an odd integer, the result is +0.
    powMatcher([-0], [
        0.000000000000001,
        2,
        Math.PI,
        Number.MAX_VALUE,
        +Infinity
    ], (n: number) => n === +0, "Expects +0. [N]");

    // If base is −0 and exponent < 0 and exponent is an odd integer, the result is −∞.
    powMatcher([-0], [
        -1,
        -111,
        -111111
    ], (n: number) => n === -Infinity, "Expects -Infinity. [O]");

    // If base is −0 and exponent < 0 and exponent is not an odd integer, the result is +∞.
    powMatcher([-0], [
        -0.000000000000001,
        -2,
        -Math.PI,
        -Number.MAX_VALUE,
        -Infinity
    ], (n: number) => n === +Infinity, "Expects +Infinity. [P]");

    // If base < 0 and base is finite and exponent is finite and exponent is not an integer, the result is NaN.
    powMatcher([
        -Number.MAX_VALUE,
        -Math.PI,
        -1,
        -0.000000000000001
    ], [
        -Math.E,
        -1.000000000000001,
        -0.000000000000001,
        0.000000000000001,
        1.000000000000001,
        Math.E,
        Math.PI
    ], (n: number) => Number.isNaN(n), "Expects NaN. [R]");

    // If exponent is −0, the result is 1, even if base is NaN.
    powMatcher([
        -Infinity,
        -Number.MAX_VALUE,
        -0.000000000000001,
        -0,
        +0,
        0.000000000000001,
        Number.MAX_VALUE,
        +Infinity,
        NaN
    ], [-0], (n: number) => n === 1, "Expects 1. [S]");

    // If base is NaN and exponent is nonzero, the result is NaN.
    powMatcher([NaN], [
        -Infinity,
        -Number.MAX_VALUE,
        -0.000000000000001,
        0.000000000000001,
        Number.MAX_VALUE,
        +Infinity,
        NaN
    ], (n: number) => Number.isNaN(n), "Expects NaN. [T]");

    // If abs(base) > 1 and exponent is +∞, the result is +∞.
    powMatcher([
        -Infinity,
        -Number.MAX_VALUE,
        -1.000000000000001,
        1.000000000000001,
        Number.MAX_VALUE,
        +Infinity
    ], [+Infinity], (n: number) => n === +Infinity, "Expects +Infinity. [U]")

    // If abs(base) > 1 and exponent is −∞, the result is +0.
    powMatcher([
        -Infinity,
        -Number.MAX_VALUE,
        -1.000000000000001,
        1.000000000000001,
        Number.MAX_VALUE,
        +Infinity
    ], [-Infinity], (n: number) => n === +0, "Expects 0. [V]");

    //  If abs(base) is 1 and exponent is +∞, the result is NaN.
    powMatcher([
        -1,
        1
    ], [+Infinity], (n: number) => Number.isNaN(n), "Expects NaN. [W]");

    // If abs(base) is 1 and exponent is −∞, the result is NaN.
    powMatcher([
        -1,
        1
    ], [-Infinity], (n: number) => Number.isNaN(n), "Expects NaN. [X]");

    // If abs(base) < 1 and exponent is +∞, the result is +0.
    powMatcher([
        0.999999999999999,
        0.5,
        +0,
        -0,
        -0.5,
        -0.999999999999999
    ], [+Infinity], (n: number) => n === +0, "Expects +0. [Y]");

}