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
import { TSObjectCache } from "cpp_integration_exts";
import { Runtime } from "tsnative/std/definitions/runtime"

let user = new TSObjectCache();

function testSaveNumbers() {
    user.addNumber(4);
    user.addNumber(100);
    user.addNumber(5000);
    user.addNumber(20000);
}

function testSaveSimpleClosure() {
    let doPrint = function() { console.log("Lalala"); }

    user.setClosure(doPrint);
}

let numberToCapture = 1000;

function testSaveClassClosure () {
    class SomeClass {
        val: number;

        constructor() {
            this.val = 18;
        }

        doChangeValue() {
            this.val += 222;
            numberToCapture += this.val;
        }
    }

    let el = new SomeClass();
    user.setClassClosure(el.doChangeValue);
}

function testClosurePassingToCXXClassByOwner() {
    user.onClick(() => 101);
}

export function gcTest(testBody: () => void, description: string, savedObjects: number) {
    const memInfo = Runtime.getMemoryDiagnostics();
    const gc = Runtime.getGC();

    gc.collect();
    const internalObjectsCount = memInfo.getAliveObjectsCount();
    // Checks that everything in the gc's heap is alive
    memInfo.printGCState();

    testBody();

    gc.collect();
    const newObjectCount = memInfo.getAliveObjectsCount();

    // Checks that everything in the gc's heap is alive
    memInfo.printGCState();

    console.log(internalObjectsCount);
    console.log(newObjectCount);

    console.assert(internalObjectsCount + savedObjects === newObjectCount, `GC failed: not all object were collected -- ${description}`);
}

gcTest(testSaveNumbers, "test use numbers in cxx code", 4);

console.assert(user.getNumbersSum() === 25104, "GC check saved object - use saved numbers");

user.clear();

console.assert(user.getNumbersSum() === 0, "GC check saved object - clear saved numbers");

gcTest(testSaveSimpleClosure, "test use ts closure in cxx code", 1); // 1 - closure

let str = user.getClosureString();

console.log(str);

console.assert(str === "[Function]", "GC check saved object - use saved closure");

gcTest(testSaveClassClosure, "test save class closure", 5);

user.callClassClosure();

console.assert(numberToCapture === 1240, "GC check saved object - use saved class closure");

TSObjectCache.setStaticNumber(44.5);

gcTest(testClosurePassingToCXXClassByOwner, "Test keeping and passing closure by TSObjectOwner to std::function", 1);
console.assert(user.click() === 101, "Closure passed to std::function by TSObjectOwner and called successfully");
