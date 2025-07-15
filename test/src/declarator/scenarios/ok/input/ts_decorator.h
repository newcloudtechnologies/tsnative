#pragma once

#include <TS.h>
#include <std/tsobject.h>

class TS_EXPORT TS_DECORATOR("NoFields") TS_DECORATOR("MapsTo('Pi', 3.14)") Entity : public Object
{
public:
    TS_METHOD Entity() = default;
    ~Entity() = default;

    TS_METHOD TS_DECORATOR("Function(1, 2, 'str', 3.14)") TS_DECORATOR("NoRet")
        TS_DECORATOR("MapsTo('iterator')") void update();
};

/*
TODO: support generics

template <typename T>
class TS_EXPORT TS_DECORATOR("Generic") Array
{
public:
    Array();
};
*/
