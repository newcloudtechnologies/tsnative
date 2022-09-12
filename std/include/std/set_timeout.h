#pragma once

#include <TS.h>

class TSClosure;
class Number;

TS_CODE("// @ts-ignore")
// @todo: AN-1173
TS_CODE("declare function setTimeout(handler: TSClosure, timeout: number): number;")
Number* setTimeout(TSClosure* handler, Number* timeout);

// @todo: AN-1173
TS_CODE("declare function clearTimeout(handle: number): void;")
void clearTimeout(Number* handle);
