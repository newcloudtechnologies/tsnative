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
import * as path from "path";

function toPosixStyle(file: string) {
  return file.split(path.sep).join(path.posix.sep);
}

export const NUMERIC = toPosixStyle(path.join(__dirname, "definitions", "lib.std.numeric.d.ts"));

export const STRING_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsstring.d.ts")
);

export const ARRAY_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsarray.d.ts")
);

export const OBJECT_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsobject.d.ts")
);

export const UNDEFINED_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsundefined.d.ts")
);

export const NULL_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsnull.d.ts")
);

export const NUMBER_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsnumber.d.ts")
);

export const BOOLEAN_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsboolean.d.ts")
);

export const UNION_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsunion.d.ts")
);

export const SET_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsset.d.ts")
);

export const MAP_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsmap.d.ts")
);

export const TUPLE_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tstuple.d.ts")
);

export const ITERABLE_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "iterable.d.ts")
);

export const STRING_ITERATOR_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "stringiterator.d.ts")
);

export const MAP_ITERATOR_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "mapiterator.d.ts")
);

export const SET_ITERATOR_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "setiterator.d.ts")
);

export const CONSOLE_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "console.d.ts")
);

export const GC_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "gc.d.ts"));

export const RUNTIME_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "runtime.d.ts"));
export const DIAGNOSTICS_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "diagnostics.d.ts"));
export const MEMORY_DIAGNOSTICS_DEFINITION = toPosixStyle(path.join(__dirname, "definitions", "memory_diagnostics.d.ts"));

export const CLOSURE_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsclosure.d.ts")
);

export const DATE_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsdate.d.ts")
);

export const MATH_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "tsmath.d.ts")
);

export const SET_INTERVAL_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "set_interval.d.ts")
);

export const SET_TIMEOUT_DEFINITION = toPosixStyle(
  path.join(__dirname, "definitions", "set_timeout.d.ts")
);

export const EVENT_LOOP_DEFINITION = toPosixStyle(
    path.join(__dirname, "definitions", "event_loop.d.ts")
);

export const PROMISE_DEFINITION = toPosixStyle(
    path.join(__dirname, "definitions", "tspromise.d.ts")
);

export const PARSE_INT_DEFINITION = toPosixStyle(
    path.join(__dirname, "definitions", "parse_int.d.ts")
);

export const PARSE_FLOAT_DEFINITION = toPosixStyle(
    path.join(__dirname, "definitions", "parse_float.d.ts")
);

export const STUBS = toPosixStyle(path.join(__dirname, "definitions", "lib.std.stubs.d.ts"));
