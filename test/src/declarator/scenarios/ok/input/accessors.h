#pragma once

#include <TS.h>
#include <std/tsarray.h>
#include <std/tsnumber.h>
#include <std/tsobject.h>

#include <string>
#include <vector>

class TS_EXPORT Collection : public Object
{
public:
    TS_METHOD Collection() = default;

    TS_METHOD TS_GETTER Number* capacity();
    TS_METHOD TS_SETTER void capacity(Number* value);

    TS_METHOD TS_GETTER TS_NAME("size") Number* getSize();
    TS_METHOD TS_SETTER TS_NAME("size") void setSize(Number* value);
};

class TS_EXPORT Rope : public Object
{
public:
    TS_METHOD Rope() = default;

    TS_METHOD TS_SIGNATURE("get length(): number") Number* length();
    TS_METHOD TS_SIGNATURE("set length(value: number)") void length(Number* value);

    template <typename U>
    TS_METHOD TS_SIGNATURE("get values<U>(): U[]") Array<U>* values(TSClosure* closure);

    template <typename U>
    TS_METHOD TS_SIGNATURE("set values<U>(vals: U[])") void values(Array<U>* vals);
};
