#include "point.h"

#include <std/gc.h>

using namespace cpp;

Point::Point(Number* x, Number* y) : _x(x), _y(y) {}

Number* Point::x() const { return _x; }
Number* Point::y() const { return _y; }

void Point::setX(Number* x) { _x = x; }
void Point::setY(Number* y) { _y = y; }

Point *Point::clone() const {
  Point *clone = new Point(*this);
  return GC::track(clone);
}