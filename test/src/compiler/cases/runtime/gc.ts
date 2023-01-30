import { Runtime } from "tsnative/std/definitions/runtime"

// String scoped allocation
{
    // All diagnostics mechanics is created using variables to force GC not to delete it before the time comes
    // old and new object counts will not be equivalent otherwise becase diagnostics object will be collected
    const diagnostics = Runtime.getDiagnostics();
    const memInfo = diagnostics.getMemoryDiagnostics();
    const gc = Runtime.getGC();

    gc.collect();

    const internalObjectsCount = memInfo.getAliveObjectsCount();

    {
        const myStr : string = "abacaba";
        myStr.trim(); // Use this memory to prove it is alive
    }

    gc.collect();

    const newObjectCount = memInfo.getAliveObjectsCount();

    console.assert(internalObjectsCount === newObjectCount, "GC failed: not all object were collected");
}

{
    const gc = Runtime.getGC();

    gc.collect();
    
    function eee(v: number) {

    };

    gc.saveMemoryGraph(); // iterate through objects
}


// // Collect from the prev test
// Runtime.getGC().collect();

// // Non primitive type scoped collection
// {
//     // All diagnostics mechanics is created using variables to force GC not to delete it before the time comes
//     // old and new object counts will not be equivalent otherwise becase diagnostics object will be collected
//     const diagnostics = Runtime.getDiagnostics();
//     const memInfo = diagnostics.getMemoryDiagnostics();
//     const internalObjectsCount = memInfo.getAliveObjectsCount();

//     {
//         class A {
//             n: number;

//             constructor() {
//                 this.n = 15;
//             }

//             get getter() { return 10; }
//             foo() {}
//         };
//         const a = new A();
//         a.foo();

//         let b = a.getter;
//         b = 15;

//         a.n = 10;
//     }

//     Runtime.getGC().collect();
    
//     const newObjectCount = memInfo.getAliveObjectsCount();
//     console.assert(internalObjectsCount === newObjectCount, "GC failed: not all object were collected");
// }

// Runtime.getGC().collect();

// // Do not collect function closure
// {
//     // All diagnostics mechanics is created using variables to force GC not to delete it before the time comes
//     // old and new object counts will not be equivalent otherwise becase diagnostics object will be collected
//     const diagnostics = Runtime.getDiagnostics();
//     const memInfo = diagnostics.getMemoryDiagnostics();
//     const internalObjectsCount = memInfo.getAliveObjectsCount();

//     function foo() {
//     };

//     Runtime.getGC().collect();
//     const newObjectCount = memInfo.getAliveObjectsCount();

//     // +3 are closure, numArgs, envLength
//     console.assert(internalObjectsCount + 3 === newObjectCount, "GC failed: not all object were collected");
// }

// Runtime.getGC().collect();

// // Collect local function variables
// {
//     // All diagnostics mechanics is created using variables to force GC not to delete it before the time comes
//     // old and new object counts will not be equivalent otherwise becase diagnostics object will be collected
//     const diagnostics = Runtime.getDiagnostics();
//     const memInfo = diagnostics.getMemoryDiagnostics();
//     const internalObjectsCount = memInfo.getAliveObjectsCount();

//     function foo() {
//         let a = "abacaba";
//         let b = "mama rama";
//     };
    
//     foo();

//     Runtime.getGC().collect();
//     const newObjectCount = memInfo.getAliveObjectsCount();

//     // +3 are closure, numArgs, envLength
//     console.assert(internalObjectsCount + 3 === newObjectCount, "GC failed: not all object were collected");
// }

// Runtime.getGC().collect();

// Collect local function variables but do not collect environment
// {
    // All diagnostics mechanics is created using variables to force GC not to delete it before the time comes
    // old and new object counts will not be equivalent otherwise becase diagnostics object will be collected
    // const diagnostics = Runtime.getDiagnostics();
    // const memInfo = diagnostics.getMemoryDiagnostics();
    // const internalObjectsCount = memInfo.getAliveObjectsCount();
//     let i = 22;
//     function foo() {
//         i = 42;
//     };

//     foo();

//     Runtime.getGC().collect();
//     const newObjectCount = memInfo.getAliveObjectsCount();

//     console.log(internalObjectsCount);
//     console.log(newObjectCount);
//     // +3 are closure, numArgs, envLength, nothing for i because it's placeholder is created earlier than first getAliveObjectsCount
//     console.assert(internalObjectsCount + 3 === newObjectCount, "GC failed: not all object were collected");
// }