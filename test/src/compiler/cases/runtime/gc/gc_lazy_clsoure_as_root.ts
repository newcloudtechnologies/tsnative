import { Runtime } from "tsnative/std/definitions/runtime"


function createStore<T>() 
{
    return 10;
}

class SomeClass<T> {
    value: T;

    constructor(val: T) {
        this.value = val;
    }

    someMethod<G>(el: G) {
        return el;
    }

    otherMethod() {
        return this.value;
    }
}


const diagnostics = Runtime.getDiagnostics();
const memInfo = diagnostics.getMemoryDiagnostics();

// validate memory, createStore as a root should crash the program
memInfo.printGCState();

const gc = Runtime.getGC();
gc.collect();