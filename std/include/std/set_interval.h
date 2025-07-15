#pragma once

#include <TS.h>

class TSClosure;
class Number;

TS_CODE("// @ts-ignore")
// @todo: AN-1173
TS_CODE("declare function setInterval(handler: TSClosure, timeout: number): number;");
Number* setInterval(TSClosure* handler, Number* interval);

// @todo: AN-1173
TS_CODE("declare function clearInterval(handle: number): void;");
void clearInterval(Number* handle);
