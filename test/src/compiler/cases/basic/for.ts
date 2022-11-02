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

{

    const COUNT = 10;
    let i = 0;

    // with initializer, condition and incrementor
    for (i = 0; i < COUNT; ++i) { }
    console.assert(i === COUNT, "for: failed");

    // with external initializer, condition and incrementor
    i = 0;
    for (; i < COUNT; ++i) { }
    console.assert(i === COUNT, "for: external initializer failed");

    // with initializer, internal condition and incrementor
    for (i = 0; ; ++i) {
        if (i === COUNT)
            break;
    }
    console.assert(i === COUNT, "for: internal condition failed");

    // same as previous, but the `break` statement is wrapped in block
    for (i = 0; ; ++i) {
        if (i === COUNT) {
            break;
        }
    }
    console.assert(i === COUNT, "for: scoped internal condition failed");

    // with initializer, condition and internal incrementor
    for (i = 0; i < COUNT;) {
        ++i;
    }
    console.assert(i === COUNT, "for: internal incrementor failed");

    // with initializer, internal condition and internal incrementor
    for (i = 0; ;) {
        if (i === COUNT)
            break;
        ++i;
    }
    console.assert(i === COUNT, "for: internal condition and internal incrementor failed");

    // with external initializer, internal condition and internal incrementor
    i = 0;
    for (; ;) {
        if (i === COUNT)
            break;
        ++i;
    }
    console.assert(i === COUNT, "for: external initializer, internal condition and internal incrementor failed");

    // pseudo `forever` construction
    i = 0;
    for (; ;) {
        if (true)
            break;
    }
    console.assert(i === 0, "for: forever failed");

    // `continue` statement
    for (i = 0; i < COUNT; ++i) {
        if (true)
            continue;
    }
    console.assert(i === COUNT, "for: continue failed");

    // same as previous, but the `continue` statement is wrapped in block
    for (i = 0; i < COUNT; ++i) {
        if (true) {
            continue;
        }
    }
    console.assert(i === COUNT, "for: scoped continue failed");

}

// Test conditionless 'break'
{
    const qqq = [1, 2, 3, 4, 5];

    for (let i = 0; i < qqq.length; ++i) {
        break;
    }
}
