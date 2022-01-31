#include "point.h"

#include <std/gc.h>

using namespace cpp;

Point::Point(const Number* x, const Number* y) : _x(x->unboxed()), _y(y->unboxed()) {}

const Number* Point::x() const { return &_x; }
const Number* Point::y() const { return &_y; }

void Point::setX(Number* x) { _x = x->unboxed(); }
void Point::setY(Number* y) { _y = y->unboxed(); }

Point *Point::clone() const {
  Point *clone = new Point(*this);
  return GC::track(clone);
}