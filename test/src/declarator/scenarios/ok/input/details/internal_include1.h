#pragma once

#include <TS.h>
#include <std/tsobject.h>

template <typename T>
class TS_EXPORT Iterable : public Object
{
public:
    TS_METHOD virtual T begin() = 0;
    TS_METHOD virtual T next() = 0;
};
