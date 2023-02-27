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
import { Point, Rect } from "cpp_integration_exts";
import { Runtime } from "tsnative/std/definitions/runtime"
import { CXXBase } from "cpp_integration_exts";
import { DerivedFromBaseInOtherNamespace } from "cpp_integration_exts";
import { DerivedFromVirtualBase } from "cpp_integration_exts";

function test_gc_on_cxx_class() {
    const p1 = new Point(1, 1);
    const p2 = new Point(222, 4345);

    const rect0 = new Rect(p1, p2);
    const rectDiagonal = rect0.getDiagonal();
}

function test_gc_on_cxx_class_with_inheritance() {
    const d = new DerivedFromBaseInOtherNamespace;
    d.test();

    class Inheritor extends CXXBase {
        n = 42
        m = () => "Hello from "
    }
    
    const inh = new Inheritor();
    let e = inh.n;

    let derived = new DerivedFromVirtualBase();
    e += derived.pureVirtualMethodToOverride();

    class InherClassOverrideMethod extends DerivedFromVirtualBase {
        pureVirtualMethodToOverride() {
            return 12345678;
        }
    }

    let obj3 = new InherClassOverrideMethod();
    e += obj3.pureVirtualMethodToOverride();
}

// All diagnostics mechanics is created using variables to force GC not to delete it before the time comes
// old and new object counts will not be equivalent otherwise becase diagnostics object will be collected
const diagnostics = Runtime.getDiagnostics();
const memInfo = diagnostics.getMemoryDiagnostics();

const gc = Runtime.getGC();

{
    gc.collect();

    const internalObjectsCount = memInfo.getAliveObjectsCount();

    test_gc_on_cxx_class();

    gc.collect();
        
    const newObjectCount = memInfo.getAliveObjectsCount();

    console.assert(internalObjectsCount === newObjectCount, "GC failed: not all object were collected -- check cxx classes");
}

{
    gc.collect();

    const internalObjectsCount = memInfo.getAliveObjectsCount();

    test_gc_on_cxx_class_with_inheritance();

    gc.collect();
        
    const newObjectCount = memInfo.getAliveObjectsCount();

    console.assert(internalObjectsCount === newObjectCount, "GC failed: not all object were collected -- check cxx classes with inher");
}