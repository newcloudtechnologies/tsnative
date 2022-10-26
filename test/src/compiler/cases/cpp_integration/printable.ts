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

// Nothing to test here, really. Just verify buildability and non-crashing

import { Point, Printable } from "cpp_integration_exts";

const point = new Point(1, 22);
const s = "STRINGEST STRING";

const printable = new Printable(point, s);
console.log(printable);
