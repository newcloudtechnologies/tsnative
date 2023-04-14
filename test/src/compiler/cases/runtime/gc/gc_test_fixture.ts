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

import { Runtime } from "tsnative/std/definitions/runtime"

export function gcTest(testBody: () => void, description: string, savedObjects = 0) {
    const memInfo = Runtime.getMemoryDiagnostics();
    const gc = Runtime.getGC();

    gc.collect();
    const beforeAliveObjects = memInfo.getAliveObjectsCount();

    memInfo.printGCState();
    testBody();

    Runtime.getLoop().processEvents();
    Runtime.getLoop().processEvents(); // On Windows, callbacks are processed on the second iteration of the loop

    // Checks that everything in the gc's heap is alive


    gc.collect();
    const afterAliveObjects = memInfo.getAliveObjectsCount();

    // Checks that everything in the gc's heap is alive
    memInfo.printGCState();

    console.log(`before alive object ${beforeAliveObjects}, after ${afterAliveObjects}, saved ${savedObjects}`);
    console.assert(beforeAliveObjects === afterAliveObjects - savedObjects,
         `GC failed: not all object were collected -- ${description}`);
}
