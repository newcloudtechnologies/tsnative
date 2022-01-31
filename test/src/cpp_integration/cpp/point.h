#pragma once

#include <std/tsnumber.h>

namespace cpp {

class Point {
public:
  Point(const Number* x, const Number* y);

  const Number* x() const;
  const Number* y() const;

  void setX(Number* x);
  void setY(Number* y);

  Point* clone() const;

private:
  Number _x{0.0};
  Number _y{0.0};
};

} // namespace cpp