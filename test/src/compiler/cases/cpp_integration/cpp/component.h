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

#pragma once

#include <TS.h>

#include <std/tsobject.h>

namespace cpp_integration IS_TS_MODULE
{

class TS_EXPORT Component : public Object
{
public:
    TS_METHOD Component();
    virtual ~Component() = default;

    TS_METHOD TS_DECORATOR("Virtual") virtual void draw() = 0;
    TS_METHOD TS_DECORATOR("Virtual") virtual void render();

    TS_METHOD void test();

    TS_CODE("m: number;")
};

class TS_EXPORT AnotherWidget : public Object
{
public:
    TS_METHOD AnotherWidget();
};

class TS_EXPORT Handler : public Object
{
public:
    TS_METHOD Handler();

    TS_METHOD void handle(Component* c);
};

} // namespace IS_TS_MODULE