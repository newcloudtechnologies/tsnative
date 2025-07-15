#pragma once

#include <TS.h>
#include <std/tsobject.h>

class TS_EXPORT TS_IGNORE Entity : public Object
{
public:
    TS_METHOD Entity() = default;
    ~Entity() = default;

    TS_METHOD TS_IGNORE void update();
};
