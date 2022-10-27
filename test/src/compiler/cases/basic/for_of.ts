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
    const arr = [1, 2, 3];
    let counter = 0;

    for (const value of arr) {
        if (counter === 0) {
            break;
        }
        console.assert(value === ++counter, "Array for..of");
    }

    console.log("Counter value: " + counter.toString());
    console.assert(counter === 0, "Break failed");
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

// Iterate over array + continue
{
    const arr = [1, 2, 3];
    let counter = 0;

    for (const value of arr) {
        if (counter === 1) {
            continue;
        }

        ++counter;
    }

    console.assert(counter === 1, "For of: Iterate over array + continue size check failed");
}

// Iterate over array + break
{
    const arr = [1, 2, 3];
    let counter = 0;

    for (const value of arr) {
        if (counter === 0) {
            break;
        }
        
        ++counter;
    }

    console.assert(counter === 0, "For of: Iterate over array + break counter value check failed");
}

// Iterate over simple arrays using nested loops
{
    const outerArray = [1, 2, 3];
    const innerArray = ["MyStr1", "MyStr2"];
    let outerCounter = 0;
    
    for (const outerValue of outerArray) {
        let innerCounter = 0;
        for (const innerValue of innerArray) {
            ++innerCounter;
        }
        console.assert(innerCounter === innerArray.length, "For of: Iterate over simple arrays innerCounter value check failed");

        ++outerCounter;
    }

    console.assert(outerCounter === outerArray.length, "For of: Iterate over simple arrays outerCounter value check failed");
}

// Iterate over simple arrays using nested loops + continue
{
    const outerArray = [1, 2, 3];
    const innerArray = ["MyStr1", "MyStr2"];
    let outerCounter = 0;
    
    for (const outerValue of outerArray) {
        let innerCounter = 0;
        for (const innerValue of innerArray) {
            if (innerCounter === 0) {
                continue;
            }

            ++innerCounter;
        }
        console.assert(innerCounter === 0, "For of: Iterate over simple arrays + continue innerCounter value check failed");

        ++outerCounter;
    }

    console.assert(outerCounter === outerArray.length, "For of: Iterate over simple arrays + continue outerCounter value check failed");
}

// Iterate over simple arrays using nested loops + break
{
    const outerArray = [1, 2, 3];
    const innerArray = ["MyStr1", "MyStr2"];
    let outerCounter = 0;
    
    for (const outerValue of outerArray) {
        let innerCounter = 0;
        for (const innerValue of innerArray) {
            if (innerCounter === 1) {
                break;
            }

            ++innerCounter;
        }
        console.assert(innerCounter === 1, "For of: Iterate over simple arrays + break innerCounter value check failed");

        ++outerCounter;
    }

    console.assert(outerCounter === outerArray.length, "For of: Iterate over simple arrays + break outerCounter value check failed");
}

// Test conditionless 'break'
{
    const qqq = [1, 2, 3, 4, 5];

    for (const _ of qqq) {
        break;
    }
}
