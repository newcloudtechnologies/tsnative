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

class MyError {
  readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}

{
  const b = (i: number): number => {
    try {
      throw new MyError("Runtime error");
    } catch {
      i = 23;
    }
    return i;
  };
  console.assert(b(1) === 23, "b Miss match");
}

{
  const c = (i: number): number => {
    try {
      throw new MyError("Runtime error");
    } catch {
      const noUse: number = 1;
    }
    return i;
  };
  console.assert(c(1) === 1, "c Miss match");
}

{
  const d = (i: number): number => {
    try {
      if (i === 3) throw new MyError("Runtime error");
      i = 15;
    } catch {
      i = 30;
    }
    return i;
  };
  console.assert(d(3) === 30 && d(1) === 15, "d Miss match");
}

{
  function e(i: number): number {
    const count = 5;
    let j = 0;
    try {
      for (j = 0; j < count; ++j) {
        if (i === 2) throw new MyError("Runtime error");
      }
    } catch {
      return i * 2 + 3;
    }
    return j;
  }
  console.assert(e(2) === 7 && e(5) === 5, "e Miss match");
}

{
  const f = (i: number): number => {
    try {
      try {
        throw new MyError("Runtime error");
      } catch {
        i = 33;
        throw 26;
      }
    } catch {
      const noUse: number = 1;
    }
    return i;
  };
  console.assert(f(2) === 33, "f Miss match");
}
{
  const g = (i: number): number => {
    try {
      try {
        throw new MyError("Runtime error");
      } catch {
        i = 33;
        throw new MyError("Runtime error");
      }
    } catch {
      i += 33;
    }
    return i;
  };
  console.assert(g(2) === 66, "g Miss match");
}

{
  const h = (i: number): number => {
    try {
      if (i === 1) {
        throw 23;
      }
      if (i === 2) {
        throw 24;
      }
    } catch (e) {
      return e;
    }
    return i;
  };
  console.assert(h(1) === 23 && h(2) === 24 && h(3) === 3, "h Miss match");
}

{
  const error = "this error";
  const noError = "no error";

  const i = (p: number): MyError => {
    try {
      if (p === 1) {
        throw new MyError(error);
      }
    } catch (e) {
      return e;
    }
    return new MyError(noError);
  };
  console.assert(i(1).message === error && i(2).message === noError, "i Miss match");
}

{
  const f = (i: number): number => {
    return i;
  };
  const j = (i: number): number => {
    try {
      if (i === 1) {
        throw 23;
      }
    } catch (e) {
      i = f(e);
    }
    return i;
  };
  console.assert(j(1) === 23 && j(2) === 2, "j Miss match");
}

{
  const k = (i: number): number => {
    try {
      if (i === 1) {
        throw 23;
      }
    } catch (e) {
      i = e;
    }
    return i;
  };
  console.assert(k(1) === 23 && k(2) === 2, "k mismatch");
}

{
  const makeThrow = (i: number, error: string): number => {
    function g(j: number): number {
      if (j === 1) throw new MyError(error);
      return j;
    }
    return g(i);
  };

  let error: string = "";
  const errorMsg = "12345";

  const l = (i: number): number => {
    try {
      return makeThrow(i, errorMsg);
    } catch (e) {
      const err = e as MyError;
      error = err.message;
      return err.message.length;
    }
  };
  console.assert(l(1) === 5 && error === errorMsg, "l mismatch");
}

{
  class Foo {
    static error: string = "throws from method";
    maybeThrows(str: string): string | never {
      if (str.length === 0) throw 23;
      return str;
    }

    wrapThrow(str: string): string {
      return this.maybeThrows(str);
    }

    echo(str: string): string {
      let result: string = "";
      try {
        result = this.wrapThrow(str);
      } catch {
        result = Foo.error;
      }
      return result;
    }
  }
  const foo = new Foo();
  console.assert(foo.echo("") === Foo.error);
}

{
  const error: number = -1;
  const divisionByZero: string = "Division by zero";
  let msg: string = "";
  class Bar {
    private getDivideImpl(num: number, den: number): number {
      if (den === 0) throw new MyError(divisionByZero);
      return num / den;
    }

    getNumber(i: number): number {
      return i;
    }

    getDivide(num: number, den: number): number {
      try {
        return this.getNumber(this.getDivideImpl(num, den));
      } catch (e) {
        const myError = e as MyError;
        msg = myError.message;
        return error;
      }
    }
  }
  const bar = new Bar();
  console.assert(bar.getDivide(4, 0) === error && msg === divisionByZero, "Division by zero mismatch");
}

