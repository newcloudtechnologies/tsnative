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
#include <std/tsarray.h>
#include <std/tsnumber.h>

#include <string>
#include <vector>

class TS_EXPORT Collection
{
public:
    TS_METHOD Collection() = default;

    TS_METHOD TS_GETTER Number capacity();
    TS_METHOD TS_SETTER void capacity(Number value);
};

class TS_EXPORT Rope
{
public:
    TS_METHOD Rope() = default;

    TS_METHOD TS_SIGNATURE("get length(): number") Number length();
    TS_METHOD TS_SIGNATURE("set length(value: number)") void length(const Number& value);

    template <typename U>
    TS_METHOD TS_SIGNATURE("get values<U>(): U[]") Array<U>* values(TSClosure* closure);

    template <typename U>
    TS_METHOD TS_SIGNATURE("set values<U>(vals: U[])") void values(Array<U>* vals);
};