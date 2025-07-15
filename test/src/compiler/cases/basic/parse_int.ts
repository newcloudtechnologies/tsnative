import {equals} from "./math/utils";

{
    console.assert(equals(parseInt("-1"), -1), "ParseInt. parseInt('-1') failed");
    console.assert(equals(parseInt("-0"), 0), "ParseInt. parseInt('-0') failed");
    console.assert(equals(parseInt(" 1"), 1), "ParseInt. parseInt(' 1') failed");
    console.assert(equals(parseInt("     1"), 1), "ParseInt. parseInt(' 1') failed");
    console.assert(equals(parseInt("     1     "), 1), "ParseInt. parseInt('     1    ') failed");
    console.assert(equals(parseInt(" 1"), 1), "ParseInt. parseInt(' 1') failed");
    console.assert(equals(parseInt("11", 2), 3), "ParseInt. parseInt('11', 2) failed");
    console.assert(equals(parseInt("11", 0), 11), "ParseInt. parseInt('11', 0) failed");
    console.assert(equals(parseInt("010"), 10), "ParseInt. parseInt('010') failed");
    console.assert(equals(parseInt("17", 8), 15), "ParseInt. parseInt('17', 8) failed");
    console.assert(equals(parseInt("100px"), 100), "ParseInt. parseInt('100px') failed");
    console.assert(equals(parseInt("12.3"), 12), "ParseInt. parseInt('12.3') failed");
}

{
    // If R = 0, then R = 10
    console.assert(equals(parseInt("0"), parseInt("0", 10)), "parseInt('0') === parseInt('0', 10) failed");
    console.assert(equals(parseInt("1"), parseInt("1", 10)), "parseInt('1') === parseInt('1', 10) failed");
    console.assert(equals(parseInt("2"), parseInt("2", 10)), "parseInt('2') === parseInt('2', 10) failed");
    console.assert(equals(parseInt("3"), parseInt("3", 10)), "parseInt('3') === parseInt('3', 10) failed");
    console.assert(equals(parseInt("4"), parseInt("4", 10)), "parseInt('4') === parseInt('4', 10) failed");
    console.assert(equals(parseInt("5"), parseInt("5", 10)), "parseInt('5') === parseInt('5', 10) failed");
    console.assert(equals(parseInt("6"), parseInt("6", 10)), "parseInt('6') === parseInt('6', 10) failed");
    console.assert(equals(parseInt("7"), parseInt("7", 10)), "parseInt('7') === parseInt('7', 10) failed");
    console.assert(equals(parseInt("8"), parseInt("8", 10)), "parseInt('8') === parseInt('8', 10) failed");
    console.assert(equals(parseInt("9"), parseInt("9", 10)), "parseInt('9') === parseInt('9', 10) failed");
    console.assert(equals(parseInt("10"), parseInt("10", 10)), "parseInt('10) === parseInt('10', 10) failed");
    console.assert(equals(parseInt("9999"), parseInt("9999", 10)), "parseInt('9999') === parseInt('9999', 10) failed");

    console.assert(equals(parseInt("0", 0), parseInt("0", 10)),
        "parseInt('0', 0) === parseInt('0', 10) failed");

    console.assert(equals(parseInt("1", 0), parseInt("1", 10)),
        "parseInt('1', 0) === parseInt('1', 10) failed");

    console.assert(equals(parseInt("2", 0), parseInt("2", 10)),
        "parseInt('2', 0) === parseInt('2', 10) failed");

    console.assert(equals(parseInt("3", 0), parseInt("3", 10)),
        "parseInt('3', 0) === parseInt('3', 10) failed");

    console.assert(equals(parseInt("4", 0), parseInt("4", 10)),
        "parseInt('4', 0) === parseInt('4', 10) failed");

    console.assert(equals(parseInt("5", 0), parseInt("5", 10)),
        "parseInt('5', 0) === parseInt('5', 10) failed");

    console.assert(equals(parseInt("6", 0), parseInt("6", 10)),
        "parseInt('6', 0) === parseInt('6', 10) failed");

    console.assert(equals(parseInt("7", 0), parseInt("7", 10)),
        "parseInt('7', 0) === parseInt('7', 10) failed");

    console.assert(equals(parseInt("8", 0), parseInt("8", 10)),
        "parseInt('8', 0) === parseInt('8', 10) failed");

    console.assert(equals(parseInt("9", 0), parseInt("9", 10)),
        "parseInt('9', 0) === parseInt('9', 10) failed");

    console.assert(equals(parseInt("10", 0), parseInt("10", 10)),
        "parseInt('10', 0) === parseInt('10', 10) failed");

    console.assert(equals(parseInt("9999", 0), parseInt("9999", 10)),
        "parseInt('9999', 0) === parseInt('9999', 10) failed");
}