{
  class Bar {
    positiveNumber: number;
    constructor(value: number) {
      if (value < 0) throw new MyError("Negative value!");
      this.positiveNumber = value;
    }
  }

  const foo = (value: number): number => {
    let result: number = 0;
    try {
      const bar = new Bar(value);
      result = bar.positiveNumber;
    } catch {
      return value;
    }
    return result;
  };
  console.assert(foo(-1) === -1, "Negative value mismatch");
}

{
  const f = (i: number): number => {
    if (i === 1) throw 23;
    return i;
  };
  const m = (i: number): number => {
    try {
      return f(i);
    } catch (e) {
      return e;
    }
  };
  console.assert(m(1) === 23 && m(2) === 2, "k mismatch");
}

{
  const f = (i: number): number => {
    if (i === 1) throw 23;
    return i;
  };
  const n = (i: number): number => {
    try {
      const g = (p: number): number => p;
      return g(f(i));
    } catch (e) {
      return e;
    }
  };
  console.assert(n(1) === 23 && n(2) === 2, "k mismatch");
}

{
  const f = (i: number): number | never => {
    if (i === 1) throw 23;
    return i;
  };
  const o = (i: number): number => {
    try {
      return ((): number => f(i))();
    } catch (e) {
      return e;
    }
  };
  console.assert(o(1) === 23 && o(2) === 2, "k mismatch");
}

{
  class Bar {
    private positiveValue: number = -1;

    constructor(value: number) {
      this.positiveValue = value;
    }

    get value(): number {
      if (this.positiveValue === -1) throw new MyError("Value is not initialized");
      return this.positiveValue;
    }

    set value(newValue: number) {
      if (newValue <= 0) throw new MyError("Passed not positive value");
      this.positiveValue = newValue;
    }
  }
  const error: number = 1024;
  const catchGetter = (i: number): number => {
    try {
      return new Bar(i).value;
    } catch {
      return error;
    }
  };

  const catchSetter = (i: number): number => {
    const bar = new Bar(23);
    try {
      ((): void => {
        bar.value = i;
      })();
    } catch {
      return error;
    }
    return bar.value;
  };
  console.assert(catchGetter(-1) === error && catchGetter(1) === 1, "Getter mismatch");
  console.assert(catchSetter(-1) === error && catchSetter(1) === 1, "Setter mismatch");
}

{
  class Base {
    data: number;

    constructor(i: number) {
      if (i <= 0) throw 23;
      this.data = i;
    }

    get value(): number {
      return this.data;
    }
  }

  class Derived extends Base {
    constructor(i: number) {
      super(i);
    }
  }

  const error = 1024;
  const catchFromSuper = (i: number): number => {
    let result = i;
    try {
      result = new Derived(i).value;
    } catch {
      return error;
    }
    return result;
  };
  console.assert(catchFromSuper(0) === error && catchFromSuper(1) === 1, "Catch from base exception mismatch");
}

{
  const error: string = "error";

  class Bar {
    data: string;

    constructor(str: string) {
      this.data = str;
    }

    get value(): string {
      if (this.data.length === 0) throw new MyError(error);
      return this.data;
    }

    doSome(): string {
      try {
        try {
          return this.value;
        } catch (e1) {
          const f = (): string => {
            throw e1;
          };
          f();
        }
      } catch (e2) {
        const err = e2 as MyError;
        return err.message;
      }
      return "none";
    }
  }
  const bar = new Bar("");
  console.assert(bar.doSome() === error, "Nested concrete exception value mismatch");
}

{
  function foo() {
    try {
        let a = 15;
        throw a;
    }
    catch (e) {
      console.assert(e === 15, "Exceptions: thrown value equality check failed");
    }
  }

  foo();
}

{

  function baz() {
    let a = 10;
    if (a === 10) {
      let b = 100;
      throw a;
    }

    let c = "abacaba";
    throw a;
  }

  function bar() {
    try {
      let b = 15;
      baz();

      let c = 50;
    }
    catch (e) {
      console.assert(e === 10, "Exceptions: thrown value equality check failed");
    }
  }

  bar();
}

{
  function fuzz() {
    try {
      try {
          let a = 15;
          throw "abacaba";
      }
      catch (e) {
        let variable = 100;
        console.assert(e === "abacaba", "Exceptions: thrown value equality check failed");
        throw e;
      }
    }
    catch(ee) {
      console.assert(ee === "abacaba", "Exceptions: thrown value equality check failed");
    }
  }

  fuzz();
}