import { Runtime } from "tsnative/std/definitions/runtime"

export function gcTest(testBody: () => void, description: string, savedObjects = 0) {
    const memInfo = Runtime.getMemoryDiagnostics();
    const gc = Runtime.getGC();

    gc.collect();
    const beforeAliveObjects = memInfo.getAliveObjectsCount();

    memInfo.printGCState();
    testBody();

    // Checks that everything in the gc's heap is alive

    gc.collect();
    const afterAliveObjects = memInfo.getAliveObjectsCount();

    // Checks that everything in the gc's heap is alive
    memInfo.printGCState();

    console.log(`before alive object ${beforeAliveObjects}, after ${afterAliveObjects}, saved ${savedObjects}`);
    console.assert(beforeAliveObjects === afterAliveObjects - savedObjects,
         `GC failed: not all object were collected -- ${description}`);
}
