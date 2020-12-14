// Nothing to test here, really. Just verify buildability and non-crashing

import { Point, Printable } from "./declarations/cpp";

const point = new Point(1, 22);
const s = "STRINGEST STRING";
const i: int32_t = 324;

const printable = new Printable(point, s, i);
console.log(printable);
