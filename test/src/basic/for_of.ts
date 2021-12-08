/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

// Array
{
    const arr = [1, 2, 3];
    let counter = 0;

    for (const value of arr) {
        console.assert(value === ++counter, "Array for..of");
    }
}

{
    const str = "TEST";
    const chars = str.split("");

    let counter = 0;
    for (const char of str) {
        console.assert(char === chars[counter++], "String for..of");
    }
}

{
    const set = new Set<number>();
    set.add(3).add(1).add(-22);
    const expected = [3, 1, -22];

    let counter = 0;
    for (const value of set) {
        console.assert(value === expected[counter++], "Set for..of");
    }
}

{
    const map = new Map<number, string>();
    map.set(10, "Z").set(1, "A").set(2, "B");

    const expectedKeys = [10, 1, 2];
    const expectedValues = ["Z", "A", "B"];

    let counter = 0;
    for (const value of map) {
        console.assert(value[0] === expectedKeys[counter] && value[1] === expectedValues[counter], "Map for..of");
        ++counter;
    }
}

{
    const map = new Map<number, string>();
    map.set(10, "Z").set(1, "A").set(2, "B");

    const expectedKeys = [10, 1, 2];
    const expectedValues = ["Z", "A", "B"];

    let counter = 0;
    for (const [key, value] of map) {
        console.assert(key === expectedKeys[counter] && value === expectedValues[counter], "Map for..of with destuctured initializer");
        ++counter;
    }
}
