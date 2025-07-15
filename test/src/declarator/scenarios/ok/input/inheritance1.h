#pragma once

#include <TS.h>
#include <std/tsobject.h>

namespace test IS_TS_MODULE
{

namespace snippets IS_TS_NAMESPACE
{

class TS_EXPORT Entity : public Object
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};

class TS_EXPORT Base : public Entity
{
    int n = 0;
    bool f = false;

public:
    ~Base() = default;
    TS_METHOD void base();
};

class TS_EXPORT Derived : public Base
{
public:
    ~Derived() = default;
    TS_METHOD void derived();
};

} // namespace IS_TS_NAMESPACE
} // namespace IS_TS_MODULE
