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

{
  const i = 4444

  class Base {
    n = 9909;

    constructor() {
      const r1 = this.render1;
      console.assert(r1() === i, "Assign class method to variable in ctor (outer variable capturing)");

      const r2 = this.render2;
      console.assert(r2() === this.n, "Assign class method to variable in ctor (class variable capturing)");
    }

    render1(): number {
      return i;
    }

    render2(): number {
      return this.n;
    }
  }

  class Derived extends Base {
    m = 1000;

    render2(): number {
      return this.m;
    }
  }

  const base = new Base();
  const derived = new Derived();

  function f(v: Base) {
    const r1 = v.render1;
    const r2 = v.render2;

    return [r1(), r2()];
  }

  const baseResult = f(base);
  console.assert(baseResult[0] === i && baseResult[1] === base.n, "Assign BASE class method to variable in function with polymorpic arguments");

  const derivedResult = f(derived);
  console.assert(derivedResult[0] === i && derivedResult[1] === derived.m, "Assign DERIVED class method to variable in function with polymorpic arguments");
}

{
  class RxComponent {
    barfoo() {
      return this.render();
    }

    render(): string {
      return "base";
    }
  }

  class MyComponent extends RxComponent {
    render(): string {
      return "derived";
    }
  }

  {
    const obj = new RxComponent();
    console.assert(obj.render() === "base" && obj.barfoo() === "base", "Base class 'virtual' method call");
  }

  {
    const obj: RxComponent = new MyComponent();
    console.assert(obj.render() === "derived" && obj.barfoo() === "derived", "Derived class 'virtual' method call");
  }
}

{
  class Base<StateT> {
    _state: StateT

    constructor(initialState: StateT) {
      this._state = initialState;
    }
  }

  interface MyState {
    num: number;
    str: string;
  }

  class MyDerived extends Base<MyState> {
    constructor() {
      const initialState: MyState = {
        num: 555,
        str: "777"
      }
      super(initialState);
    }
  }

  console.assert(new MyDerived()._state.num === 555, "Derived from generic property access (1)");
  console.assert(new MyDerived()._state.str === "777", "Derived from generic property access (2)");

  interface MyAnotherState {
    str: string;
  }

  class MyAnotherDerived extends Base<MyAnotherState> {
    constructor() {
      const initialState: MyAnotherState = {
        str: "depressed"
      }
      super(initialState);
    }
  }

  console.assert(new MyAnotherDerived()._state.str === "depressed", "Derived from generic property access (3)");
}

{
  class Base {
    boo() {
      return 0;
    }
  }

  class Derived extends Base {
    boo() {
      return 1;
    }
  }

  class DerivedOfDerived extends Derived {
    boo() {
      return 2;
    }
  }

  {
    let w0: Base = new Base;
    console.assert(w0.boo() === 0, "Base 'virtual' method call");
  }
  {
    let w1: Base = new Derived;
    console.assert(w1.boo() === 1, "Derived casted to Base 'virtual' method call");
  }
  {
    let w2: Derived = new Derived;
    console.assert(w2.boo() === 1, "Derived 'virtual' method call");
  }
  {
    let w3: Base = new DerivedOfDerived;
    console.assert(w3.boo() === 2 && (w3 as Base).boo() === 2 && (w3 as Derived).boo() === 2 && (w3 as DerivedOfDerived).boo() === 2, "DerivedOfDerived casted to Base 'virtual' method call");
  }
  {
    let w4: Derived = new DerivedOfDerived;
    console.assert(w4.boo() === 2 && (w4 as Base).boo() === 2 && (w4 as Derived).boo() === 2 && (w4 as DerivedOfDerived).boo() === 2, "DerivedOfDerived casted to Derived 'virtual' method call");
  }
  {
    let w5: DerivedOfDerived = new DerivedOfDerived;
    console.assert(w5.boo() === 2 && (w5 as Base).boo() === 2 && (w5 as Derived).boo() === 2 && (w5 as DerivedOfDerived).boo() === 2, "DerivedOfDerived 'virtual' method call");
  }
}

{
  class MyWi<StateT> {
    setState() {
      return "Base";
    }
  }

  const mywi_string = new MyWi<string>();
  const mywi_number = new MyWi<number>();

  console.assert(mywi_string.setState() === "Base", "Generic class with unused type argument (1)");
  console.assert(mywi_number.setState() === "Base", "Generic class with unused type argument (2)");
}

