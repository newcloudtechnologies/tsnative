#pragma once

#include <TS.h>

#include <std/tsobject.h>

namespace test IS_TS_MODULE
{

class TS_EXPORT Base : public Object
{
public:
    TS_METHOD Base();

    TS_METHOD void test();
};

} // namespace IS_TS_MODULE