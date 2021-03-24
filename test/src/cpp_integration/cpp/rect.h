#pragma once

#include "point.h"

namespace cpp {

class Rect {
public:
  Rect(const Point &topLeft, const Point &bottomRight);

  double getSquare();

private:
  Point topLeft;
  Point bottomRight;
};

} // namespace cpp