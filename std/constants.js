"use strict";
exports.__esModule = true;
exports.STUBS = exports.CLOSURE_DEFINITION = exports.GC_DEFINITION = exports.CONSOLE_DEFINITION = exports.SET_ITERATOR_DEFINITION = exports.MAP_ITERATOR_DEFINITION = exports.STRING_ITERATOR_DEFINITION = exports.ITERABLE_DEFINITION = exports.TUPLE_DEFINITION = exports.MAP_DEFINITION = exports.SET_DEFINITION = exports.UNION_DEFINITION = exports.BOOLEAN_DEFINITION = exports.NUMBER_DEFINITION = exports.NULL_DEFINITION = exports.UNDEFINED_DEFINITION = exports.OBJECT_DEFINITION = exports.ARRAY_DEFINITION = exports.STRING_DEFINITION = exports.NUMERIC = void 0;
var path = require("path");
function toPosixStyle(file) {
    return file.split(path.sep).join(path.posix.sep);
}
exports.NUMERIC = toPosixStyle(path.join(__dirname, "definitions", "lib.std.numeric.d.ts"));
exports.STRING_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsstring.d.ts"));
exports.ARRAY_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsarray.d.ts"));
exports.OBJECT_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsobject.d.ts"));
exports.UNDEFINED_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsundefined.d.ts"));
exports.NULL_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsnull.d.ts"));
exports.NUMBER_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsnumber.d.ts"));
exports.BOOLEAN_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsboolean.d.ts"));
exports.UNION_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsunion.d.ts"));
exports.SET_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsset.d.ts"));
exports.MAP_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsmap.d.ts"));
exports.TUPLE_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tstuple.d.ts"));
exports.ITERABLE_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "iterable.d.ts"));
exports.STRING_ITERATOR_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "stringiterator.d.ts"));
exports.MAP_ITERATOR_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "mapiterator.d.ts"));
exports.SET_ITERATOR_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "setiterator.d.ts"));
exports.CONSOLE_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "console.d.ts"));
exports.GC_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "gc.d.ts"));
exports.CLOSURE_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "tsclosure.d.ts"));
exports.STUBS = toPosixStyle(path.join(__dirname, "definitions", "lib.std.stubs.d.ts"));
