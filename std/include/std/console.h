#pragma once

#include "private/options.h"

#include "std/private/options.h"

#include "std/tsboolean.h"
#include "std/tsstring.h"

#include <TS.h>

#include <exception>
#include <iostream>

// prevent console::assert from being handled as a macro
#ifdef assert
#undef assert
#endif

namespace console IS_TS_DECLARED_NAMESPACE
{

template <typename T>
TS_EXPORT TS_SIGNATURE("function log(message?: any, ...optionalParams: any[]): void") void log(T t);

template <typename T, typename... Ts>
void log(T v, Ts... ts);

template <typename T, typename... Ts>
void logImpl(T v, Ts... ts);

template <typename... Ts>
void logImpl(String* v, Ts... ts);

template <typename... Ts>
TS_EXPORT TS_SIGNATURE("function assert(assumption: boolean, ...optionalParams: any[]): void") void assert(
    Boolean* assumption, Ts... ts);

} // namespace IS_TS_DECLARED_NAMESPACE

TS_CODE(
    "declare type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;\n");

template <typename T>
void console::log(T value)
{
    std::cout << std::boolalpha << value << std::endl;
}

template <typename T, typename... Ts>
void console::log(T v, Ts... ts)
{
    console::logImpl(v, ts...);
}

template <typename T, typename... Ts>
void console::logImpl(T v, Ts... ts)
{
    std::cout << std::boolalpha << v << " ";
    console::log(ts...);
}

static String n{"\n"};
static String rn{"\r\n"};

template <typename... Ts>
void console::logImpl(String* v, Ts... ts)
{
    if (v->endsWith(&n)->unboxed() || v->endsWith(&rn)->unboxed())
    {
        std::cout << v;
    }
    else
    {
        std::cout << v << " ";
    }

    console::log(ts...);
}

template <typename... Ts>
void console::assert(Boolean* assumption, Ts... ts)
{
    if (!assumption->unboxed())
    {
        console::log("Assertion failed:", ts...);
        std::terminate();
    }
}
