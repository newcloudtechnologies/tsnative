#pragma once

#include <std/tsnumber.h>

namespace cpp {

class Point {
public:
  Point(Number* x, Number* y);

  Number* x() const;
  Number* y() const;

  void setX(Number* x);
  void setY(Number* y);

  Point* clone() const;

private:
  Number* _x = nullptr;
  Number* _y = nullptr;
};

} // namespace cpp