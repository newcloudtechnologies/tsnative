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