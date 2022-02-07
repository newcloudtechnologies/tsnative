#pragma once

#include "TS.h"

#include <string>
#include <vector>

using number = double;

class TS_EXPORT Collection
{
public:
    TS_METHOD Collection() = default;

    TS_METHOD number capacity();
    TS_METHOD void capacity(number value);
};




