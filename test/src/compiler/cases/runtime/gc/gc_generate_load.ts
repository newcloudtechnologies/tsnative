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

import { gcTest } from "./gc_test_fixture";

function randomString(len: number, charSet: string) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = "";
    for (let i = 0; i < len; i++) {
        let randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}

function generateString(s: string, loopLength: number) {
    for (let i = 0; i < loopLength; ++i) {
        s += randomString(50, "");
    }
    return s;
}

function thenable(s: string) {
    return generateString(s, 10);
}

function test()
{
    let p = Promise.resolve("");

    for (let i = 0; i < 3; ++i) {
        p = p.then(thenable);
    }
}

gcTest(test, "Check generate random string");