{
    console.assert(equals(parseInt("11", 2.1), parseInt("11", 2)),
        "parseInt('11', 2.1) === parseInt('11', 2) failed");

    console.assert(equals(parseInt("11", 2.5), parseInt("11", 2)),
        "parseInt('11', 2.5) === parseInt('11', 2) failed");

    console.assert(equals(parseInt("11", 2.9), parseInt("11", 2)),
        "ParseInt. parseInt('11', 2.9) === parseInt('11', 2) failed");

    console.assert(equals(parseInt("11", 2.000000000001), parseInt("11", 2.000000000001)),
        "ParseInt. parseInt('11', 2.000000000001) === parseInt('11', 2) failed");

    console.assert(equals(parseInt("11", +0), parseInt("11", 10)),
        "ParseInt. parseInt('11', +0) === parseInt('11', 10) failed");

    console.assert(equals(parseInt("11", -0), parseInt("11", 10)),
        "ParseInt. parseInt('11', -0) === parseInt('11', 10) failed");

    console.assert(equals(parseInt("11", 4294967298), parseInt("11", 2)),
        "ParseInt. parseInt('11', 4294967298) === parseInt('11', 2) failed");

    console.assert(equals(parseInt("11", 4294967296), parseInt("11", 10)),
        "ParseInt. parseInt('11', 4294967296) ===   parseInt('11', 10) failed");

    console.assert(equals(parseInt("11", -4294967294), parseInt("11", 2)),
        "ParseInt. parseInt('11', -4294967294) === parseInt('11', 2) failed");

    console.assert(equals(parseInt("11", NaN), parseInt("11", 10)),
        "ParseInt. parseInt('11', NaN) === parseInt('11', 10) failed");

    console.assert(equals(parseInt("11", +Infinity), 11), "ParseInt. parseInt('11', +Infinity) failed");
    console.assert(equals(parseInt("11", -Infinity), 11), "ParseInt. parseInt('11', -Infinity) failed");
}

{
    // If the length of S is at least 2 and the first two characters of S
    // re either 0x or 0X, then remove the first two characters from S and let R = 16
    console.assert(equals(parseInt("0x0", 0), parseInt("0", 16)),
        "ParseInt. parseInt('0x0', 0) === parseInt('0', 16) failed");

    console.assert(equals(parseInt("0xA", 0), parseInt("A", 16)),
        "ParseInt. parseInt('0xA', 0) === parseInt('A', 16) failed");

    console.assert(equals(parseInt("0xF", 0), parseInt("F", 16)),
        "ParseInt. parseInt('0xF', 0) === parseInt('F', 16) failed");


    console.assert(equals(parseInt("0xABCDEF", 0), parseInt("ABCDEF", 16)),
        "ParseInt. parseInt('0xABCDEF', 0) === parseInt('ABCDEF', 16) failed");

    console.assert(equals(parseInt("0xABCDEF", 0), parseInt("ABCDEF", 16)),
        "ParseInt. parseInt('0xABCDEF', 0) === parseInt('ABCDEF', 16) failed");

    console.assert(equals(parseInt("0xA", 10), parseInt("0", 10)),
        "ParseInt. parseInt('OxA', 10) === parseInt('0', 10) failed");

    console.assert(equals(parseInt("0xA", 0), parseInt("10", 0)),
        "ParseInt. parseInt('OxA', 0) === parseInt('10', 0) failed");
}

