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

const memInfo = Runtime.getMemoryDiagnostics();
const gc = Runtime.getGC();

// Simple class Test
gc.collect();

let internalObjectsCount = memInfo.getAliveObjectsCount();

{
    class A {
        n: number;

        constructor() {
            this.n = 15;
        }

        get getter() { return 10; }
        foo() {}
    };
    const a = new A();
    a.foo();

    let b = a.getter;
    b = 15;

    a.n = 10;
}

// Checks that everything in the gc's heap is alive
memInfo.printGCState();

gc.collect();

// Checks that everything in the gc's heap is alive
memInfo.printGCState();

let newObjectCount = memInfo.getAliveObjectsCount();

console.assert(internalObjectsCount === newObjectCount, "GC global context: simple class failed");

// User case with classes
gc.collect();

internalObjectsCount = memInfo.getAliveObjectsCount();

{
    interface RxButton_args {
        text: string
    }

    class RxButton_t  {
        readonly text: string;
        constructor(text: string) { 
            this.text = text;
        }
    }

    function RxButton(args: RxButton_args): RxButton_t {
        console.log(args.text)
        return new RxButton_t(args.text);
    }

    const qqq = RxButton({
        text: true ? "Log In" : "Processing...",
    })
}

// Checks that everything in the gc's heap is alive
memInfo.printGCState();

gc.collect();

// Checks that everything in the gc's heap is alive
memInfo.printGCState();
    
newObjectCount = memInfo.getAliveObjectsCount();

console.assert(internalObjectsCount === newObjectCount, "GC global context: check classes");

// Test collections
gc.collect();

internalObjectsCount = memInfo.getAliveObjectsCount();

{
    class Clazz {
        constructor(n: number, s: string) {
            this.n = n;
            this.s = s;
        }

        readonly n: number;
        readonly s: string;
    }

    const set: Set<Clazz> = new Set();

    const first = new Clazz(1, "1");
    const second = new Clazz(2, "2");
    const third = new Clazz(3, "3");

    // test `add` chaining
    set.add(first)
        .add(second)
        .add(third);

    // test size
    set.add(first)
        .add(second)
        .add(third);

    let nValuesSum = 0;

    let sValuesSum = "";

    set.forEach((v, v1) => {
        nValuesSum += v.n;
        sValuesSum += v1.s;
    });
}

// Checks that everything in the gc's heap is alive
memInfo.printGCState();

gc.collect();

// Checks that everything in the gc's heap is alive
memInfo.printGCState();
    
newObjectCount = memInfo.getAliveObjectsCount();

console.assert(internalObjectsCount === newObjectCount, "GC global context: check collections");

