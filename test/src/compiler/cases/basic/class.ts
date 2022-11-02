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

/*
@todo: doesn't work on ts-node
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
*/

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

  /*
  @todo: doesn't work on ts-node
    new B();
  
    console.assert(B.a === 1, "class: ClasssB.a === 1 failed");
    console.assert(A.a === 1, "class: ClasssA.a === 1 failed");
  */
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
  new WithoutConstructorDeclaration;

  class DerivedWithoutConstructorDeclaration extends WithoutConstructorDeclaration { };
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
  const nInitializer = 9909;

  class Base {
    n = nInitializer;

    constructor() {
      const r1 = this.render1.bind(this);
      console.assert(r1() === i, "Assign class method to variable in ctor (outer variable capturing)");

      /*

      mkrv: @todo
       TS is not support polymorphic 'this' in 'super()' context, but we do. Have to fix this behaviour

      const r2 = this.render2.bind(this);
      console.assert(r2() === this.n, "Assign class method to variable in ctor (class variable capturing)");
      */
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

    constructor() {
      super();

      const r1 = this.render1.bind(this);
      console.assert(r1() === i, "Assign class method to variable in ctor (outer variable capturing)");

      const r2 = this.render2.bind(this);
      console.assert(r2() === this.m, "Assign class method to variable in ctor (class variable capturing)");

      console.assert(this.n === nInitializer, "'Super' property from derived class ctor");
    }

    render2(): number {
      return this.m;
    }
  }

  const base = new Base();
  const derived = new Derived();

  function f(v: Base) {
    const r1 = v.render1.bind(v);
    const r2 = v.render2.bind(v);

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
  obj.createButn();
}

{
  class A {
    f() {
      return "A";
    }
  }

  class B extends A {
    f() {
      return "B";
    }
  }

  class C {
    constructor(v: A, expected: string) {
      console.assert(v.f() === expected, "Polymorphic ctor");
    }
  }

  new C(new A, "A");
  new C(new B, "B");
}

{
  const baseValue = "BASE";
  class Base {
    setState() {
      return this.update();
    }

    protected render() { return baseValue; }

    private update() {
      return this.render();
    }
  }

  const value = "12";
  function f() { return value; }

  class Derived extends Base {
    render() {
      return f();
    }
  }

  {
    const v = new Base;
    console.assert(v.setState() === baseValue, "Base call");
  }

  {
    const v = new Derived;
    console.assert(v.setState() === value, "Derived call");
  }

  {
    const v: Base = new Derived;
    console.assert(v.setState() === value, "Casted to base derived call");
  }
}

{
  class MyClass<TemplateType> {
    _items: TemplateType[];

    constructor(items: TemplateType[]) {
      this._items = items;
    }
  }

  {
    class FMButtonTable_t extends MyClass<number> {
      constructor(items: number[]) {
        super(items);
      }
    }

    const initializer: number[] = [1, 3, 3, 5]
    const table = new FMButtonTable_t(initializer)

    console.assert(table._items === initializer, "Generic-typed array property (1)");
  }

  {
    class FMButtonTable_s extends MyClass<string> {
      constructor(items: string[]) {
        super(items);
      }
    }

    const initializer = ["hell", "o"];
    const table = new FMButtonTable_s(initializer);

    console.assert(table._items === initializer, "Generic-typed array property (2)");
  }

  {
    class FMButtonTable_g extends MyClass<number> {
      constructor(items: number[]) {
        super(items);
      }
    }

    const initializer = [1, 1, 1];
    const table = new FMButtonTable_g(initializer);

    console.assert(table._items === initializer, "Generic-typed array property (3)");
  }
}

{
  class Base {
    lol: string;

    getVal(): string {
      return "base"
    }

    constructor() {
      this.lol = this.getVal();
    }
  }

  class Derived extends Base {
    constructor() {
      super();
    }

    getVal(): string {
      return "derived"
    }
  }

  console.assert(new Base().lol === "base", "Base 'virtual' method call from ctor");
  console.assert(new Derived().lol === "derived", "Derived 'virtual' method call from ctor");
}

{
  class BaseAnimal {
    moveLength() {
      return 5;
    }
  }

  class JumpyAnimal extends BaseAnimal {
    moveLength() {
      return super.moveLength() * 100;
    }
  }

  const moose = new JumpyAnimal()
  console.assert(moose.moveLength() === 500, "Base method call in 'virtual' methods case");
}

{
  class DeclarativeOverlay {
    private constructor() { }

    static with() {
      return new DeclarativeOverlay;
    }

    show() { return this; }
  }

  class Dialog {
    name: string;

    constructor() {
      this.name = this.getName();
    }

    getName() {
      return "Base";
    }
  }

  class FileDialog extends Dialog {
    overlay: DeclarativeOverlay;

    constructor() {
      super();

      this.overlay = DeclarativeOverlay
        .with()
        .show();

      this.overlay.show().show().show();
      this.name = this.getName();
    }

    getName() {
      return "Derived";
    }
  }

  console.assert(new FileDialog().name === "Derived", "Polymorphic 'this' method");
}

{
  const outerVariable = "A";

  class MyComponent {
    fofo(handler: () => string) {
      const tmp = handler;
      return tmp;
    }

    inFofoArg() { return outerVariable; }

    render() {
      return this.fofo(this.inFofoArg.bind(this));
    }
  }

  console.assert(new MyComponent().render()() === outerVariable, "Bound method as argument");
}

{
  class MyBase {
    str1: string = "one";

    lol(): MyBase {
      return this;
    }
  }

  class MyDerived extends MyBase {
    str2: string = "two";
  }

  const obj = new MyDerived().lol();
  console.assert(obj.str1 === "one", "'this' cast in return");
  console.assert((obj as MyDerived).str2 === "two", "Cast it back");
}

{
  // only test buildability
  interface MyState {
    str: string;
  }

  class RxComponent_t {
    constructor(initialState: MyState) {
      let unused = initialState;
    }
  }

  class MyStatum_t extends RxComponent_t {
    constructor() {
      super({
        str: "_str"
      });
    }
  }

  let id_statum = new MyStatum_t();
}

{
  // only test buildability
  const tmp_createActionButton = (action: (() => void)): void => {
    action();
  }

  class MyComponent {
    n = 3
    my_updateState(): void { console.log(this.n) }

    render2(): void {
      let this_my_updateState = this.my_updateState.bind(this);
      tmp_createActionButton(this_my_updateState);
    }
  }

  let obj = new MyComponent();
  obj.render2();
}

{
  class RxComponent2<StateT> {
    _state: StateT

    constructor(initialState: StateT) {
      this._state = initialState;
    }

    setState(reducer: ((state: StateT) => StateT)): void {
      reducer(this._state);
    }
  }

  interface MyState {
    num: number;
  }

  class MyComponent extends RxComponent2<MyState> {
    constructor() {
      let initialState: MyState = {
        num: 555,
      }
      super(initialState);
    }
  }

  let obj = new MyComponent();
  obj.setState((state: MyState): MyState => {
    state.num = 639;
    return state;
  });

  console.assert(obj._state.num === 639, "Funarg that use generic type");
}

{
  class RxComponent_t {
    constructor() {
      this.render();
    }

    protected render(): void { }
  }

  class RxWidget_t {
    constructor(s: string) {
      this._selfWidget = s;
    }

    _selfWidget: string;
  }

  const s = "2";

  function createText(): RxWidget_t {
    return new RxWidget_t(s);
  }

  class MyStatum_t extends RxComponent_t {
    protected /*override*/ render(): void {
      const widget = createText();
      console.assert(widget._selfWidget === s, "Outer function correcly captured in environment");
    }
  }

  new MyStatum_t();

  function createStatum() {
    return new MyStatum_t;
  }

  createStatum();

  function other() {
    return createStatum();
  }
  other();

  function another() {
    return () => createStatum();
  }
  another()();
}

{
  class Widget { }

  class RxWidget_t {
    protected _selfWidget: Widget;

    constructor() {
      this._selfWidget = new Widget();
    }
  }

  class RxText_t extends RxWidget_t { }

  function RxText(): RxText_t {
    return new RxText_t();
  }

  class RxComponent_t extends RxWidget_t {
    constructor() {
      super();
      this.render();
    }

    protected render(): RxWidget_t {
      return new RxWidget_t();
    }
  }

  class MyStatum_t extends RxComponent_t {
    protected render(): RxWidget_t {
      return RxText();
    }

  }

  new MyStatum_t();
}

{
  class C {
    fn: (() => void) | undefined;
  }

  const c = new C();
  c.fn = () => { }
  c.fn()
}

{
  class AbsData {
    verde() {
      console.log("Going green")
    }
  }

  class ExtData extends AbsData {
    letter: string = "A";
  }

  class BaseColorist {
    data: AbsData

    constructor(initial: AbsData) {
      this.data = initial;
    }
  }

  class Controller extends BaseColorist {
    constructor() {
      super(new ExtData());
    }
  }

  const d = new Controller();
  console.assert((d.data as ExtData).letter === "A", "Class property initialization by derived type");
}

{
  class Base {
    n = 0

    // mkrv @todo
    // tried to use tuple as return, got segfault
    foo() {
      return { s: "BASE", n: this.n };
    }
  }

  class AnotherBase extends Base {
    n = 1

    constructor() {
      super();

      // mkrv @todo
      // super.n have to be 'undefined'

      const fooResult = super.foo();
      console.assert(fooResult.s === "BASE" && fooResult.n === 1, "AnotherBase 'super' function call");
    }

    foo() {
      return { s: "ANOTHER BASE", n: this.n };
    }
  }

  class Derived extends AnotherBase {
    n = 2

    constructor() {
      super();
      const v = super.foo();
      console.assert(v.s === "ANOTHER BASE" && v.n === 2, "Derived 'super' call");

      new AnotherBase
    }

    foo() {
      return { s: "DERIVED", n: this.n };
    }
  }

  const d = new Derived();
  const v = d.foo();
  console.assert(v.s === "DERIVED" && v.n === 2, "Most derived class function call");
}

{
  class BB { }

  class Base<T> extends BB {
    n = 0;

    constructor() {
      super();

      console.assert(this.n === 0, "Property: 'this' is pointed to current base class in 'super' context");
      console.assert(this.render() === 2, "Method: 'this' is pointed to derived class in 'super' context");
    }

    render() {
      return 1;
    }
  }

  class Derived extends Base<string> {
    n = 1;

    render() {
      return 2;
    }
  }

  new Derived();
}

{
  class Root {
    render() {
      return this;
    }
  }

  class Base extends Root { }

  class Derived extends Base { }

  const d = new Derived();
  console.assert(d === d.render(), "Return of 'this' through heirachy chain must be most derived 'this'")
}

{
  class RxWidget {
    addChild(child: RxWidget): void {
      child._setParent(this);
    }

    private _setParent(parent: RxWidget): void {
      console.assert(true, "'this' as method argument");
    }
  }

  const root: RxWidget = new RxWidget();

  const subRoot: RxWidget = new RxWidget();
  root.addChild(subRoot);
}

{
  class Base {
    value: string;

    createValue(): string {
      return "base";
    }

    constructor() {
      const getValFn = this.createValue.bind(this);
      this.value = getValFn();
    }
  }

  class Derived extends Base {
    createValue(): string {
      return "derived";
    }
  }

  console.assert(new Derived().value === "derived", "Bind derived class method in base ctor");
}

{
  class Maybe<Type1000> {
    _isInitialized: boolean = false;
    private _value: Type1000[] = [];

    get value(): Type1000 {
      return this._value[0];
    }

    set value(val: Type1000) {
      this._value.push(val);
      this._isInitialized = true;
    }
  }

  class Wow {
    str: string = "20";
  }

  let w = new Maybe<Wow>();
  w.value = new Wow();

  console.assert(w._isInitialized && w.value.str === "20", "Empty array as property default initializer");
}

{
  class RxIconButton_t {
    static y: number = 10;

    constructor() {
      RxIconButton_t.y += 100
    }
  }

  function foo() {
    return new RxIconButton_t();
  }

  foo();
  foo();

  console.assert(RxIconButton_t.y === 210, "Static class property is captured in environment");
}

{
  class C {
    obj = {
      fieldName: "default"
    };

    constructor() {
      const fieldName = "non-default"; // variable name potentially clashes with this.obj.fieldName
      this.render();
    }

    render() {
      console.assert(this.obj.fieldName === "default", "Variable names should not clash with object property name");
    }
  }

  new C;
}

{
  class MyClass {
    private tag = "MyClass"

    constructor() {
      const o = this.foo();
      console.assert(o.bar() === this.tag, "Calling method that returns 'this' inside constructor");
    }

    foo() {
      return this;
    }

    bar() {
      return this.tag;
    }
  }

  new MyClass();
}
