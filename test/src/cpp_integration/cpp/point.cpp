#include "point.h"

#include <std/gc.h>
#include <std/tsnumber.h>

using namespace cpp;

Point::Point(Number *x, Number *y)
{
  set("x", x);
  set("y", y);
}

Point::Point(const Point& other)
{
  setX(other.get<Number *>("x"));
  setY(other.get<Number *>("y"));
}

Number *Point::x() const { return get<Number *>("x"); }
Number *Point::y() const { return get<Number *>("y"); }

void Point::setX(Number *x) { set("x", x); }
void Point::setY(Number *y) { set("y", y); }

Point *Point::clone() const
{
  Point *clone = new Point(*this);
  return GC::track(clone);
}