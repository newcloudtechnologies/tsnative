#pragma once

#include "point.h"

#include <std/tsarray.h>
#include <std/tsobject.h>

class Number;

namespace cpp
{
  class Rect : public Object
  {
  public:
    Rect(Point *topLeft, Point *bottomRight);

    Point *topLeft() const;
    Point *bottomRight() const;

    Number *getSquare();

    Array<Point *> *getDiagonal() const;
  };
} // namespace cpp