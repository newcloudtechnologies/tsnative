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

#include "std/console.h"
#include "std/tsarray.h"

#include <iostream>

namespace
{
void logString(const std::string& str)
{
    std::cout << str << " ";
}

void logArray(Array<Object*>* objects)
{
    auto iterator = objects->iterator();
    auto result = iterator->next();

    while (!result->done()->unboxed())
    {
        logString(result->value()->toString()->cpp_str());
        result = iterator->next();
    }
}
} // anonymous namespace

void console::log(Object* msg, Array<Object*>* objects)
{
    logString(msg->toString()->cpp_str());
    logArray(objects);
}

void console::assert(Boolean* assumption, Array<Object*>* objects)
{
    static const std::string failureMsg{"Assertion failed:"};

    if (!Object::asObjectPtr(assumption)->toBool()->unboxed())
    {
        logString(failureMsg);
        logArray(objects);
        std::terminate();
    }
}