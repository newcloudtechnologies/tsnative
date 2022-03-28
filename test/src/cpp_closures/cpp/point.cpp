#include "point.h"

Point::Point(Number *x, Number *y)
{
    set("x", x);
    set("y", y);
}

const Number *Point::x() const { return get<const Number *>("x"); }
const Number *Point::y() const { return get<const Number *>("y"); }