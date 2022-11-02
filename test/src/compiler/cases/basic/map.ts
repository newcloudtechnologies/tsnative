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

class A {
    constructor(n: number, s: string) {
        this.n = n;
        this.s = s;
    }

    readonly n: number;
    readonly s: string
}
const m: Map<string, A> = new Map;

const first = new A(1, "1");
const second = new A(2, "2");
const third = new A(3, "3");

// test `set` chaining
m.set("a", first)
    .set("b", second)
    .set("c", third);


// test size
console.assert(m.size === 3, "Map size");

let keys = "";
const expectedKeysSum = "abc";

let nValuesSum = 0;
const expected_nValuesSum = 6;

let sValuesSum = "";
const expected_sValuesSum = "123";

// test `forEach` with single argument
m.forEach((v) => {
    nValuesSum += v.n;
    sValuesSum += v.s;
});

// test `forEach` with two arguments
m.forEach((_, k) => {
    keys += k;
});

console.assert(keys === expectedKeysSum, "Keys reducing");
console.assert(nValuesSum === expected_nValuesSum, "Ns sum");
console.assert(sValuesSum === expected_sValuesSum, "Ss sum");

// test `Map.keys()` and `Map.values()`
{
    const expectedKeys = ["a", "b", "c"];

    const it = m.keys();
    let next = it.next();
    let currentIndex = 0;
    while (!next.done) {
        console.assert(next.value === expectedKeys[currentIndex], "Map.keys()");
        next = it.next();
        ++currentIndex;
    }
}

{
    const expectedValues = [first, second, third];

    const it = m.values();
    let next = it.next();
    let currentIndex = 0;
    while (!next.done) {
        console.assert(next.value === expectedValues[currentIndex], "Map.values()");
        next = it.next();
        ++currentIndex;
    }
}

// test values overwriting
{
    const first = new A(101, "101");
    const second = new A(201, "201");
    const third = new A(301, "301");

    m.set("a", first)
        .set("b", second)
        .set("c", third);

    const expectedSize = 3;

    {
        const expectedKeys = ["a", "b", "c"];

        const it = m.keys();
        let next = it.next();
        let currentIndex = 0;
        while (!next.done) {
            console.assert(next.value === expectedKeys[currentIndex], "Map.keys() overwritten");
            next = it.next();
            ++currentIndex;
        }
    }

    {
        const expectedValues = [first, second, third];

        const it = m.values();
        let next = it.next();
        let currentIndex = 0;
        while (!next.done) {
            console.assert(next.value === expectedValues[currentIndex], "Map.values() overwritten");
            next = it.next();
            ++currentIndex;
        }
    }

    console.assert(m.size === expectedSize, "Map.size overwritten");
}

// test deletion
const deletionResult = m.delete("a");
console.assert(deletionResult, "Map.delete result");
console.assert(!m.has("a"), "Map.has after deletion");
console.assert(m.size === 2, "Map.size after deletion");

// test `clear`
m.clear();
console.assert(m.size === 0, "Map.size after `clear`");

// test deletion in `forEach`
m.set("a", first)
    .set("b", second)
    .set("c", third);

m.forEach((_, key) => {
    if (key === "b") {
        m.delete(key);
    }
});

console.assert(m.has("a") && m.has("c") && !m.has("b"), "Map.has after deletion in `forEach`");
console.assert(m.size === 2, "Map.size after deletion in `forEach`");

// test `clear` in `forEach`
let cyclesCounter = 0;
const expectedCyclesCounter = 1;

m.forEach((_, __, map) => {
    map.clear();
    ++cyclesCounter;
});

console.assert(m.size === 0, "Map.size after `clear` in `forEach`");
console.assert(cyclesCounter === expectedCyclesCounter, "cyclesCounter");
