import { Runtime } from "tsnative/std/definitions/runtime"

const memInfo = Runtime.getMemoryDiagnostics();
const gc = Runtime.getGC();
let internalObjectsCount = 0;
let newObjectCount = 0;

function prepareNextText() {
    gc.collect();
    internalObjectsCount = memInfo.getAliveObjectsCount();
}

function checkGCState(errorMsg: string) {
    // Checks that everything in the gc's heap is alive
    memInfo.printGCState();

    gc.collect();

    // Checks that everything in the gc's heap is alive
    memInfo.printGCState();

    newObjectCount = memInfo.getAliveObjectsCount();

    console.assert(internalObjectsCount === newObjectCount, errorMsg);
}

prepareNextText();

namespace A {
    export const a = 10;
}

checkGCState("GC namespaces: single namespace failed");
prepareNextText();

namespace B {
    export namespace C {
        export const b = 15;
    }
}

checkGCState("GC namespaces: nested namespace failed");
prepareNextText();

namespace D {
    export enum E {
        ENTRY1 = 1,
        ENTRY2 = 2
    }
}

checkGCState("GC namespaces: namespace with enum failed");
prepareNextText();

namespace E {
    export const val1 = 15;
}
namespace E {
    export const val2 = 20;
}

checkGCState("GC namespaces: splitted namespace failed");
prepareNextText();

namespace F {
    export namespace G {
        export namespace H {
            export namespace I {
                export function foo() {
                    return 150;
                }
            }
        }
    }
}

checkGCState("GC namespaces: a lot of nested namespaces failed");
prepareNextText();

namespace J {
    export namespace K {
        export namespace L {
            export const val3 = 100;
        }
    }
}
namespace J {
    export namespace K {
        export namespace L {
            export const val4 = 150;
        }
    }
}

checkGCState("GC namespaces: a log of nested and splitted namespaces failed");
prepareNextText();

namespace M {
    export namespace N {
        export const val5 = 1000;
    }
}
namespace O {
    export namespace N {
        export const val6 = 5000;
    }
}

checkGCState("GC namespaces: nested namespace name collision failed");
prepareNextText();

// TODO Classes and interfaces inside of namespaces are not supported for now