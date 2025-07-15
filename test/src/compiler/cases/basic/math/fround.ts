import {equals} from "./utils"

{
    console.assert(equals(Math.fround(0), 0), "Math: fround(0) failed");
    console.assert(equals(Math.fround(-0.0), -0.0), "Math: fround(-0) failed");
    console.assert(equals(Math.fround(1), 1.0), "Math: floor(1) failed");
    console.assert(equals(Math.fround(1.337), 1.3370000123977661), "Math: fround(1.337) failed");
    console.assert(Math.fround(Infinity) === Infinity, "Math: fround(Infinity) failed");
    console.assert(Number.isNaN(Math.fround(NaN)), "Math: fround(NaN) failed");

    console.assert(equals(Math.fround(1.0000003576278687), 1.0000003576278687),
        "Math: fround(1.0000003576278687) failed");

    console.assert(equals(Math.fround(-1.0000003576278687), -1.0000003576278687),
        "Math: fround(-1.0000003576278687) failed");
}