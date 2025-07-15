#pragma once

#include <TS.h>
#include <std/tsobject.h>

namespace global
{

namespace stuffs
{

class TS_EXPORT Abc : public Object
{
public:
    TS_METHOD Abc() = default;
    TS_METHOD void abc();
};

} // namespace stuffs

} // namespace global
