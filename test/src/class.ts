/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

{
  class B {
    cnt: number = 0;
    constructor(init: number) {
      this.cnt = init;
    }
    inc(): number {
      return ++this.cnt;
    }
  }

  let b = new B(3);

  console.assert(b.cnt === 3, "class: constructor(3) failed");
  console.assert(b.inc() === 4, "class: b.inc() failed");
}

{
  class A {
    static a: number = 0;
    constructor() { }
  }

  class B extends A {
    static b: number = 0;

    constructor() {
      super()
      B.a++;
    }

    getA(): number {
      return B.a;
    }

    setA(v: number) {
      B.a = v;
    }
  }

  const inst = new B();

  console.assert(inst.getA() === 1, "class: inst.getA() === 1 failed");

  inst.setA(2);

  console.assert(inst.getA() === 2, "class: inst.getA() === 2 failed");

  console.assert(A.a === 2, "class: ClassA.a === 2 failed");
  console.assert(B.a === 2, "class: ClassB.a === 2 failed");

  B.a = 3;
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
  class A {
    static a: number = 0;
    constructor() { }
  }

  class B extends A {
    static a: number = 0;

    constructor() {
      super();
      A.a++;
    }

    setStatic(v: number) {
      A.a = v;
    }
  }

  const inst = new B();
  inst.setStatic(1);

  console.assert(B.a === 0, "ClassBB.a === 0 failed");
  console.assert(A.a === 1, "ClassAA.a === 1 failed");
}

{
  class A {
    static a: number = 0;
    constructor() { }
  }

  class B extends A {
    static b: number = 0;

    constructor() {
      super();
      B.a++;
    }
  }

  /* @todo: super() call through inheritance chain
  class ClasssC extends ClasssB {
    static c: number = 0;

    constructor() {
      super();
      ClasssB.b++;
    }
  }

  new ClasssC();

  console.assert(ClasssB.b === 1, "class: ClasssB.b === 1 failed");
  */

  new B();

  console.assert(B.a === 1, "class: ClasssB.a === 1 failed");
  console.assert(A.a === 1, "class: ClasssA.a === 1 failed");
}

{
  class Counter {
    value: number = 0;
    constructor(init: number) {
      this.value = init;
    }

    increment(): number {
      return ++this.value;
    }
  }

  class Runner {
    begin: Counter;
    end: Counter;
    current: Counter;

    constructor(min: number, max: number) {
      this.begin = new Counter(min);
      this.end = new Counter(max);
      this.current = new Counter(min);
    }

    tick() {
      if (this.current.value < this.end.value && this.current.value >= this.begin.value) {
        this.current.increment();
      }
    }

    count(): number {
      return this.current.value;
    }
  }

  const runner = new Runner(0, 9);
  console.assert(runner.count() === 0, "class: init failed");

  runner.tick();
  console.assert(runner.count() === 1, "class: tick1 failed");

  for (let i: number = 0; i < 100; i++) {
    runner.tick();
  }

  console.assert(runner.count() === 9, "class: tick3 failed");
}

{
  class Node {
    private name: string;

    constructor() {
      this.name = "";
    }

    setName(name: string) {
      this.name = name;
    }

    getName(): string {
      return this.name;
    }
  }

  let node1 = new Node();
  node1.setName("Node1");

  let node2 = new Node();
  node2.setName("Node2");

  console.assert(node1.getName() === "Node1", "class: node1.getName() === 'Node1' failed");
  console.assert(node2.getName() === "Node2", "class: node2.getName() === 'Node2' failed");
}

{
  class Employee {
    private _fullName: string;
    public _setterIsInvoked: number;
    public _getterIsInvoked: number;

    constructor() {
      this._fullName = "initial";
      this._setterIsInvoked = 0;
      this._getterIsInvoked = 0;
    }

    get fullName(): string {
      this._getterIsInvoked++;
      return this._fullName;
    }

    set fullName(newName: string) {
      this._setterIsInvoked++;
      this._fullName = newName;
    }
  }

  let employee = new Employee();

  console.assert(employee.fullName === "initial", "class: employee.fullName === 'initial' failed");
  console.assert(employee._getterIsInvoked === 1, "class: employee._getterIsInvoked === 1 failed");

  employee.fullName = "Bob Smith";
  console.assert(employee._setterIsInvoked === 1, "class: employee._setterIsInvoked === 1 failed");

  console.assert(employee.fullName === "Bob Smith", "class: employee.fullName === 'Bob Smith' failed");
  console.assert(employee._getterIsInvoked === 2, "class: employee._getterIsInvoked === 1 failed");
}

{
  class A {
    public s: string = "sss";
    public r: string;
    public n: number = 3;

    constructor() {
      this.r = "rrr";
    }
  }

  let inst = new A();

  console.assert(inst.s === "sss", "class: inst.s === 'sss' failed");
  console.assert(inst.r === "rrr", "class: inst.r === 'rrr' failed");
  console.assert(inst.n === 3, "class: inst.n === 3 failed");
}

