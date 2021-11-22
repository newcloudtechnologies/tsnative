#pragma once

#include "point.h"

#include <std/array.h>

namespace cpp {

class Rect {
public:
  Rect(const Point &topLeft, const Point &bottomRight);

  double getSquare();

  Array<Point*>* getDiagonal() const;

private:
  Point topLeft;
  Point bottomRight;
};

} // namespace cpp