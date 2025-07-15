#pragma once

#include "TS.h"
#include "std/tsnumber.h"

#include <string>
#include <vector>

class TS_EXPORT Collection
{
public:
    TS_METHOD Collection() = default;

    TS_METHOD TS_GETTER Number* capacity();
    TS_METHOD void capacity(Number* value);
};
