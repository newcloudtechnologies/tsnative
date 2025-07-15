#pragma once

#include <TS.h>

#include "std/private/options.h"
#include "std/private/to_string_converter.h"

#include "std/tsboolean.h"
#include "std/tsstring.h"

#include <exception>
#include <iostream>

// prevent console::assert from being handled as a macro
#ifdef assert
#undef assert
#endif

namespace console IS_TS_DECLARED_NAMESPACE
{

TS_EXPORT TS_SIGNATURE("function log(...items: any[]): void") void log(Array<Object*>* objects);

TS_EXPORT TS_SIGNATURE("function assert(condition?: boolean | undefined, ...optionalParams: any[]): void") void assert(
    Union* condition, Array<Object*>* objects);

} // namespace IS_TS_DECLARED_NAMESPACE

TS_CODE(
    "declare type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;\n");