{
    // If S contains any character that is not a radix-R digit,
    // then let Z be the substring of S consisting of all characters before
    // the first such character; otherwise, let Z be S
    console.assert(equals(parseInt("0123456789", 2), 1), "ParseInt. parseInt('0123456789', 2) failed");
    console.assert(equals(parseInt("01234567890", 3), 5), "ParseInt. parseInt('01234567890', 3) failed");
    console.assert(equals(parseInt("01234567890", 4), 27), "ParseInt. parseInt('01234567890', 4) failed");
    console.assert(equals(parseInt("01234567890", 5), 194), "ParseInt. parseInt('01234567890', 5) failed");
    console.assert(equals(parseInt("01234567890", 6), 1865), "ParseInt. parseInt('01234567890', 6) failed");
    console.assert(equals(parseInt("01234567890", 7), 22875), "ParseInt. parseInt('01234567890', 7) failed");
    console.assert(equals(parseInt("01234567890", 8), 342391), "ParseInt. parseInt('01234567890', 8) failed");
    console.assert(equals(parseInt("01234567890", 9), 6053444), "ParseInt. parseInt('01234567890', 9) failed");
    console.assert(equals(parseInt("-0123456789", 2), -1), "ParseInt. parseInt('-0123456789', 2) failed");
    console.assert(equals(parseInt("-01234567890", 3), -5), "ParseInt. parseInt('-01234567890', 3) failed");
    console.assert(equals(parseInt("-01234567890", 4), -27), "ParseInt. parseInt('-01234567890', 4) failed");
    console.assert(equals(parseInt("-01234567890", 5), -194), "ParseInt. parseInt('-01234567890', 5) failed");
    console.assert(equals(parseInt("-01234567890", 6), -1865), "ParseInt. parseInt('-01234567890', 6) failed");
    console.assert(equals(parseInt("-01234567890", 7), -22875), "ParseInt. parseInt('-01234567890', 7) failed");
    console.assert(equals(parseInt("-01234567890", 8), -342391), "ParseInt. parseInt('-01234567890', 8) failed");
    console.assert(equals(parseInt("-01234567890", 9), -6053444), "ParseInt. parseInt('-01234567890', 9) failed");
}

{
    // If S contains any character that is not a radix-R digit,
    // then let Z be the substring of S consisting of all characters before
    // the first such character; otherwise, let Z be S
    for (let i = 2; i <= 36; ++i) {
        console.assert(equals(parseInt("10$1", i), i),
            "ParseInt. parseInt('10$1',", i, ") === ", i, " failed");
    }
}
{
    // If R < 2 or R > 36, then return NaN
    console.assert(Number.isNaN(parseInt("0", 1)), "ParseInt. parseInt('0', 1) failed");
    console.assert(Number.isNaN(parseInt("1", 1)), "ParseInt. parseInt('1', 1) failed");
    console.assert(Number.isNaN(parseInt("2", 1)), "ParseInt. parseInt('2', 1) failed");
    console.assert(Number.isNaN(parseInt("3", 1)), "ParseInt. parseInt('3', 1) failed");
    console.assert(Number.isNaN(parseInt("4", 1)), "ParseInt. parseInt('4', 1) failed");
    console.assert(Number.isNaN(parseInt("5", 1)), "ParseInt. parseInt('5', 1) failed");
    console.assert(Number.isNaN(parseInt("6", 1)), "ParseInt. parseInt('6', 1) failed");
    console.assert(Number.isNaN(parseInt("7", 1)), "ParseInt. parseInt('7', 1) failed");
    console.assert(Number.isNaN(parseInt("8", 1)), "ParseInt. parseInt('8', 1) failed");
    console.assert(Number.isNaN(parseInt("9", 1)), "ParseInt. parseInt('9', 1) failed");
    console.assert(Number.isNaN(parseInt("10", 1)), "ParseInt. parseInt('10', 1) failed");

    // If the conversion is not possible then return NaN
    console.assert(Number.isNaN(parseInt("11", -50)), "ParseInt. parseInt('11', -50) failed");
    console.assert(Number.isNaN(parseInt("")), "ParseInt. parseInt('') failed");
    console.assert(Number.isNaN(parseInt("   ")), "ParseInt. parseInt('   ') failed");
    console.assert(Number.isNaN(parseInt("Infinity")), "ParseInt. parseInt('Infinity') failed");
    console.assert(Number.isNaN(parseInt("546", 2)), "ParseInt. parseInt('546') failed");
    console.assert(Number.isNaN(parseInt("11", -2147483650)), "ParseInt. parseInt('11', -2147483650) failed");
    console.assert(Number.isNaN(parseInt("0x", 0)), "ParseInt. parseInt('0x', 0) failed");
    console.assert(!Number.isNaN(parseInt("0x", 10)), "ParseInt. parseInt('0x', 10) failed");
    console.assert(Number.isNaN(parseInt("0x", 16)), "ParseInt. parseInt('0x', 16) failed");
    console.assert(Number.isNaN(parseInt("0X", 0)), "ParseInt. parseInt('0X', 0) failed");
    console.assert(!Number.isNaN(parseInt("0X", 10)), "ParseInt. parseInt('0X', 10) failed");
    console.assert(Number.isNaN(parseInt("0X", 16)), "ParseInt. parseInt('0X', 16) failed");
    console.assert(Number.isNaN(parseInt("0xA", 1)), "ParseInt. parseInt('0xA', 1) failed");


    // If Z is empty, return NaN
    for (let i = 2; i <= 36; ++i) {
        console.assert(Number.isNaN(parseInt("$invalid string")), "ParseInt. parseInt('$invalid string'", i, ") failed");
    }
}

