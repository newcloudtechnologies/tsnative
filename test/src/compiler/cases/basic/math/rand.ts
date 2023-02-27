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
    let i = 0;
    let randoms: Set<Number> = new Set;
    const COUNT = 100;
    for (i = 0; i < COUNT; ++i) {
        const nextRand = Math.random();
        console.assert(0 <= nextRand && nextRand < 1, "Math: random generated number outside [0, 1)");
        randoms.add(Math.random());
    }
    i = 0;
    console.assert(randoms.size === COUNT, "Math: random generated non unique numbers");
}