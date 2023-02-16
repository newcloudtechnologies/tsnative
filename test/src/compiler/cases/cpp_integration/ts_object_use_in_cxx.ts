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

export function gcTest(testBody: () => void, description: string, savedObjects: number) {
    const diagnostics = Runtime.getDiagnostics();
    const memInfo = diagnostics.getMemoryDiagnostics();
    const gc = Runtime.getGC();

    gc.collect();
    const internalObjectsCount = memInfo.getAliveObjectsCount();

    testBody();

    // Checks that everything in the gc's heap is alive
    memInfo.printGCState();

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

gcTest(testSaveSimpleClosure, "test use ts closure in cxx code", 1);

let str = user.getClosureString();

console.log(str);

console.assert(str === "[Function]", "GC check saved object - use saved closure");

gcTest(testSaveClassClosure, "test save class closure", 2);

user.callClassClosure();

console.assert(numberToCapture === 1240, "GC check saved object - use saved class closure");

TSObjectCache.setStaticNumber(44.5);
