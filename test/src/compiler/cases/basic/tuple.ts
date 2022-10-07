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