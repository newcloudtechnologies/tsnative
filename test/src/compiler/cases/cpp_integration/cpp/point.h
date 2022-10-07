#pragma once

#include <std/tsnumber.h>
#include <std/tsobject.h>

namespace cpp {

class Point : public Object {
public:
  Point(Number* x, Number* y);
  Point(const Point& other);

  Number* x() const;
  Number* y() const;

  void setX(Number* x);
  void setY(Number* y);

  Point* clone() const;
};

} // namespace cpp