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
        const auto converted = ToStringConverter::convert(Object::asObjectPtr(result->value()));
        logString(converted);
        result = iterator->next();
    }
}
} // anonymous namespace

void console::log(Array<Object*>* objects)
{
    logArray(objects);
    std::cout << std::endl;
}

void console::assert(Union* condition, Array<Object*>* objects)
{
    static const std::string failureMsg{"Assertion failed:"};

    if (!condition->hasValue() || condition->toBool()->unboxed())
    {
        return;
    }

    logString(failureMsg);
    logArray(objects);
    std::terminate();
}