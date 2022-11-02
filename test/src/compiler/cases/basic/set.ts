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
    readonly s: string;
}

const set: Set<A> = new Set;


const first = new A(1, "1");
const second = new A(2, "2");
const third = new A(3, "3");

// test `add` chaining
set.add(first)
    .add(second)
    .add(third);


// test size
console.assert(set.size === 3, "Set size");

// test 'unique only' behavior
set.add(first)
    .add(second)
    .add(third);

console.assert(set.size === 3, "Set size");

let nValuesSum = 0;
const expected_nValuesSum = 6;

let sValuesSum = "";
const expected_sValuesSum = "123";

// test `forEach` with single argument
set.forEach((v, v1) => {
    nValuesSum += v.n;
    sValuesSum += v1.s;
});


console.assert(nValuesSum === expected_nValuesSum, "Ns sum");
console.assert(sValuesSum === expected_sValuesSum, "Ss sum");

const is_equal_arrays = function <T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
};

const expectedValues = [first, second, third];

// test `Set.keys()` and `Set.values()`
{
    const it = set.keys();
    let next = it.next();
    let index = 0;
    while (!next.done) {
        console.assert(next.value === expectedValues[index], "Set.keys()");
        next = it.next();
        ++index;
    }
}

{
    const it = set.values();
    let next = it.next();
    let index = 0;
    while (!next.done) {
        console.assert(next.value === expectedValues[index], "Set.values()");
        next = it.next();
        ++index;
    }
}

{
    const itKeys = set.keys();
    const itVals = set.values();
    let nextKey = itKeys.next();
    let nextVal = itVals.next();
    while (!nextKey.done && !nextVal.done) {
        console.assert(nextKey.value === nextVal.value, "Set.values() & Set.keys()");
        nextKey = itKeys.next();
        nextVal = itVals.next();

        console.assert(nextVal.done === nextKey.done, "Keys and values are same");
    }
}

// test deletion
const deletionResult = set.delete(first);
console.assert(deletionResult, "Set.delete result");
console.assert(!set.has(first), "Set.has after deletion");
console.assert(set.size === 2, "Set.size after deletion");

// test `clear`
set.clear();
console.assert(set.size === 0, "Set.size after `clear`");

// test deletion in `forEach`
set.add(first)
    .add(second)
    .add(third);

set.forEach((v, v1) => {
    if (v === second) {
        set.delete(v1);
    }
});

console.assert(set.has(first) && set.has(third) && !set.has(second), "Set.has after deletion in `forEach`");
console.assert(set.size === 2, "Map.size after deletion in `forEach`");

// test `clear` in `forEach`
let cyclesCounter = 0;
const expectedCyclesCounter = 1;

set.forEach((_, __, set) => {
    set.clear();
    ++cyclesCounter;
});

console.assert(set.size === 0, "Set.size after `clear` in `forEach`");
console.assert(cyclesCounter === expectedCyclesCounter, "cyclesCounter");