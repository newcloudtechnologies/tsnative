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

// Nothing to test here, really. Just verify buildability and non-crashing

// TS class with nested class logging test
{
    class Nested {
        a = {
            o: 2,
            cc: "22"
        }

        b = [2, 3, 4]

        f: () => void = function () { }

        n1: number = 2
        n2: number = 2
        n3: number = 2
        n4: number = 2
        n5: number = 2
        n6: number = 2
    }

    class Clazz {
        n: number
        s: string

        nested: Nested

        constructor(n: number, s: string) {
            this.n = n;
            this.s = s;
            this.nested = new Nested();
        }

        f: () => void = function () { }
    }

    const c = new Clazz(324, "Sddd");
    console.log(c)
}

// Unions and intersections logging test
{
    interface A {
        n: number;
    }

    interface B {
        s: string;
    }

    const abIntersection: A & B = { n: 42, s: "222222" };
    console.log(abIntersection);

    let abUnion: A | B = { n: 2 };
    console.log(abUnion);

    abUnion = { s: "1" };
    console.log(abUnion);
}

{
    const m = new Map<string, number>()
        .set("a", 2)
        .set("b", 4);

    console.log(m);
}

{
    const s = new Set<string>()
        .add("a")
        .add("b")
        .add("a");

    console.log(s);
}

{
    const f = () => { };
    console.log(f);
}

{
    console.log(null);
    console.log(undefined);
}

{
    const a = [1, 2, 3];
    console.log(a);
}
