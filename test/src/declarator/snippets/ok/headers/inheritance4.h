/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2021
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
#include <std/tsobject.h>

class TS_EXPORT Entity : public Object
{
public:
    Entity() = default;
    ~Entity() = default;
    TS_METHOD void entity();
};

template <typename T>
class TemplateBase : public Entity
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
