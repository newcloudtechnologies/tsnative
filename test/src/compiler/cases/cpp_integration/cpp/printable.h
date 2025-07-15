#pragma once

#include <TS.h>

#include "point.h"

#include <std/console.h>
#include <std/tsobject.h>
#include <std/tsstring.h>

#include <iostream>

namespace cpp_integration IS_TS_MODULE
{

class TS_EXPORT Printable : public Object
{
public:
    TS_METHOD Printable(Point* point, String* s);
};

} // namespace IS_TS_MODULE
