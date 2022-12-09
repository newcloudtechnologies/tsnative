/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

// Check NaN
{
    // Check instance
    {
        console.assert(!Number.isNaN(123), "NaN. Check instance. Case [1-A]: Expects 123 is not a NaN.");

        console.assert(Number.isNaN(Number.NaN), "NaN. Check instance. Case [1-B]: Expects Number.Nan is a NaN.");

        console.assert(!Number.isNaN('42'), "NaN. Check instance. Case [1-C]: Expects '42' is not a NaN.");

        console.assert(!Number.isNaN(false), "NaN. Check instance. Case [1-D]: Expects false is not a NaN.");

        console.assert(!Number.isNaN(true), "NaN. Check instance. Case [1-E]: Expects true is not a NaN.");

        console.assert(!(Number.NaN),
            "NaN. Check instance. Case [1-F]: Expects casting NaN to boolean is always false.");

        console.assert(Number.NaN.toString() === "NaN",
            "NaN. Check instance. Case [1-G]: Expects toString() value is 'NaN'.");

        console.assert(Number.isNaN(NaN), "NaN. Check instance. Case [1-H]: Global NaN failed.");

        console.assert(!Number.isNaN(Infinity), "NaN. Check instance. Case [1-I]: Global Infinity is not a NaN.");
    }

    // Check relations
    {
        console.assert(Number.NaN !== Number.NaN, "NaN. Check relations. Case [1-A]: Expects non equality.");

        console.assert(!(Number.NaN === Number.NaN),
            "NaN. Check relations. Case [1-B]: Expects Number.NaN is non equality.");

        console.assert(!(Number.NaN > Number.NaN),
            "NaN. Check relations. Case [1-C]: Expects Number.NaN is non equality.");

        console.assert(!(Number.NaN < Number.NaN),
            "NaN. Check relations. Case [1-D]: Expects Number.NaN is non equality.");

        console.assert(!(Number.NaN >= Number.NaN),
            "NaN. Check relations. Case [1-E]: Expects Number.NaN is non equality.");

        console.assert(!(Number.NaN <= Number.NaN),
            "NaN. Check relations. Case [1-F]: Expects Number.NaN is non equals.");

        console.assert(!(Number.NaN === undefined),
            "NaN. Check relations. Case [1-G]: Expects Number.NaN is non equals with undefined.");

        console.assert(!(Number.NaN === null),
            "NaN. Check relations. Case [1-H]: Expects Number.NaN is non equals with null.");

        console.assert(!(NaN === NaN),
            "NaN. Check relations. Case [1-I]: Expects NaN is non equals with self.");
    }

    // Check arithmetics
    {
        console.assert(Number.isNaN(0 / 0), "NaN. Check arithmetics. Case [1-A]: Expects 0/0 is NaN.");

        console.assert(!Number.isNaN(1 / 0), "NaN. Check arithmetics. Case [1-B]: Expects 1/0 is not NaN.");

        console.assert(!Number.isNaN(0 / 1), "NaN. Check arithmetics. Case [1-C]: Expects 0/1 is not NaN.");

        console.assert(Number.isNaN(Number.NaN + 1),
            "NaN. Check arithmetics. Case [1-D]: Expects Number.NaN + 1 is NaN.");

        console.assert(Number.isNaN(Number.NaN - 1),
            "NaN. Check arithmetics. Case [1-E]: Expects Number.NaN - 1 is NaN.");

        console.assert(Number.isNaN(Number.NaN * 1),
            "NaN. Check arithmetics. Case [1-F]: Expects Number.NaN * 1 is NaN.");

        console.assert(Number.isNaN(Number.NaN / 1),
            "NaN. Check arithmetics. Case [1-G]: Expects Number.NaN / 1 is NaN.");

        console.assert(Number.isNaN((Number.POSITIVE_INFINITY) - Number.NaN),
            "NaN. Check arithmetics. Case[1-H]: when we perform any operations with NaN, result is NaN.");

        console.assert(Number.isNaN((Number.POSITIVE_INFINITY) + Number.NaN),
            "NaN. Check arithmetics. Case[1-I]: When we perform any operations with NaN, always result is NaN.");

        console.assert(Number.isNaN((Number.POSITIVE_INFINITY) * Number.NaN),
            "NaN. Check arithmetics. Case[1-J]: When we perform any operations with NaN, always result is NaN.");

        console.assert(Number.isNaN((Number.POSITIVE_INFINITY) / Number.NaN),
            "NaN. Check arithmetics. Case[1-K]: When we perform any operations with NaN, always result is NaN.");

        console.assert(Number.isNaN((Number.NEGATIVE_INFINITY) - Number.NaN),
            "NaN. Check arithmetics. Case[1-L]: when we perform any operations with NaN, result is NaN.");

        console.assert(Number.isNaN((Number.NEGATIVE_INFINITY) + Number.NaN),
            "NaN. Check arithmetics. Case[1-M]: When we perform any operations with NaN, always result is NaN.");

        console.assert(Number.isNaN((Number.NEGATIVE_INFINITY) * Number.NaN),
            "NaN. Check arithmetics. Case[1-N]: When we perform any operations with NaN, always result is NaN.");

        console.assert(Number.isNaN((Number.NEGATIVE_INFINITY) / Number.NaN),
            "NaN. Check arithmetics. Case[1-O]: When we perform any operations with NaN, always result is NaN.");

        console.assert(Number.isNaN(NaN * 0),
            "NaN. Check arithmetics. Case[1-P]: When we perform any operations with NaN, always result is NaN.");

        console.assert(Number.isNaN(Infinity / Infinity),
            "NaN. Check arithmetics. Case[1-R]: Expects result is NaN.");

        console.assert(Number.isNaN(Number.NEGATIVE_INFINITY + Number.POSITIVE_INFINITY),
            "NaN. Check arithmetics. Case[1-S]: Expects Number.NEGATIVE_INFINITY + Number.POSITIVE_INFINITY is NaN.");

        console.assert(Number.isNaN((Number.POSITIVE_INFINITY) * 0),
            "NaN. Check arithmetics. Case[1-T]: Expects When we multiply Number.POSITIVE_INFINITY by 0, result is NaN.");

        console.assert(Number.isNaN((Number.POSITIVE_INFINITY) / Number.NEGATIVE_INFINITY),
            "NaN. Check arithmetics. Case[1-U]: When we divide Number.POSITIVE_INFINITY by either " +
            "NEGATIVE_INFINITY or POSITIVE_INFINITY, result is NaN.");
    }
}

