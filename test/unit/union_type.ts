{
    interface A {
        a: number
        b: string
    }

    interface B {
        c: number
        d: string
    }

    // @todo: more complex types, e.g. let union: number | A | B = { a: 12, b: "h" }
    let union: A | B = { a: 12, b: "h" };

    console.assert(union.a === 12, "Union object initialization failed");
    console.assert(union.b === "h", "Union object initialization failed");

    union = { c: 909, d: "LAH" };

    console.assert(union.c === 909, "Union object re-initialization failed");
    console.assert(union.d === "LAH", "Union object re-initialization failed");
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