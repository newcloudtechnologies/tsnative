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
    enum Alignment {
        Horizontal,
        Vertical,
    }

    function bypass(value: Alignment) {
        return value;
    }

    console.assert(bypass(Alignment.Horizontal) === Alignment.Horizontal && bypass(Alignment.Vertical) === Alignment.Vertical, "Enum argument");
}

{
    enum Margins_e {
        Top = (1 << 0),
        Left = (1 << 1),
        Right = (1 << 2),
        Bottom = (1 << 3),
    }

    function setMargin(edges: Margins_e) {
        return edges;
    }

    console.assert(setMargin(Margins_e.Left | Margins_e.Right) === ((1 << 1) | (1 << 2)), "Enum combination argument");
}

{
    enum Margins_e {
        Top = (1 << 0),
        Left = (1 << 1),
        Right = (1 << 2),
        Bottom = (1 << 3),
    }

    const edges = Margins_e.Top | Margins_e.Left
    if (edges & Margins_e.Top) {
        console.assert(true, "Never");
    } else {
        console.assert(false, "Enum check using '&'");
    }
}

{
    enum RxMargins_e {
        Top = (1 << 0),
        Left = (1 << 1),
        Right = (1 << 2),
        Bottom = (1 << 3),
    }

    function margins(edges: RxMargins_e) {
        return edges;
    }

    class Foo_t {
        margins2(edges: RxMargins_e) {
            return edges;
        }
    }

    const edges: RxMargins_e = RxMargins_e.Top | RxMargins_e.Right;

    console.assert(margins(edges) === ((1 << 0) | (1 << 2)), "Enum free function argument");
    console.assert(new Foo_t().margins2(edges) === ((1 << 0) | (1 << 2)), "Enum method argument");
}

{
    enum RxMargins_e {
        Top = 1,
        Right = 4,
    }

    class Foo_t {
        margins2(edges: RxMargins_e) {
            return edges;
        }
    }

    const edges: RxMargins_e = RxMargins_e.Top | RxMargins_e.Right;

    console.assert(new Foo_t().margins2(edges as number) === edges, "Enum cast to number");
}

{
    enum RxMargins_e {
        Top = 1,
        Right = 4,
    }

    class Foo_t {
        margins2(edges: number) {
            return edges;
        }
    }

    const edges: RxMargins_e = RxMargins_e.Top | RxMargins_e.Right;
    console.assert(new Foo_t().margins2(edges) === edges, "Implicit enum cast to number");
}

enum MyEnum {
    A = (1 << 0),
    B = (1 << 1),
    C = (1 << 2),
    D = (1 << 3),
}

const val = MyEnum.A | MyEnum.B;

const res1 = val & MyEnum.A;
const res2 = val ^ MyEnum.C;

console.assert(res1 === 1, "Enum bitwise AND");
console.assert(res2 === 7, "Enum bitwise XOR");

class MyBaseClass {
    _field: MyEnum = MyEnum.A

    constructor(val: MyEnum) {
        if (val & (MyEnum.B | MyEnum.C)) {
            this._field = val;
        }
    }
}

const base = new MyBaseClass(MyEnum.A & MyEnum.B | MyEnum.D);

let res3 = "";
switch (base._field) {
    case MyEnum.A: {
        res3 += "A";
        break;
    }
    case MyEnum.B: {
        res3 += "B";
        break;
    }
    case MyEnum.C: {
        res3 += "C";
        break;
    }
    case MyEnum.D: {
        res3 += "D";
        break;
    }
};

console.assert(res3 === "A", "Enum class member initialized correctly");

namespace myspace {
    export class MyDerivedClass extends MyBaseClass {
        constructor(val: MyEnum) {
            super(val | MyEnum.D);
        }

        getField(): MyEnum {
            return this._field;
        }

        getFieldAbc(): MyEnum {
            return this._field & ((MyEnum.A | MyEnum.B | MyEnum.C));
        }
    }
}

const obj = new myspace.MyDerivedClass(val);
const res4 = obj.getFieldAbc();
const res5 = obj.getField();

console.assert(res4 === 3, "Enum class member initialized correctly (2)");
console.assert(res5 === 11, "Enum class member + bitwise AND");

// only test buildability
{
    enum MyEnum {
        A, B, C
    };
    console.log(MyEnum.A);

    type YourEnum = MyEnum;
    let val: YourEnum = MyEnum.A;
    console.log(val);

    type YourEnum2 = MyEnum.A;
    let val2: YourEnum2 = MyEnum.A;
    console.log(val2);

    type YourEnum3 = MyEnum.A | MyEnum.C;
    let val3: YourEnum3 = MyEnum.C;
    console.log(val3);

    class Printer<T> {
        sayHi(name: T) {
            console.log(name + ", Mr.Robot")
        }

    }

    type MyString = string;

    // @todo: AN-1155
    // (new Printer<MyString>()).sayHi("Bula");

    const p = new Printer<MyString>();
    p.sayHi("Bula");
}
