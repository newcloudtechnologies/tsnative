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
  function foo(a: number, b: number) {
    return a + b;
  }

  function bar(a: number, b: number) {
    return foo(b, a);
  }

  let res = bar(1, 2);

  console.assert(bar(1, 2) === 3, "function: bar(1, 2) failed");
}

{
  let isInvoked = false;

  function fnc() {
    isInvoked = true;
  }

  fnc();

  // @ts-ignore
  console.assert(isInvoked === true, "function: isInvoked failed");
}

{
  function takesFunctionDeclaration(fn: () => void) {
    fn();
  }
  function declaration() { }

  takesFunctionDeclaration(declaration);
}

{
  function dummyFunctionScope() {
    function scopedAndTakesFunctionDeclaration(fn: () => void) {
      fn();
    }
    function scopedDeclaration() { }

    scopedAndTakesFunctionDeclaration(scopedDeclaration);
  }

}

{
  class Getter {
    i = 43;

    get() {
      return this.i;
    }
  }

  class Storage {
    i = 1;
  }

  const getter = new Getter();
  const storage = new Storage();

  const getterI = getter.get.bind(getter);
  console.assert(getterI() === 43, "Function bind test failed (1)")

  const storageI = getter.get.bind(storage);
  console.assert(storageI() === 1, "Function bind test failed (2)")

  const f = (f: (n: number) => number, m: number) => f(m);
  const functionToBind = (n: number) => n;
  const bounded = f.bind(null, functionToBind);

  console.assert(bounded(9) === 9, "Function bind test failed (3)");
}

//Uncalled funargs. Test only buildability
{
  function foo(callback: (lol: string) => void) { }
  foo((lol: string): void => { });

  function onClicked(handler: (event: string) => void) { }
  onClicked((event: string): void => {
    console.log("hiphip", event);
  });

  interface Store<A> {
    dispatch: (action: A) => void,
  }

  type Reducer<S, A> = (state: S, action: A) => S;

  function createStore2<S, A>(reducer: Reducer<S, A>): Store<A> {
    return {
      dispatch: function (action: A): void { },
    }
  }

  type MyState_t = {
    str: string
  }

  type MyAction_t = {
    type: number
  }

  function MyReducer(state: MyState_t, action: MyAction_t): MyState_t {
    let unused = action;
    return state;
  }

  const FMStore = createStore2(MyReducer)
  FMStore.dispatch({ type: 123 })
}

{
  // Test only buildability
  function createStore<S, A>(reducer: (state: S, action: A) => S, initialState: S): S {
    // TODO AN-1117
    // If you write "state" here instead of a "newState" then you will get GC segfault.
    // See the task for more details
    let newState = initialState;
    let unused = reducer;
    return newState;
  }

  function FMReducer(state: string, action: number): string {
    return state;
  }

  const createFMStore = (state: string) => {
    createStore(FMReducer, state);
  }

  createFMStore("");
}

{
  const f = (i: number) => {
    if (i === 10) {
      return 0;
    } else {
      return 10;
    }
  }
  console.assert(f(1) === 10, "Function without explicit terminator must have implicit one");
}

{
  const i = 42;

  function create() {
    const list = {};

    return function () {
      console.assert(i === 42, "Outer variables are available inside nested function");
      return list;
    }
  }

  const first = create();
  const second = create();

  console.assert(first() !== second(), "Nested functions should not reuse same parent function locals");
}

{
  // initially this test included sonamed functions with DIFFERENT return types (bug TSN-246)
  class TextDoc {
    static tag = "TextDoc";

    asyncSave(): string {
      return TextDoc.tag;
    }
  }

  class TableDoc {
    static tag = "TableDoc";
    static expectedArgument = "109310911081";

    asyncSave(value: string): string {
      console.assert(value === TableDoc.expectedArgument, "It should be ok to pass arguments to methods handled in duck-typed manner");
      return TableDoc.tag;
    }
  }

  function testFunction(doc: TextDoc | TableDoc) {
    return doc.asyncSave(TableDoc.expectedArgument);
  }

  {
    const doc = new TextDoc();
    const value = testFunction(doc);
    console.assert(value === TextDoc.tag, "It should be ok to return values from methods handled in duck-typed manner (TextDoc)");
  }

  {
    const doc = new TableDoc();
    const value = testFunction(doc);
    console.assert(value === TableDoc.tag, "It should be ok to return values from methods handled in duck-typed manner (TableDoc)");
  }
}
