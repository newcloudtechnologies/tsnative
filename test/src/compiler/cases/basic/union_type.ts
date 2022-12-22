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

import createStore2 from "./union_type_imports"

{
    interface A {
        a: number
        b: string
    }

    interface B {
        c: number
        d: string
    }

    let union: A | B = { a: 12, b: "h" };

    console.assert(union.a === 12, "Union object initialization failed");
    console.assert(union.b === "h", "Union object initialization failed");

    union = { c: 909, d: "LAH" };

    console.assert(union.c === 909, "Union object re-initialization failed");
    console.assert(union.d === "LAH", "Union object re-initialization failed");

    {
        interface A {
            a: string
            b: number
        }

        interface B {
            c: string
            d: number
        }

        let union: A | number | B | string = { a: "5", b: 7 };
        console.assert((union as A).a === "5" && (union as A).b === 7, "Complex union initialization (1)");

        union = 12;
        console.assert(union === 12, "Complex union initialization (2)")

        union = { c: "hell", d: 22 };
        console.assert((union as B).c === "hell" && (union as B).d === 22, "Complex union initialization (3)");

        union = "LALALALA";
        console.assert(union === "LALALALA", "Complex union initialization (4)");

        union = { a: "h", b: 12 };
        console.assert((union as A).a === "h" && (union as A).b === 12, "Complex union reinitialization");
    }
}

{
    interface C {
        a: string
        b: string
        x: number
    }

    interface D {
        c: string
        x: number
        d: number
    }

    type CD = C | D

    let x: CD = { a: "1", b: "{ a: , b: null, x: 2 }", c: "2", x: 2 };
    console.assert(x.x === 2, "Union common property test failed");
    // NB: However all the properties of 'B' are available using cast operator (x as B),
    //     access to non-common props of A and B (that is, 'c' and 'd') will lead to crash.
    // @todo: Correct behavior is to return 'undefined': (x as B).d === undefined should be ok.
    x = { c: "2", x: 22, d: 44 };

    console.assert(x.x === 22, "Union common property after re-initialization test failed");
}

{
    interface E {
        type: string
        id: number
    }

    interface F {
        type: string
        index: number
    }

    type EF = E | F;
    const union: EF = { type: "A", id: 22, index: 44 };

    console.assert(union.type === "A", "Union common property test failed");
    console.assert((union as E).id === 22, "Union as E test failed");
    console.assert((union as F).index === 44, "Union as F test failed");
}

{
    let union: boolean | number = 12;
    console.assert(union === 12, "'boolean | number' union initialization with 'number' failed");
    union = false;
    console.assert(union === false, "'boolean | number' union re-initialization with 'false' failed");
    union = true;
    console.assert(union === true, "'boolean | number' union re-initialization with 'true' failed");
}

{
    let union: string | number = "h";
    console.assert(union === "h", "'string | number' union initialization with 'string' failed");
    union = 22;
    console.assert(union === 22, "'string | number' union re-initialization with 'number' failed");
}

{
    interface A {
        a: number
        b: string
    }

    {
        let _union: A | null = { a: 12, b: "h" };
        console.assert((_union as A).a === 12, "Cast and get from nullable union");
        _union = null;
        console.assert(!_union, "Assign null to nullable union");

    }

    {
        let _union: A | undefined = { a: 12, b: "h" };
        console.assert((_union as A).a === 12, "Cast and get from optional union");
        _union = undefined;
        console.assert(!_union, "Assign null to optional union");
    }
}

{
    function whosThere(foo: number | null) {
        console.assert((foo as number) === 574, "Union as primitive");
    }

    const stanger: number | null = 574;
    whosThere(stanger);
}

{
    class MyData {
        str: string = "John Doe";
    }

    function whosThere(foo: MyData | null) {
        if (foo) {
            console.assert(foo.str === "John Doe", "Narrowed to class union property access");
        } else {
            console.assert(true, "...");
        }
    }

    const stanger: MyData | null = new MyData;
    whosThere(stanger);
    whosThere(null);
}

{
    createStore2();
}

{
    let n: number | undefined = undefined;
    n = 5;

    console.assert(n as number === 5, "Optional union initialized with undefined");
}

{
    class MyData {
        num: number = 777
    }

    class MyObj {
        data: MyData | null = null;
    }

    const obj = new MyObj;
    console.assert(!obj.data, "Object property of 'T | null' type initialized by null")
}

