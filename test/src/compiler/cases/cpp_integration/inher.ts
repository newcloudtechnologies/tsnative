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

import { CXXBase } from "cpp_integration_exts";
import { DerivedFromBaseInOtherNamespace } from "cpp_integration_exts";
import { DerivedFromVirtualBase } from "cpp_integration_exts";
import { Point } from "cpp_integration_exts";
import { Worker } from "cpp_integration_exts";

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

{
    class BasePoint extends Point {
        static tag = "BasePoint"

        constructor(expectedTag: string) {
            super(1, 1);

            const finishTag = this.finish();
            console.assert(finishTag === expectedTag, `Methods:
                    'this' in polymorphic call have to refer to most derived class (CXX-inheritance)
                    and all of its non-polymorphic methods have to be available through call chain.
                    Expected tag: ${expectedTag}, received: ${finishTag}`
            );
        }

        private finish() {
            return this.render();
        }

        render() {
            return BasePoint.tag;
        }
    }

    class DerivedPoint extends BasePoint {
        static tag = "DerivedPoint"

        constructor(expectedTag: string) {
            super(expectedTag);
        }

        render() {
            return this.getTag();
        }

        private getTag() {
            return DerivedPoint.tag;
        }
    }

    new BasePoint(BasePoint.tag)
    new DerivedPoint(DerivedPoint.tag)
}

{
    class Base extends Worker {
        constructor() {
            super();
            this.someMethod(); // <-- OK. We have a valid fully constructed Worker object as 'this' after 'super()' call

            // part of TSN-586
            // Once we left the constructor body ORIGINAL 'this' will be restored therefore
            // D1.constructor and other methods won't be able to call Worker methods correctly.
        }
    }

    class D1 extends Base {
        constructor() {
            super();

            // part of TSN-586
            // lines below are lead to crash once uncommented
            // this.someMethod();
            // super.someMethod();
        }
    }

    const d1 = new D1();
    d1.someMethod();
}