// Check Infinity
{
    // Check instance
    {
        console.assert(Number.isFinite(23), "Infinity. Check instance. Case[1-A]: Expects 23 is finite value.");

        console.assert(!Number.isFinite(1 / 0),
            "Infinity. Check instance. Case[1-B]: Expects 1/0 is not finite value.");

        console.assert(!Number.isFinite(0 / 0),
            "Infinity. Check instance. Case[1-C]: Expects 0/0 is not finite value.");

        console.assert(!Number.isFinite(false),
            "Infinity. Check instance. Case[1-D]: Expects false is not finite value.");

        console.assert(!Number.isFinite(Number.NaN),
            "Infinity. Check instance. Case[1-E]: Expects Number.NaN is not finite value.");

        console.assert(!Number.isFinite(Number.NaN + 1),
            "Infinity. Check instance. Case[1-F]: Expects Number.NaN + 1 is not finite value.");

        console.assert(!Number.isFinite(Number.POSITIVE_INFINITY),
            "Infinity. Check instance. Case[1-G]: Expects Number.POSITIVE_INFINITY is not finite value.");

        console.assert(!Number.isFinite(Number.NEGATIVE_INFINITY),
            "Infinity. Check instance. Case[1-H]: Expects Number.NEGATIVE_INFINITY is not finite value.");

        console.assert(Number.POSITIVE_INFINITY.toString() === "Infinity",
            "Infinity. Check instance. Case[1-I]: Expects Number.POSITIVE_INFINITY.toString() value is 'Infinity'");

        console.assert(Number.NEGATIVE_INFINITY.toString() === "-Infinity",
            "Infinity. Check instance. Case[1-J]: Expects Number.NEGATIVE_INFINITY.toString() value is '-Infinity'");

        console.assert(!Number.isFinite(Infinity),
            "Infinity. Check instance. Case[1-K]: Expects global Infinity is not a finite")

        console.assert(!Number.isFinite(-Infinity),
            "Infinity. Check instance. Case[1-L]: Expects global -Infinity is not a finite")

        console.assert(Number.isFinite(Number.MAX_VALUE),
            "Infinity. Check instance. Case[1-M]: Expects Number.MAX_VALUE is a finite")

        console.assert(Number.isFinite(Number.MIN_VALUE),
            "Infinity. Check instance. Case[1-N]: Expects Number.MIN_VALUE is a finite")

        console.assert(!Number.isFinite(NaN),
            "Infinity. Check instance. Case[1-O]: Expects global NaN is an a finite")
    }


    // Check relations
    {
        console.assert(Number.NEGATIVE_INFINITY < Number.POSITIVE_INFINITY,
            "Infinity. Check relations Case[1-A]: Expects Number.NEGATIVE_INFINITY < Number.POSITIVE_INFINITY.");

        console.assert(Number.NEGATIVE_INFINITY < Number.MIN_VALUE,
            "Infinity. Check relations Case[1-B]: Expects Number.NEGATIVE_INFINITY < Number.MIN_VALUE.");

        console.assert(Number.POSITIVE_INFINITY > Number.MAX_VALUE,
            "Infinity. Check relations Case[1-C]: Expects Number.POSITIVE_INFINITY > Number.MAX_VALUE.");

        console.assert(Number.POSITIVE_INFINITY === Infinity,
            "Infinity. Check relations. Case[1-D]: Expects Number.POSITIVE_INFINITY and global Infinity are equals")
    }

    // Check arithmetics
    {
        console.assert(!Number.isFinite(Number.POSITIVE_INFINITY + 1),
            "Infinity. Check arithmetics. Case[1-A]: Expects Number.POSITIVE_INFINITY + 1 is not finite value.");

        console.assert(!Number.isFinite(Number.POSITIVE_INFINITY - 1),
            "Infinity. Check arithmetics. Case[1-B]: Expects Number.POSITIVE_INFINITY - 1 is not finite value.");

        console.assert(!Number.isFinite(Number.NEGATIVE_INFINITY + 1),
            "Infinity. Check arithmetics. Case[1-C]: Expects Number.NEGATIVE_INFINITY + 1 is not finite value.");

        console.assert(!Number.isFinite(Number.NEGATIVE_INFINITY - 1),
            "Infinity. Check arithmetics. Case[1-D]: Expects Number.NEGATIVE_INFINITY - 1 is not finite value.");

        console.assert((2 / Number.NEGATIVE_INFINITY) === 0,
            "Infinity. Check arithmetics. Case[1-E]: Expects Any number divided by infinity is always zero.");

        console.assert((2 / Number.POSITIVE_INFINITY) === 0,
            "Infinity. Check arithmetics. Case[1-F]: Expects Any number divided by -infinity is always zero.");

        console.assert(((Number.POSITIVE_INFINITY) / -2) === Number.NEGATIVE_INFINITY,
            "Infinity. Check arithmetics. Case[1-G]: Expects When we divide Number.POSITIVE_INFINITY by any" +
            " negative number except Number.NEGATIVE_INFINITY, result is Number.NEGATIVE_INFINITY.");

        console.assert(((Number.POSITIVE_INFINITY) / 2) === Number.POSITIVE_INFINITY,
            "Infinity. Check arithmetics. Case[1-H]: When we divide Number.POSITIVE_INFINITY by any " +
            "positive number except Number.POSITIVE_INFINITY, result is Number.POSITIVE_INFINITY.");

        console.assert(Number.MAX_VALUE * 2 === Infinity,
            "Infinity. Check arithmetics. Case[1-J]: Expects MAX_VALUE * 2 to be an Infinity");

        console.assert(Number.MIN_VALUE - Infinity === -Infinity,
            "Infinity. Check arithmetics. Case[1-K]: Expects MIN_VALUE - Infinity to be an -Infinity");

        console.assert(Number.MIN_VALUE - Number.NEGATIVE_INFINITY === +Infinity,
            "Infinity. Check arithmetics. Case[1-M]: Expects MIN_VALUE - NEGATIVE_INFINITY to be an +Infinity");

        console.assert(Number.MAX_VALUE - Infinity === -Infinity,
            "Infinity. Check arithmetics. Case[1-L]: Expects MAX_VALUE - Infinity to be an -Infinity");

        console.assert(Number.MAX_VALUE - Number.NEGATIVE_INFINITY === +Infinity,
            "Infinity. Check arithmetics. Case[1-M]: Expects MAX_VALUE - NEGATIVE_INFINITY to be an +Infinity");

        // +0 and -0
        const f = (x: number) => 1 / x;

        console.assert(f(-0) === -Infinity,
            "Infinity. Check arithmetics. Case[1-L]: Expects f(-0) to be an -Infinity");

        console.assert(f(+0) === +Infinity,
            "Infinity. Check arithmetics. Case[1-M]: Expects f(0) to be an +Infinity");
    }
}

