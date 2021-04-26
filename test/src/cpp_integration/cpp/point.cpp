#include "point.h"

#include <std-typescript-llvm/include/gc.h>

using namespace cpp;

Point::Point(double x, double y) : _x(x), _y(y) {}

double Point::x() const { return _x; }
double Point::y() const { return _y; }

void Point::setX(double x) { _x = x; }
void Point::setY(double y) { _y = y; }

Point *Point::clone() const {
  Point *clone = new Point(*this);
  return GC::track(clone);
}