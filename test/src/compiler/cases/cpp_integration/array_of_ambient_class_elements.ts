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

import { exts } from "cpp_integration_exts";

const empty0: exts.FileInfo_t[] = [];
const empty1 = new Array<exts.FileInfo_t>();

const empty2: exts.FileInfo_t[] = <exts.FileInfo_t[]>[];
const empty3: exts.FileInfo_t[] = [] as exts.FileInfo_t[];

// variable type notation is optional:
const empty4 = <exts.FileInfo_t[]>[];
const empty5 = [] as exts.FileInfo_t[];

// array of arrays also supported:
const empty6: exts.FileInfo_t[][] = [];
const empty7 = [] as exts.FileInfo_t[][];

console.assert(!empty0.length, "Empty array initializer (0)");
console.assert(!empty1.length, "Empty array initializer (1)");
console.assert(!empty2.length, "Empty array initializer (2)");
console.assert(!empty3.length, "Empty array initializer (3)");
console.assert(!empty4.length, "Empty array initializer (4)");
console.assert(!empty5.length, "Empty array initializer (5)");
console.assert(!empty6.length, "Empty array initializer (6)");
console.assert(!empty7.length, "Empty array initializer (7)");
