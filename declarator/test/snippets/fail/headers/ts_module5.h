#pragma once

#include "TS.h"
#include "ts_module3_include.h"

namespace TS_MODULE(global) IS_TS_NAMESPACE
{

namespace TS_NAMESPACE(stuffs)
{

class TS_EXPORT Entity
{
public:
    TS_METHOD Entity() = default;
    TS_METHOD void entity();
};

}   // namespace stuffs

}   // namespace global



