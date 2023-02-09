import { Runtime } from "tsnative/std/definitions/runtime"

export function gcTest(testBody: () => void, description: string) {
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

    console.assert(internalObjectsCount === newObjectCount, `GC failed: not all object were collected -- ${description}`);
}