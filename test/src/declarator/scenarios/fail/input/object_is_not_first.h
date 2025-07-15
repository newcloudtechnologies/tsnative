#pragma once

#include <TS.h>
#include <std/tsnumber.h>

namespace test IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class WithoutObject
{
public:
    WithoutObject() = default;
};

class TS_EXPORT Entity : public WithoutObject, public Object
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE
