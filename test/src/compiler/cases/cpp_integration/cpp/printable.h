/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2022
 *
 * You can not use the contents of the file in any way without
 * New Cloud Technologies, Ltd. written permission.
 *
 * To obtain such a permit, you should contact New Cloud Technologies, Ltd.
 * at http://ncloudtech.com/contact.html
 *
 */

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
