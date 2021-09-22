"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ITERABLE = exports.STUBS = exports.GC_DEFINITION = exports.UTILITY_DEFINITIONS = exports.DEFINITIONS = exports.NUMERIC = void 0;
const path = require("path");
function toPosixStyle(file) {
    return file.split(path.sep).join(path.posix.sep);
}
exports.NUMERIC = toPosixStyle(path.join(__dirname, "definitions", "lib.std.numeric.d.ts"));
exports.DEFINITIONS = toPosixStyle(path.join(__dirname, "definitions", "lib.std.d.ts"));
exports.UTILITY_DEFINITIONS = toPosixStyle(path.join(__dirname, "definitions", "lib.std.utils.d.ts"));
exports.GC_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "lib.std.gc.d.ts"));
exports.STUBS = toPosixStyle(path.join(__dirname, "definitions", "lib.std.stubs.d.ts"));
exports.ITERABLE = toPosixStyle(path.join(__dirname, "definitions", "lib.std.iterable.d.ts"));
