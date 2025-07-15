#pragma once

#include <TS.h>
#include <std/tsnumber.h>

namespace test IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class WithObject1 : public Object
{
public:
    WithObject1() = default;
};

class WithObject2 : public Object
{
public:
    WithObject2() = default;
};

class TS_EXPORT Entity : public WithObject1, public WithObject2
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE
