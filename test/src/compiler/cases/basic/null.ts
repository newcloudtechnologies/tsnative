{

    let i: number | null = null;
    console.assert(!i, "Null union: Null initialization failed");

    i = 42;
    console.assert(i === 42, "Null union: Primitive value assignment failed");

    i = null;
    console.assert(!i, "Null union: Null assignment failed");

    class C {
        constructor() { }
    }

    let c: C | null;

    c = new C();
    console.assert(!!c, "Null union: Value assignment failed")

    c = null;
    console.assert(!c, "Null union: Null assignment failed")
}