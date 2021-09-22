import * as path from "path";

function toPosixStyle(file: string) {
  return file.split(path.sep).join(path.posix.sep);
}

export const NUMERIC = toPosixStyle(path.join(__dirname, "..", "..", "std", "definitions", "lib.std.numeric.d.ts"));
export const DEFINITIONS = toPosixStyle(path.join(__dirname, "..", "..", "std", "definitions", "lib.std.d.ts"));
export const UTILITY_DEFINITIONS = toPosixStyle(
  path.join(__dirname, "..", "..", "std", "definitions", "lib.std.utils.d.ts")
);
export const GC_DEFINITION = toPosixStyle(path.join(__dirname, "..", "..", "std", "definitions", "lib.std.gc.d.ts"));
export const STUBS = toPosixStyle(path.join(__dirname, "..", "..", "std", "definitions", "lib.std.stubs.d.ts"));
export const ITERABLE = toPosixStyle(path.join(__dirname, "..", "..", "std", "definitions", "lib.std.iterable.d.ts"));
