// Basic test with constant indexes access
{
    const booleanInitializer = true;
    const stringInitializer = "09000";
    const numericInitializer = 22;

    const tuple: [boolean, string, number] = [booleanInitializer, stringInitializer, numericInitializer];

    console.assert(tuple.length === 3, "Tuple size");
    console.assert(tuple[0] === booleanInitializer, "Tuple first element");
    console.assert(tuple[1] === stringInitializer, "Tuple second element");
    console.assert(tuple[2] === numericInitializer, "Tuple third element");
}

// Test runtime indexes
{
    const tuple: [boolean, number, string] = [true, 22, "aaaa"];
    for (let i = 0; i < tuple.length; ++i) {
        // It would be nice to test something here, but compiler for now have limited unions support. Just test buildability and non-crashing.
        const _ = tuple[i];
    }
}

// Tuple destructing assignment
{
    const primitivesTuple: [number, string] = [1, "Steve"];
    const [v1, v2] = primitivesTuple;

    console.assert(v1 === 1, "Tuple: destructing assignment element 1 not equal");
    console.assert(v2 === "Steve", "Tuple: destructing assignment element 2 not equal");
}