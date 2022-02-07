#pragma once

#include <TS.h>

class TS_EXPORT TS_IGNORE Entity
{
public:
    TS_METHOD Entity() = default;
    ~Entity() = default;

    TS_METHOD TS_IGNORE void update();
};


