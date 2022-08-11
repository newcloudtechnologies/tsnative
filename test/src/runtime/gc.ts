import { Runtime } from "tsnative/std/definitions/runtime"

// String scoped allocation
{
    // All diagnostics mechanics is created using variables to force GC not to delete it before the time comes
    // old and new object counts will not be equivalent otherwise becase diagnostics object will be collected
    const diagnostics = Runtime.getDiagnostics();
    const memInfo = diagnostics.getMemoryDiagnostics();
    const internalObjectsCount = memInfo.getAliveObjectsCount();
    {
        const myStr : string = "abacaba";
        myStr.trim(); // Use this memory to prove it is alive
    }

    Runtime.getGC().collect();

    const newObjectCount = memInfo.getAliveObjectsCount();
    console.assert(internalObjectsCount === newObjectCount, "GC failed: not all object were collected");
}

// Collect from the prev test
Runtime.getGC().collect();

// Non primitive type scoped collection
{
    // All diagnostics mechanics is created using variables to force GC not to delete it before the time comes
    // old and new object counts will not be equivalent otherwise becase diagnostics object will be collected
    const diagnostics = Runtime.getDiagnostics();
    const memInfo = diagnostics.getMemoryDiagnostics();
    const internalObjectsCount = memInfo.getAliveObjectsCount();
    {
        class A {};
        const a = new A();
    }

    Runtime.getGC().collect();
    
    const newObjectCount = memInfo.getAliveObjectsCount();

    console.log(internalObjectsCount);
    console.log(newObjectCount);
    console.assert(internalObjectsCount === newObjectCount, "GC failed: not all object were collected");
}

// Simple garbage inside a block. GC deletes it
{
    // const memInfo = Runtime.getDiagnostics().getMemoryDiagnostics();
    // const internalObjectsCount = memInfo.getAliveObjectsCount();

//     {
// //        const a : number[] = [];

//         const newObjectCount = memInfo.getAliveObjectsCount();
//         // const diff = newObjectCount - internalObjectsCount;

//         console.assert(1 === newObjectCount, "GC failed: one empty array should be allocated");
//     }

    // const memoryDiagnostics = Runtime.getDiagnostics().getMemoryDiagnostics();
    // const prevDeletedObjects = memoryDiagnostics.getDeletedObjectsCount();

    // function foo() {
    //     let a : string = "abacaba";
    //     let b : string = "mama rama";
    //     return a + b;
    // }
    // let e = foo();

    // Runtime.getGC().collect();

    // const deletedObjects = memoryDiagnostics.getDeletedObjectsCount() - prevDeletedObjects;
    // console.log("Deleted objects:");
    // console.log(deletedObjects);
    // console.assert(deletedObjects === 2, "GC Failed: gc had not collected the gargbage");
    
    // const newObjectCount = memInfo.getAliveObjectsCount();

    // console.log(newObjectCount);
    // console.log(internalObjectsCount);

    // const newObjectCount = memInfo.getAliveObjectsCount();
    // console.assert(internalObjectsCount === newObjectCount, "GC failed: erray was not deleted");
    //console.assert(false, "GC failed: erray was not deleted");
}