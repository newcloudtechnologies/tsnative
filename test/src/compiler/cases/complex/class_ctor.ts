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

// Test case from TSN-182 Define class property via constructor
{
    class A {
        w = 1;
        constructor() {}
    }
    class B {
        constructor(private a: A) {}

        printA() : number {
            return a.w;
        }
    }
    let a = new A();
    let b = new B(a);
    console.assert(b.printA() === 1, "Class ctor 1");
}
