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


// Execute simple body
{
    let i = 0;
    do {
        ++i;
    }
    while (i < 2);
    console.assert(i === 2, "do while: Execute simple body failed");
}

// Execute simple body only once
{
    let i = 0;
    do {
        ++i;
    } while (i < 0);
    console.assert(i === 1, "do while: Execute simple body only once failed");
}

// Execute body + nested scoped continue
{
    let i = 0;
    do {
        if (i === 1) {
            i += 4;
            continue;
        }
        ++i;
    } while (i < 2);
    console.assert(i === 5, "do while: Execute body + continue failed");
}

// Execute body + nested scoped break
{
    let i = 0;
    do {
        if (i === 1) {
            break;
        }
        ++i;
    } while (i < 2);
    console.assert(i === 1, "do while: Execute body + break failed");
}

// Nested do while cycles
{
    let i = 0;
    do {
        ++i;
        let j = 0;
        do {
            ++j;
        } while (j < 3);
        console.assert(j === 3, "do while: Nested do while cycles -> nested cycle failed");
    } while (i < 2);
    console.assert(i === 2, "do while: Nested do while cycles -> outer cycle failed");
}

// Nested do while cycles + continue
{
    let i = 0;
    do {
        ++i;
        let j = 0;
        do {
            if (j === 1) {
                j += 4;
                continue;
            }
            ++j;
        } while (j < 3);
        console.assert(j === 5, "do while: Nested do while cycles -> nested cycle failed");
    } while (i < 2);
    console.assert(i === 2, "do while: Nested do while cycles -> outer cycle failed");
}

// Nested do while cycles + break
{
    let i = 0;
    do {
        ++i;
        let j = 0;
        do {
            if (j === 1) {
                break;
            }
            ++j;
        } while (j < 3);
        console.assert(j === 1, "do while: Nested do while cycles -> nested cycle failed");
    } while (i < 2);
    console.assert(i === 2, "do while: Nested do while cycles -> outer cycle failed");
}

// Empty body
{
    do {
        ;
    } while (false);
}

// Test conditionless 'break'
{
    do {
        break;
    } while (false);
}
