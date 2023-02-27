/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import {equals} from "./math/utils";

{
    // Invalid convert is NaN
    console.assert(Number.isNaN(parseFloat("")), "parseFloat('') failed");
    console.assert(Number.isNaN(parseFloat("str")), "parseFloat('str') failed");
    console.assert(Number.isNaN(parseFloat("+")), "parseFloat('+') failed");
    console.assert(Number.isNaN(parseFloat("e1")), "parseFloat('e1') failed");
    console.assert(Number.isNaN(parseFloat("e-1")), "parseFloat('e-1') failed");
    console.assert(Number.isNaN(parseFloat("E+1")), "parseFloat('E+1') failed");
    console.assert(Number.isNaN(parseFloat("E0")), "parseFloat('E0') failed");
    console.assert(Number.isNaN(parseFloat("-.e-1")), "parseFloat('-.e-1') failed");
    console.assert(Number.isNaN(parseFloat(".e1")), "parseFloat('.e1') failed");
    console.assert(Number.isNaN(parseFloat(".x")), "parseFloat('.x') failed");
    console.assert(Number.isNaN(parseFloat(".+x")), "parseFloat('.+x') failed");
    console.assert(Number.isNaN(parseFloat("A")), "parseFloat('A') failed");
}

{
    // Check prefix
    console.assert(equals(parseFloat("11x"), 11), "parseFloat('11x') failed");
    console.assert(equals(parseFloat("11s1"), 11), "parseFloat('11s1') failed");
    console.assert(equals(parseFloat("11.s1"), 11), "parseFloat('11.s1') failed");
    console.assert(equals(parseFloat(".0s1"), 0), "parseFloat('.0s1') failed");
    console.assert(equals(parseFloat("1.s1"), 1), "parseFloat('1.s1') failed");
    console.assert(equals(parseFloat("1..1"), 1), "parseFloat('1..1') failed");
    console.assert(equals(parseFloat("0.1.1"), 0.1), "parseFloat('0.1.1') failed");
    console.assert(equals(parseFloat("0. 1"), 0), "parseFloat('0. 1') failed");
    console.assert(equals(parseFloat("1ex"), 1), "parseFloat('1ex') failed");
    console.assert(equals(parseFloat("1e-x"), 1), "parseFloat('1e-x') failed");
    console.assert(equals(parseFloat("1e1x"), 10), "parseFloat('1e1x') failed");
    console.assert(equals(parseFloat("1e-1x"), 0.1), "parseFloat('1e-1x') failed");
    console.assert(equals(parseFloat("0.1e-1x"), 0.01), "parseFloat('0.1e-1x') failed");

    console.assert(equals(parseFloat("  -0x0"), 0), "parseFloat('0x0') failed");
    console.assert(equals(parseFloat("0x1"), 0), "parseFloat('0x1') failed");
    console.assert(equals(parseFloat("0x2"), 0), "parseFloat('0x2') failed");
    //.....
    console.assert(equals(parseFloat("0xA"), 0), "parseFloat('0xA') failed");
    console.assert(equals(parseFloat("0xB"), 0), "parseFloat('0xB') failed");
    //....
    console.assert(equals(parseFloat("0xF"), 0), "parseFloat('0xA') failed");

    console.assert(equals(parseFloat("0x"), 0), "parseFloat('0x') failed");
    console.assert(equals(parseFloat("0X"), 0), "parseFloat('0x') failed");

    console.assert(equals(parseFloat("-11.string"), -11), "parseFloat('-11.string') failed");
    console.assert(equals(parseFloat("01.string"), 1), "parseFloat('01.string') failed");
    console.assert(equals(parseFloat("+11.1string"), 11.1), "parseFloat('+11.1string') failed");
    console.assert(equals(parseFloat("01.1string"), 1.1), "parseFloat('01.11string') failed");
    console.assert(equals(parseFloat("-11.e-1string"), -1.1), "parseFloat('-11.e-1string') failed");
    console.assert(equals(parseFloat("01.e1string"), 10), "parseFloat('01.e1string') failed");
    console.assert(equals(parseFloat("+11.22e-1string"), 1.122), "parseFloat('+11.22e-1string') failed");
    console.assert(equals(parseFloat("01.01e1string"), 10.1), "parseFloat('01.01e1string') failed");
    console.assert(equals(parseFloat("001.string"), 1), "parseFloat('001.string') failed");
    console.assert(equals(parseFloat("010.string"), 10), "parseFloat('010.string') failed");
    console.assert(equals(parseFloat("+.1string"), 0.1), "parseFloat('+.1string') failed");
    console.assert(equals(parseFloat("+.01string"), 0.01), "parseFloat('+.01string') failed");
    console.assert(equals(parseFloat("+.22e-1string"), 0.022), "parseFloat('+.22e-1string') failed");

    console.assert(equals(parseFloat("-11string"), -11), "parseFloat('-11string') failed");
    console.assert(equals(parseFloat("01string"), 1), "parseFloat('01string') failed");
    console.assert(equals(parseFloat("-11e-1string"), -1.1), "parseFloat('-11e-1string') failed");
    console.assert(equals(parseFloat("01e1string"), 10), "parseFloat('01e1string') failed");
    console.assert(equals(parseFloat("001string"), 1), "parseFloat('001string') failed");
    console.assert(equals(parseFloat("1e001string"), 10), "parseFloat('001string') failed");
    console.assert(equals(parseFloat("010string"), 10), "parseFloat('010string') failed");

    console.assert(equals(parseFloat("1.0e-1_0"), 1.0e-1), "parseFloat('1.0e-1_0') failed");
    console.assert(equals(parseFloat("1.0e-10_0"), 1.0e-10), "parseFloat('1.0e-10_0') failed");
    console.assert(equals(parseFloat("1.0e+1_0"), 1.0e+1), "parseFloat('1.0e+1_0') failed");
    console.assert(equals(parseFloat("1.0e+10_0"), 1.0e+10), "parseFloat('1.0e+10_0') failed");
    console.assert(equals(parseFloat("10.00_01e2"), 10.00), "parseFloat('10.00_01e2') failed");

    console.assert(equals(parseFloat("123456789_0"), 123456789), "parseFloat('123456789_0') failed");
    console.assert(equals(parseFloat("123456789_1"), 123456789), "parseFloat('123456789_1') failed");
    console.assert(equals(parseFloat("123456789_2"), 123456789), "parseFloat('123456789_2') failed");
    //.....
    console.assert(equals(parseFloat("123456789_9"), 123456789), "parseFloat('123456789_9') failed");
}

{
    // Check Infinity
    console.assert(parseFloat("Infinity") === +Infinity, "parseFloat('Infinity') failed");
    console.assert(parseFloat("+Infinity") === +Infinity, "parseFloat('+Infinity') failed");
    console.assert(parseFloat("-Infinity") === -Infinity, "parseFloat('-Infinity') failed");

    // Check Infinity + string
    console.assert(parseFloat("Infinity1") === +Infinity, "parseFloat('Infinity1') failed");
    console.assert(parseFloat("Infinityx") === +Infinity, "parseFloat('Infinityx') failed");
    console.assert(parseFloat("InfinityDotA2") === +Infinity, "parseFloat('InfinityDotA2') failed");
}

{
    console.assert(equals(parseFloat("3.14"), 3.14), "parseFloat('3.14') failed");
    console.assert(equals(parseFloat("3,14"), 3), "parseFloat('3,14') failed");
}