{
    // Check if parseInt still accepts octal
    // parseInt is no longer allowed to treat a leading zero as indicating octal.
    // "If radix is undefined or 0, it is assumed to be 10 except
    // when the number begins with the character pairs 0x or 0X, in which
    // case a radix of 16 is assumed."
    console.assert(equals(parseInt("010"), 10), "ParseInt. parseInt('010') failed");
    console.assert(equals(parseInt("0123123123"), 123123123), "ParseInt. parseInt('0123123123') failed");
}

{
    // The following examples all return 15:
    console.assert(equals(parseInt("0xF", 16), 15), "ParseInt. parseInt('0xF') failed");
    console.assert(equals(parseInt("F", 16), 15), "ParseInt. parseInt('F') failed");
    console.assert(equals(parseInt("17", 8), 15), "ParseInt. parseInt('17') failed");
    console.assert(equals(parseInt("15,23", 10), 15), "ParseInt. parseInt('15,23') failed");
    console.assert(equals(parseInt("FXX123", 16), 15), "ParseInt. parseInt('FXX123') failed");
    console.assert(equals(parseInt("15 * 3", 10), 15), "ParseInt. parseInt('15 * 3') failed");
    console.assert(equals(parseInt("15e2", 10), 15), "ParseInt. parseInt('15e2') failed");
    console.assert(equals(parseInt("15px", 10), 15), "ParseInt. parseInt('15px') failed");
    console.assert(equals(parseInt("12", 13), 15), "ParseInt. parseInt('12') failed");
}

{
    // Some big number
    console.assert(equals(parseInt("22222222210323245498540985049580495849058043"), 2.2222222210323244e+43),
        "ParseInt. parseInt('22222222210323245498540985049580495849058043') failed");

    console.assert(equals(parseInt("22222222210323245498540985049580495849058043", 16), 1.2770796173784749e+52),
        "ParseInt. parseInt('22222222210323245498540985049580495849058043', 16) failed");
}

{
    // Check overflow
    console.assert(Number.isSafeInteger(parseInt("9007199254740991")),
        "parseInt('9007199254740991') is not safe integer. failed");

    console.assert(Number.isSafeInteger(parseInt("-9007199254740991")),
        "parseInt('-9007199254740991') is not safe integer. failed");

    console.assert(!Number.isSafeInteger(parseInt("9007199254740992")),
        "parseInt('9007199254740991') is not safe integer. failed");

    const s = "11111111111111111111111111111111111111"
    "111111111111111111111111111111111111111111111111"
    "111111111111111111111111111111111111111111111111"
    "111111111111111111111111111111111111111111111111"
    "111111111111111111111111111111111111111111111111"
    "111111111111111111111111111111111111111111111111"
    "111111111111111111111111111111111111111111111111"
    "111111111111111111111111111111111111111111111111";

    console.assert(Number.isFinite(Number.parseInt(s)), "ParseInt. parseInt(s) failed");
}
