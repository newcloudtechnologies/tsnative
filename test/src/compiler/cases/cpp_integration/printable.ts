// Nothing to test here, really. Just verify buildability and non-crashing

import { Point, Printable } from "cpp_integration_exts";

const point = new Point(1, 22);
const s = "STRINGEST STRING";

const printable = new Printable(point, s);
console.log(printable);