// Check Epsilon
{
    console.assert(Number.EPSILON === Math.pow(2, -52),
        "Epsilon. Case[1-A]: Expects Number.EPSILON is 2^-52.");

    console.assert(Number.EPSILON > Number.NEGATIVE_INFINITY,
        "Epsilon. Case[1-B]: Expects Number.EPSILON > Number.NEGATIVE_INFINITY.");

    console.assert(Number.EPSILON < Number.POSITIVE_INFINITY,
        "Epsilon. Case[1-C]: Expects Number.EPSILON < Number.POSITIVE_INFINITY.");

    const numberEquals = (x: number, y: number, tolerance: number = Number.EPSILON) => Math.abs(x - y) < tolerance;

    console.assert(numberEquals(0.1 + 0.2, 0.3), "Epsilon. Case[1-D]: Expects 0.1 + 0.2 and 0.3 are is equal.");

    console.assert(numberEquals(1000.1 + 1000.2, 2000.3, 2000 * Number.EPSILON),
        "Epsilon. Case[1-E]: Expects 1000.1 + 1000.2 and 2000.3 are is equal.");
}

// IsInteger
{
    console.assert(Number.isInteger(0), "IsInteger. Case [1-A]: 0 is an integer");

    console.assert(Number.isInteger(1), "IsInteger. Case [1-B]: 1 is an integer");

    console.assert(Number.isInteger(-10000), "IsInteger. Case [1-C]: -10000 is an integer");

    console.assert(Number.isInteger(9999999999), "IsInteger. Case [1-D]: 9999999999 is an integer");

    console.assert(!Number.isInteger(0.1), "IsInteger. Case [1-E]: 0.1 is not an integer");

    console.assert(!Number.isInteger(Math.PI), "IsInteger. Case [1-F]: Math.PI is not an integer");

    console.assert(!Number.isInteger(Number.POSITIVE_INFINITY),
        "IsInteger. Case [1-G]: Number.POSITIVE_INFINITY is not an integer");

    console.assert(!Number.isInteger(Number.NEGATIVE_INFINITY),
        "IsInteger. Case [1-H]: Number.NEGATIVE_INFINITY is not an integer");

    console.assert(!Number.isInteger("10"), "IsInteger. Case [1-I]: '10' is not an integer");

    console.assert(!Number.isInteger(true), "IsInteger. Case [1-J]: true is not an integer");

    console.assert(Number.isInteger(5.0), "IsInteger. Case [1-K]: 0.5 is an integer");

    console.assert(!Number.isInteger(5.000000000000001),
        "IsInteger. Case [1-L]: 5.000000000000001 is not an integer");

    console.assert(Number.isInteger(5.0000000000000001),
        "IsInteger. Case [1-M]: 5.0000000000000001 is an integer because of loss of precision");

    console.assert(Number.isInteger(4500000000000000.1),
        "IsInteger. Case [1-N]: 4500000000000000.1 is an integer because of loss of precision");

    console.assert(!Number.isInteger(Infinity), "IsInteger. Case [1-O]: global Infinity is not an integer");

    console.assert(!Number.isInteger(-Infinity), "IsInteger. Case [1-P]: global -Infinity is not an integer");
}

