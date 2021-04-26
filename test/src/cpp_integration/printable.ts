// Nothing to test here, really. Just verify buildability and non-crashing

import { int64_t } from "std-typescript-llvm/definitions/lib.std.numeric";
import { Point, Printable } from "./declarations/cpp";

const point = new Point(1, 22);
const s = "STRINGEST STRING";
const i: int64_t = 324;

const printable = new Printable(point, s, i);
console.log(printable);
