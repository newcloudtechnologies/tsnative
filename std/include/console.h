#pragma once

#include "stdstring.h"

#include <exception>
#include <iostream>

// prevent console::assert from being handled as a macro
#ifdef assert
#undef assert
#endif

namespace console
{

template <typename T>
void log(T t);

template <typename T, typename... Ts>
void log(T v, Ts... ts);

template <typename T, typename... Ts>
void logImpl(T v, Ts... ts);

template <typename... Ts>
void logImpl(string* v, Ts... ts);

template <typename... Ts>
void assert(bool assumption, Ts... ts);

} // namespace console

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

template <typename... Ts>
void console::logImpl(string *v, Ts... ts)
{
    if (v->endsWith("\n") || v->endsWith("\r\n"))
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
void console::assert(bool assumption, Ts... ts) {
    if (!assumption) {
        console::log("Assertion failed:", ts...);
        std::terminate();
    }
}
