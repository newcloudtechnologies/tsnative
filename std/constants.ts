import * as path from "path";

function toPosixStyle(file: string) {
  return file.split(path.sep).join(path.posix.sep);
}

export const NUMERIC = toPosixStyle(path.join(__dirname, "..", "std", "definitions", "lib.std.numeric.d.ts"));

export const STRING_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsstring.d.ts")
);

export const ARRAY_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsarray.d.ts")
);

export const OBJECT_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsobject.d.ts")
);

export const UNDEFINED_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsundefined.d.ts")
);

export const NULL_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsnull.d.ts")
);

export const NUMBER_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsnumber.d.ts")
);

export const BOOLEAN_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsboolean.d.ts")
);

export const UNION_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsunion.d.ts")
);

export const SET_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsset.d.ts")
);

export const MAP_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsmap.d.ts")
);

export const TUPLE_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tstuple.d.ts")
);

export const ITERABLE_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "iterable.d.ts")
);

export const STRING_ITERATOR_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "stringiterator.d.ts")
);

export const MAP_ITERATOR_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "mapiterator.d.ts")
);

export const SET_ITERATOR_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "setiterator.d.ts")
);

export const CONSOLE_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "console.d.ts")
);

export const GC_DEFINITION = toPosixStyle(path.join(__dirname, "..", "..", "install", "std", "definitions", "gc.d.ts"));

export const CLOSURE_DEFINITION = toPosixStyle(
  path.join(__dirname, "..", "..", "install", "std", "definitions", "tsclosure.d.ts")
);

export const STUBS = toPosixStyle(path.join(__dirname, "..", "std", "definitions", "lib.std.stubs.d.ts"));
