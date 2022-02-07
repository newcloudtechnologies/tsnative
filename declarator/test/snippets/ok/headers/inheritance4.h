#pragma once

#include <TS.h>

class TS_EXPORT Entity
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};

template <typename T>
class TemplateBase: public Entity
{
    T t1;
    T t2;
    int i1;
public:
    TemplateBase() = default;
    ~TemplateBase() = default;

    TS_METHOD void templateBase();
};

class TS_EXPORT Derived : public TemplateBase<int>
{
public:
    ~Derived() = default;
    TS_METHOD void derived();
};

