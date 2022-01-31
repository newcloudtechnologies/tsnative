#pragma once

#include <std/tsnumber.h>

class Point {
public:
  Point(Number* x, Number* y);

  const Number* x() const;
  const Number* y() const;

private:
  Number _x{0.0};
  Number _y{0.0};
};