{
  class A {
    public n: number = 3;

    constructor() {
      this.n = 10;
    }
  }

  let inst = new A();

  console.assert(inst.n === 10, "class: inst.n === 10 failed");
}

{
  class Widget {
    static COUNT: number = 0;

    constructor() {
      Widget.COUNT++;
    }
    /*
      // @todo: #4278
        static make(): Widget {
          return new Widget();
        }
    */
    static get count(): number {
      return Widget.COUNT;
    }

    static reset() {
      Widget.COUNT = 0;
    }
  }

  console.assert(Widget.count === 0, "class: Widget.count === 0 failed");

  new Widget();

  console.assert(Widget.count === 1, "class: Widget.count === 1 failed");

  new Widget();

  console.assert(Widget.count === 2, "class: Widget.count === 2 failed");

  new Widget();

  console.assert(Widget.count === 3, "class: Widget.count === 3 failed");

  Widget.reset();

  console.assert(Widget.count === 0, "class: Widget.count === 0 failed");
}

{
  class Product {
    private value: string;

    constructor(value: string) {
      this.value = value;
    }

    get kind(): string {
      return this.value;
    }
  }

  class Factory {
    private static ARG: string = "";

    constructor() {
    }

    static get arg(): string {
      return Factory.ARG;
    }

    static set arg(arg: string) {
      Factory.ARG = arg;
    }

    static make(): Product {
      return new Product(Factory.ARG);
    }
  }

  Factory.arg = "Fruit";
  const inst1 = Factory.make();

  console.assert(Factory.arg === "Fruit", "class: Factory.arg === 'Fruit' failed");
  console.assert(inst1.kind === Factory.arg, "class: inst1.kind === Factory.arg failed");

  Factory.arg = "Drink";
  const inst2 = Factory.make();

  console.assert(Factory.arg === "Drink", "class: Factory.arg === 'Drink' failed");
  console.assert(inst2.kind === Factory.arg, "class: inst2.kind === Factory.arg failed");
}

{
  class WithoutConstructorDeclaration { };
  // classes without constructor declaration provided should be compilable due to empty constructor generation during preprocessing
  new WithoutConstructorDeclaration;

  class DerivedWithoutConstructorDeclaration extends WithoutConstructorDeclaration { };
  // 'super' call should also be generated
  new DerivedWithoutConstructorDeclaration;
}

{
  class C {
    i = 42;
  }

  class X extends C {
    n = 22;
  }

  const x = new X;
  console.assert(x.i === 42 && x.n === 22, "Inherited and own properties test failed");
}

{
  class RxWidget {
    __selfWidget: number = 555;
  }

  class RxComponent extends RxWidget {
    updateState() {
      return 22;
    }
  }

  class MyComponent extends RxComponent {
  }

  {
    const obj: RxComponent = new MyComponent();
    const value = obj.updateState();

    console.assert(value === 22, "Casted to base class method call");
  }

  {
    const obj: RxWidget = new MyComponent();
    const value = obj.__selfWidget;

    console.assert(value === 555, "Casted to base class property access");
  }
}

{
  class RxComponent2 {
    __vptr_render: (() => string);

    constructor() {
      this.__vptr_render = (): string => {
        new RxComponent2(); // Self-reference to ctor
        return "wow";
      };
    }
  }

  const obj = new RxComponent2();
  console.assert(obj.__vptr_render() === "wow", "Self references in constructors are allowed")
}

{
  class RxWidget {
    _selfWidget: string = "wow";
  }

  {
    class RxComponent extends RxWidget {
      protected __vptr_render: number = 555;

      render(): RxWidget {
        return new RxComponent();
      }
    }

    const w: RxWidget = new RxComponent().render();
    console.assert(w._selfWidget === "wow", "Immediate upcast in return statement");
  }

  {
    class RxComponent extends RxWidget {
      protected __vptr_render: number = 555;

      render(): RxWidget {
        const v: RxWidget = new RxComponent();
        return v;
      }
    }

    const w: RxWidget = new RxComponent().render();
    console.assert(w._selfWidget === "wow", "Upcast in variable initialization");
  }
}

{
  const BASE_RET = 1;
  const DERIVED_RET = 2;

  class Base {
    myFunc() {
      return BASE_RET;
    }
  };

  class Derived extends Base {
    myFunc() {
      return DERIVED_RET;
    }
  };

  let obj0: Base = new Base();
  console.assert(obj0.myFunc() === BASE_RET, "Base method result");
  let obj1: Base = new Derived();
  console.assert(obj1.myFunc() === DERIVED_RET, "Derived method result");

  function fn(obj: Base) {
    return obj.myFunc();
  }

  console.assert(fn(obj0) === BASE_RET, "Base as polymorphic argument");
  console.assert(fn(obj1) === DERIVED_RET, "Derived as polymorphic argument");
}
