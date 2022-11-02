/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

#pragma once

#include <TS.h>

#include "std/private/options.h"

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

template <typename T>
TS_EXPORT TS_SIGNATURE("function log(message: any, ...optionalParams: any[]): void") void log(T t);

template <typename T, typename... Ts>
void log(T v, Ts... ts);

template <typename T, typename... Ts>
void logImpl(T v, Ts... ts);

template <typename T, typename... Ts>
TS_EXPORT TS_SIGNATURE("function assert(assumption: any, ...optionalParams: any[]): void") void assert(T assumption,
                                                                                                       Ts... ts);

} // namespace IS_TS_DECLARED_NAMESPACE

TS_CODE(
    "declare type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;\n");

template <typename T>
void console::log(T value)
{
    using NonPtrT = typename std::remove_pointer<T>::type;
    static_assert(std::is_pointer<T>::value &&
                  (std::is_base_of<Object, NonPtrT>::value || std::is_same<Object, NonPtrT>::value));

    std::cout << std::boolalpha << static_cast<Object*>(value)->toString() << std::endl;
}

template <typename T, typename... Ts>
void console::log(T v, Ts... ts)
{
    console::logImpl(v, ts...);
}

template <typename T, typename... Ts>
void console::logImpl(T v, Ts... ts)
{
    using NonPtrT = typename std::remove_pointer<T>::type;
    static_assert(std::is_pointer<T>::value &&
                  (std::is_base_of<Object, NonPtrT>::value || std::is_same<Object, NonPtrT>::value));

    std::cout << std::boolalpha << static_cast<Object*>(v)->toString() << " ";
    console::log(ts...);
}

static String* assertionFailedMessage = new String("Assertion failed:");

template <typename T, typename... Ts>
void console::assert(T assumption, Ts... ts)
{
    using NonPtrT = typename std::remove_pointer<T>::type;
    static_assert(std::is_pointer<T>::value &&
                  (std::is_base_of<Object, NonPtrT>::value || std::is_same<Object, NonPtrT>::value));

    if (!static_cast<Object*>(assumption)->toBool()->unboxed())
    {
        console::log(assertionFailedMessage, ts...);
        std::terminate();
    }
}
