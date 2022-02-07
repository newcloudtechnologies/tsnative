#pragma once

#include <TS.h>

namespace global IS_TS_MODULE
{

namespace not_exported
{
    class TS_EXPORT Hidden
    {
    public:
        Hidden() = default;
        ~Hidden() = default;
        TS_METHOD void hidden();
    };
}

namespace stuffs1 IS_TS_NAMESPACE
{

class TS_EXPORT Entity1
{
public:
    TS_METHOD Entity1() = default;
    TS_METHOD void entity1();
};

}   // namespace stuffs1

namespace stuffs2 IS_TS_NAMESPACE
{

class TS_EXPORT Entity2
{
public:
    TS_METHOD Entity2() = default;
    TS_METHOD void entity2();
};

}    // namespace stuffs2

}   // namespace global



