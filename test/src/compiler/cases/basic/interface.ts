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
    const aInitializer = 5;
    const sInitializer = "via";
    const fooRet = "Foo";

    class Wow_t {
        constructor(a: number, s: string) {
            console.assert(a === aInitializer && s === sInitializer, "Wow_t constructor");
        }

        foo() {
            return fooRet;
        }
    }

    interface Wow_args {
        a: number,
        s: string
    }

    function Wow(args: Wow_args) {
        return new Wow_t(args.a, args.s);
    }

    const fooResult = Wow({
        a: aInitializer,
        s: sInitializer
    }).foo();

    console.assert(fooResult === fooRet, "Call on class instance initialized by interface-typed object");

    const wInitializer = 10;
    const hInitializer = 15;

    interface MySize {
        w: number,
        h: number,
    }

    interface MySidePanel_args {
        size: MySize,
    }

    function create(args: MySidePanel_args) {
        console.assert(args.size.w === wInitializer && args.size.h === hInitializer, "Complex object argument to interface-typed parameter");
    }

    create({
        size: {
            w: wInitializer,
            h: hInitializer
        }
    });
}

{
    interface MyState {
        num: number;
        str: string;
    }

    const numInitializer = 555;
    const strInitializer = "777";

    function setState(reducer: ((state: MyState) => MyState)) {
        return reducer({ num: numInitializer, str: strInitializer });
    }

    const v = setState((state: MyState): MyState => {
        let next: MyState = ({
            num: state.num,
            str: state.str
        });

        return next;
    });

    console.assert(v.num === numInitializer && v.str === strInitializer, "Interface return (1)");
}

{
    interface MyState {
        num: number;
        str: string;
    }

    const numInitializer = 564;
    const strInitializer = "2222";

    function setState(reducer: ((state: MyState) => MyState)) {
        return reducer({ num: numInitializer, str: strInitializer });
    }

    const v = setState((state: MyState): MyState => {
        return {
            num: state.num + 5,
            str: state.str + "a"
        }
    });

    console.assert(v.num === numInitializer + 5 && v.str === strInitializer + "a", "Interface return (2)");
}

{
    interface MyClassData {
        first: string
        second: number
    }

    const firstInitializer = "222";
    const secondInitializer = -1;

    const value: MyClassData = {
        second: secondInitializer,
        first: firstInitializer
    }

    console.assert(value.first === firstInitializer && value.second === secondInitializer, "Interface-typed variable out-of-order initialization");

    function doit(args: MyClassData): MyClassData {
        return args;
    }

    const res = doit({
        second: secondInitializer,
        first: firstInitializer
    });

    console.assert(res.first === firstInitializer && res.second === secondInitializer, "Interface-typed variable out-of-order initialization");
}

{
    interface VoidState { }

    interface MyState extends VoidState {
        num: number;
        str: string;
    }

    const state1: MyState = {
        num: 555,
        str: "777"
    };

    const state0: VoidState = state1;
    console.assert((state0 as MyState).num === 555, "Cast interface to base type in variable initialization");

    class Base {
        _state: VoidState;

        constructor(initialState: MyState) {
            this._state = initialState;
        }
    }

    const b: Base = new Base(state1);
    console.assert((b._state as MyState).num === 555 && (b._state as MyState).str === "777", "Cast interface to base type in class property initialization");
}

{
    interface RxSize_i {
        w?: number,
        h: number,
    };

    const size: RxSize_i = { h: 200 };
    console.assert(size.h === 200 && !size.w, "Optional interface property (1)");
}

{
    interface RxSize_i {
        w?: number,
        h?: number,
    };

    let size: RxSize_i = { w: 200 };

    size = {
        ...size,
        h: 500
    };

    console.assert(size.h === 500 && size.w === 200, "Optional interface property (2)");
}

{
    interface RxSize_i {
        w?: number,
    }

    const size: RxSize_i = {} as RxSize_i

    if (size.w) {
        console.assert(false, "Optional interface property: never");
    } else {
        console.assert(true, "Optional interface property: always");
    }
}

// Interface inheritance, TSN-62
{
    interface VoidState {
        num: number;
    }

    interface MyState extends VoidState {
        str: string;
    }

    let state1: MyState = {
        num: 555,
        str: "777"
    };
    console.assert(state1.num === 555, "Interface inheritance 1")
    console.assert(state1.str === "777", "Interface inheritance 2")
}

// FIXME: uncomment this test
// Interface inheritance with methods
// {
//     interface Mailable {
//         send(email: string): boolean
//     }
//     interface FutureMailable extends Mailable {
//         later(email: string, after: number): boolean
//     }
//     let b: FutureMailable = {
//         send(email: string): boolean {
//             return true;
//         },
//         later(email: string, after: number): boolean {
//             return true;
//         }
//     };
//     console.assert(b.send("") === true, "Interface inheritance with methods 1")
//     console.assert(b.later("", 5) === true, "Interface inheritance with methods 2")
// }

// Multiple interface inheritance
{
    interface A {
        a(): void
    }
    interface B {
        b(): void
    }
    interface C {
        c(): void
    }
    interface D extends B, C {
        d(): void
    }
}

// Interface extends class
{
    class Control {
        private state: boolean = false;
    }

    interface StatefulControl extends Control {
        enable(): void
    }

    class Button extends Control implements StatefulControl {
        enable() { }
    }
    class TextBox extends Control implements StatefulControl {
        enable() { }
    }
    class Label extends Control { }

}

{
    interface Person {
        name: string;
        age: number;
    }

    interface ReadonlyPerson {
        readonly name: string;
        readonly age: number;
    }

    let writablePerson: Person = {
        name: "Person McPersonface",
        age: 42,
    };

    let readonlyPerson: ReadonlyPerson = writablePerson;
    console.assert(readonlyPerson.age === 42, "Interface with readonly properties 1");
    writablePerson.age++;
    console.assert(readonlyPerson.age === 43, "Interface with readonly properties 2");
}

{
    interface Colorful {
        color: string;
    }

    interface Circle {
        radius: number;
    }

    interface ColorfulCircle extends Colorful, Circle {}

    const cc: ColorfulCircle = {
        color: "red",
        radius: 42,
    };
    console.assert(cc.color === "red", "Interface multiple inheritance 1");
    console.assert(cc.radius === 42, "Interface multiple inheritance 2");
}

{
    interface Colorful {
        color: string;
    }
    interface Circle {
        radius: number;
    }

    type ColorfulCircle = Colorful & Circle;

    let cc: Colorful & Circle = { color: "blue", radius: 42 };
    console.assert(cc.color === "blue", "Interface intersection 1");
    console.assert(cc.radius === 42, "Interface intersection 2");
}

{
    interface Box<Type> {
        contents: Type;
    }

    interface ColorBox<Type> extends Box<Type> {
        color:  string;
    }

    let cb: ColorBox<number> = {contents: 42, color: "red"};
    console.assert(cb.color === "red", "Interface generic and inheritance 1");
    console.assert(cb.contents === 42, "Interface generic and inheritance 2");
}

{
    interface Box {
        height: number;
        width: number;
    }
    interface Box {
        scale: number;
    }
    let box: Box = { height: 5, width: 6, scale: 10 };
    console.assert(box.height === 5, "Interface merging 1");
    console.assert(box.width === 6, "Interface merging 2");
    console.assert(box.scale === 10, "Interface merging 3");
}
