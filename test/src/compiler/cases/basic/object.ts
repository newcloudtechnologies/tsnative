/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

{
    const a = { v: 12 };
    const b = { v: 12 };

    console.assert(a !== b, "Object not equals comparison failed");
    console.assert(a === a, "Object equals comparison failed");
    console.assert(b === b, "Object equals comparison failed");
}

{
    const a = { v: 12, k: "42" };
    const b = { o: 1, k: "0" };
    const c = { ...a, ...b };

    console.assert(c.v === 12, "Object spread initialization failed (1)");
    console.assert(c.k === "0", "Object spread initialization failed (2)");
    console.assert(c.o === 1, "Object spread initialization failed (3)");
}

{
    const a = { v: 12, k: "42" };
    const c = { ...a, k: "00" };

    console.assert(c.v === 12, "Object spread initialization failed (4)");
    console.assert(c.k === "00", "Object spread initialization failed (5)");
}

{
    interface A {
        v: number,
        k: string
    }

    interface B {
        b: boolean
    }

    type AnB = A & B;

    const a: AnB = { v: 12, k: "42", b: false };
    const c = { ...a };

    console.assert(c.v === 12, "Object spread initialization failed (1)");
    console.assert(c.k === "42", "Object spread initialization failed (2)");
    console.assert(c.b === false, "Object spread initialization failed (3)");
}

{
    interface A {
        v: number,
        k: string
    }

    interface B {
        b: boolean
    }

    type AnB = A & B;

    const a: AnB = { v: 12, k: "42", b: false };
    const b: B = { b: true }
    const c = { ...a, ...b };

    console.assert(c.v === 12, "Object spread initialization failed (1)");
    console.assert(c.k === "42", "Object spread initialization failed (2)");
    console.assert(c.b === true, "Object spread initialization failed (3)");
}

{
    const getObject = function (name: string, length: number, height: number, width: number) {
        const obj = {
            name: name,
            length: length,
            height: height,
            width: width
        };

        return obj;
    }

    const obj1 = getObject("Box", 10, 16, 14);

    console.assert(obj1.name === "Box", "object: obj1.name failed");
    console.assert(obj1.length === 10, "object: obj1.length failed");
    console.assert(obj1.height === 16, "object: obj1.height failed");
    console.assert(obj1.width === 14, "object: obj1.width failed");

    const obj2 = getObject("Cylinder", 20, 6, 6);

    console.assert(obj2.name === "Cylinder", "object: obj2.name failed");
    console.assert(obj2.length === 20, "object: obj2.length failed");
    console.assert(obj2.height === 6, "object: obj2.height failed");
    console.assert(obj2.width === 6, "object: obj2.width failed");
}

{
    type AuthState_t = {
        answer: string,
    }

    function f(state: AuthState_t, arg: string): AuthState_t {
        return { ...state, answer: arg }
    }

    const state = { answer: 'aaa' }

    const state2 = f(state, 'bbb')
    console.assert(state2.answer === "bbb", "Spread from type-alias-typed parameter");
}

{
    interface MyState {
        num: number;
        name: string;
    }

    function updateState(state: MyState): MyState {
        return {
            ...state,
            num: 444,
        }
    }

    const initialState = { num: 2, name: "updated" };
    const state = updateState(initialState);

    console.assert(state.name === "updated" && state.num === 444, "Return spreaded object from function");
}

{
    enum State {
        Small = (1 << 0),
        Normal = (1 << 1),
        Large = (1 << 2),
    }

    type MyType = {
        n1: State
    }

    type MyType1 = {
        n: State,
        a: MyType
    }

    {
        const qqq = {
            n: State.Large,
            a: {
                n1: State.Large
            }
        } as MyType1

        console.assert(qqq.n === State.Large && qqq.a.n1 === State.Large, "Enum value assigned to object property properly");
        qqq.a.n1 = State.Normal;
        console.assert(qqq.n === State.Large && qqq.a.n1 === State.Normal, "Enum value reassigned to object property properly");
    }

    {
        const propValue1 = 22;
        const propValue2 = 33;

        const qqq = {
            n: propValue1,
            a: {
                n1: propValue1
            }
        } as MyType1

        console.assert(qqq.n === propValue1 && qqq.a.n1 === propValue1, "Number assigned to object property properly");
        qqq.a.n1 = propValue2;
        console.assert(qqq.n === propValue1 && qqq.a.n1 === propValue2, "Number value reassigned to object property properly");
    }
}
