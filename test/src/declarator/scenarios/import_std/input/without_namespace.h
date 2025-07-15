#pragma once

#include <TS.h>
#include <std/tsobject.h>

class TS_EXPORT Entity : public Object
{
public:
    TS_METHOD Entity() = default;
    TS_METHOD void entity();
};
