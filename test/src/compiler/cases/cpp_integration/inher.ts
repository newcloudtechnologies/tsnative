/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

import { CXXBase } from "cpp_integration_exts";
import { DerivedFromBaseInOtherNamespace } from "cpp_integration_exts";
import { DerivedFromVirtualBase } from "cpp_integration_exts";

const derivedFromVirtualBase = new DerivedFromVirtualBase();
console.assert(derivedFromVirtualBase.virtualMethod() === "base virtual method", "'DerivedFromVirtualBase.virtualMethod' test failed");
console.assert(derivedFromVirtualBase.pureVirtualMethodToOverride() === 324, "'DerivedFromVirtualBase.pureVirtualMethodToOverride' test failed");

// Just test buildability
const d = new DerivedFromBaseInOtherNamespace;
d.test();

class Inheritor extends CXXBase {
    n = 42
    m = () => "Hello from "
}

const obj = new Inheritor();
console.assert(obj.getNumber() === 42, "CXX derived class property must be accessible on CXX side");
console.assert(obj.callMemberClosure() === "Hello from CXX", "CXX derived class function-like property must be accessible on CXX side");

{
    class InheritorWithConstructor extends CXXBase {
        constructor() {
            super();
        }

        value = 42
    }

    const obj = new InheritorWithConstructor();
    console.assert(obj.value === 42, "CXX derived class may provide its own constructor");
}