{
  class MyWi<StateT extends { toString(): string }> {
    setState(wow: StateT) {
      return wow.toString();
    }
  }

  class Data {
    toString() {
      return "Data class data"
    }
  }

  class Up extends MyWi<Data> {
  }

  console.assert((new Up).setState(new Data) === "Data class data", "Extend constrained generic class");
}

{
  const question = "What have you done?";
  class ExtraWidget {
    lol() {
      return question;
    }
  }

  class RxWindow {
    getTheWidget() {
      const retVal = new ExtraWidget();
      console.assert(retVal.lol() === question, "Correct prototype when called inside method");
    }
  }

  const win = new RxWindow();
  win.getTheWidget();
}

{
  {
    const expected = "Base.myFunc";

    interface Basis {
      myFunc(): void;
    };

    class Base implements Basis {
      myFunc() {
        return expected;
      }
    };

    console.assert(new Base().myFunc() === expected, "Interface implementation without ctor declared");
  }

  {
    const expected = "Base with ctor.myFunc";

    interface Basis {
      myFunc(): void;
    };

    class Base implements Basis {
      constructor() {
      }

      myFunc() {
        return expected;
      }
    };

    console.assert(new Base().myFunc() === expected, "Interface implementation with empty ctor declared");
  }
}

{
  class Base<StateT> {
    _state: StateT

    constructor(initialState: StateT) {
      this._state = initialState;
    }
  }

  interface MyState {
    num: number;
    str: string;
  }

  class MyDerived extends Base<MyState> {
    constructor() {
      let initialState: MyState = {
        num: 555,
        str: "777"
      }
      super(initialState);
    }
  }

  const a = new MyDerived();

  console.assert(a._state.num === 555, "Derived from generic instance property access (1)");
  console.assert(a._state.str === "777", "Derived from generic instance property access (2)");

  interface MyAnotherState {
    str: string;
  }

  class MyAnotherDerived extends Base<MyAnotherState> {
    constructor() {
      const initialState: MyAnotherState = {
        str: "depressed"
      }
      super(initialState);
    }
  }

  const b = new MyAnotherDerived();

  console.assert(b._state.str === "depressed", "Derived from generic instance property access (3)");
}

{
  class Base2 {
    good: string = "777"
    nice?: string
  }

  const b = new Base2();
  console.assert(!b.nice, "Optional property default initializer");

  b.nice = "nice";
  console.assert((b.nice as string) === "nice", "Optional property assignment (1)");

  b.nice = undefined;
  console.assert(!b.nice, "Optional property assignment (2)");
}

{
  class Base {
    static value = "nope";

    protected woo?(): string;

    public fooliche(): string {
      return this.woo ? this.woo() : Base.value;
    }
  }

  class Derived1 extends Base {
    static value = "derived1";

    public woo(): string {
      return Derived1.value;
    }
  }

  class Derived2 extends Base {
    static value = "derived2 nope";

    public barletto(): string {
      return this.woo ? this.woo() : Derived2.value;
    }
  }

  const a: Derived1 = new Derived1();
  console.assert(a.woo() === Derived1.value && a.fooliche() === Derived1.value, "Optional method overload (1)");

  const b: Derived2 = new Derived2();
  console.assert(b.fooliche() === Base.value && b.barletto() === Derived2.value, "Optional method overload (2)");
}

{
  class RxComponent2<StateT> {
    private _state: StateT

    constructor(initialState: StateT) {
      this._state = initialState;
    }

    get state(): StateT {
      return this._state;
    }

    set state(state: StateT) {
      this._state = state;
    }
  }

  interface MyState {
    str0: string;
    num1: number;
  }

  const stateInitializer: MyState = {
    str0: "777",
    num1: 555,
  };

  class MyComponent extends RxComponent2<MyState> {
    constructor() {
      super(stateInitializer);
    }
  }

  const obj: RxComponent2<MyState> = new MyComponent();
  console.assert(obj.state.num1 === stateInitializer.num1 && obj.state.str0 === stateInitializer.str0, "Generic class' getter");

  const otherState: MyState = {
    str0: "774",
    num1: 324,
  };

  obj.state = otherState;
  console.assert(obj.state.num1 === otherState.num1 && obj.state.str0 === otherState.str0, "Generic class' setter");
}

{
  const value = "this_clicko";

  class RxIconButton {
    onClicked(handler: string): void {
      const tmp = handler;
      console.assert(tmp === value, "Correct prototype when method is called for immediately invoked constructor inside method declaration");
    }
  }


  class MyComponent {
    createButn(): void {
      (new RxIconButton()).onClicked(value);
    }
  }

  const obj = new MyComponent();
  obj.createButn()
}