// safeInteger
{
    console.assert(Number.isSafeInteger(3), "safeInteger. Case [1-A]: 3 is safe an integer");

    console.assert(!Number.isSafeInteger(Math.pow(2, 53)), "safeInteger. Case [1-B]: 2^53 is not safe integer");

    console.assert(Number.isSafeInteger(Math.pow(2, 53) - 1),
        "safeInteger. Case [1-C]: 3 is safe an integer");

    console.assert(!Number.isSafeInteger(Number.NaN), "safeInteger. Case [1-D]: NaN is not safe integer");

    console.assert(!Number.isSafeInteger('3'), "safeInteger. Case [1-E]: '3' is not safe integer");

    console.assert(!Number.isSafeInteger(3.1), "safeInteger. Case [1-F]: 3.1 is not safe integer");

    console.assert(Number.isSafeInteger(3.0), "safeInteger. Case [1-G]: 3.0 is safe an integer");

    console.assert(Number.isSafeInteger(Number.MAX_SAFE_INTEGER),
        "safeInteger. Case [1-H]: Number.MAX_SAFE_INTEGER is safe an integer");

    console.assert(Number.isSafeInteger(Number.MIN_SAFE_INTEGER),
        "safeInteger. Case [1-I]: Number.MIN_SAFE_INTEGER is safe an integer");

    console.assert(Number.MAX_SAFE_INTEGER === Math.pow(2, 53) - 1,
        "safeInteger. Case [1-J]: Expects Number.MAX_SAFE_INTEGER and Math.pow(2, 53) - 1 are equal");

    console.assert(Number.MIN_SAFE_INTEGER === -(Math.pow(2, 53) - 1),
        "safeInteger. Case [1-K]: Expects Number.MIN_SAFE_INTEGER and -(Math.pow(2, 53) - 1) are equal");

    console.assert(Number.MAX_SAFE_INTEGER < Number.POSITIVE_INFINITY,
        "safeInteger. Case [1-L]: Expects Number.MAX_SAFE_INTEGER < Number.POSITIVE_INFINITY");

    console.assert(Number.MIN_SAFE_INTEGER > Number.NEGATIVE_INFINITY,
        "safeInteger. Case [1-M]: Expects Number.MAX_SAFE_INTEGER < Number.POSITIVE_INFINITY");

    console.assert(!Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1),
        "safeInteger. Case [1-N]: ExpectsNumber.MAX_SAFE_INTEGER + 1 is not safe integer");
}