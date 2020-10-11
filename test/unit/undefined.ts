/*
 * Copyright (c) Laboratory of Cloud Technologies, Ltd., 2013-2020
 *
 * You can not use the contents of the file in any way without
 * Laboratory of Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact Laboratory of Cloud Technologies, Ltd.
 * at http://cloudtechlab.ru/#contacts
 *
 */

let u: undefined;
console.assert(!u, "Undefined type initialization failed");

let optionalUnion: string | number | undefined;
console.assert(!optionalUnion, "Non-initialized union test failed");

optionalUnion = "A";
console.assert(optionalUnion === "A", "Union comparison failed");

optionalUnion = 1;
console.assert(optionalUnion === 1, "Union comparison failed");

optionalUnion = undefined;
console.assert(!optionalUnion, "Active undefined test failed");