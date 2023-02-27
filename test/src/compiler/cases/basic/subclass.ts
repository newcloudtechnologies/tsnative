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

{

    class A {
    }

    class B extends A {
        val: number = 15;
    }

    const b = new B();

    console.assert(b.val === 15, "case[1-A]: expects val is 15");
}

{
    let val: number[] = [];

    class A {
        constructor(...args: number[]) {
            val = args;
        }
    }

    class B extends A {
        constructor(...args: number[]) {
            super(...args);
        }
    }

    new B(0, 1, 2);

    console.assert(val[0] === 0, "Case [2-A]: Expected 0");
    console.assert(val[1] === 1, "Case [2-B]: Expected 0");
    console.assert(val[2] === 2, "Case [2-C]: Expected 0");
}

{
    class Base {
        value: number;

        constructor(value: number) {
            this.value = value;
        }
    }

    class Derived extends Base {
        constructor(value: number) {
            super(value);
        }
    }

    const instance = new Derived(5);

    console.assert(instance.value === 5, "case [3-A]: value expects is 5");
}

{
    let val = false;

    class A {
        constructor() {
            val = true;
        }
    }

    class B extends A {
        constructor() {
            try {
                throw null;
            } catch (e) {
                super();
            }
        }
    }

    new B();
    console.assert(val, "case [4-A]: expect true");
}

{
    class Base {
        getClassName(): string {
            return "Base";
        }

        hasParent(): boolean {
            return false;
        }

        getParent(): Base {
            return this;
        }
    }

    class Derived1 extends Base {

        getClassName(): string {
            return "Derived1";
        }
    }

    class Derived2 extends Base {

        getClassName(): string {
            return "Derived2";
        }
    }

    class Derived3 extends Derived2 {

        getClassName(): string {
            return "Derived3";
        }
    }

    const object1 = new Derived1();
    const object2 = new Derived2();
    const object3 = new Derived3();


    console.assert(object1.getClassName() === "Derived1", "case [5-A]: Expects class name is Derived1");
    console.assert(object2.getClassName() === "Derived2", "case [5-C]: Expects class name is Derived2");
    console.assert(object3.getClassName() === "Derived3", "case [5-E]: Expects class name is Derived3");
}

{
    class RxWidget_t {

        grow(): this { // It will pass through the entire hierarchy and will be called on the type corresponding to this
            return this;
        }

        getClassName(): string {
            return "RxWidget_t";
        }
    }

    class TestWdg extends RxWidget_t {
        constructor() {
            super();
        }
    }

    class TablePagesView_t extends TestWdg {
        constructor() {
            super();

        }

        getClassName(): string {
            return "TablePagesView_t";
        }
    }

    let inst = new TablePagesView_t();

    let pageView = inst.grow();

    console.assert(pageView.getClassName() === "TablePagesView_t", "case[6-A] Expected class name is TablePagesView_t");
}

{
    class RxWidget_t {

        grow(): RxWidget_t { // Only RxWidget_t
            return this;
        }

        getClassName(): string {
            return "RxWidget_t";
        }
    }

    class TestWdg extends RxWidget_t {
        constructor() {
            super();
        }
    }

    class TablePagesView_t extends TestWdg {
        constructor() {
            super();
        }
    }

    let inst = new TablePagesView_t();

    let pageView = inst.grow();

    console.assert(pageView.getClassName() === "RxWidget_t", "case[7-A] Expected class name is RxWidget_t");
}


{
    class A {
        static a: number = 0;

        constructor() {
        }
    }

    class B extends A {
        static b: number = 0;

        constructor() {
            super()
            A.a++;
        }

        getA(): number {
            return A.a;
        }

        setA(v: number) {
            A.a = v;
        }
    }

    const inst = new B();

    console.assert(inst.getA() === 1, "class: inst.getA() === 1 failed");

    inst.setA(2);

    console.assert(inst.getA() === 2, "class: inst.getA() === 2 failed");

    console.assert(A.a === 2, "class: ClassA.a === 2 failed");
    console.assert(B.a === 2, "class: ClassB.a === 2 failed");

    A.a = 3;
    console.assert(A.a === 3, "class: ClassA.a === 3 failed");
    console.assert(B.a === 3, "class: ClassB.a === 3 failed");

    A.a = 4;
    console.assert(A.a === 4, "class: ClassA.a === 4 failed");
    console.assert(B.a === 4, "class: ClassB.a === 4 failed");

    console.assert(B.b === 0, "class: ClassB.b === 0 failed");

    B.b = 1;

    console.assert(B.b === 1, "class: ClassB.b === 1 failed");
}

{
    class A extends Array<number> {
    }

    const a = new A();

    console.assert(a.length === 0, "case [8-A]: expects 0");

    a.push(1);

    console.assert(a.length === 1, "case [8-B]: expects 1");
}

{
    class A extends Date {
        constructor(format: string) {
            super(format);
        }
    }

    const a = new A("2021-01-01");
    const b = new Date("2021-01-01");

    console.assert(a.toString() === b.toString(), "case [9-A]: expects equality for dates");
}

