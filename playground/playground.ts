class MyClass<T> {
  field: T;

  constructor(t: T) {
    this.field = t;
  }

  foo() {
    let other = this.field;
  }
}

let obj1 = new MyClass<number>(10);
let obj2 = new MyClass({s: "12"});
obj2.foo()
