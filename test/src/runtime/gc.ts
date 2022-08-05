import { Runtime } from "tsnative/std/definitions/runtime"

// Simple scoped allocation
// {
//     const memInfo = Runtime.getDiagnostics().getMemoryDiagnostics();
//     const internalObjectsCount = memInfo.getAliveObjectsCount();
//     {
//         const myStr : string = "abacaba";
//         myStr.trim(); // Use this memory to prove it is alive
//     }

//     Runtime.getGC().collect();

//     const newObjectCount = memInfo.getAliveObjectsCount();
//     console.assert(internalObjectsCount === newObjectCount, "GC inner scope string failed");
// }

{
    const md = Runtime.getDiagnostics().getMemoryDiagnostics();
    console.assert(false, "Failed");
}
// {
//     const memInfo = Runtime.getDiagnostics().getMemoryDiagnostics();
//     const internalObjectsCount = memInfo.getAliveObjectsCount();
//     {   
//         // let s = "inner_scope_str";
//         // function foo()
//         // {}

//         // foo();
//     }

//     Runtime.getGC().collect();

//     const newObjectCount = memInfo.getAliveObjectsCount();
//     console.assert(internalObjectsCount === newObjectCount, "GC inner scope function failed");
// }


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