{
    class B {
        method() {
            return 1;
        }

        get x() {
            return 2;
        }
    }

    class C extends B {
        get y() {
            console.assert(super.x === 2, "case[10-A]: the value of `super.x` is `2`");
            return super.method();
        }
    }

    console.assert(new C().y === 1, "case [10-B]: the value of `new C().y` is `1`");
}

{
    class B {
        method() {
            return 1;
        }

        get x() {
            return 2;
        }
    }

    class C extends B {
        public set y(v: number) {
            console.assert(v === 3, "case [11-A]: the value of `v` is `3`");
            console.assert(super.x === 2, "case [11-B]: the value of `super.x` is `2`");
            console.assert(super.method() === 1, "case [11-C]: `super.method()` returns `1`");
        }
    }

    console.assert((new C().y = 3) === 3, "case [11-E]: `new C().y = 3` is `3`");
}

{
    class B {
        static method() {
            return 1;
        }

        static get x() {
            return 2;
        }
    }

    class C extends B {
        static get x() {
            console.assert(super.x === 2, "case [12-A]: the value of `super.x` is `2`");
            return super.method();
        }
    }

    console.assert(C.x === 1, "case [12-B]: the value of `C.x` is `1`");
}

{
    class B {
        static method() {
            return 1;
        }

        static get x() {
            return 2;
        }
    }

    class C extends B {
        static set x(v: number) {
            console.assert(v === 3, "case [13-A]: the value of `v` is `3`");
            console.assert(super.x === 2, "case [13-B] The value of `super.x` is `2`");
            console.assert(super.method() === 1, "case [13-C] `super.method()` returns `1`");
        }
    }

    console.assert((C.x = 3) === 3, "case [13-D]: `C.x = 3` is `3`");
}

{
    let constructCounts = {
        base: 0,
        subclass: 0,
        subclass2: 0
    };

    class Base {
        constructor(...args: number[]) {
            constructCounts.base++;
            console.assert(args.length === 2, "case [14-A]: the value of `arguments.length` is `2`");
            console.assert(args[0] === 1, "case [14-B]: the value of `arguments[0]` is `1`");
            console.assert(args[1] === 2, "case [14-C]: the value of `arguments[1]` is `2`");
        }
    }

    new Base(1, 2);

    class Subclass extends Base {
        constructor(...args: number[]) {
            constructCounts.subclass++;
            console.assert(args.length === 2, "case [14-D]: the value of `arguments.length` is `2`");
            console.assert(args[0] === 3, "case [14-E]: the value of `arguments[0]` is `3`");
            console.assert(args[1] === 4, "case [14-F]: the value of `arguments[1]` is `4`");
            super(1, 2);
        }
    }

    new Subclass(3, 4);

    class Subclass2 extends Base {
        constructor(...args: number[]) {
            constructCounts.subclass2++;
            console.assert(args.length === 2, "case [14-G]: the value of `arguments.length` is `2`");
            console.assert(args[0] === 3, "case [14-H]: the value of `arguments[0]` is `3`");
            console.assert(args[1] === 4, "case [14-I]: the value of `arguments[1]` is `4`");
            super(1, 2);
        }
    }

    new Subclass2(3, 4);

    console.assert(constructCounts.base === 3, "case [14-J]: the value of `constructCounts.base` is `3`");
    console.assert(constructCounts.subclass === 1, "case [14-K]: the value of `constructCounts.subclass` is `1`");
    console.assert(constructCounts.subclass2 === 1, "case [14-L]: the value of `constructCounts.subclass2` is `1`");
}

{
    let baseCalled = 0;

    class Base {
        constructor(...args: number[]) {
            ++baseCalled
        }
    }

    let fCalled = 0;

    function f() {
        ++fCalled;
        return 3;
    }

    class Subclass extends Base {
        constructor() {
            super(23);
            console.assert(baseCalled === 1, "case [15-A]: the value of `baseCalled` is `1`");
            let obj = this;

            try {
                super(f());
            } catch {
            }

            console.assert(fCalled === 1, "case [15-B]: the value of `fCalled` is `1`");
            console.assert(baseCalled === 2, "case [15-C]: The value of `baseCalled` is `2`");
            console.assert(this === obj, "case [15-D]: `this` is `obj`");

            try {
                super(f());
            } catch {
            }

            console.assert(fCalled === 2, "case [15-E]: The value of `fCalled` is `2`");
            console.assert(baseCalled === 3, "case [15-F]: The value of `baseCalled` is `3`");
            console.assert(this === obj, "case [15-G]: `this` is `obj`");

            try {
                super(f());
            } catch {
            }

            console.assert(fCalled === 3, "case [15-H]: The value of `fCalled` is `3`");
            console.assert(baseCalled === 4, "case [15-I]: The value of `baseCalled` is `4`");
            console.assert(this === obj, "case [15-J]: `this` is `obj`");
        }
    }

    new Subclass();
}