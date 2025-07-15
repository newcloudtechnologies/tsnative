#pragma once

#include <TS.h>
#include <std/tsobject.h>

namespace test IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class TS_EXPORT EnumHolder : public Object
{
public:
    enum TS_EXPORT Types
    {
        PLANT,
        ANIMAL,
        INSECT
    };

public:
    TS_METHOD EnumHolder() = default;
    ~EnumHolder() = default;

    TS_METHOD Types getType();
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE
