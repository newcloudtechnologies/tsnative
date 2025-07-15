import {equals} from "./utils"


{
    console.assert(equals(Math.clz32(8), 28), "Math: clz32(8) failed");
    console.assert(equals(Math.clz32(2), 30), "Math: clz32(2) failed");
    console.assert(equals(Math.clz32(0), 32), "Math: clz32(0) failed");
    console.assert(equals(Math.clz32(-0.0), 32), "Math: clz32(-0) failed");
    console.assert(equals(Math.clz32(-0.5), 32), "Math: clz32(-0.5) failed");
    console.assert(equals(Math.clz32(0.5), 32), "Math: clz32(0.5) failed");
    console.assert(equals(Math.clz32(1.7), 31), "Math: clz32(1.7) failed");
    console.assert(equals(Math.clz32(-1), 0), "Math: clz32(-1) failed");
    console.assert(equals(Math.clz32(-100), 0), "Math: clz32(-100) failed");
    console.assert(equals(Math.clz32(1), 31), "Math: clz32(-1) failed");
    console.assert(equals(Math.clz32(2147483648), 0), "Math: clz32(2147483648) failed");

    console.assert(equals(Math.clz32(+Infinity), 32), "Math: clz32(+Infinity) failed");
    console.assert(equals(Math.clz32(-Infinity), 32), "Math: clz32(-Infinity) failed");

    console.assert(equals(Math.clz32(Math.pow(2, 32) - 1), 0), "Math: clz32(2^32 - 1) failed");
    console.assert(equals(Math.clz32(Math.pow(2, 32)), 32), "Math: clz32(2^32) failed");
    console.assert(equals(Math.clz32(Math.pow(2, 32) + 1), 31), "Math: clz32(2^32 + 1) failed");

    console.assert(equals(Math.clz32(Math.pow(2, 16) -1), 16), "Math: clz32(2^16 - 1) failed");
    console.assert(equals(Math.clz32(Math.pow(2, 16)), 15), "Math: clz32(2^16) failed");
    console.assert(equals(Math.clz32(Math.pow(2, 16) + 1), 15), "Math: clz32(2^16 + 1) failed");

    console.assert(equals(Math.clz32(Math.pow(2, 8) - 1), 24), "Math: clz32(2^8 - 1) failed");
    console.assert(equals(Math.clz32(Math.pow(2, 8)), 23), "Math: clz32(2^8) failed");
    console.assert(equals(Math.clz32(Math.pow(2, 8) + 1), 23), "Math: clz32(2^8 + 1) failed");

    console.assert(equals(Math.clz32(-(Math.pow(2, 32) - 1)), 31), "Math: clz32(-(2^32 - 1)) failed");
    console.assert(equals(Math.clz32(-(Math.pow(2, 32))), 32), "Math: clz32(-(2^32)) failed");
    console.assert(equals(Math.clz32(-(Math.pow(2, 32) + 1)), 0), "Math: clz32(-(2^32 + 1)) failed");

    console.assert(equals(Math.clz32(-(Math.pow(2, 16) - 1)), 0), "Math: clz32(-(2^16 - 1)) failed");
    console.assert(equals(Math.clz32(-(Math.pow(2, 16))), 0), "Math: clz32(-(2^16)) failed");
    console.assert(equals(Math.clz32(-(Math.pow(2, 16) + 1)), 0), "Math: clz32(-(2^16 + 1)) failed");

    console.assert(equals(Math.clz32(-(Math.pow(2, 8) - 1)), 0), "Math: clz32(-(2^8 - 1)) failed");
    console.assert(equals(Math.clz32(-(Math.pow(2, 8))), 0), "Math: clz32(-(2^8)) failed");
    console.assert(equals(Math.clz32(-(Math.pow(2, 8) + 1)), 0), "Math: clz32(-(2^8 + 1)) failed");

    console.assert(equals(Math.clz32(NaN), 32), "Math: clz32(NaN) failed");
}
