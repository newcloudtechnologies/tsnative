#pragma once

#include "TS.h"
#include "ts_module3_include.h"

namespace TS_MODULE(global)
{

namespace TS_NAMESPACE(stuffs) IS_TS_MODULE
{

class TS_EXPORT Entity
{
public:
    TS_METHOD Entity() = default;
    TS_METHOD void entity();
};

}   // namespace stuffs

}   // namespace global