{
    const a: string | undefined = 'test';
    const b: string | undefined = a;
    console.assert(b as string === "test", "Union-to-union assignment");
}

{
    type Window_args = {
        title: string | undefined,
    }

    class TextWindow_t {
        title: string;

        constructor(title: string | undefined) {
            if (title) {
                this.title = (title as string) + ' - MyOffice';
            } else {
                this.title = 'Untitled Document - MyOffice';
            }
        }

    }

    function TextWindow(args: Window_args): TextWindow_t {
        return new TextWindow_t(args.title);
    }


    const w = TextWindow({
        title: 'test',
    });

    console.assert(w.title === "test - MyOffice", "Constructor with optional union parameter must be handled correctly");
}

{
    function myFunc(arg?: string) {
        if (arg !== undefined) {
            console.assert(false, "Never");
        } else {
            console.assert(true, "Comparison with not provided optional argument");
        }
    }

    myFunc();
}

{
    function myFunc1(arg: string | undefined) {
        if (arg !== undefined) {
            console.assert(false, "Never");
        } else {
            console.assert(true, "Comparison T | undefined argument");
        }
    }

    myFunc1(undefined)
}

{
    let qqq: string | undefined;

    if (qqq !== undefined) {
        console.assert(false, "Never");
    } else {
        console.assert(true, "Comparison T | undefined");
    }
}

{
    type DataAction_ut = string | number;

    function foo(arg: DataAction_ut) {
        switch(arg) {
            case '213': {
                console.assert(arg === '213', "Switch on Union type 1");
                break;
            }
            case 5: {
                console.assert(arg === 5, "Switch on Union type 2");
                break;
            }
            default: {
                break;
            }
        }
    }

    let val: DataAction_ut = '213';
    foo(val);
    let val2: DataAction_ut = 5;
    foo(val2);
}

{
    type DataAction_ut = string | number | undefined;

    function foo(arg: DataAction_ut) {
        switch(arg) {
            case '213': {
                console.assert(arg === '213', "Switch on Union type 3");
                break;
            }
            case 5: {
                console.assert(arg === 5, "Switch on Union type 4");
                break;
            }
            case undefined: {
                console.assert(arg === undefined, "Switch on Union type 5");
                break;
            }
            default: {
                break;
            }
        }
    }

    let val: DataAction_ut = '213';
    foo(val);
    let val2: DataAction_ut = 5;
    foo(val2);
    let val3: DataAction_ut = undefined;
    foo(val3);
}

{
    type DataAction_ut = string | number | null;

    function foo(arg: DataAction_ut) {
        switch(arg) {
            case '213': {
                console.assert(arg === '213', "Switch on Union type 6");
                break;
            }
            case 5: {
                console.assert(arg === 5, "Switch on Union type 7");
                break;
            }
            case null: {
                console.assert(arg === null, "Switch on Union type 8");
                break;
            }
            default: {
                break;
            }
        }
    }

    let val: DataAction_ut = '213';
    foo(val);
    let val2: DataAction_ut = 5;
    foo(val2);
    let val3: DataAction_ut = null;
    foo(val3);
}

{
    enum DataActionTypes_e {
        Load,
        Stash, //! @unused
        Flush, //! @unused
        Save,
    }

    interface SaveDataAction_t {
        type: DataActionTypes_e.Save,
        urlToSave?: string,
    }

    interface LoadDataAction_t {
        type: DataActionTypes_e.Load,
        num: number,
    }

    type DataAction_ut = SaveDataAction_t | LoadDataAction_t;

    function foo(arg: DataAction_ut) {
        switch(arg.type) {
            case DataActionTypes_e.Save: {
                console.assert(arg.type === DataActionTypes_e.Save, "Switch on Enum type: 1");
                console.assert(arg.urlToSave === "11", "Switch on Enum type: 2");
                break;
            }
            case DataActionTypes_e.Load: {
                console.assert(arg.type === DataActionTypes_e.Load, "Switch on Enum type: 3");
                console.assert(arg.num === 11, "Switch on Enum type: 4");

                break;
            }
            default: {
                break;
            }
        }
    }

    let val: DataAction_ut = {
        type: DataActionTypes_e.Save,
        urlToSave: "11"
    }
    foo(val);
    let val2: DataAction_ut = {
        type: DataActionTypes_e.Load,
        num: 11
    }
    foo(val2);
}
