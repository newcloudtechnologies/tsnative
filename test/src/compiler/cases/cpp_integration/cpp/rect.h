/*
 * Copyright (c) New Cloud Technologies, Ltd., 2014-2023
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

#include <std/tsarray.h>
#include <std/tsobject.h>

class Number;

namespace cpp_integration IS_TS_MODULE
{
class TS_EXPORT Rect : public Object
{
public:
    TS_METHOD Rect(Point* topLeft, Point* bottomRight);

    TS_METHOD Point* topLeft() const;
    TS_METHOD Point* bottomRight() const;

    TS_METHOD Number* getSquare();

    TS_METHOD Array<Point*>* getDiagonal() const;
};
} // namespace IS_TS_MODULE