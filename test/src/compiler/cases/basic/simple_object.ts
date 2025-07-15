function assertObjectKeysAreEqual(keys : string[], expectedKeys : string[], msg : string) {
    console.assert(keys.length === expectedKeys.length, msg);
    let currentIndex = 0;
    while (currentIndex < keys.length) {
        console.assert(keys[currentIndex] === expectedKeys[currentIndex], msg);
        ++currentIndex;
    }
}

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
    const obj = { d: 1, b: 2, c: 3 };
    const expectedKeys = ["d", "b", "c"];
    assertObjectKeysAreEqual(Object.keys(obj), expectedKeys,
            "Object.keys() array ordering test failed");
}

{
    class Base {
        x: number = 0;
        y: string = "";
    };

    class Derived extends Base {
        x: number = 10; // Shadowing
        z: number = 100;
    };

    const d = new Derived();

    const expectedKeys = ["x", "y", "z"];
    assertObjectKeysAreEqual(Object.keys(d), expectedKeys,
            "Object.keys() array shadowing test failed");
}

{
    class Base {
        a: string = "";
        n: number = 15;
    }

    class Inheritor extends Base {
        n: number = 10
        a: string = "abcaba"
    }

    const i = new Inheritor;
    const expectedKeys = ["a", "n"];

    assertObjectKeysAreEqual(Object.keys(i), expectedKeys, "Object.keys() array shadowing test failed");
}

// TODO This test to be uncommented after TSN-218
// {
//     class C {
//         _length = 0;
//         get length() {
//           return this._length;
//         }
//         set length(value) {
//           this._length = value;
//         }
//     }
//     const c = new C();
//     const expectedKeys = ["_length"];

//     console.log("Testing ser and get property, keys are: ")
//     console.log(Object.keys(c))
//     assertObjectKeysAreEqual(Object.keys(c), expectedKeys, "Object.keys() array get set properties test failed");
// }

// TODO uncomment this on TSN-219 fix
// {
//     class A {
//         foo() : number
//         {
//             return 10;
//         }
//     }
//     const expectedKeys: string[] = [];

//     console.log(Object.keys(new A));

//     assertObjectKeysAreEqual(Object.keys(new A), expectedKeys,
//             "Object.keys() array class without properties test failed");
// }
//
// {
//     class A {
//         a = 1;
//         b = 1;
//         foo() : number
//         {
//             return 10;
//         }
//     }

//     class B extends A {
//         b = 10; // Shadowing
//         a = 5
//         bar(): number {
//             return 0;
//         }
//     }
//     const expectedKeys = ["a", "b"];

//     assertObjectKeysAreEqual(Object.keys(new A), expectedKeys,
//             "Object.keys() array class without properties test failed");
// }
//
// {
//     class D {
//         x: number = 10;
//         z: number = 100;
//         say (a : number) : number {
//             return this.x * a;
//         }
//     };

//     const d = new D();
//     const expectedKeys = ["x", "z"];

//     console.log("DBG:", Object.keys(d));

//     assertObjectKeysAreEqual(Object.keys(d), expectedKeys, "Object.keys() array class with function test failed");
// }

{
    let a = { "foo": function(){}}
    const expectedKeys = ["foo"];

    assertObjectKeysAreEqual(Object.keys(a), expectedKeys, "Object.keys() array object with function test failed");
}

{
    let a = {}
    const expectedKeys: string[] = [];
    assertObjectKeysAreEqual(Object.keys(a), expectedKeys, "Object.keys() empty array object");
}

// TODO uncomment this after TSN-212 is fixed
// {
//     class A {
//         constructor() {}
//         get foo() { return 10; }
//         set bar(a: number) {}
//         static baz() {}
//         barbar() {}
//     }
//     let a = new A;
//     const expectedKeys: string[] = [];
//     assertObjectKeysAreEqual(Object.keys(a), expectedKeys, "Object.keys() class methods");
// }

// TODO: uncomment this after TSN-212 is fixed
// {
//     class BB {
//         parent = "1"
//     }
//
//     class DD extends BB {}
//     const d = new DD();
//     const expectedKeys = ["parent"];
//
//     assertObjectKeysAreEqual(Object.keys(d), expectedKeys,
//                "Object.keys() parent custom property test failed");
//
// }

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

{
    const value = 'Edit111';

    {
        const dict = {
            'Edit1': value
        }

        console.assert(dict.Edit1 === value, "Plain object explicit string key (single quote)");
    }

    {
        const dict = {
            "Edit1": value
        }

        console.assert(dict.Edit1 === value, "Plain object explicit string key (double quote)");
    }

    {
        const dict = {
            'Edit1': value
        }

        console.assert(dict["Edit1"] === value, "Plain object explicit string key (single quote) access (double quote) by element access expression");
    }

    {
        const dict = {
            'Edit1': value
        }

        console.assert(dict['Edit1'] === value, "Plain object explicit string key (single quote) access (single quote) by element access expression");
    }

    {
        const dict = {
            "Edit1": value
        }

        console.assert(dict['Edit1'] === value, "Plain object explicit string key (double quote) access (single quote) by element access expression");
    }

    {
        const dict = {
            "Edit1": value
        }

        console.assert(dict["Edit1"] === value, "Plain object explicit string key (double quote) access (double quote) by element access expression");
    }

    {
        const dict = {
            Edit1: value
        }

        console.assert(dict['Edit1'] === value, "Plain object with non-explicit string key access by element access expression (single quote)");
    }

    {
        const dict = {
            Edit1: value
        }

        console.assert(dict["Edit1"] === value, "Plain object with non-explicit string key access by element access expression (double quote)");
    }
}

// Object literals and unions
{
    function foo(): number|string {
        return 10;
    }

    let a = {
        text: foo()
    }
    console.assert(a.text === 10, "Object: Object with union(number inside) is not equal");

    a.text = "abacaba";
    console.assert(a.text === "abacaba", "Object: Object with union(string inside) is not equal");
}