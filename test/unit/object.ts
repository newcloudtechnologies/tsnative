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

/* @todo
{
    const a = { v: 12, k: "42" };
    const c = { ...a, k: "00" };

    console.assert(c.v === 12, "Object spread initialization failed (4)");
    console.assert(c.k === "00", "Object spread initialization failed (5)");
}
*/

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
